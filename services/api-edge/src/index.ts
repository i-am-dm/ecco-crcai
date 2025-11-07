import http from "node:http";
import url from "node:url";
import { makeStorage, listManifests, makeSnapshotPath, writeHistory, validateJson, cloudTraceFromHeader, logJSON, enforceRBAC, Role, updateSnapshot, manifestFromSnapshot, makeManifestPerIdPath, buildIndexPointers, ulid } from "@ecco/platform-libs";
import { authFromRequest } from "./auth.js";
import { readFileSync } from "node:fs";
import { resolve, extname } from "node:path";

const PORT = Number(process.env.PORT || 8080);
const BUCKET = process.env.DATA_BUCKET || "";
const MAX_RESEARCH_DOC_BYTES = Number(process.env.RESEARCH_DOC_MAX_BYTES || 25 * 1024 * 1024);
const PUBLIC_ASSET_BASE = (process.env.PUBLIC_ASSET_BASE_URL || process.env.ASSET_BASE_URL || "").replace(/\/+$/, "");
type AllowedEnv = "dev" | "stg" | "prod";
const FALLBACK_ENV: AllowedEnv = process.env.DEFAULT_ENV === "stg" || process.env.DEFAULT_ENV === "prod" ? (process.env.DEFAULT_ENV as AllowedEnv) : "dev";

function resolveEnv(value: string): AllowedEnv {
  if (value === "dev" || value === "stg" || value === "prod") return value;
  return FALLBACK_ENV;
}

async function getRoles(req: http.IncomingMessage): Promise<Role[]> {
  const ctx = await authFromRequest(req);
  return ctx.roles || [];
}

function send(res: http.ServerResponse, code: number, body: any) {
  const data = typeof body === "string" ? body : JSON.stringify(body);
  if (res.writableEnded) return; // avoid double send on restarts
  res.writeHead(code, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type,x-roles,authorization",
    "access-control-allow-methods": "GET,POST,OPTIONS",
  });
  res.end(data);
}

function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

function sanitizeFileName(name: string): string {
  const cleaned = name
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "research-doc";
}

function sanitizePathSegment(input: string): string {
  const cleaned = input
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "idea";
}

const MIME_EXTENSION_MAP: Record<string, string> = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/vnd.ms-powerpoint": ".ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": ".pptx",
  "text/plain": ".txt",
  "text/markdown": ".md",
  "application/json": ".json",
  "image/png": ".png",
  "image/jpeg": ".jpg",
};

function resolveExtension(fileName: string, contentType: string): string {
  const currentExt = extname(fileName);
  if (currentExt) return currentExt.toLowerCase();
  const mapped = MIME_EXTENSION_MAP[contentType.toLowerCase()];
  return mapped || "";
}

function base64Payload(input: string): string {
  if (!input) return "";
  const commaIndex = input.indexOf(",");
  if (commaIndex !== -1) {
    return input.slice(commaIndex + 1);
  }
  return input;
}

async function handleResearchDocUpload(req: http.IncomingMessage, res: http.ServerResponse, envFromQuery: string) {
  const body = await readBody(req);
  const env = String(body?.env || envFromQuery || "prod");
  const ideaIdRaw = typeof body?.ideaId === "string" ? body.ideaId : typeof body?.idea_id === "string" ? body.idea_id : "";
  const ideaId = ideaIdRaw.trim();
  if (!ideaId) {
    send(res, 400, { error: "invalid_request", reason: "ideaId_required" });
    return;
  }
  const roles = await getRoles(req);
  const r = enforceRBAC(roles, "idea", "POST", env);
  if (!r.allowed) {
    send(res, 403, { error: "forbidden", reason: r.reason });
    return;
  }
  const dataRaw = typeof body?.data === "string" ? body.data : "";
  if (!dataRaw) {
    send(res, 400, { error: "invalid_request", reason: "data_required" });
    return;
  }
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64Payload(dataRaw), "base64");
  } catch {
    send(res, 400, { error: "invalid_request", reason: "data_invalid_base64" });
    return;
  }
  if (!buffer.length) {
    send(res, 400, { error: "invalid_request", reason: "data_empty" });
    return;
  }
  if (MAX_RESEARCH_DOC_BYTES > 0 && buffer.length > MAX_RESEARCH_DOC_BYTES) {
    send(res, 413, { error: "payload_too_large", reason: `max_${MAX_RESEARCH_DOC_BYTES}` });
    return;
  }
  const fileNameInput =
    (typeof body?.fileName === "string" && body.fileName) || (typeof body?.filename === "string" && body.filename) || "research-doc";
  const safeBaseName = sanitizeFileName(fileNameInput);
  const contentTypeInput =
    (typeof body?.contentType === "string" && body.contentType) ||
    (typeof body?.content_type === "string" && body.content_type) ||
    "application/octet-stream";
  const contentType = contentTypeInput.toLowerCase();
  const extension = resolveExtension(safeBaseName, contentType);
  const docId = ulid().toLowerCase();
  const ideaSegment = sanitizePathSegment(ideaId);
  const objectPath = `env/${env}/research_docs/${ideaSegment}/${docId}${extension}`;
  const storage = makeStorage(BUCKET);
  await storage.writeBuffer(objectPath, buffer, { contentType });
  const publicUrl = PUBLIC_ASSET_BASE ? `${PUBLIC_ASSET_BASE}/${objectPath}` : `https://storage.googleapis.com/${BUCKET}/${objectPath}`;
  const uploadedAt = new Date().toISOString();
  const fileNameWithExt = extension && !safeBaseName.toLowerCase().endsWith(extension) ? `${safeBaseName}${extension}` : safeBaseName;
  send(res, 201, {
    storagePath: objectPath,
    url: publicUrl,
    fileName: fileNameWithExt,
    contentType,
    sizeBytes: buffer.length,
    uploadedAt,
  });
}

