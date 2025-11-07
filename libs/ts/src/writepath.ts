import { GcsStorage, StorageClient } from "./gcs/storage.js";
import { ulid } from "./ulid.js";
import type { EnvelopeBase, Env } from "./envelope.js";

export type Entity = EnvelopeBase["entity"];

export interface WritePathOptions {
  storage?: StorageClient;
}

const ENTITY_PATH_SEGMENTS: Record<Entity, string> = {
  idea: "ideas",
  venture: "ventures",
  resource: "resources",
  budget: "budgets",
  kpi: "kpis",
  investor: "investors",
  partner: "partners",
  service: "services",
  talent: "talent",
  experiment: "experiments",
  round: "rounds",
  cap_table: "cap_tables",
  playbook: "playbooks",
  playbook_run: "playbook_runs",
  show_page: "show_pages",
  comment: "comments",
  rule: "rules",
  benchmark: "benchmarks",
  report: "reports",
  model: "models",
  simulation: "simulations",
  dataroom: "dataroom",
};

const SEGMENT_TO_ENTITY = Object.fromEntries(
  Object.entries(ENTITY_PATH_SEGMENTS).map(([entity, segment]) => [segment, entity])
) as Record<string, Entity>;

export function entityPathSegment(entity: Entity): string {
  return ENTITY_PATH_SEGMENTS[entity] ?? `${entity}s`;
}

export function entityFromPathSegment(segment: string): Entity | null {
  return SEGMENT_TO_ENTITY[segment] ?? null;
}

export function isEntity(value: string): value is Entity {
  return (value as Entity) in ENTITY_PATH_SEGMENTS;
}

export function makeHistoryPath(env: Env, entity: Entity, id: string, when = new Date()): string {
  const segment = entityPathSegment(entity);
  const yyyy = String(when.getUTCFullYear());
  const mm = String(when.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(when.getUTCDate()).padStart(2, "0");
  const tsZ = when.toISOString().replace(/\.\d{3}Z$/, "Z");
  const u = ulid(when.getTime());
  return `env/${env}/${segment}/${id}/history/${yyyy}/${mm}/${dd}/${tsZ}_${u}.json`;
}

export function makeSnapshotPath(env: Env, entity: Entity, id: string): string {
  const segment = entityPathSegment(entity);
  return `env/${env}/snapshots/${segment}/${id}.json`;
}

export async function writeHistory(
  bucket: string,
  env: Env,
  entity: Entity,
  id: string,
  payload: unknown,
  opts: WritePathOptions = {}
) {
  const storage = opts.storage ?? new GcsStorage(bucket);
  const path = makeHistoryPath(env, entity, id);
  return storage.writeJson(path, payload, { ifGenerationMatch: 0, contentType: "application/json" });
}

export async function updateSnapshot(
  bucket: string,
  env: Env,
  entity: Entity,
  id: string,
  payload: any,
  opts: WritePathOptions = {}
) {
  const storage = opts.storage ?? new GcsStorage(bucket);
  const snapPath = makeSnapshotPath(env, entity, id);

  // Idempotency: if snapshot exists and has newer or equal updated_at, skip
  let pre: { meta?: { metageneration: number }; current?: any } = {};
  try {
    const meta = await storage.stat(snapPath);
    pre.meta = { metageneration: meta.metageneration };
    try {
      pre.current = await storage.readJson<any>(snapPath);
    } catch {}
  } catch {}

  const newUpdatedAt = payload?.updated_at ? Date.parse(payload.updated_at) : 0;
  const currentUpdatedAt = pre.current?.updated_at ? Date.parse(pre.current.updated_at) : -1;
  if (currentUpdatedAt >= 0 && newUpdatedAt <= currentUpdatedAt) {
    return { skipped: true, reason: "stale_update" } as const;
  }

  const writeOpts = pre.meta
    ? { ifMetagenerationMatch: pre.meta.metageneration, contentType: "application/json" }
    : { ifGenerationMatch: 0, contentType: "application/json" };

  const res = await storage.writeJson(snapPath, payload, writeOpts);
  return { skipped: false, result: res } as const;
}
