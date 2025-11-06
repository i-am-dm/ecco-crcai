import http from "node:http";
import { GcsStorage, buildIndexPointers, entityFromPathSegment, cloudTraceFromHeader, logJSON } from "@ecco/platform-libs";

type PubSubPush = {
  message?: {
    data?: string;
  };
};

type GcsEvent = {
  bucket: string;
  name: string;
};

const PORT = Number(process.env.PORT || 8080);

function send(res: http.ServerResponse, code: number, body: any) {
  const data = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(code, { "content-type": "application/json" });
  res.end(data);
}

function parseSnapshotPath(name: string) {
  const parts = name.split("/");
  if (parts.length < 5) return null;
  if (parts[0] !== "env") return null;
  const env = parts[1] as "dev" | "stg" | "prod";
  if (parts[2] !== "snapshots") return null;
  const segment = parts[3];
  const entity = entityFromPathSegment(segment);
  if (!entity) return null;
  const file = parts.slice(4).join("/");
  if (!file.endsWith(".json")) return null;
  const id = file.replace(/\.json$/, "");
  return { env, entity, id } as const;
}

async function upsertPointer(storage: GcsStorage, path: string, payload: any) {
  let meta: { metageneration: number } | null = null;
  let current: any = null;
  try {
    const existingMeta = await storage.stat(path);
    meta = { metageneration: existingMeta.metageneration };
    current = await storage.readJson<any>(path).catch(() => null);
  } catch {
    // new pointer
  }

  const newUpdatedAt = Date.parse(payload.updated_at ?? "0");
  const currentUpdatedAt = current?.updated_at ? Date.parse(current.updated_at) : -1;
  if (currentUpdatedAt >= 0 && newUpdatedAt <= currentUpdatedAt) {
    return { skipped: true as const, reason: "stale" };
  }

  const writeOpts = meta
    ? { ifMetagenerationMatch: meta.metageneration, contentType: "application/json" }
    : { ifGenerationMatch: 0, contentType: "application/json" };

  const result = await storage.writeJson(path, payload, writeOpts);
  return { skipped: false as const, result };
}

async function cleanupPointers(
  storage: GcsStorage,
  prefix: string,
  id: string,
  keep: Set<string>
) {
  const objects = await storage.list(prefix);
  for (const obj of objects) {
    if (!obj.name.endsWith(`/${id}.json`)) continue;
    if (keep.has(obj.name)) continue;
    await storage.delete(obj.name);
  }
}

async function handleEvent(event: GcsEvent) {
  const pathInfo = parseSnapshotPath(event.name);
  if (!pathInfo) return { skipped: true, reason: "not_snapshot" } as const;

  const storage = new GcsStorage(event.bucket);
  const snapshot = await storage.readJson<any>(event.name).catch((err) => ({ _error: err }));
  if ((snapshot as any)?._error) {
    return { skipped: true, reason: "read_failed", error: String((snapshot as any)._error) } as const;
  }

  const plans = buildIndexPointers(snapshot);
  if (plans.length === 0) return { skipped: true, reason: "no_indices" } as const;

  const cleanupMap = new Map<string, { prefix: string; id: string; keep: Set<string> }>();

  const results: Array<{ path: string; skipped: boolean; reason?: string }> = [];

  for (const plan of plans) {
    if (plan.cleanup) {
      const key = `${plan.cleanup.prefix}|${plan.cleanup.id}`;
      let entry = cleanupMap.get(key);
      if (!entry) {
        entry = { prefix: plan.cleanup.prefix, id: plan.cleanup.id, keep: new Set() };
        cleanupMap.set(key, entry);
      }
      entry.keep.add(plan.path);
    }

    const res = await upsertPointer(storage, plan.path, plan.pointer);
    results.push({ path: plan.path, skipped: res.skipped, reason: res.skipped ? res.reason : undefined });
  }

  for (const entry of cleanupMap.values()) {
    await cleanupPointers(storage, entry.prefix, entry.id, entry.keep);
  }

  return { skipped: false, results } as const;
}

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST" || !req.url || !req.url.startsWith("/pubsub/push")) {
    send(res, 404, { error: "not found" });
    return;
  }
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const raw = Buffer.concat(chunks).toString("utf8");
    const body = JSON.parse(raw) as PubSubPush;
    const b64 = body.message?.data;
    if (!b64) {
      send(res, 204, {});
      return;
    }
    const decoded = Buffer.from(b64, "base64").toString("utf8");
    const event = JSON.parse(decoded) as GcsEvent;
    const trace = cloudTraceFromHeader(req.headers["x-cloud-trace-context"] as string | undefined);
    const result = await handleEvent(event);
    logJSON({ message: "index-writer processed event", severity: "INFO", trace, event: event.name, result });
    send(res, 200, { ok: true, result });
  } catch (err) {
    const trace = cloudTraceFromHeader(req.headers["x-cloud-trace-context"] as string | undefined);
    logJSON({ message: "index-writer error", severity: "ERROR", trace, error: String(err) });
    send(res, 200, { ok: true, skipped: true, error: String(err) });
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`index-writer listening on :${PORT}`);
});