async function handleList(req: http.IncomingMessage, res: http.ServerResponse, entity: string, env: string) {
  const roles = await getRoles(req);
  let r = enforceRBAC(roles, entity, "GET", env);
  // Allow investors/advisors to view published playbooks only
  const investorReadPlaybooks = (entity === 'playbook') && (roles.includes('Investor') || roles.includes('Advisor'));
  if (investorReadPlaybooks) r = { allowed: true } as any;
  if (!r.allowed) {
    send(res, 403, { error: "forbidden", reason: r.reason });
    return;
  }
  const storage = makeStorage(BUCKET);
  const records = await listManifests(storage, env as any, entity as any, {} as any);
  const items = investorReadPlaybooks ? (records as any[]).filter((m) => String(m?.status || '').toLowerCase() === 'published') : records;
  send(res, 200, { items });
}

async function handleGet(req: http.IncomingMessage, res: http.ServerResponse, entity: string, id: string, env: string) {
  const roles = await getRoles(req);
  let r = enforceRBAC(roles, entity, "GET", env);
  if (!r.allowed && (entity === 'playbook') && (roles.includes('Investor') || roles.includes('Advisor'))) {
    // allow but will filter by status below
    r = { allowed: true } as any;
  }
  if (!r.allowed) {
    send(res, 403, { error: "forbidden", reason: r.reason });
    return;
  }
  const storage = makeStorage(BUCKET);
  const path = makeSnapshotPath(env as any, entity as any, id);
  try {
    const json = await storage.readJson(path);
    if ((entity === 'playbook') && (roles.includes('Investor') || roles.includes('Advisor'))) {
      const status = String((json as any)?.status || '').toLowerCase();
      if (status !== 'published') return send(res, 403, { error: 'forbidden', reason: 'unpublished' });
    }
    send(res, 200, json);
  } catch (err) {
    send(res, 404, { error: "not_found" });
  }
}

async function handleHistory(req: http.IncomingMessage, res: http.ServerResponse) {
  const body = await readBody(req);
  const requestedEnv = String(body?.env || "");
  const env = resolveEnv(requestedEnv);
  body.env = env;
  const entity = String(body?.entity || "");
  let id = String(body?.id || "");
  const authCtx = await authFromRequest(req);
  const roles = authCtx.roles || [];
  const r = enforceRBAC(roles, entity, "POST", env);
  if (!r.allowed) {
    send(res, 403, { error: "forbidden", reason: r.reason });
    return;
  }
  if (!id) {
    if (entity === "idea") {
      id = ulid().toLowerCase();
      body.id = id;
    } else {
      send(res, 400, { error: "invalid_request", reason: "id_required" });
      return;
    }
  }
  // Extra guard: publishing playbooks is limited to Admin/Leadership
  if (entity === 'playbook' && (body?.status === 'Published' || body?.status === 'published')) {
    const allowed = roles.includes('Admin') || roles.includes('Leadership');
    if (!allowed) {
      return send(res, 403, { error: 'forbidden', reason: 'publish_requires_admin' });
    }
  }
  // Validate against declared schema version if available
  const version = String(body?.schema_version || "");
  try {
    if (version) {
      const schemaPath = resolve(process.cwd(), "schemas", entity, `${version}.schema.json`);
      const schema = JSON.parse(readFileSync(schemaPath, "utf8"));
      const result = await validateJson(schema, body);
      if (!result.valid) {
        send(res, 400, { error: "schema_validation_failed", details: result });
        return;
      }
    }
  } catch {
    // proceed without validation if schema missing
  }
  const storage = makeStorage(BUCKET);
  let payload = body;
  if (entity === "idea") {
    payload = await prepareIdeaPayload({
      payload: body,
      env,
      id,
      storage,
      actor: authCtx.email || authCtx.sub || body.created_by || body.createdBy,
    });
  }
  await writeHistory(BUCKET, env as any, entity as any, id, payload, { storage });
  // Respond immediately
  send(res, 202, { accepted: true });
  const nowIso = new Date().toISOString();
  const snapshot = {
    ...payload,
    id,
    entity,
    env,
    schema_version: payload?.schema_version || '1.0.0',
    created_at: payload?.created_at || payload?.createdAt || nowIso,
    updated_at: payload?.updated_at || payload?.updatedAt || nowIso,
  };
  runDevSnapshotPipeline(storage, snapshot);
}

async function listPointers(storage: ReturnType<typeof makeStorage>, prefix: string): Promise<any[]> {
  const objects = await storage.list(prefix);
  const jsonFiles = objects.map((o: any) => o.name).filter((n: string) => n.endsWith(".json"));
  const out: any[] = [];
  for (const name of jsonFiles) {
    try {
      out.push(await storage.readJson(name));
    } catch {}
  }
  return out;
}

async function runDevSnapshotPipeline(storage: ReturnType<typeof makeStorage>, snapshot: any) {
  try {
    const devFsMode = String(process.env.STORAGE_BACKEND || "").toLowerCase() === "fs";
    if (!devFsMode) return;
    if (!snapshot?.env || !snapshot?.entity || !snapshot?.id) return;
    const env = snapshot.env as any;
    const entity = snapshot.entity as any;
    const id = snapshot.id as string;
    await updateSnapshot(BUCKET, env, entity, id, snapshot, { storage });
    const manifest = manifestFromSnapshot(snapshot);
    const manPath = makeManifestPerIdPath(env, entity, id);
    await storage.writeJson(manPath, manifest, { contentType: "application/json", ifGenerationMatch: 0 });
    const plans = buildIndexPointers(snapshot);
    for (const plan of plans) {
      if (plan.cleanup) {
        const existing = await storage.list(plan.cleanup.prefix);
        const toDelete = existing.map((o: any) => o.name).filter((n: string) => n.endsWith(`/${plan.cleanup!.id}.json`));
        for (const name of toDelete) {
          await storage.delete(name).catch(() => {});
        }
      }
      await storage.writeJson(plan.path, plan.pointer, { contentType: "application/json" });
    }
    logJSON({ message: "dev pipeline success", severity: "INFO", entity, id });
  } catch (e) {
    logJSON({ message: "dev pipeline error", severity: "WARNING", error: String(e) });
  }
}

