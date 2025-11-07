#!/usr/bin/env node
import { readFileSync, readdirSync, statSync } from "node:fs";
import { basename, join, extname } from "node:path";
import { GcsStorage, writeHistory, updateSnapshot, validateJson, makeManifestPerIdPath, manifestFromSnapshot, buildIndexPointers } from "@ecco/platform-libs";

type Env = "dev" | "stg" | "prod";

function usage() {
  console.error(`Usage:
  write-cli write-history --bucket <name> --env <dev|stg|prod> --entity <entity> --id <id> --file <json>
  write-cli write-and-snapshot --bucket <name> --env <env> --entity <entity> --id <id> --file <json>
  write-cli seed-dir --bucket <name> --env <env> --root <dir> [--snapshots true]
  write-cli rebuild-manifests --bucket <name> --env <env> --entity <entity|all>
  write-cli rebuild-indices --bucket <name> --env <env> --entity <entity|all>
`);
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  const cmd = argv[2];
  for (let i = 3; i < argv.length; i += 2) {
    const k = argv[i];
    const v = argv[i + 1];
    if (!k || !k.startsWith("--")) continue;
    args[k.slice(2)] = v;
  }
  return { cmd, args } as const;
}

function schemaPath(entity: string): string {
  switch (entity) {
    case "idea": return new URL("../../../schemas/idea/v1.0.0.schema.json", import.meta.url).pathname;
    case "venture": return new URL("../../../schemas/venture/v1.0.0.schema.json", import.meta.url).pathname;
    case "round": return new URL("../../../schemas/round/v1.0.0.schema.json", import.meta.url).pathname;
    case "cap_table": return new URL("../../../schemas/cap_table/v1.0.0.schema.json", import.meta.url).pathname;
    default: throw new Error(`Unsupported entity: ${entity}`);
  }
}

async function main() {
  const { cmd, args } = parseArgs(process.argv);
  if (!cmd || !["write-history", "write-and-snapshot", "seed-dir", "rebuild-manifests", "rebuild-indices"].includes(cmd)) {
    usage();
    process.exit(1);
  }
  const bucket = args.bucket;
  const env = args.env as Env;
  const storage = new GcsStorage(bucket);

  if (cmd === "write-history" || cmd === "write-and-snapshot") {
    const entity = args.entity as string;
    const id = args.id as string;
    const file = args.file as string;
    if (!bucket || !env || !entity || !id || !file) {
      usage();
      process.exit(1);
    }
    const schema = JSON.parse(readFileSync(schemaPath(entity), "utf8"));
    const payload = JSON.parse(readFileSync(file, "utf8"));
    const vres = await validateJson(schema, payload);
    if (!vres.valid) {
      console.error("Payload failed validation:", (vres as any).errors);
      process.exit(1);
    }
    const hist = await writeHistory(bucket, env, entity as any, id, payload, { storage });
    console.log(`Wrote history (gen=${hist.generation}) for ${entity}/${id}`);
    if (cmd === "write-and-snapshot") {
      const res = await updateSnapshot(bucket, env, entity as any, id, payload, { storage });
      if ((res as any).skipped) {
        console.log(`Skipped snapshot update (reason: ${(res as any).reason}) for ${entity}/${id}`);
      } else {
        console.log(`Updated snapshot (metagen=${(res as any).result.metageneration}) for ${entity}/${id}`);
      }
    }
    return;
  }

  if (cmd === "seed-dir") {
    const root = args.root as string;
    const writeSnapshots = String(args.snapshots ?? "true") === "true";
    if (!bucket || !env || !root) {
      usage();
      process.exit(1);
    }
    const entities = ["idea", "venture", "round", "cap_table"] as const;
    let count = 0;
    for (const ent of entities) {
      const dir = join(root, ent);
      let entries: string[] = [];
      try {
        entries = readdirSync(dir).filter((f) => extname(f) === ".json");
      } catch {
        continue;
      }
      const schema = JSON.parse(readFileSync(schemaPath(ent), "utf8"));
      for (const file of entries) {
        const id = file.replace(/\.json$/, "");
        const full = join(dir, file);
        if (!statSync(full).isFile()) continue;
        const payload = JSON.parse(readFileSync(full, "utf8"));
        const vres = await validateJson(schema, payload);
        if (!vres.valid) {
          console.error(`Skipping invalid ${ent}/${id}:`, (vres as any).errors);
          continue;
        }
        await writeHistory(bucket, env, ent as any, id, payload, { storage });
        if (writeSnapshots) await updateSnapshot(bucket, env, ent as any, id, payload, { storage });
        count++;
      }
    }
    console.log(`Seeded ${count} objects from ${root} (snapshots=${writeSnapshots})`);
    return;
  }

  if (cmd === "rebuild-manifests") {
    const entity = (args.entity as string) || "all";
    if (!bucket || !env) {
      usage();
      process.exit(1);
    }
    const entities = (entity === "all" ? ["idea", "venture", "round", "cap_table"] : [entity]) as string[];
    let written = 0;
    for (const ent of entities) {
      const segment = ent === "cap_table" ? "cap_tables" : `${ent}s`;
      const prefix = `env/${env}/snapshots/${segment}/`;
      const list = await storage.list(prefix);
      for (const o of list) {
        if (!o.name.endsWith(".json")) continue;
        const snap = await storage.readJson<any>(o.name);
        const manifest = manifestFromSnapshot(snap);
        const path = makeManifestPerIdPath(env, manifest.entity as any, manifest.id);
        let opts: any = { contentType: "application/json" };
        try {
          const meta = await storage.stat(path);
          opts.ifMetagenerationMatch = meta.metageneration;
        } catch {
          opts.ifGenerationMatch = 0;
        }
        await storage.writeJson(path, manifest, opts);
        written++;
      }
    }
    console.log(`Rebuilt ${written} manifests (env=${env}, entity=${entity})`);
    return;
  }

  if (cmd === "rebuild-indices") {
    const entity = (args.entity as string) || "all";
    if (!bucket || !env) {
      usage();
      process.exit(1);
    }
    const allEntities = ["idea", "venture", "round", "cap_table", "playbook", "playbook_run", "comment"] as const;
    const entities = (entity === "all" ? allEntities : [entity]) as readonly string[];
    let written = 0;
    let cleaned = 0;
    for (const ent of entities) {
      const segment = ent === "cap_table" ? "cap_tables" : `${ent}s`;
      const prefix = `env/${env}/snapshots/${segment}/`;
      const list = await storage.list(prefix);
      for (const o of list) {
        if (!o.name.endsWith(".json")) continue;
        const snap = await storage.readJson<any>(o.name);
        const plans = buildIndexPointers(snap);
        for (const plan of plans) {
          if (plan.cleanup) {
            const existing = await storage.list(plan.cleanup.prefix);
            const toDelete = existing.map((x: any) => x.name).filter((n: string) => n.endsWith(`/${plan.cleanup!.id}.json`));
            for (const name of toDelete) {
              try { await storage.delete(name); cleaned++; } catch {}
            }
          }
          await storage.writeJson(plan.path, plan.pointer, { contentType: "application/json" });
          written++;
        }
      }
    }
    console.log(`Rebuilt indices (env=${env}, entity=${entity}): written=${written}, cleaned=${cleaned}`);
    return;
  }
}

main().catch((err) => {
  console.error(basename(process.argv[1]), "error:", err);
  process.exit(1);
});
