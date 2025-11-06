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