type StageHistoryEntry = {
  stage: string;
  changed_at: string;
  changed_by?: string;
  notes?: string;
};

type IdeaPayloadOptions = {
  payload: any;
  env: AllowedEnv;
  id: string;
  storage: ReturnType<typeof makeStorage>;
  actor?: string | null;
};

async function prepareIdeaPayload({ payload, env, id, storage, actor }: IdeaPayloadOptions) {
  const enriched = { ...payload };
  const nowIso = new Date().toISOString();
  enriched.id = id;
  enriched.entity = "idea";
  enriched.env = env;
  enriched.schema_version = enriched.schema_version || "1.0.0";

  let existing: any = null;
  try {
    const snapPath = makeSnapshotPath(env as any, "idea" as any, id);
    existing = await storage.readJson(snapPath);
  } catch {
    existing = null;
  }

  const createdAt = enriched.created_at || enriched.createdAt || existing?.created_at || existing?.createdAt || nowIso;
  enriched.created_at = createdAt;
  enriched.createdAt = createdAt;

  const updatedAt = enriched.updated_at || enriched.updatedAt || nowIso;
  enriched.updated_at = updatedAt;
  enriched.updatedAt = updatedAt;

  const resolvedStageOwner =
    enriched.stageOwner ||
    enriched.stage_owner ||
    existing?.stageOwner ||
    existing?.stage_owner ||
    actor ||
    "system@ecco.studio";
  if (resolvedStageOwner) {
    enriched.stageOwner = resolvedStageOwner;
    enriched.stage_owner = resolvedStageOwner;
  }

  const resolvedStageDue =
    enriched.stageDueDate || enriched.stage_due_date || existing?.stageDueDate || existing?.stage_due_date || "";
  if (resolvedStageDue) {
    enriched.stageDueDate = resolvedStageDue;
    enriched.stage_due_date = resolvedStageDue;
  }

  const previousStage = typeof existing?.stage === "string" && existing.stage.trim() ? existing.stage : undefined;
  const currentStage = typeof enriched.stage === "string" && enriched.stage.trim() ? enriched.stage : previousStage || "Idea";
  enriched.stage = currentStage;

  let stageHistory: StageHistoryEntry[] = [];
  if (Array.isArray(enriched.stage_history)) {
    stageHistory = sanitizeStageHistoryEntries(enriched.stage_history, createdAt);
  } else if (Array.isArray(enriched.stageHistory)) {
    stageHistory = sanitizeStageHistoryEntries(enriched.stageHistory, createdAt);
  } else if (Array.isArray(existing?.stage_history)) {
    stageHistory = sanitizeStageHistoryEntries(existing.stage_history, createdAt);
  }

  if (stageHistory.length === 0) {
    stageHistory = [
      {
        stage: currentStage,
        changed_at: createdAt,
        changed_by: resolvedStageOwner,
      },
    ];
  }

  const lastEntry = stageHistory[stageHistory.length - 1];
  if (previousStage && currentStage && previousStage !== currentStage) {
    stageHistory.push({
      stage: currentStage,
      changed_at: updatedAt,
      changed_by: actor || resolvedStageOwner,
    });
  } else if (lastEntry?.stage !== currentStage) {
    stageHistory.push({
      stage: currentStage,
      changed_at: updatedAt,
      changed_by: actor || resolvedStageOwner,
    });
  }

  enriched.stage_history = stageHistory;
  enriched.stageHistory = stageHistory;
  return enriched;
}

function sanitizeStageHistoryEntries(entries: any[], fallbackDate: string): StageHistoryEntry[] {
  const out: StageHistoryEntry[] = [];
  for (const entry of entries) {
    if (!entry || typeof entry !== "object") continue;
    const stage = typeof (entry as any).stage === "string" && (entry as any).stage.trim() ? (entry as any).stage : "";
    if (!stage) continue;
    const changedAtValue =
      typeof (entry as any).changed_at === "string" && (entry as any).changed_at.trim()
        ? (entry as any).changed_at
        : fallbackDate;
    const normalized: StageHistoryEntry = {
      stage,
      changed_at: changedAtValue,
    };
    if (typeof (entry as any).changed_by === "string" && (entry as any).changed_by.trim()) {
      normalized.changed_by = (entry as any).changed_by.trim();
    }
    if (typeof (entry as any).notes === "string" && (entry as any).notes.trim()) {
      normalized.notes = (entry as any).notes.trim();
    }
    out.push(normalized);
  }
  return out;
}

type CommentAttachment = {
  title?: string;
  url: string;
  type?: string;
};

function normalizeAttachments(input: unknown): CommentAttachment[] {
  if (!Array.isArray(input)) return [];
  const normalized: CommentAttachment[] = [];
  for (const raw of input) {
    if (typeof raw === "string") {
      if (!raw.trim()) continue;
      normalized.push({ url: raw.trim() });
      continue;
    }
    if (!raw || typeof raw !== "object") continue;
    const obj = raw as Record<string, unknown>;
    const urlRaw = obj.url || obj.href;
    if (typeof urlRaw !== "string" || !urlRaw.trim()) continue;
    const item: CommentAttachment = { url: urlRaw.trim() };
    const title = obj.title || obj.name;
    if (typeof title === "string" && title.trim()) item.title = title.trim();
    if (typeof obj.type === "string" && obj.type.trim()) item.type = obj.type.trim();
    normalized.push(item);
  }
  return normalized.slice(0, 5);
}

