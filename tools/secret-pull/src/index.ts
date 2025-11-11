#!/usr/bin/env node
import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { mkdirSync } from "node:fs";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

type Spec = { name: string; envKey: string };

function usage() {
  console.error(`Usage:
  secret-pull --project <id> --out .env.local --secrets name1[:ENV_KEY],name2[:ENV_KEY],projects/p/secrets/s/versions/1:ENV

Notes:
  - If --project omitted, reads GOOGLE_CLOUD_PROJECT/GCP_PROJECT.
  - If ENV_KEY omitted, uses UPPER_SNAKE(name).
  - Secrets may be bare names (resolved to latest in provided project) or full resource paths.
`);
}

function parseArgs(argv: string[]) {
  const args: Record<string, string> = {};
  for (let i = 2; i < argv.length; i += 2) {
    const k = argv[i];
    const v = argv[i + 1];
    if (!k || !k.startsWith("--")) continue;
    args[k.slice(2)] = v ?? "";
  }
  return args;
}

function toEnvKey(name: string): string {
  return name
    .replace(/^projects\/.+\/secrets\//, "")
    .replace(/\/versions\/.+$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .toUpperCase();
}

function parseSecretsSpec(spec: string | undefined): Spec[] {
  if (!spec) return [];
  return spec.split(",").map((raw) => {
    const [name, envKey] = raw.split(":");
    return { name: name.trim(), envKey: (envKey || toEnvKey(name)).trim() };
  });
}

async function accessSecret(client: SecretManagerServiceClient, project: string | undefined, name: string): Promise<string> {
  const isFull = name.startsWith("projects/");
  const resource = isFull
    ? name
    : project
    ? `projects/${project}/secrets/${name}/versions/latest`
    : (() => {
        throw new Error("No project specified for bare secret name");
      })();
  const [version] = await client.accessSecretVersion({ name: resource });
  const payload = version.payload?.data ? Buffer.from(version.payload.data).toString("utf8") : undefined;
  if (!payload) throw new Error(`Secret ${resource} has no payload`);
  return payload.trim();
}

async function main() {
  const args = parseArgs(process.argv);
  const project = args.project || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || "";
  const out = resolve(process.cwd(), args.out || ".env.local");
  const specs = parseSecretsSpec(args.secrets);
  if (specs.length === 0) {
    usage();
    process.exit(1);
  }
  const client = new SecretManagerServiceClient();
  const lines: string[] = [];
  for (const s of specs) {
    const value = await accessSecret(client, project || undefined, s.name);
    // Escape any newlines
    const safe = value.replace(/\n/g, "\\n");
    lines.push(`${s.envKey}=${safe}`);
  }
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, lines.join("\n") + "\n", { encoding: "utf8" });
  console.log(`Wrote ${specs.length} secrets to ${out}`);
}

main().catch((err) => {
  console.error("secret-pull error:", err);
  process.exit(1);
});

