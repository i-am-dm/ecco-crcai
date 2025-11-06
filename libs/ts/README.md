# @ecco/platform-libs (TypeScript)

Utilities for JSON-in-GCS persistence: envelope helpers, ULID, RFC3339 helpers, JSON Schema validation, and a GCS client with preconditions.

Install (in repo root)
- npm i
- cd libs/ts && npm i (installs dev deps like typescript)
- Add optional peers if needed in your app: `npm i ajv @google-cloud/storage`

Build
- npm run build (from libs/ts)

Usage
- Envelope
  ```ts
  import { newEnvelope, touch } from "@ecco/platform-libs";
  const env = newEnvelope("IDEA-001","idea","dev","1.0.0");
  const updated = touch(env);
  ```
- ULID
  ```ts
  import { ulid } from "@ecco/platform-libs";
  const id = ulid();
  ```
- JSON validation
  ```ts
  import { validateJson } from "@ecco/platform-libs";
  import schema from "../../../schemas/idea/v1.0.0.schema.json" assert { type: "json" };
  const res = await validateJson(schema, payload);
  if (!res.valid) throw new Error(res.errors?.join("; "));
  ```
- GCS client (requires @google-cloud/storage in consumer)
  ```ts
  import { GcsStorage } from "@ecco/platform-libs";
  const gcs = new GcsStorage("ecco-studio-platform-data");
  await gcs.writeJson("env/dev/test.json", {hello:"world"}, { ifGenerationMatch: 0 });
  ```

Schemas
- Schemas live under `schemas/{entity}/v1.0.0.schema.json` in this repo. In GCS, copy under `env/{env}/schemas/...` as per spec.