function normalizeMentions(input: unknown): string[] | undefined {
  if (!Array.isArray(input)) return undefined;
  const mentions = Array.from(
    new Set(
      input
        .filter((item): item is string => typeof item === "string" && item.trim().length > 0)
        .map((item) => item.trim())
    )
  );
  return mentions.length ? mentions.slice(0, 10) : undefined;
}

async function handleIdeaCommentsList(req: http.IncomingMessage, res: http.ServerResponse, ideaId: string, env: string) {
  const ctx = await authFromRequest(req);
  const r = enforceRBAC(ctx.roles || [], "idea", "GET", env);
  if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
  const storage = makeStorage(BUCKET);
  const prefix = `env/${env}/indices/comments/by-idea/${ideaId}/`;
  const pointers = await listPointers(storage, prefix);
  const sorted = pointers.sort((a, b) => {
    const aTs = Date.parse(a.updated_at || a.created_at || "") || 0;
    const bTs = Date.parse(b.updated_at || b.created_at || "") || 0;
    return bTs - aTs;
  });
  const items: any[] = [];
  for (const pointer of sorted.slice(0, 50)) {
    const ptr = pointer?.ptr;
    if (typeof ptr === "string") {
      try {
        const snap = await storage.readJson(ptr);
        items.push(snap);
        continue;
      } catch {}
    }
    items.push(pointer);
  }
  send(res, 200, { items });
}

async function handleIdeaCommentsCreate(req: http.IncomingMessage, res: http.ServerResponse, ideaId: string, env: string) {
  const ctx = await authFromRequest(req);
  const r = enforceRBAC(ctx.roles || [], "idea", "POST", env);
  if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
  const body = await readBody(req);
  const messageRaw = typeof body?.message === "string" ? body.message : body?.text;
  const message = (messageRaw || "").trim();
  if (!message) return send(res, 400, { error: "invalid_request", reason: "message_required" });
  if (message.length > 4000) return send(res, 400, { error: "invalid_request", reason: "message_too_long" });
  const attachments = normalizeAttachments(body?.attachments);
  const mentions = normalizeMentions(body?.mentions);
  const storage = makeStorage(BUCKET);
  let ideaTitle = "";
  try {
    const ideaSnapshot = await storage.readJson<any>(makeSnapshotPath(env as any, "idea" as any, ideaId));
    ideaTitle = ideaSnapshot?.title || ideaSnapshot?.theme || "";
  } catch {
    return send(res, 404, { error: "idea_not_found" });
  }
  const commentId = ulid();
  const nowIso = new Date().toISOString();
  const authorName =
    (typeof body?.authorName === "string" && body.authorName.trim()) ||
    (typeof body?.author_name === "string" && body.author_name.trim()) ||
    ctx.email ||
    ctx.sub ||
    "Unknown";
  const comment = {
    id: commentId,
    entity: "comment",
    env,
    schema_version: "v1.0.0",
    created_at: nowIso,
    updated_at: nowIso,
    idea_id: ideaId,
    ideaId: ideaId,
    idea_title: ideaTitle,
    message,
    attachments,
    mentions,
    author_id: ctx.sub || ctx.email || body?.author_id || body?.authorId,
    author_email: ctx.email || body?.author_email || body?.authorEmail,
    author_name: authorName,
  };
  await writeHistory(BUCKET, env as any, "comment", commentId, comment, { storage });
  runDevSnapshotPipeline(storage, comment);
  send(res, 201, { comment });
  notifySlackOfComment(comment).catch(() => {});
}

async function notifySlackOfComment(comment: any) {
  const webhook = process.env.COMMENTS_SLACK_WEBHOOK || process.env.ALERTS_WEBHOOK_URL;
  if (!webhook) return;
  try {
    const author = comment?.author_name || comment?.author_email || comment?.author_id || "team member";
    const ideaRef = comment?.idea_title ? `${comment.idea_title} (${comment.ideaId})` : comment?.ideaId || "idea";
    const text = [
      `💬 *New comment on* ${ideaRef}`,
      `*Author:* ${author}`,
      `*Message:* ${comment?.message}`,
    ];
    await fetch(webhook, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: text.join("\n") }),
    });
  } catch (err) {
    logJSON({ message: "comment slack notify failed", severity: "WARNING", error: String(err) });
  }
}

