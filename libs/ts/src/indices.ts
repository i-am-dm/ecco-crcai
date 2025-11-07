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
    case "idea":
      addIdeaPointers(snapshot, basePointer, plans);
      break;
    case "round":
      addRoundPointers(snapshot, basePointer, plans);
      break;
    case "cap_table":
      addCapTablePointers(snapshot, basePointer, plans);
      break;
    case "playbook":
      addPlaybookPointers(snapshot, basePointer, plans);
      break;
    case "playbook_run":
      addPlaybookRunPointers(snapshot, basePointer, plans);
      break;
    case "comment":
      addCommentPointers(snapshot, basePointer, plans);
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

function addPlaybookPointers(snapshot: any, pointer: ManifestRecord, plans: PointerPlan[]) {
  const env = pointer.env;
  const id = pointer.id;

  if (typeof snapshot.stage === "string" && snapshot.stage.trim()) {
    const stageSlug = slugify(snapshot.stage);
    const path = `env/${env}/indices/playbooks/by-stage/${stageSlug}/${id}.json`;
    plans.push({
      path,
      pointer: { ...pointer, stage: snapshot.stage },
      cleanup: { prefix: `env/${env}/indices/playbooks/by-stage/`, id },
    });
  }

  if (typeof snapshot.function === "string" && snapshot.function.trim()) {
    const funcSlug = slugify(snapshot.function);
    const path = `env/${env}/indices/playbooks/by-function/${funcSlug}/${id}.json`;
    plans.push({
      path,
      pointer: { ...pointer, function: snapshot.function },
      cleanup: { prefix: `env/${env}/indices/playbooks/by-function/`, id },
    });
  }

  if (typeof snapshot.owner === "string" && snapshot.owner.trim()) {
    const ownerSlug = slugify(snapshot.owner);
    const path = `env/${env}/indices/playbooks/by-owner/${ownerSlug}/${id}.json`;
    plans.push({
      path,
      pointer: { ...pointer, owner: snapshot.owner },
      cleanup: { prefix: `env/${env}/indices/playbooks/by-owner/`, id },
    });
  }

  if (Array.isArray(snapshot.tags)) {
    for (const tag of snapshot.tags) {
      if (typeof tag !== "string" || !tag.trim()) continue;
      const tagSlug = slugify(tag);
      const path = `env/${env}/indices/playbooks/by-tag/${tagSlug}/${id}.json`;
      plans.push({
        path,
        pointer: { ...pointer, tag },
        cleanup: { prefix: `env/${env}/indices/playbooks/by-tag/`, id },
      });
    }
  }
}

function addPlaybookRunPointers(snapshot: any, pointer: ManifestRecord, plans: PointerPlan[]) {
  const env = pointer.env;
  const id = pointer.id; // run id
  const playbookId = snapshot.playbookId as string | undefined;
  if (typeof playbookId === "string" && playbookId.trim()) {
    const path = `env/${env}/indices/playbook_runs/by-playbook/${playbookId}/${id}.json`;
    plans.push({
      path,
      pointer: { ...pointer, playbookId },
      cleanup: { prefix: `env/${env}/indices/playbook_runs/by-playbook/${playbookId}/`, id },
    });
  }
  const ventureId = snapshot.ventureId as string | undefined;
  if (typeof ventureId === "string" && ventureId.trim()) {
    const path = `env/${env}/indices/playbook_runs/by-venture/${ventureId}/${id}.json`;
    plans.push({
      path,
      pointer: { ...pointer, ventureId },
      cleanup: { prefix: `env/${env}/indices/playbook_runs/by-venture/${ventureId}/`, id },
    });
  }
}

function addCommentPointers(snapshot: any, pointer: ManifestRecord, plans: PointerPlan[]) {
  const env = pointer.env;
  const id = pointer.id;
  const ideaId = snapshot.ideaId || snapshot.idea_id;
  if (typeof ideaId === "string" && ideaId.trim()) {
    const path = `env/${env}/indices/comments/by-idea/${ideaId}/${id}.json`;
    plans.push({
      path,
      pointer: { ...pointer, ideaId },
      cleanup: { prefix: `env/${env}/indices/comments/by-idea/${ideaId}/`, id },
    });
  }
}

function addIdeaPointers(snapshot: any, pointer: ManifestRecord, plans: PointerPlan[]) {
  const env = pointer.env;
  const id = pointer.id;

  if (typeof snapshot.status === "string" && snapshot.status.trim()) {
    const statusSlug = slugify(snapshot.status);
    const path = `env/${env}/indices/ideas/by-status/${statusSlug}/${id}.json`;
    plans.push({
      path,
      pointer: { ...pointer, status: snapshot.status },
      cleanup: { prefix: `env/${env}/indices/ideas/by-status/`, id },
    });
  }

  if (typeof snapshot.stage === "string" && snapshot.stage.trim()) {
    const stageSlug = slugify(snapshot.stage);
    const path = `env/${env}/indices/ideas/by-stage/${stageSlug}/${id}.json`;
    plans.push({
      path,
      pointer: { ...pointer, stage: snapshot.stage },
      cleanup: { prefix: `env/${env}/indices/ideas/by-stage/`, id },
    });
  }

  const owner =
    (typeof snapshot.stageOwner === "string" && snapshot.stageOwner.trim() && snapshot.stageOwner) ||
    (typeof snapshot.stage_owner === "string" && snapshot.stage_owner.trim() && snapshot.stage_owner) ||
    (typeof pointer.stageOwner === "string" && pointer.stageOwner.trim() && pointer.stageOwner);
  if (owner) {
    const ownerSlug = slugify(owner);
    const path = `env/${env}/indices/ideas/by-owner/${ownerSlug}/${id}.json`;
    plans.push({
      path,
      pointer: { ...pointer, stageOwner: owner },
      cleanup: { prefix: `env/${env}/indices/ideas/by-owner/`, id },
    });
  }

  const overallScore = parseOverallScore(snapshot);
  if (overallScore !== null) {
    const bucket = scoreBucket(overallScore);
    const path = `env/${env}/indices/ideas/by-score/${bucket}/${id}.json`;
    plans.push({
      path,
      pointer: { ...pointer, score: pointer.score ?? snapshot.score },
      cleanup: { prefix: `env/${env}/indices/ideas/by-score/`, id },
    });
  }
}

function parseOverallScore(snapshot: any): number | null {
  const rawScore = snapshot?.score;
  if (typeof rawScore === "number") {
    return clampScore(rawScore);
  }
  if (rawScore && typeof rawScore === "object" && typeof rawScore.overall === "number") {
    return clampScore(rawScore.overall);
  }
  const legacyField = snapshot?.score_overall ?? snapshot?.scoreOverall;
  if (typeof legacyField === "number") {
    return clampScore(legacyField);
  }
  return null;
}

function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(10, Math.max(0, value));
}

function scoreBucket(value: number): string {
  const bucket = Math.floor(clampScore(value));
  return bucket.toString().padStart(2, "0");
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
