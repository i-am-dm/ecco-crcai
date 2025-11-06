#!/usr/bin/env node
import { Storage } from "@google-cloud/storage";
import fetch from "node-fetch";

async function main() {
  const bucket = process.env.DATA_BUCKET;
  const env = process.env.ENV || "prod";
  const target = process.env.SEARCH_FEED_TARGET;
  if (!bucket || !target) {
    console.error("DATA_BUCKET and SEARCH_FEED_TARGET env vars required");
    process.exit(1);
  }
  const storage = new Storage();
  const bucketRef = storage.bucket(bucket);
  const [files] = await bucketRef.getFiles({ prefix: `env/${env}/snapshots/` });
  let sent = 0;
  for (const file of files) {
    if (!file.name.endsWith('.json')) continue;
    const [buf] = await file.download();
    const snapshot = JSON.parse(buf.toString("utf8"));
    const payload = { id: snapshot.id, entity: snapshot.entity, env: snapshot.env, updated_at: snapshot.updated_at, ptr: file.name };
    await fetch(target, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    sent++;
  }
  console.log(`Backfill dispatched ${sent} records to ${target}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

