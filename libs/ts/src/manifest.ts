import { createHash } from "node:crypto";
import { makeSnapshotPath, entityPathSegment, entityFromPathSegment } from "./writepath.js";
import type { EnvelopeBase, Env } from "./envelope.js";

export interface ManifestRecord extends Pick<EnvelopeBase, "id" | "entity" | "env" | "schema_version" | "updated_at"> {
  ptr: string;
  title?: string;
  status?: string;
  lead?: string;
  ventureId?: string;
  ideaId?: string;
  stage?: string;
  asOf?: string;
  theme?: string;
  problem?: string;
  market?: string;
  team?: string;
  tech?: string;
  description?: string;
  score?: {
    overall?: number;
    market?: number;
    team?: number;
    tech?: number;
    timing?: number;
    notes?: string;
    [key: string]: unknown;
  };
  tags?: string[];
  attachments?: string[];
  stageOwner?: string;
  stage_owner?: string;
  stageDueDate?: string;
  stage_due_date?: string;
  createdBy?: string;
  created_by?: string;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

function copyStringVariants(target: Record<string, unknown>, source: Record<string, unknown>, variants: string[]) {
  const value = variants
    .map((key) => source[key])
    .find((val) => typeof val === "string" && val.length > 0);
  if (typeof value === "string") {
    for (const key of variants) {
      target[key] = value;
    }
  }
}

function copyAuditFields(snapshot: Record<string, unknown>, record: Record<string, unknown>) {
  copyStringVariants(record, snapshot, ["createdAt", "created_at"]);
  copyStringVariants(record, snapshot, ["updatedAt", "updated_at"]);
  copyStringVariants(record, snapshot, ["createdBy", "created_by"]);
}

function copyIdeaFields(snapshot: any, record: Record<string, unknown>) {
  const ideaStrings = ["theme", "problem", "market", "team", "tech", "title", "description"];
  for (const key of ideaStrings) {
    const value = snapshot[key];
    if (typeof value === "string" && value.length > 0) {
      record[key] = value;
    }
  }

  const score = snapshot.score;
  if (score && typeof score === "object") {
    record.score = score;
  }

  const tags = snapshot.tags;
  if (Array.isArray(tags)) {
    record.tags = tags.filter((tag) => typeof tag === "string");
  }

  const attachments = snapshot.attachments;
  if (Array.isArray(attachments)) {
    record.attachments = attachments.filter((att) => typeof att === "string");
  }

  const stageHistory = snapshot.stage_history;
  if (Array.isArray(stageHistory)) {
    record.stage_history = stageHistory;
  }

  copyStringVariants(record, snapshot, ["stageOwner", "stage_owner"]);
  copyStringVariants(record, snapshot, ["stageDueDate", "stage_due_date"]);
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

  copyAuditFields(snapshot as Record<string, unknown>, record);

  const { title, status, lead, ventureId, stage, asOf } = snapshot as any;
  if (typeof title === "string") record.title = title;
  if (typeof status === "string") record.status = status;
  if (typeof lead === "string") record.lead = lead;
  if (typeof ventureId === "string") record.ventureId = ventureId;
  const ideaId = (snapshot as any).ideaId || (snapshot as any).idea_id;
  if (typeof ideaId === "string") record.ideaId = ideaId;
  if (typeof stage === "string") record.stage = stage;
  if (typeof asOf === "string") record.asOf = asOf;

  // Common optional fields for cross-entity listings
  const fn = (snapshot as any).function;
  if (typeof fn === "string") (record as any).function = fn;
  const owner = (snapshot as any).owner;
  if (typeof owner === "string") (record as any).owner = owner;
  const version = (snapshot as any).version;
  if (typeof version === "string") (record as any).version = version;
  const eff = (snapshot as any).effectiveness_score;
  if (typeof eff === "number") (record as any).effectiveness_score = eff;

  if (entity === "idea") {
    copyIdeaFields(snapshot, record);
  } else if (entity === "show_page") {
    copyStringVariants(record, snapshot as Record<string, unknown>, ["title"]);
    copyStringVariants(record, snapshot as Record<string, unknown>, ["tagline"]);
    copyStringVariants(record, snapshot as Record<string, unknown>, ["ventureId", "venture_id"]);
    if (typeof (snapshot as any).published === "boolean") {
      (record as any).published = (snapshot as any).published;
    }
  }

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
