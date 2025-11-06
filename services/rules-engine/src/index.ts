import http from "node:http";
import {
  GcsStorage,
  entityFromPathSegment,
  evaluateRule,
  buildAlert,
  RuleDefinition,
} from "@ecco/platform-libs";
import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

type PubSubPush = {
  message?: {
    data?: string;
  };
};

type GcsEvent = {
  bucket: string;
  name: string;
};

const PORT = Number(process.env.PORT || 8080);
const secretClient = new SecretManagerServiceClient();

function send(res: http.ServerResponse, code: number, body: any) {
  const data = typeof body === "string" ? body : JSON.stringify(body);
  res.writeHead(code, { "content-type": "application/json" });
  res.end(data);
}

function parseSnapshotPath(name: string) {
  const parts = name.split("/");
  if (parts.length < 5) return null;
  if (parts[0] !== "env") return null;
  const env = parts[1] as "dev" | "stg" | "prod";
  if (parts[2] !== "snapshots") return null;
  const segment = parts[3];
  const entity = entityFromPathSegment(segment);
  if (!entity) return null;
  const file = parts.slice(4).join("/");
  if (!file.endsWith(".json")) return null;
  const id = file.replace(/\.json$/, "");
  return { env, entity, id } as const;
}

async function loadRules(storage: GcsStorage, env: string): Promise<RuleDefinition[]> {
  const prefix = `env/${env}/rules/`;
  const listed = await storage.list(prefix);
  const rules: RuleDefinition[] = [];
  for (const item of listed) {
    if (!item.name.endsWith(".json")) continue;
    try {
      const rule = await storage.readJson<RuleDefinition>(item.name);
      rules.push(rule);
    } catch (err) {
      console.warn(`rules-engine: failed to load ${item.name}:`, err);
    }
  }
  return rules;
}

async function writeAlert(storage: GcsStorage, alert: ReturnType<typeof buildAlert>) {
  const path = `env/${alert.env}/reports/alerts/${alert.rule_id}/${alert.entity_id}/${alert.id}.json`;
  await storage.writeJson(path, alert, { ifGenerationMatch: 0, contentType: "application/json" });
  return path;
}

async function resolveSecret(target: string): Promise<string> {
  // Formats supported:
  // - sm://SECRET_NAME (uses project from GOOGLE_CLOUD_PROJECT)
  // - sm://projects/{project}/secrets/{secret}/versions/{version}
  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCP_PROJECT || "";
  const normalized = target.replace(/^sm:\/\//, "");
  const secretPath = normalized.includes("/secrets/")
    ? normalized
    : project
    ? `projects/${project}/secrets/${normalized}/versions/latest`
    : (() => {
        throw new Error("No project configured for secret resolution");
      })();
  const [version] = await secretClient.accessSecretVersion({ name: secretPath });
  const payload = version.payload?.data?.toString("utf8");
  if (!payload) throw new Error(`Secret ${secretPath} has no payload`);
  return payload.trim();
}

async function resolveTarget(target?: string): Promise<string | null> {
  // Support three modes:
  // 1) sm://SECRET_NAME or full secret path → resolve via Secret Manager
  // 2) env://ENV_VAR → read from process.env
  // 3) Fallback (no target) → use ALERTS_WEBHOOK_URL if present (local dev convenience)
  if (!target) {
    const fallback = process.env.ALERTS_WEBHOOK_URL;
    return fallback ? fallback : null;
  }
  if (target.startsWith("sm://")) {
    return resolveSecret(target);
  }
  if (target.startsWith("env://")) {
    const key = target.slice("env://".length);
    const val = process.env[key];
    return val ?? null;
  }
  return target;
}

async function dispatchAlert(alert: ReturnType<typeof buildAlert>, rule: RuleDefinition) {
  const channel = rule.action.channel ?? "log";
  const target = await resolveTarget(rule.action.target);
  const payload = { alert, ruleId: rule.id };

  switch (channel) {
    case "webhook":
      if (!target) throw new Error(`Rule ${rule.id} webhook target missing`);
      await fetch(target, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      console.log(JSON.stringify({ severity: alert.severity, ruleId: rule.id, message: "Dispatched webhook alert", target }));
      break;
    case "log":
    default:
      console.log(JSON.stringify({ severity: alert.severity, ruleId: rule.id, message: "Alert logged", alert }));
      break;
  }
}

async function handleEvent(event: GcsEvent) {
  const pathInfo = parseSnapshotPath(event.name);
  if (!pathInfo) return { skipped: true, reason: "not_snapshot" } as const;

  const storage = new GcsStorage(event.bucket);
  const snapshot = await storage.readJson<any>(event.name).catch((err) => ({ _error: err }));
  if ((snapshot as any)?._error) {
    return { skipped: true, reason: "read_failed", error: String((snapshot as any)._error) } as const;
  }

  if (snapshot.env !== pathInfo.env) {
    return { skipped: true, reason: "env_mismatch" } as const;
  }

  const rules = await loadRules(storage, pathInfo.env);
  if (rules.length === 0) {
    return { skipped: true, reason: "no_rules" } as const;
  }

  const triggered: Array<{ ruleId: string; alertPath: string }> = [];

  for (const rule of rules) {
    if (rule.env && rule.env !== snapshot.env) continue;
    const result = evaluateRule(rule, snapshot);
    if (!result.passed) continue;
    const alert = buildAlert(rule, snapshot, result);
    const path = await writeAlert(storage, alert);
    try {
      await dispatchAlert(alert, rule);
    } catch (err) {
      console.error(JSON.stringify({ ruleId: rule.id, message: "Alert dispatch failed", error: String(err) }));
    }
    triggered.push({ ruleId: rule.id, alertPath: path });
  }

  return {
    skipped: triggered.length === 0,
    reason: triggered.length === 0 ? "no_triggers" : undefined,
    triggered,
  } as const;
}

const server = http.createServer(async (req, res) => {
  if (req.method !== "POST" || !req.url || !req.url.startsWith("/pubsub/push")) {
    send(res, 404, { error: "not found" });
    return;
  }
  try {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(chunk as Buffer);
    const raw = Buffer.concat(chunks).toString("utf8");
    const body = JSON.parse(raw) as PubSubPush;
    const b64 = body.message?.data;
    if (!b64) {
      send(res, 204, {});
      return;
    }
    const decoded = Buffer.from(b64, "base64").toString("utf8");
    const event = JSON.parse(decoded) as GcsEvent;
    const result = await handleEvent(event);
    send(res, 200, { ok: true, result });
  } catch (err) {
    send(res, 200, { ok: true, skipped: true, error: String(err) });
  }
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`rules-engine listening on :${PORT}`);
});
