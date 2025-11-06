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

test("makeManifestPerIdPath builds path", () => {
  assert.equal(makeManifestPerIdPath("prod", "venture", "V001"), "env/prod/manifests/ventures/by-id/V001.json");
});

test("manifestShardKey returns two hex chars by default", () => {
  const key = manifestShardKey("V001");
  assert.equal(key.length, 2);
});
