import { validateJson } from "../src/schema/validator.js";
import { readFileSync } from "node:fs";

const schemaPath = new URL("../../../schemas/cap_table/v1.0.0.schema.json", import.meta.url);
const schema = JSON.parse(readFileSync(schemaPath, "utf8"));

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
if (!res.valid) {
  console.error("Validation errors:", (res as any).errors);
  process.exit(1);
}
console.log("Sample valid.");

