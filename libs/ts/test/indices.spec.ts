import { test, strict as assert } from "node:test";
import { buildIndexPointers } from "../src/indices.js";

const ventureSnapshot = {
  id: "V001",
  entity: "venture",
  env: "prod",
  schema_version: "1.0.0",
  created_at: "2025-11-01T00:00:00Z",
  updated_at: "2025-11-06T10:21:23Z",
  status: "Pilot",
  lead: "Bob Ross",
  milestones: [
    { milestoneId: "M1", title: "Ship", dueDate: "2026-02-01" },
  ],
};

test("buildIndexPointers for venture generates expected paths", () => {
  const plans = buildIndexPointers(ventureSnapshot);
  assert.equal(plans.length, 3);
  const paths = plans.map((p) => p.path).sort();
  assert.deepEqual(paths, [
    "env/prod/indices/ventures/by-lead/bob-ross/V001.json",
    "env/prod/indices/ventures/by-next-due/2026-02/V001.json",
    "env/prod/indices/ventures/by-status/pilot/V001.json",
  ]);
});

const capTableSnapshot = {
  id: "CT-V001",
  entity: "cap_table",
  env: "prod",
  schema_version: "1.0.0",
  created_at: "2025-11-01T00:00:00Z",
  updated_at: "2025-11-06T10:35:00Z",
  ventureId: "V001",
};

test("buildIndexPointers for cap table", () => {
  const plans = buildIndexPointers(capTableSnapshot);
  assert.equal(plans.length, 1);
  assert.equal(plans[0].path, "env/prod/indices/cap_tables/by-venture/V001.json");
});

const commentSnapshot = {
  id: "CMT-001",
  entity: "comment",
  env: "prod",
  schema_version: "v1.0.0",
  created_at: "2025-11-07T08:00:00Z",
  updated_at: "2025-11-07T08:00:00Z",
  ideaId: "IDEA-123",
  message: "Need to validate TAM slides.",
};

test("buildIndexPointers for comment by idea", () => {
  const plans = buildIndexPointers(commentSnapshot);
  assert.equal(plans.length, 1);
  assert.equal(plans[0].path, "env/prod/indices/comments/by-idea/IDEA-123/CMT-001.json");
  assert.equal(plans[0].pointer.ideaId, "IDEA-123");
});

const ideaSnapshot = {
  id: "IDEA-001",
  entity: "idea",
  env: "dev",
  schema_version: "v1.0.0",
  created_at: "2025-11-05T15:04:00Z",
  updated_at: "2025-11-06T10:18:22Z",
  status: "Under Review",
  stage: "Validation",
  stageOwner: "Validation Owner",
  score: {
    overall: 8.6,
    market: 8.0,
  },
};

test("buildIndexPointers for idea creates owner, status, stage, and score buckets", () => {
  const plans = buildIndexPointers(ideaSnapshot);
  assert.equal(plans.length, 4);
  const paths = plans.map((p) => p.path).sort();
  assert.deepEqual(paths, [
    "env/dev/indices/ideas/by-owner/validation-owner/IDEA-001.json",
    "env/dev/indices/ideas/by-score/08/IDEA-001.json",
    "env/dev/indices/ideas/by-stage/validation/IDEA-001.json",
    "env/dev/indices/ideas/by-status/under-review/IDEA-001.json",
  ]);
  const scorePlan = plans.find((p) => p.path.includes("/by-score/"));
  assert.ok(scorePlan);
  assert.equal(scorePlan?.pointer.score?.overall, 8.6);
  const ownerPlan = plans.find((p) => p.path.includes("/by-owner/"));
  assert.ok(ownerPlan);
  assert.equal(ownerPlan?.pointer.stageOwner, "Validation Owner");
});
