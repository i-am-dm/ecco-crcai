import { test, strict as assert } from "node:test";
import type { StorageClient } from "../src/gcs/storage.js";
import { listManifests } from "../src/readers.js";

class FakeStorage implements StorageClient {
  private objects = new Map<string, string>();
  constructor(init?: Record<string, string>) {
    if (init) for (const [k, v] of Object.entries(init)) this.objects.set(k, v);
  }
  async writeJson(): Promise<any> { throw new Error("not implemented"); }
  async stat(path: string): Promise<any> { throw new Error("not implemented: " + path); }
  async delete(): Promise<void> { throw new Error("not implemented"); }
  async list(prefix: string) {
    const out: any[] = [];
    for (const name of this.objects.keys()) if (name.startsWith(prefix)) out.push({ name });
    return out;
  }
  async readJson<T = unknown>(path: string): Promise<T> {
    const text = this.objects.get(path);
    if (text === undefined) throw new Error("not found");
    return JSON.parse(text) as T;
  }
  async readText(path: string): Promise<string> {
    const text = this.objects.get(path);
    if (text === undefined) throw new Error("not found");
    return text;
  }
}

test("listManifests prefers shards when present", async () => {
  const storage = new FakeStorage({
    "env/prod/manifests/ventures/_index_shard=00.ndjson":
      [
        JSON.stringify({ id: "V001", entity: "venture", env: "prod", schema_version: "1.0.0", updated_at: "2025-11-06T00:00:00Z", ptr: "env/prod/snapshots/ventures/V001.json" }),
        JSON.stringify({ id: "V002", entity: "venture", env: "prod", schema_version: "1.0.0", updated_at: "2025-11-06T01:00:00Z", ptr: "env/prod/snapshots/ventures/V002.json" }),
      ].join("\n") + "\n",
  });
  const items = await listManifests(storage, "prod", "venture", {} as any);
  assert.equal(items.length, 2);
  assert.equal(items[0].entity, "venture");
});

test("listManifests falls back to per-id when shards missing", async () => {
  const storage = new FakeStorage({
    "env/stg/manifests/cap_tables/by-id/CT-1.json": JSON.stringify({
      id: "CT-1", entity: "cap_table", env: "stg", schema_version: "1.0.0", updated_at: "2025-11-06T02:00:00Z", ptr: "env/stg/snapshots/cap_tables/CT-1.json"
    }),
    "env/stg/manifests/cap_tables/by-id/CT-2.json": JSON.stringify({
      id: "CT-2", entity: "cap_table", env: "stg", schema_version: "1.0.0", updated_at: "2025-11-06T03:00:00Z", ptr: "env/stg/snapshots/cap_tables/CT-2.json"
    }),
  });
  const items = await listManifests(storage, "stg", "cap_table", {} as any);
  assert.equal(items.length, 2);
  assert.equal(items[0].entity, "cap_table");
});

