#!/usr/bin/env node
import { Storage } from "@google-cloud/storage";

async function main() {
  const bucket = process.env.DATA_BUCKET;
  const env = process.env.ENV || "prod";
  if (!bucket) {
    console.error("DATA_BUCKET env required");
    process.exit(1);
  }
  const storage = new Storage();
  const bucketRef = storage.bucket(bucket);
  const summary: any = { env, generated_at: new Date().toISOString(), counts: {}, samples: {} };

  const prefixes = ["snapshots", "manifests", "indices", "reports/alerts"];
  for (const p of prefixes) {
    const [files] = await bucketRef.getFiles({ prefix: `env/${env}/${p}/` });
    summary.counts[p] = files.length;
    summary.samples[p] = files.slice(0, 3).map((f) => f.name);
  }
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

