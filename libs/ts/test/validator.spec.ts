import { test, strict as assert } from "node:test";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { validateJson } from "../src/schema/validator.js";
import { ulid } from "../src/ulid.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadSchema(rel: string) {
  const p = resolve(__dirname, "../../../", rel);
  return JSON.parse(readFileSync(p, "utf8"));
}

test("cap_table schema validates good sample", async () => {
  const schema = loadSchema("schemas/cap_table/v1.0.0.schema.json");
  const sample = {
    id: "CT-V001",
    entity: "cap_table",
    env: "prod",
    schema_version: "1.0.0",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ventureId: "V001",
    asOf: "2025-11-01",
    holders: [
      { holderId: "H-FOUNDERS", name: "Founders", security: "COMMON", quantity: 6000000, pctFullyDiluted: 0.6 },
    ],
  };
  const res = await validateJson(schema, sample);
  assert.equal(res.valid, true);
});

test("cap_table schema rejects missing required", async () => {
  const schema = loadSchema("schemas/cap_table/v1.0.0.schema.json");
  const bad = { entity: "cap_table" };
  const res = await validateJson(schema, bad);
  assert.equal(res.valid, false);
});

test("ULID length and ordering", () => {
  const ids = [] as string[];
  const t = Date.now();
  for (let i = 0; i < 5; i++) ids.push(ulid(t));
  for (const id of ids) assert.equal(id.length, 26);
  const sorted = [...ids].sort();
  assert.deepEqual(ids, sorted, "Monotonic ULIDs should be lexicographically increasing within same ms");
});

