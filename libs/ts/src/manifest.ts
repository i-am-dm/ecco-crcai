import { createHash } from "node:crypto";
import { makeSnapshotPath, entityPathSegment, entityFromPathSegment } from "./writepath.js";
import type { EnvelopeBase, Env } from "./envelope.js";

export interface ManifestRecord extends Pick<EnvelopeBase, "id" | "entity" | "env" | "schema_version" | "updated_at"> {
  ptr: string;
  title?: string;
  status?: string;
  lead?: string;
  ventureId?: string;
  stage?: string;
  asOf?: string;
  [key: string]: unknown;
}

export function makeManifestPerIdPath(env: Env, entity: EnvelopeBase["entity"], id: string): string {
  const segment = entityPathSegment(entity);
  return `env/${env}/manifests/${segment}/by-id/${id}.json`;
}

export function manifestFromSnapshot(snapshot: any): ManifestRecord {
  if (!snapshot || typeof snapshot !== "object") {
    throw new Error("Snapshot payload required");
  }
  const { id, entity, env, schema_version, updated_at } = snapshot as EnvelopeBase;
  if (!id || !entity || !env || !schema_version || !updated_at) {
    throw new Error("Snapshot missing envelope fields");
  }
  const ptr = makeSnapshotPath(env as Env, entity, id);
  const record: ManifestRecord = {
    id,
    entity,
    env: env as Env,
    schema_version,
    updated_at,
    ptr,
  };

  const { title, status, lead, ventureId, stage, asOf } = snapshot as any;
  if (typeof title === "string") record.title = title;
  if (typeof status === "string") record.status = status;
  if (typeof lead === "string") record.lead = lead;
  if (typeof ventureId === "string") record.ventureId = ventureId;
  if (typeof stage === "string") record.stage = stage;
  if (typeof asOf === "string") record.asOf = asOf;

  return record;
}

export function manifestShardKey(id: string, shardCount = 256): string {
  if (shardCount <= 0) throw new Error("shardCount must be positive");
  const digest = createHash("sha1").update(id).digest();
  // Use first byte for up to 256 shards. For fewer shards, mod.
  const firstByte = digest[0];
  const bucket = shardCount >= 256 ? firstByte : firstByte % shardCount;
  if (shardCount >= 256) {
    return bucket.toString(16).padStart(2, "0");
  }
  const width = Math.ceil(Math.log10(shardCount));
  return bucket.toString().padStart(width, "0");
}

export function entityFromManifestPath(segment: string): EnvelopeBase["entity"] | null {
  return entityFromPathSegment(segment);
}
