#!/usr/bin/env node
import { Storage } from "@google-cloud/storage";
import { manifestShardKey, entityPathSegment, entityFromManifestPath, isEntity } from "@ecco/platform-libs";

type Options = {
  bucket: string;
  env: "dev" | "stg" | "prod";
  entity: string;
  shards: number;
  since?: string; // RFC3339 timestamp or duration e.g. 1h, 24h, 30m
};

function usage() {
  console.error(
    `Usage: manifest-compactor --bucket <name> --env <dev|stg|prod> --entity <entity> [--shards 256] [--since <RFC3339|1h|30m|7d>]`
  );
}

function parseArgs(argv: string[]): Options | null {
  const opts: Partial<Options> = { shards: 256 };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const value = argv[++i];
    if (!value) continue;
    switch (key) {
      case "bucket":
        opts.bucket = value;
        break;
      case "env":
        if (!["dev", "stg", "prod"].includes(value)) return null;
        opts.env = value as Options["env"];
        break;
      case "entity":
        opts.entity = value;
        break;
      case "shards":
        opts.shards = Number(value);
        break;
      case "since":
        opts.since = value;
        break;
      default:
        break;
    }
  }
  if (!opts.bucket || !opts.env || !opts.entity || !opts.shards) return null;
  return opts as Options;
}

function parseSinceToEpochMs(since?: string): number | null {
  if (!since) return null;
  // Accept RFC3339 timestamp
  const maybeTs = Date.parse(since);
  if (!Number.isNaN(maybeTs)) return maybeTs;
  // Accept simple durations like 1h,30m,7d
  const m = since.match(/^(\d+)([smhd])$/);
  if (!m) return null;
  const n = Number(m[1]);
  const unit = m[2];
  const mult = unit === "s" ? 1000 : unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
  return Date.now() - n * mult;
}

async function collectManifests(storage: Storage, bucket: string, prefix: string, sinceMs: number | null) {
  const bucketRef = storage.bucket(bucket);
  const records: Array<{ manifest: any; path: string }> = [];
  let pageToken: string | undefined;
  do {
    const [files, , nextQuery] = await bucketRef.getFiles({ prefix, autoPaginate: false, pageToken });
    for (const file of files) {
      const [buf] = await file.download();
      const manifest = JSON.parse(buf.toString("utf8"));
      if (sinceMs) {
        const updated = Date.parse(manifest?.updated_at ?? 0);
        if (!Number.isFinite(updated) || updated < sinceMs) continue;
      }
      records.push({ manifest, path: file.name });
    }
    pageToken = (nextQuery as any)?.pageToken;
  } while (pageToken);
  return records;
}

async function writeShard(bucket: string, shardPath: string, ndjson: string, storage: Storage) {
  const file = storage.bucket(bucket).file(shardPath);
  const opts: any = {
    contentType: "application/x-ndjson",
    resumable: false,
    gzip: false,
    validation: false,
  };
  try {
    const [meta] = await file.getMetadata();
    opts.preconditionOpts = { ifMetagenerationMatch: meta.metageneration };
  } catch (err: any) {
    if (err?.code === 404) {
      opts.preconditionOpts = { ifGenerationMatch: 0 };
    } else {
      throw err;
    }
  }
  await file.save(ndjson, opts);
}

async function main() {
  const parsed = parseArgs(process.argv);
  if (!parsed) {
    usage();
    process.exit(1);
  }
  const { bucket, env, entity, shards } = parsed;
  const normalized = (() => {
    if (isEntity(entity)) {
      return { entity, segment: entityPathSegment(entity) };
    }
    const maybe = entityFromManifestPath(entity);
    if (maybe) {
      return { entity: maybe, segment: entityPathSegment(maybe) };
    }
    throw new Error(`Unknown entity: ${entity}`);
  })();
  const storage = new Storage();
  const prefix = `env/${env}/manifests/${normalized.segment}/by-id/`;
  const sinceMs = parseSinceToEpochMs(parsed.since);
  const manifestRecords = await collectManifests(storage, bucket, prefix, sinceMs);
  if (manifestRecords.length === 0) {
    console.log("No manifests found; nothing to compact.");
    return;
  }

  if (!sinceMs) {
    const groups = new Map<string, any[]>();
    for (const { manifest } of manifestRecords) {
      const shard = manifestShardKey(manifest.id, shards);
      const arr = groups.get(shard) ?? [];
      arr.push(manifest);
      groups.set(shard, arr);
    }
    for (const [shard, items] of groups.entries()) {
      const path = `env/${env}/manifests/${normalized.segment}/_index_shard=${shard}.ndjson`;
      const ndjson = items.map((m) => JSON.stringify(m)).join("\n") + "\n";
      await writeShard(bucket, path, ndjson, storage);
      console.log(`Wrote shard ${shard} with ${items.length} records -> ${path}`);
    }
    return;
  }

  // Partial rebuild: only shards affected by recently updated manifests
  const byShard = new Map<string, any[]>();
  for (const { manifest } of manifestRecords) {
    const shard = manifestShardKey(manifest.id, shards);
    const arr = byShard.get(shard) ?? [];
    arr.push(manifest);
    byShard.set(shard, arr);
  }

  for (const [shard, changed] of byShard.entries()) {
    const path = `env/${env}/manifests/${normalized.segment}/_index_shard=${shard}.ndjson`;
    // Load existing shard if present
    const bucketRef = storage.bucket(bucket);
    const file = bucketRef.file(path);
    let existing: any[] = [];
    try {
      const [buf] = await file.download();
      existing = buf
        .toString("utf8")
        .split("\n")
        .filter(Boolean)
        .map((l: string) => JSON.parse(l));
    } catch (err: any) {
      if (err?.code !== 404) throw err;
    }
    const byId = new Map<string, any>();
    for (const m of existing) byId.set(m.id, m);
    for (const m of changed) byId.set(m.id, m);
    const out = Array.from(byId.values());
    const ndjson = out.map((m) => JSON.stringify(m)).join("\n") + (out.length ? "\n" : "");
    await writeShard(bucket, path, ndjson, storage);
    console.log(`Updated shard ${shard} with ${changed.length} changed, total ${out.length} -> ${path}`);
  }
}

main().catch((err) => {
  console.error("manifest-compactor error:", err);
  process.exit(1);
});