async function handleIndexRoute(req: http.IncomingMessage, res: http.ServerResponse, path: string, env: string) {
  // Ventures by-status/by-lead/by-next-due
  let m = path.match(/^\/v1\/index\/ventures\/by-status\/([^/]+)$/);
  if (m) {
    const r = enforceRBAC(await getRoles(req), "venture", "GET", env);
    if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
    const status = decodeURIComponent(m[1]);
    const storage = makeStorage(BUCKET);
    const items = await listPointers(storage, `env/${env}/indices/ventures/by-status/${status}/`);
    return send(res, 200, { items });
  }
  m = path.match(/^\/v1\/index\/ventures\/by-lead\/([^/]+)$/);
  if (m) {
    const r = enforceRBAC(await getRoles(req), "venture", "GET", env);
    if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
    const lead = decodeURIComponent(m[1]);
    const storage = makeStorage(BUCKET);
    const items = await listPointers(storage, `env/${env}/indices/ventures/by-lead/${lead}/`);
    return send(res, 200, { items });
  }
  m = path.match(/^\/v1\/index\/ventures\/by-next-due\/([^/]+)$/);
  if (m) {
    const r = enforceRBAC(await getRoles(req), "venture", "GET", env);
    if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
    const ym = decodeURIComponent(m[1]);
    const storage = makeStorage(BUCKET);
    const items = await listPointers(storage, `env/${env}/indices/ventures/by-next-due/${ym}/`);
    return send(res, 200, { items });
  }
  // Playbooks indices
  m = path.match(/^\/v1\/index\/playbooks\/by-stage\/([^/]+)$/);
  if (m) {
    const r = enforceRBAC(await getRoles(req), "playbook", "GET", env);
    if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
    const stage = decodeURIComponent(m[1]);
    const storage = makeStorage(BUCKET);
    const items = await listPointers(storage, `env/${env}/indices/playbooks/by-stage/${stage}/`);
    return send(res, 200, { items });
  }
  m = path.match(/^\/v1\/index\/playbooks\/by-function\/([^/]+)$/);
  if (m) {
    const r = enforceRBAC(await getRoles(req), "playbook", "GET", env);
    if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
    const func = decodeURIComponent(m[1]);
    const storage = makeStorage(BUCKET);
    const items = await listPointers(storage, `env/${env}/indices/playbooks/by-function/${func}/`);
    return send(res, 200, { items });
  }
  m = path.match(/^\/v1\/index\/playbooks\/by-owner\/([^/]+)$/);
  if (m) {
    const r = enforceRBAC(await getRoles(req), "playbook", "GET", env);
    if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
    const owner = decodeURIComponent(m[1]);
    const storage = makeStorage(BUCKET);
    const items = await listPointers(storage, `env/${env}/indices/playbooks/by-owner/${owner}/`);
    return send(res, 200, { items });
  }
  m = path.match(/^\/v1\/index\/playbooks\/by-tag\/([^/]+)$/);
  if (m) {
    const r = enforceRBAC(await getRoles(req), "playbook", "GET", env);
    if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
    const tag = decodeURIComponent(m[1]);
    const storage = makeStorage(BUCKET);
    const items = await listPointers(storage, `env/${env}/indices/playbooks/by-tag/${tag}/`);
    return send(res, 200, { items });
  }
  // Playbook run indices
  m = path.match(/^\/v1\/index\/playbook_runs\/by-playbook\/([^/]+)$/);
  if (m) {
    const r = enforceRBAC(await getRoles(req), "playbook_run", "GET", env);
    if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
    const pbId = decodeURIComponent(m[1]);
    const storage = makeStorage(BUCKET);
    const items = await listPointers(storage, `env/${env}/indices/playbook_runs/by-playbook/${pbId}/`);
    return send(res, 200, { items });
  }
  m = path.match(/^\/v1\/index\/playbook_runs\/by-venture\/([^/]+)$/);
  if (m) {
    const r = enforceRBAC(await getRoles(req), "playbook_run", "GET", env);
    if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
    const ventureId = decodeURIComponent(m[1]);
    const storage = makeStorage(BUCKET);
    const items = await listPointers(storage, `env/${env}/indices/playbook_runs/by-venture/${ventureId}/`);
    return send(res, 200, { items });
  }
  // Rounds and cap tables by venture
  m = path.match(/^\/v1\/index\/rounds\/by-venture\/([^/]+)$/);
  if (m) {
    const r = enforceRBAC(await getRoles(req), "round", "GET", env);
    if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
    const ventureId = decodeURIComponent(m[1]);
    const storage = makeStorage(BUCKET);
    const items = await listPointers(storage, `env/${env}/indices/rounds/by-venture/${ventureId}/`);
    return send(res, 200, { items });
  }
  m = path.match(/^\/v1\/index\/cap_tables\/by-venture\/([^/]+)$/);
  if (m) {
    const r = enforceRBAC(await getRoles(req), "cap_table", "GET", env);
    if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
    const ventureId = decodeURIComponent(m[1]);
    const storage = makeStorage(BUCKET);
    const items = await listPointers(storage, `env/${env}/indices/cap_tables/by-venture/${ventureId}/`);
    return send(res, 200, { items });
  }
  // Ideas indices
  m = path.match(/^\/v1\/index\/ideas\/by-status\/([^/]+)$/);
  if (m) {
    const r = enforceRBAC(await getRoles(req), "idea", "GET", env);
    if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
    const statusSlug = decodeURIComponent(m[1]);
    const storage = makeStorage(BUCKET);
    const items = await listPointers(storage, `env/${env}/indices/ideas/by-status/${statusSlug}/`);
    return send(res, 200, { items });
  }
  m = path.match(/^\/v1\/index\/ideas\/by-stage\/([^/]+)$/);
  if (m) {
    const r = enforceRBAC(await getRoles(req), "idea", "GET", env);
    if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
    const stageSlug = decodeURIComponent(m[1]);
    const storage = makeStorage(BUCKET);
    const items = await listPointers(storage, `env/${env}/indices/ideas/by-stage/${stageSlug}/`);
    return send(res, 200, { items });
  }
  m = path.match(/^\/v1\/index\/ideas\/by-score\/([0-9]{2})$/);
  if (m) {
    const r = enforceRBAC(await getRoles(req), "idea", "GET", env);
    if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
    const bucket = m[1];
    const bucketNum = Number.parseInt(bucket, 10);
    if (Number.isNaN(bucketNum) || bucketNum < 0 || bucketNum > 10) {
      return send(res, 400, { error: "invalid_bucket" });
    }
    const storage = makeStorage(BUCKET);
    const items = await listPointers(storage, `env/${env}/indices/ideas/by-score/${bucket}/`);
    items.sort((a: any, b: any) => {
      const scoreA = typeof a?.score === "number" ? a.score : a?.score?.overall ?? 0;
      const scoreB = typeof b?.score === "number" ? b.score : b?.score?.overall ?? 0;
      if (scoreA === scoreB) {
        const updatedA = Date.parse(a?.updated_at || a?.updatedAt || 0);
        const updatedB = Date.parse(b?.updated_at || b?.updatedAt || 0);
        return updatedB - updatedA;
      }
      return scoreB - scoreA;
    });
    return send(res, 200, { items });
  }
  return send(res, 404, { error: "not_found" });
}

