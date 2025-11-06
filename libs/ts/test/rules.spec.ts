import { test, strict as assert } from "node:test";
import { evaluateRule, buildAlert } from "../src/rules.js";

const rule = {
  id: "RULE-1",
  entity: "rule",
  env: "prod" as const,
  schema_version: "1.0.0",
  created_at: "2025-11-01T00:00:00Z",
  updated_at: "2025-11-01T00:00:00Z",
  match: {
    entity: "venture" as const,
    conditions: [
      { path: "kpis.MRR", op: "lt", value: 10000 },
      { path: "status", op: "eq", value: "Pilot" },
    ],
  },
  action: {
    type: "alert" as const,
    channel: "log",
    severity: "warn" as const,
  },
  description: "Flag ventures with low MRR in Pilot stage",
};

const snapshot = {
  id: "V001",
  entity: "venture",
  env: "prod" as const,
  schema_version: "1.0.0",
  created_at: "2025-11-01T00:00:00Z",
  updated_at: "2025-11-05T00:00:00Z",
  status: "Pilot",
  kpis: { MRR: 8000 },
};

test("evaluateRule passes when conditions met", () => {
  const result = evaluateRule(rule, snapshot);
  assert.equal(result.passed, true);
  assert.equal(result.failedConditions.length, 0);
  assert.equal(result.matchedConditions.length, 2);
});

test("buildAlert produces pointer to snapshot", () => {
  const evalResult = evaluateRule(rule, snapshot);
  const alert = buildAlert(rule, snapshot, evalResult);
  assert.equal(alert.entity_id, "V001");
  assert.equal(alert.snapshot_ptr, "env/prod/snapshots/ventures/V001.json");
  assert.equal(alert.severity, "warn");
});

