import { test, strict as assert } from "node:test";
import { manifestFromSnapshot, manifestShardKey, makeManifestPerIdPath } from "../src/manifest.js";

const snapshot = {
  id: "V001",
  entity: "venture",
  env: "prod",
  schema_version: "1.0.0",
  created_at: "2025-11-01T00:00:00Z",
  updated_at: "2025-11-06T10:21:23Z",
  title: "Automated Venture Platform",
  status: "Pilot",
  lead: "Bob",
};

test("manifestFromSnapshot extracts envelope and display fields", () => {
  const manifest = manifestFromSnapshot(snapshot);
  assert.equal(manifest.ptr, "env/prod/snapshots/ventures/V001.json");
  assert.equal(manifest.title, "Automated Venture Platform");
  assert.equal(manifest.status, "Pilot");
  assert.equal(manifest.lead, "Bob");
});

test("manifestFromSnapshot copies idea-specific fields and aliases", () => {
  const ideaSnapshot = {
    id: "IDEA-001",
    entity: "idea",
    env: "dev",
    schema_version: "1.0.0",
    created_at: "2025-11-05T15:04:00Z",
    updated_at: "2025-11-06T10:18:22Z",
    created_by: "maya@ecco.studio",
    theme: "AI Research Ops",
    problem: "Analysts spend 12h/week aggregating qualitative research.",
    market: "Internal tooling across 18 venture teams; upsell to partners.",
    team: "Research ops lead + ML engineer + fractional PM.",
    tech: "Next.js UI, Vertex AI embeddings, GCS write path.",
    title: "Atlas Insight Copilot",
    status: "Under Review",
    stage: "Validation",
    stage_owner: "Maya Collins",
    stage_due_date: "2025-12-01T00:00:00Z",
    score: { overall: 8.4, market: 8, team: 9, tech: 8, timing: 8 },
    tags: ["AI", "Research"],
    attachments: ["gs://sample/doc.pdf"],
    stage_history: [
      { stage: "Idea", changed_at: "2025-11-05T15:04:00Z" },
      { stage: "Validation", changed_at: "2025-11-06T10:18:22Z" },
    ],
  };

  const manifest = manifestFromSnapshot(ideaSnapshot);
  assert.equal(manifest.theme, ideaSnapshot.theme);
  assert.equal(manifest.problem, ideaSnapshot.problem);
  assert.equal(manifest.stageOwner, "Maya Collins");
  assert.equal(manifest.stage_owner, "Maya Collins");
  assert.equal(manifest.stageDueDate, "2025-12-01T00:00:00Z");
  assert.equal(manifest.stage_due_date, "2025-12-01T00:00:00Z");
  assert.equal(manifest.createdBy, ideaSnapshot.created_by);
  assert.equal(manifest.created_by, ideaSnapshot.created_by);
  assert.equal(manifest.createdAt, ideaSnapshot.created_at);
  assert.equal(manifest.created_at, ideaSnapshot.created_at);
  assert.deepEqual(manifest.score, ideaSnapshot.score);
  assert.deepEqual(manifest.tags, ideaSnapshot.tags);
  assert.deepEqual(manifest.attachments, ideaSnapshot.attachments);
  assert.deepEqual(manifest.stage_history, ideaSnapshot.stage_history);
});

test("makeManifestPerIdPath builds path", () => {
  assert.equal(makeManifestPerIdPath("prod", "venture", "V001"), "env/prod/manifests/ventures/by-id/V001.json");
});

test("manifestShardKey returns two hex chars by default", () => {
  const key = manifestShardKey("V001");
  assert.equal(key.length, 2);
});
