import http from "node:http";
import { GcsStorage, manifestFromSnapshot, cloudTraceFromHeader, logJSON } from "@ecco/platform-libs";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

type PubSubPush = { message?: { data?: string } };
type GcsEvent = { bucket: string; name: string };

const PORT = Number(process.env.PORT || 8080);
const secretClient = new SecretManagerServiceClient();

function send(res: http.ServerResponse, code: number, body: any) {
  const data = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(code, { "content-type": "application/json" });
  res.end(data);
}

async function resolveTarget(): Promise<string | null> {
  const target = process.env.SEARCH_FEED_TARGET || process.env.ALERTS_WEBHOOK_URL || "";
  if (!target) return null;
  if (target.startsWith("sm://")) {
    const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || "";
    const normalized = target.replace(/^sm:\/\//, "");
    const path = normalized.includes("/secrets/") ? normalized : `projects/${project}/secrets/${normalized}/versions/latest`;
    const [version] = await secretClient.accessSecretVersion({ name: path });
    const payload = version.payload?.data ? Buffer.from(version.payload.data).toString("utf8") : undefined;
    return payload || null;
  }
  return target;
}

async function handleEvent(event: GcsEvent) {
  const storage = new GcsStorage(event.bucket);
  const snapshot = await storage.readJson<any>(event.name);
  const manifest = manifestFromSnapshot(snapshot);
  const payload = { id: manifest.id, entity: manifest.entity, env: manifest.env, updated_at: manifest.updated_at, ptr: manifest.ptr };
  const target = await resolveTarget();
  if (!target) return { skipped: true, reason: "no_target" } as const;
  await fetch(target, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  return { skipped: false, target } as const;
}

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST" || !req.url || !req.url.startsWith("/pubsub/push")) {
    send(res, 404, { error: "not found" });
    return;
  }
  const trace = cloudTraceFromHeader(req.headers["x-cloud-trace-context"] as string | undefined);
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const raw = Buffer.concat(chunks).toString("utf8");
    const body = JSON.parse(raw) as PubSubPush;
    const b64 = body.message?.data;
    if (!b64) { send(res, 204, {}); return; }
    const decoded = Buffer.from(b64, "base64").toString("utf8");
    const event = JSON.parse(decoded) as GcsEvent;
    const result = await handleEvent(event);
    logJSON({ message: "search-feed processed", severity: "INFO", trace, event: event.name, result });
    send(res, 200, { ok: true, result });
  } catch (err) {
    logJSON({ message: "search-feed error", severity: "ERROR", trace, error: String(err) });
    send(res, 200, { ok: true, skipped: true, error: String(err) });
  }
});

server.listen(PORT, () => {
  logJSON({ message: `search-feed listening on :${PORT}`, severity: "INFO" });
});

