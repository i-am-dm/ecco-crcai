import type { ManifestRecord } from "./manifest.js";
import { manifestFromSnapshot } from "./manifest.js";
import type { Env } from "./envelope.js";
import type { Entity } from "./writepath.js";
import { entityPathSegment } from "./writepath.js";
import { slugify } from "./slug.js";

export interface PointerPlan {
  path: string;
  pointer: ManifestRecord;
  cleanup?: {
    prefix: string;
    id: string;
  };
}

export function buildIndexPointers(snapshot: any): PointerPlan[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  const entity = snapshot.entity as Entity | undefined;
  const env = snapshot.env as Env | undefined;
  if (!entity || !env) return [];

  const basePointer = manifestFromSnapshot(snapshot);
  const plans: PointerPlan[] = [];

  switch (entity) {
    case "venture":
      addVenturePointers(snapshot, basePointer, plans);
      break;
    case "round":
      addRoundPointers(snapshot, basePointer, plans);
      break;
    case "cap_table":
      addCapTablePointers(snapshot, basePointer, plans);
      break;
    default:
      break;
  }

  return plans;
}

function addVenturePointers(snapshot: any, pointer: ManifestRecord, plans: PointerPlan[]) {
  const env = pointer.env;
  const id = pointer.id;

  if (typeof snapshot.status === "string" && snapshot.status.trim()) {
    const statusSlug = slugify(snapshot.status);
    const path = `env/${env}/indices/ventures/by-status/${statusSlug}/${id}.json`;
    plans.push({
      path,
      pointer: { ...pointer, status: snapshot.status },
      cleanup: { prefix: `env/${env}/indices/ventures/by-status/`, id },
    });
  }

  if (typeof snapshot.lead === "string" && snapshot.lead.trim()) {
    const leadSlug = slugify(snapshot.lead);
    const path = `env/${env}/indices/ventures/by-lead/${leadSlug}/${id}.json`;
    plans.push({
      path,
      pointer: { ...pointer, lead: snapshot.lead },
      cleanup: { prefix: `env/${env}/indices/ventures/by-lead/`, id },
    });
  }

  const nextDue = nextMilestoneMonth(snapshot.milestones);
  if (nextDue) {
    const path = `env/${env}/indices/ventures/by-next-due/${nextDue}/${id}.json`;
    plans.push({
      path,
      pointer: { ...pointer, nextDue },
      cleanup: { prefix: `env/${env}/indices/ventures/by-next-due/`, id },
    });
  }
}

function addRoundPointers(snapshot: any, pointer: ManifestRecord, plans: PointerPlan[]) {
  const env = pointer.env;
  const id = pointer.id;
  if (typeof snapshot.ventureId === "string" && snapshot.ventureId.trim()) {
    const ventureId = snapshot.ventureId;
    const path = `env/${env}/indices/rounds/by-venture/${ventureId}/${id}.json`;
    plans.push({
      path,
      pointer: { ...pointer, ventureId },
      cleanup: { prefix: `env/${env}/indices/rounds/by-venture/${ventureId}/`, id },
    });
  }
}

function addCapTablePointers(snapshot: any, pointer: ManifestRecord, plans: PointerPlan[]) {
  const env = pointer.env;
  if (typeof snapshot.ventureId === "string" && snapshot.ventureId.trim()) {
    const ventureId = snapshot.ventureId;
    const path = `env/${env}/indices/cap_tables/by-venture/${ventureId}.json`;
    // For cap tables, pointer id remains cap table id but path keyed by venture
    plans.push({
      path,
      pointer: { ...pointer, ventureId },
      // no cleanup: single object per venture path overwritten each time
    });
  }
}

function nextMilestoneMonth(milestones: any): string | null {
  if (!Array.isArray(milestones)) return null;
  const valid = milestones
    .map((m) => (typeof m?.dueDate === "string" ? new Date(m.dueDate) : null))
    .filter((d): d is Date => !!d && !isNaN(d.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  if (valid.length === 0) return null;
  const date = valid[0];
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function makePointerPath(env: Env, entity: Entity, id: string): string {
  const segment = entityPathSegment(entity);
  return `env/${env}/indices/${segment}/${id}.json`;
}
