#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import crypto from 'node:crypto';

type Todo = { line: number; text: string; h2?: string; h3?: string; key: string };

const GH_TOKEN = process.env.GH_TOKEN || '';
const OWNER = process.env.GITHUB_OWNER || 'i-am-dm';
const REPO = process.env.GITHUB_REPO || 'ecco-crcai';

async function gh<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`https://api.github.com/repos/${OWNER}/${REPO}${path}`, {
    method,
    headers: {
      'accept': 'application/vnd.github+json',
      ...(GH_TOKEN ? { 'authorization': `token ${GH_TOKEN}` } : {}),
      'content-type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

function parseTodos(md: string): Todo[] {
  const lines = md.split(/\r?\n/);
  let h2: string | undefined;
  let h3: string | undefined;
  const out: Todo[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('## ')) { h2 = line.replace(/^##\s+/, '').trim(); h3 = undefined; continue; }
    if (line.startsWith('### ')) { h3 = line.replace(/^###\s+/, '').trim(); continue; }
    const m = line.match(/^\- \[ \] (.+)$/);
    if (m) {
      const text = m[1].trim();
      const key = crypto.createHash('sha1').update(`${h2 || ''}::${h3 || ''}::${text}`).digest('hex').slice(0, 12);
      out.push({ line: i + 1, text, h2, h3, key });
    }
  }
  return out;
}

async function ensureLabel(name: string, color: string, description: string) {
  try { await gh('GET', `/labels/${encodeURIComponent(name)}`); }
  catch (e: any) { if (e.message.includes('404')) await gh('POST', '/labels', { name, color, description }); else throw e; }
}

async function ensureMilestone(title: string, description: string): Promise<number> {
  const mls = await gh<any[]>('GET', '/milestones?state=open&per_page=100');
  const found = mls.find(m => m.title === title);
  if (found) return found.number;
  const created = await gh<any>('POST', '/milestones', { title, description });
  return created.number as number;
}

async function main() {
  const md = readFileSync(resolve(process.cwd(), 'TODO.md'), 'utf8');
  const todos = parseTodos(md);

  const issues = await gh<any[]>('GET', '/issues?state=all&per_page=100');
  const existingKeys = new Set<string>();
  for (const iss of issues) {
    const body: string = iss.body || '';
    const m = body.match(/<!--\s*todo-key:\s*([a-f0-9]+)\s*-->/i);
    if (m) existingKeys.add(m[1]);
  }

  await ensureLabel('type: todo', '0ea5e9', 'Auto-generated from TODO.md');
  await ensureLabel('section: decisions', '8b5cf6', 'Open decisions and spec errata');
  await ensureLabel('section: cicd', '22c55e', 'CI/CD and release');
  for (let n = 1; n <= 18; n++) await ensureLabel(`phase: ${n}`, '06b6d4', `Phase ${n}`);
  for (const s of ['P1','P2','P3','P4']) await ensureLabel(`stage: ${s}`, 'f59e0b', `Backlog ${s}`);

  let created = 0;
  for (const t of todos) {
    if (existingKeys.has(t.key)) continue;
    const labels = ['type: todo'];
    let milestone: number | undefined;
    let prefix = '[TODO]';
    const phaseMatch = t.h2 && t.h2.match(/^Phase\s+(\d+)/i);
    if (phaseMatch) { labels.push(`phase: ${phaseMatch[1]}`); prefix += `[Phase ${phaseMatch[1]}]`; }
    else if (t.h2 && /^Open Decisions/i.test(t.h2)) { labels.push('section: decisions'); prefix += '[Decisions]'; }
    else if (t.h2 && /^CI\/CD/i.test(t.h2)) { labels.push('section: cicd'); prefix += '[CI/CD]'; }
    else if (t.h2 && /^Product Backlog/i.test(t.h2)) {
      const stage = (t.h3 || '').match(/^P([1-4])\b/)?.[0];
      if (stage) { labels.push(`stage: ${stage}`); prefix += `[${stage}]`; milestone = await ensureMilestone(stage, `Milestone for ${stage}`); }
    }
    const title = `${prefix} ${t.text}`.slice(0, 250);
    const body = `<!-- todo-key: ${t.key} -->\nSection: ${t.h2 || 'Uncategorized'}${t.h3 ? ' / ' + t.h3 : ''}\nSource: https://github.com/${OWNER}/${REPO}/blob/main/TODO.md#L${t.line}\n\nTask\n${t.text}`;
    await gh('POST', '/issues', { title, body, labels, milestone });
    created++;
  }
  console.log(`Created ${created} issues.`);
}

main().catch((err) => { console.error(err); process.exit(1); });

