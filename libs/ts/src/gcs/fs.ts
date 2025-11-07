import { promises as fsp } from 'node:fs';
import { join, dirname } from 'node:path';
import type { DeleteOptions, ListedObject, ObjectMetadata, WriteOptions, WriteResult } from './types.js';
import type { StorageClient } from './storage.js';

export class FsStorage implements StorageClient {
  private root: string;
  constructor(rootDir: string) {
    this.root = rootDir;
  }

  private full(path: string) {
    return join(this.root, path);
  }

  async writeJson(path: string, data: unknown, _opts: WriteOptions = {}): Promise<WriteResult> {
    const full = this.full(path);
    await fsp.mkdir(dirname(full), { recursive: true });
    await fsp.writeFile(full, JSON.stringify(data));
    return { generation: 1, metageneration: 1 };
  }

  async writeBuffer(path: string, data: Buffer | Uint8Array, _opts: WriteOptions = {}): Promise<WriteResult> {
    const full = this.full(path);
    await fsp.mkdir(dirname(full), { recursive: true });
    await fsp.writeFile(full, data);
    return { generation: 1, metageneration: 1 };
  }

  async readJson<T = unknown>(path: string): Promise<T> {
    const full = this.full(path);
    const buf = await fsp.readFile(full);
    return JSON.parse(buf.toString('utf8')) as T;
  }

  async readText(path: string): Promise<string> {
    const full = this.full(path);
    const buf = await fsp.readFile(full);
    return buf.toString('utf8');
  }

  async stat(path: string): Promise<ObjectMetadata> {
    const full = this.full(path);
    const st = await fsp.stat(full);
    return {
      bucket: 'fs',
      name: path,
      generation: 1,
      metageneration: 1,
      size: st.size,
      contentType: undefined,
      updated: new Date(st.mtimeMs).toISOString(),
    };
  }

  async delete(path: string, _opts: DeleteOptions = {}): Promise<void> {
    const full = this.full(path);
    await fsp.rm(full, { force: true });
  }

  private async walk(dir: string, prefix: string, out: ListedObject[]) {
    let entries: string[] = [];
    try {
      entries = await fsp.readdir(dir);
    } catch {
      return;
    }
    for (const name of entries) {
      const p = join(dir, name);
      const st = await fsp.stat(p).catch(() => null);
      if (!st) continue;
      if (st.isDirectory()) {
        await this.walk(p, prefix, out);
      } else {
        const rel = p.slice(this.root.length + 1).replace(/\\/g, '/');
        if (!rel.startsWith(prefix)) continue;
        out.push({
          name: rel,
          generation: 1,
          metageneration: 1,
          updated: new Date(st.mtimeMs).toISOString(),
          size: st.size,
        });
      }
    }
  }

  async list(prefix: string): Promise<ListedObject[]> {
    const out: ListedObject[] = [];
    await this.walk(this.root, prefix, out);
    return out;
  }
}