async function handleHistoryList(req: http.IncomingMessage, res: http.ServerResponse, entity: string, id: string, env: string) {
  const r = enforceRBAC(await getRoles(req), entity, "GET", env);
  if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
  const storage = makeStorage(BUCKET);
  const prefix = `env/${env}/${entity}/${id}/history/`;
  const files = await storage.list(prefix);
  const names = files.map(f => f.name).filter(n => n.endsWith('.json')).sort().reverse();
  const latest = names.slice(0, 20);
  const items: any[] = [];
  for (const name of latest) {
    try { items.push(await storage.readJson(name)); } catch {}
  }
  send(res, 200, { items });
}

async function handlePlaybookApply(req: http.IncomingMessage, res: http.ServerResponse) {
  const body = await readBody(req);
  const env = String(body?.env || 'dev');
  const playbookId = String(body?.playbookId || '');
  const ventureId = String(body?.ventureId || '');
  const r = enforceRBAC(await getRoles(req), 'playbook_run', 'POST', env);
  if (!r.allowed) return send(res, 403, { error: 'forbidden', reason: r.reason });
  if (!playbookId || !ventureId) return send(res, 400, { error: 'invalid_request' });
  const storage = makeStorage(BUCKET);
  // Load playbook
  const pbPath = makeSnapshotPath(env as any, 'playbook' as any, playbookId);
  const playbook = await storage.readJson<any>(pbPath).catch(() => null);
  if (!playbook) return send(res, 404, { error: 'playbook_not_found' });
  const nowIso = new Date().toISOString();
  const runId = body?.id || `PR-${ulid ? ulid() : Math.random().toString(36).slice(2, 10)}`;
  const tasks = Array.isArray(playbook.checklist)
    ? playbook.checklist.map((s: any, idx: number) => ({
        id: `${runId}-${s.id || idx + 1}`,
        title: s.title,
        role: s.role,
        duration_days: s.duration_days,
        depends_on: s.depends_on,
        status: 'Open',
      }))
    : [];
  const runSnapshot = {
    id: runId,
    entity: 'playbook_run',
    env,
    schema_version: '1.0.0',
    created_at: nowIso,
    updated_at: nowIso,
    playbookId,
    ventureId,
    status: 'InProgress',
    applied_at: nowIso,
    tasks,
  };
  await writeHistory(BUCKET, env as any, 'playbook_run' as any, runId, runSnapshot, { storage });
  await updateSnapshot(BUCKET, env as any, 'playbook_run' as any, runId, runSnapshot, { storage });
  const man = manifestFromSnapshot(runSnapshot);
  const manPath = makeManifestPerIdPath(env as any, 'playbook_run' as any, runId);
  await storage.writeJson(manPath, man, { contentType: 'application/json', ifGenerationMatch: 0 });
  const plans = buildIndexPointers(runSnapshot);
  for (const plan of plans) {
    if (plan.cleanup) {
      const existing = await storage.list(plan.cleanup.prefix);
      const toDelete = existing.map(o => o.name).filter(n => n.endsWith(`/${plan.cleanup!.id}.json`));
      for (const name of toDelete) await storage.delete(name).catch(() => {});
    }
    await storage.writeJson(plan.path, plan.pointer, { contentType: 'application/json' });
  }
  send(res, 200, { id: runId, tasks: tasks.length });
}

function clamp(n: number, min: number, max: number) { return Math.max(min, Math.min(max, n)); }

async function handleRunComplete(req: http.IncomingMessage, res: http.ServerResponse, runId: string) {
  const body = await readBody(req);
  const env = String(body?.env || 'dev');
  const r = enforceRBAC(await getRoles(req), 'playbook_run', 'POST', env);
  if (!r.allowed) return send(res, 403, { error: 'forbidden', reason: r.reason });
  const storage = makeStorage(BUCKET);
  const runPath = makeSnapshotPath(env as any, 'playbook_run' as any, runId);
  const run = await storage.readJson<any>(runPath).catch(() => null);
  if (!run) return send(res, 404, { error: 'run_not_found' });
  const nowIso = new Date().toISOString();
  const observed = body?.observed_impacts || {};
  const updatedRun = { ...run, status: 'Completed', completed_at: nowIso, observed_impacts: observed, updated_at: nowIso };
  await updateSnapshot(BUCKET, env as any, 'playbook_run' as any, runId, updatedRun, { storage });

  // Update playbook effectiveness
  const playbookId = String(run.playbookId);
  const pbPath = makeSnapshotPath(env as any, 'playbook' as any, playbookId);
  const pb = await storage.readJson<any>(pbPath).catch(() => null);
  if (pb) {
    const exp = pb.expected_impacts || {};
    const mrrScore = typeof observed.MRR_delta_30d === 'number' && observed.MRR_delta_30d > 0
      ? (exp.MRR_delta_30d ? observed.MRR_delta_30d / exp.MRR_delta_30d : observed.MRR_delta_30d / 10000)
      : 0;
    const actScore = typeof observed.activation_pct_delta === 'number' && observed.activation_pct_delta > 0
      ? (exp.activation_pct_delta ? observed.activation_pct_delta / exp.activation_pct_delta : observed.activation_pct_delta / 0.1)
      : 0;
    const score = clamp(Math.round((mrrScore * 70 + actScore * 30) * 100) / 100, 0, 100);
    const prev = typeof pb.effectiveness_score === 'number' ? pb.effectiveness_score : 0;
    const blended = clamp(Math.round((prev * 0.7 + score * 0.3)), 0, 100);
    const updatedPb = { ...pb, effectiveness_score: blended, updated_at: nowIso };
    await updateSnapshot(BUCKET, env as any, 'playbook' as any, playbookId, updatedPb, { storage });
    const man = manifestFromSnapshot(updatedPb);
    const manPath = makeManifestPerIdPath(env as any, 'playbook' as any, playbookId);
    await storage.writeJson(manPath, man, { contentType: 'application/json' });
    const plans = buildIndexPointers(updatedPb);
    for (const plan of plans) {
      if (plan.cleanup) {
        const existing = await storage.list(plan.cleanup.prefix);
        const toDelete = existing.map(o => o.name).filter(n => n.endsWith(`/${plan.cleanup!.id}.json`));
        for (const name of toDelete) await storage.delete(name).catch(() => {});
      }
      await storage.writeJson(plan.path, plan.pointer, { contentType: 'application/json' });
    }
  }
  send(res, 200, { ok: true });
}

