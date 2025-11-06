import http from "node:http";
import { GcsStorage, updateSnapshot, entityFromPathSegment, cloudTraceFromHeader, logJSON, migrateSnapshotMinorAdditive, compactHighChurn } from "@ecco/platform-libs";

type PubSubPush = {
  message?: {
    attributes?: Record<string, string>;
    data?: string; // base64
    messageId?: string;
    publishTime?: string;
  };
  subscription?: string;
};

type GcsEvent = {
  kind?: string;
  id?: string;
  selfLink?: string;
  name: string; // object name
  bucket: string;
  metageneration?: string;
  timeCreated?: string;
  updated?: string;
};

const PORT = Number(process.env.PORT || 8080);

function send(res: http.ServerResponse, code: number, body: any) {
  const data = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(code, { "content-type": "application/json" });
  res.end(data);
}

function parsePath(name: string) {
  // env/{env}/{entity}/{id}/history/.../{file}.json
  const parts = name.split("/");
  if (parts.length < 6) return null;
  if (parts[0] !== "env") return null;
  const env = parts[1] as "dev" | "stg" | "prod";
  const segment = parts[2];
  const entity = entityFromPathSegment(segment);
  if (!entity) return null;
  const id = parts[3];
  const isHistory = parts[4] === "history";
  return { env, entity, id, isHistory } as const;
}

async function handleEvent(event: GcsEvent) {
  const p = parsePath(event.name);
  if (!p || !p.isHistory) return { skipped: true, reason: "not_history" } as const;

  const storage = new GcsStorage(event.bucket);
  let payload: any;
  try {
    payload = await storage.readJson(event.name);
  } catch (err) {
    return { skipped: true, reason: "read_failed", error: String(err) } as const;
  }

  // Apply minor additive migrations and compaction for high-churn entities
  const migrated = migrateSnapshotMinorAdditive(payload);
  const compacted = compactHighChurn(migrated);
  // Idempotency guard by updated_at vs current snapshot inside updateSnapshot()
  const res = await updateSnapshot(event.bucket, p.env, p.entity, p.id, compacted, { storage });
  return res;
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
    const dataB64 = body.message?.data;
    if (!dataB64) {
      send(res, 204, {});
      return;
    }
    const decoded = Buffer.from(dataB64, "base64").toString("utf8");
    const event = JSON.parse(decoded) as GcsEvent;
    const trace = cloudTraceFromHeader(req.headers["x-cloud-trace-context"] as string | undefined);
    const result = await handleEvent(event);
    logJSON({ message: "snapshot-builder processed event", severity: "INFO", trace, event: event.name, result });
    send(res, 200, { ok: true, result });
  } catch (err) {
    const trace = cloudTraceFromHeader(req.headers["x-cloud-trace-context"] as string | undefined);
    logJSON({ message: "snapshot-builder error", severity: "ERROR", trace, error: String(err) });
    send(res, 200, { ok: true, skipped: true, error: String(err) });
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`snapshot-builder listening on :${PORT}`);
});
