import http from "node:http";
import { GcsStorage, makeManifestPerIdPath, manifestFromSnapshot, entityFromPathSegment } from "@ecco/platform-libs";

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

async function handleEvent(event: GcsEvent) {
  const pathInfo = parseSnapshotPath(event.name);
  if (!pathInfo) return { skipped: true, reason: "not_snapshot" } as const;

  const storage = new GcsStorage(event.bucket);
  const snapshot = await storage.readJson<any>(event.name).catch((err) => {
    return { _error: err } as any;
  });
  if ((snapshot as any)?._error) {
    return { skipped: true, reason: "read_failed", error: String((snapshot as any)._error) } as const;
  }

  const manifest = manifestFromSnapshot(snapshot);
  const manifestPath = makeManifestPerIdPath(pathInfo.env, manifest.entity, manifest.id);

  let current: any;
  let meta: { metageneration: number } | null = null;
  try {
    const existingMeta = await storage.stat(manifestPath);
    meta = { metageneration: existingMeta.metageneration };
    current = await storage.readJson<any>(manifestPath).catch(() => null);
  } catch {
    // new manifest
  }

  const newUpdatedAt = Date.parse(manifest.updated_at);
  const curUpdatedAt = current?.updated_at ? Date.parse(current.updated_at) : -1;
  if (curUpdatedAt >= 0 && newUpdatedAt <= curUpdatedAt) {
    return { skipped: true, reason: "stale" } as const;
  }

  const writeOpts = meta
    ? { ifMetagenerationMatch: meta.metageneration, contentType: "application/json" }
    : { ifGenerationMatch: 0, contentType: "application/json" };

  const result = await storage.writeJson(manifestPath, manifest, writeOpts);
  return { skipped: false, path: manifestPath, result } as const;
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
    const result = await handleEvent(event);
    send(res, 200, { ok: true, result });
  } catch (err) {
    send(res, 200, { ok: true, skipped: true, error: String(err) });
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`manifest-writer listening on :${PORT}`);
});
