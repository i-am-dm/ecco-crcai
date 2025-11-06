import http from "node:http";
import url from "node:url";
import { GcsStorage, listManifests, makeSnapshotPath, writeHistory, validateJson, cloudTraceFromHeader, logJSON } from "@ecco/platform-libs";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const PORT = Number(process.env.PORT || 8080);
const BUCKET = process.env.DATA_BUCKET || "";

type Role = "Admin" | "Leadership" | "Lead" | "Contributor" | "Investor" | "Advisor";

function parseRoles(req: http.IncomingMessage): Role[] {
  const hdr = (req.headers["x-roles"] as string | undefined) || "";
  return hdr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean) as Role[];
}

function enforceRBAC(req: http.IncomingMessage, entity?: string, method?: string, env?: string): { allowed: boolean; reason?: string } {
  const roles = new Set(parseRoles(req));
  const m = method || req.method || "GET";

  // Admin-like roles: allow all
  if (["Admin", "Leadership", "Lead", "Contributor"].some((r) => roles.has(r as Role))) {
    return { allowed: true };
  }

  // Investor/Advisor: read-only; limited entities
  if (roles.has("Investor") || roles.has("Advisor")) {
    if (m !== "GET") return { allowed: false, reason: "read_only" };
    if (env && env !== "prod") return { allowed: false, reason: "env_restricted" };
    if (entity && !["venture", "cap_table", "round"].includes(entity)) return { allowed: false, reason: "entity_restricted" };
    return { allowed: true };
  }

  // Default deny if roles missing
  return { allowed: false, reason: "unauthorized" };
}

function send(res: http.ServerResponse, code: number, body: any) {
  const data = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(code, { "content-type": "application/json" });
  res.end(data);
}

function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

async function handleList(req: http.IncomingMessage, res: http.ServerResponse, entity: string, env: string) {
  const r = enforceRBAC(req, entity, "GET", env);
  if (!r.allowed) {
    send(res, 403, { error: "forbidden", reason: r.reason });
    return;
  }
  const storage = new GcsStorage(BUCKET);
  const records = await listManifests(storage, env as any, entity as any, {} as any);
  send(res, 200, { items: records });
}

async function handleGet(req: http.IncomingMessage, res: http.ServerResponse, entity: string, id: string, env: string) {
  const r = enforceRBAC(req, entity, "GET", env);
  if (!r.allowed) {
    send(res, 403, { error: "forbidden", reason: r.reason });
    return;
  }
  const storage = new GcsStorage(BUCKET);
  const path = makeSnapshotPath(env as any, entity as any, id);
  try {
    const json = await storage.readJson(path);
    send(res, 200, json);
  } catch (err) {
    send(res, 404, { error: "not_found" });
  }
}

async function handleHistory(req: http.IncomingMessage, res: http.ServerResponse) {
  const body = await readBody(req);
  const env = String(body?.env || "");
  const entity = String(body?.entity || "");
  const id = String(body?.id || "");
  const r = enforceRBAC(req, entity, "POST", env);
  if (!r.allowed) {
    send(res, 403, { error: "forbidden", reason: r.reason });
    return;
  }
  // Validate against declared schema version if available
  const version = String(body?.schema_version || "");
  try {
    if (version) {
      const schemaPath = resolve(process.cwd(), "schemas", entity, `${version}.schema.json`);
      const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
      const result = await validateJson(schema, body);
      if (!result.valid) {
        send(res, 400, { error: "schema_validation_failed", details: result });
        return;
      }
    }
  } catch {
    // proceed without validation if schema missing
  }
  await writeHistory(BUCKET, env as any, entity as any, id, body);
  send(res, 202, { accepted: true });
}

const server = http.createServer(async (req, res) => {
  const trace = cloudTraceFromHeader(req.headers["x-cloud-trace-context"] as string | undefined);
  try {
    if (!BUCKET) {
      send(res, 500, { error: "bucket_not_configured" });
      return;
    }
    const parsed = url.parse(req.url || "", true);
    const path = parsed.pathname || "/";
    const env = String(parsed.query.env || "prod");
    if (req.method === "GET") {
      const mList = path.match(/^\/v1\/(\w+)$/);
      const mGet = path.match(/^\/v1\/(\w+)\/(.+)$/);
      if (mList) {
        await handleList(req, res, mList[1], env);
        logJSON({ message: "api list", severity: "INFO", trace, entity: mList[1], env });
        return;
      }
      if (mGet) {
        await handleGet(req, res, mGet[1], decodeURIComponent(mGet[2]), env);
        logJSON({ message: "api get", severity: "INFO", trace, entity: mGet[1], id: decodeURIComponent(mGet[2]), env });
        return;
      }
    }
    if (req.method === "POST" && path === "/v1/internal/history") {
      await handleHistory(req, res);
      logJSON({ message: "api history write", severity: "NOTICE", trace });
      return;
    }
    send(res, 404, { error: "not_found" });
  } catch (err) {
    logJSON({ message: "api-edge error", severity: "ERROR", trace, error: String(err) });
    send(res, 500, { error: "internal" });
  }
});

server.listen(PORT, () => {
  logJSON({ message: `api-edge listening on :${PORT}`, severity: "INFO" });
});