async function handleOpsHealth(req: http.IncomingMessage, res: http.ServerResponse, env: string) {
  const r = enforceRBAC(await getRoles(req), 'report', 'GET', env);
  if (!r.allowed) return send(res, 403, { error: 'forbidden', reason: r.reason });
  const storage = makeStorage(BUCKET);
  const snapshots = await storage.list(`env/${env}/snapshots/`);
  // Compute lag p95 using each snapshot's updated_at field if available, else file mtime
  const lags: number[] = [];
  for (const obj of snapshots) {
    if (obj.name.endsWith('.json')) {
      try {
        const snap = await storage.readJson<any>(obj.name);
        const ts = Date.parse(snap?.updated_at || obj.updated || 0);
        if (Number.isFinite(ts)) lags.push(Date.now() - ts);
      } catch {}
    }
  }
  lags.sort((a, b) => a - b);
  const p95 = lags.length ? Math.round(lags[Math.floor(lags.length * 0.95)] / 1000) : 0;
  const all = await storage.list(`env/${env}/`);
  const totalBytes = all.reduce((s, o) => s + (o.size || 0), 0);
  const gb = totalBytes / (1024 * 1024 * 1024);
  const monthlyCostUSD = gb * 0.02; // rough coldline cost placeholder
  send(res, 200, {
    snapshotLagP95_s: p95,
    handlerErrorRate: 0,
    storageBytes: totalBytes,
    storageGB: Number(gb.toFixed(3)),
    estMonthlyCostUSD: Number(monthlyCostUSD.toFixed(2)),
  });
}

async function handleIdeaDecisionGates(req: http.IncomingMessage, res: http.ServerResponse, env: string) {
  const r = enforceRBAC(await getRoles(req), "idea", "GET", env);
  if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
  const storage = makeStorage(BUCKET);
  const manifests = await listManifests(storage, env as any, "idea" as any, {} as any);
  const now = Date.now();
  const staleMs = 30 * 24 * 60 * 60 * 1000; // 30 days
  const alerts: any[] = [];
  for (const idea of manifests as any[]) {
    const id = idea.id;
    if (!id) continue;
    const updatedStr = idea.updated_at || idea.updatedAt || idea.created_at;
    const updatedTs = Date.parse(updatedStr || "");
    const ageMs = Number.isFinite(updatedTs) ? now - updatedTs : null;
    const score = idea.score?.overall ?? idea.score?.overallScore ?? null;
    if (typeof score === "number" && score < 5) {
      alerts.push({
        id,
        type: "score_low",
        severity: score < 3 ? "critical" : "warning",
        message: `Overall score ${score.toFixed(1)} is below threshold`,
        score,
        updated_at: updatedStr,
      });
    }
    if (ageMs !== null && ageMs > staleMs) {
      alerts.push({
        id,
        type: "stale",
        severity: "warning",
        message: `Idea has not been updated for ${(ageMs / (24 * 60 * 60 * 1000)).toFixed(0)} days`,
        updated_at: updatedStr,
      });
    }
  }
  send(res, 200, { items: alerts });
}

async function handlePortfolioSummary(req: http.IncomingMessage, res: http.ServerResponse, env: string) {
  const r = enforceRBAC(await getRoles(req), "venture", "GET", env);
  if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
  const storage = makeStorage(BUCKET);
  const ventures = await listManifests(storage, env as any, "venture" as any, {} as any);
  const total = ventures.length;
  const byStatus: Record<string, number> = {};
  for (const v of ventures as any[]) {
    const s = String((v as any).status || "unknown");
    byStatus[s] = (byStatus[s] || 0) + 1;
  }
  send(res, 200, { total, byStatus });
}

async function handleHeatmap(req: http.IncomingMessage, res: http.ServerResponse, env: string) {
  const r = enforceRBAC(await getRoles(req), "venture", "GET", env);
  if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
  const points = [
    { x: 1, y: 3, value: 4, id: "V-101" },
    { x: 2, y: 2, value: 6, id: "V-102" },
    { x: 3, y: 4, value: 3, id: "V-103" },
    { x: 4, y: 1, value: 8, id: "V-104" },
  ];
  send(res, 200, { points });
}

