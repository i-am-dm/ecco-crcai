import type { StorageClient } from "./gcs/storage.js";
import type { Env } from "./envelope.js";
import type { Entity } from "./writepath.js";
import { entityPathSegment } from "./writepath.js";
import type { ManifestRecord } from "./manifest.js";

export type ListOptions = {
  limit?: number;
  since?: string | Date;
};

function parseSinceMs(since?: string | Date): number | null {
  if (!since) return null;
  if (since instanceof Date) return since.getTime();
  const t = Date.parse(since);
  return Number.isNaN(t) ? null : t;
}

async function listFromShards(
  storage: StorageClient,
  env: Env,
  entity: Entity,
  opts: ListOptions
): Promise<ManifestRecord[]> {
  const segment = entityPathSegment(entity);
  const prefix = `env/${env}/manifests/${segment}/_index_shard=`;
  const objects = await storage.list(prefix);
  const ndjsonFiles = objects.map((o) => o.name).filter((n) => n.endsWith(".ndjson"));
  if (ndjsonFiles.length === 0) return [];

  const sinceMs = parseSinceMs(opts.since);
  const out: ManifestRecord[] = [];
  for (const name of ndjsonFiles) {
    const text = await storage.readText(name);
    const lines = text.split(/\r?\n/).filter(Boolean);
    for (const line of lines) {
      try {
        const rec = JSON.parse(line) as ManifestRecord;
        if (sinceMs) {
          const updated = Date.parse(rec.updated_at ?? 0);
          if (!Number.isFinite(updated) || updated < sinceMs) continue;
        }
        out.push(rec);
        if (opts.limit && out.length >= opts.limit) return out;
      } catch {
        // ignore malformed lines
      }
    }
  }
  return out;
}

async function listFromPerId(
  storage: StorageClient,
  env: Env,
  entity: Entity,
  opts: ListOptions
): Promise<ManifestRecord[]> {
  const segment = entityPathSegment(entity);
  const prefix = `env/${env}/manifests/${segment}/by-id/`;
  const objects = await storage.list(prefix);
  const jsonFiles = objects.map((o) => o.name).filter((n) => n.endsWith(".json"));
  const sinceMs = parseSinceMs(opts.since);
  const out: ManifestRecord[] = [];
  for (const name of jsonFiles) {
    try {
      const rec = await storage.readJson<ManifestRecord>(name);
      if (sinceMs) {
        const updated = Date.parse(rec.updated_at ?? 0);
        if (!Number.isFinite(updated) || updated < sinceMs) continue;
      }
      out.push(rec);
      if (opts.limit && out.length >= opts.limit) break;
    } catch {
      // ignore unreadable manifest
    }
  }
  return out;
}

export async function listManifests(
  storage: StorageClient,
  env: Env,
  entity: Entity,
  opts: ListOptions = {}
): Promise<ManifestRecord[]> {
  // Prefer shard listing when available, fall back to per-id manifests
  const shardListed = await listFromShards(storage, env, entity, opts);
  if (shardListed.length > 0) return shardListed;
  return listFromPerId(storage, env, entity, opts);
}