async function handleKpiSeries(req: http.IncomingMessage, res: http.ServerResponse, metric: string, env: string) {
  const r = enforceRBAC(await getRoles(req), "kpi", "GET", env);
  if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
  const now = new Date();
  const series = Array.from({ length: 12 }).map((_, i) => {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (11 - i), 1));
    return { t: d.toISOString().slice(0, 10), value: Math.round(50 + Math.random() * 50) };
  });
  send(res, 200, { metric, series });
}

async function handleUtilisation(req: http.IncomingMessage, res: http.ServerResponse, env: string) {
  const r = enforceRBAC(await getRoles(req), "resource", "GET", env);
  if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
  const items = [
    { person: "A. Engineer", venture: "V-101", pct: 80 },
    { person: "B. Designer", venture: "V-102", pct: 60 },
    { person: "C. PM", venture: "V-103", pct: 95 },
  ];
  send(res, 200, { items });
}

async function handleExports(req: http.IncomingMessage, res: http.ServerResponse, env: string) {
  const r = enforceRBAC(await getRoles(req), "report", "GET", env);
  if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
  const items = [
    { type: "portfolio_csv", title: "Portfolio CSV" },
    { type: "investor_update_pdf", title: "Investor Update PDF" },
    { type: "compliance_pack", title: "Compliance Export Pack" },
  ];
  send(res, 200, { items });
}

async function handleAuditLogs(req: http.IncomingMessage, res: http.ServerResponse, env: string) {
  const r = enforceRBAC(await getRoles(req), "report", "GET", env);
  if (!r.allowed) return send(res, 403, { error: "forbidden", reason: r.reason });
  const items: any[] = [];
  send(res, 200, { items });
}

const server = http.createServer(async (req, res) => {
  const trace = cloudTraceFromHeader(req.headers["x-cloud-trace-context"] as string | undefined);
  try {
    if (!BUCKET) {
      send(res, 500, { error: "bucket_not_configured" });
      return;
    }
    // CORS preflight
    if (req.method === "OPTIONS") {
      send(res, 204, {});
      return;
    }
    const parsed = url.parse(req.url || "", true);
    const path = parsed.pathname || "/";
    const env = String(parsed.query.env || "prod");
    if (req.method === "GET") {
      const mIdeaComments = path.match(/^\/v1\/ideas\/([^/]+)\/comments$/);
      if (mIdeaComments) {
        await handleIdeaCommentsList(req, res, decodeURIComponent(mIdeaComments[1]), env);
        return;
      }
      // Specialized index and aggregate routes first
      if (path.startsWith('/v1/index/')) {
        await handleIndexRoute(req, res, path, env);
        return;
      }
      if (path === '/v1/portfolio/summary') { await handlePortfolioSummary(req, res, env); return; }
      if (path === '/v1/portfolio/heatmap') { await handleHeatmap(req, res, env); return; }
      if (path === '/v1/ideas/decision-gates') { await handleIdeaDecisionGates(req, res, env); return; }
      if (path.startsWith('/v1/history/')) {
        const mHist = path.match(/^\/v1\/history\/(\w+)\/([^/]+)$/);
        if (mHist) { await handleHistoryList(req, res, mHist[1], decodeURIComponent(mHist[2]), env); return; }
      }
      const mKpi = path.match(/^\/v1\/kpis\/([^/]+)\/series$/);
      if (mKpi) { await handleKpiSeries(req, res, mKpi[1], env); return; }
      if (path === '/v1/ops/utilisation') { await handleUtilisation(req, res, env); return; }
      if (path === '/v1/ops/health') { await handleOpsHealth(req, res, env); return; }
      if (path === '/v1/exports') { await handleExports(req, res, env); return; }
      if (path === '/v1/audit/logs') { await handleAuditLogs(req, res, env); return; }
      const mList = path.match(/^\/v1\/(\w+)$/);
      const mGet = path.match(/^\/v1\/(\w+)\/(.+)$/);
      if (mList) {
        await handleList(req, res, mList[1], env);
        logJSON({ message: "api list", severity: "INFO", trace, entity: mList[1], env });
        return;
      }
      if (mGet) {
        await handleGet(req, res, mGet[1], decodeURIComponent(mGet[2]), env);
        logJSON({ message: "api get", severity: "INFO", trace, entity: mGet[1], id: decodeURIComponent(mGet[2]), env });
        return;
      }
    }
    if (req.method === "POST" && path === "/v1/uploads/research-docs") {
      await handleResearchDocUpload(req, res, env);
      logJSON({ message: "research doc upload", severity: "NOTICE", trace, env });
      return;
    }
    if (req.method === "POST" && path === "/v1/internal/history") {
      await handleHistory(req, res);
      logJSON({ message: "api history write", severity: "NOTICE", trace });
      return;
    }
    if (req.method === 'POST') {
      const mIdeaCommentPost = path.match(/^\/v1\/ideas\/([^/]+)\/comments$/);
      if (mIdeaCommentPost) {
        await handleIdeaCommentsCreate(req, res, decodeURIComponent(mIdeaCommentPost[1]), env);
        return;
      }
    }
    if (req.method === 'POST' && path === '/v1/playbooks/apply') {
      await handlePlaybookApply(req, res);
      return;
    }
    const mComplete = path.match(/^\/v1\/playbook_runs\/([^/]+)\/complete$/);
    if (req.method === 'POST' && mComplete) {
      await handleRunComplete(req, res, decodeURIComponent(mComplete[1]));
      return;
    }
    send(res, 404, { error: "not_found" });
  } catch (err) {
    logJSON({ message: "api-edge error", severity: "ERROR", trace, error: String(err), stack: (err as any)?.stack });
    if (!res.writableEnded) send(res, 500, { error: "internal" });
  }
});

server.listen(PORT, () => {
  logJSON({ message: `api-edge listening on :${PORT}`, severity: "INFO" });
});
