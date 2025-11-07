import type { DeleteOptions, ListedObject, ObjectMetadata, WriteOptions, WriteResult } from "./types.js";

export interface StorageClient {
  writeJson(path: string, data: unknown, opts?: WriteOptions): Promise<WriteResult>;
  writeBuffer(path: string, data: Buffer | Uint8Array, opts?: WriteOptions): Promise<WriteResult>;
  readJson<T = unknown>(path: string): Promise<T>;
  readText(path: string): Promise<string>;
  stat(path: string): Promise<ObjectMetadata>;
  delete(path: string, opts?: DeleteOptions): Promise<void>;
  list(prefix: string): Promise<ListedObject[]>;
}

export class GcsStorage implements StorageClient {
  private storage: any;
  private bucketName: string;

  constructor(bucketName: string, storageInstance?: any) {
    this.bucketName = bucketName;
    this.storage = storageInstance;
  }

  private async getStorage(): Promise<any> {
    if (this.storage) return this.storage;
    // Dynamically import to keep dependency optional
    const mod = await import("@google-cloud/storage");
    const Storage = (mod as any).Storage || (mod as any).default;
    this.storage = new Storage();
    return this.storage;
  }

  async writeJson(path: string, data: unknown, opts: WriteOptions = {}): Promise<WriteResult> {
    const storage = await this.getStorage();
    const bucket = storage.bucket(this.bucketName);
    const file = bucket.file(path);
    const content = JSON.stringify(data);
    const [meta] = await file.save(content, {
      contentType: opts.contentType ?? "application/json",
      gzip: opts.gzip ?? false,
      metadata: {
        ...opts.metadata,
      },
      preconditionOpts: {
        ifGenerationMatch: opts.ifGenerationMatch,
        ifMetagenerationMatch: opts.ifMetagenerationMatch,
      },
      resumable: false,
      validation: false,
    });
    return { generation: Number(meta.generation), metageneration: Number(meta.metageneration) };
  }

  async writeBuffer(path: string, data: Buffer | Uint8Array, opts: WriteOptions = {}): Promise<WriteResult> {
    const storage = await this.getStorage();
    const bucket = storage.bucket(this.bucketName);
    const file = bucket.file(path);
    const [meta] = await file.save(data, {
      contentType: opts.contentType ?? "application/octet-stream",
      gzip: opts.gzip ?? false,
      metadata: {
        ...opts.metadata,
      },
      preconditionOpts: {
        ifGenerationMatch: opts.ifGenerationMatch,
        ifMetagenerationMatch: opts.ifMetagenerationMatch,
      },
      resumable: false,
      validation: false,
    });
    return { generation: Number(meta.generation), metageneration: Number(meta.metageneration) };
  }

  async readJson<T = unknown>(path: string): Promise<T> {
    const storage = await this.getStorage();
    const bucket = storage.bucket(this.bucketName);
    const file = bucket.file(path);
    const [buf] = await file.download();
    return JSON.parse(buf.toString("utf8")) as T;
  }

  async readText(path: string): Promise<string> {
    const storage = await this.getStorage();
    const bucket = storage.bucket(this.bucketName);
    const file = bucket.file(path);
    const [buf] = await file.download();
    return buf.toString("utf8");
  }

  async stat(path: string): Promise<ObjectMetadata> {
    const storage = await this.getStorage();
    const bucket = storage.bucket(this.bucketName);
    const file = bucket.file(path);
    const [meta] = await file.getMetadata();
    return {
      bucket: meta.bucket,
      name: meta.name,
      generation: Number(meta.generation),
      metageneration: Number(meta.metageneration),
      size: Number(meta.size || 0),
      contentType: meta.contentType,
      updated: meta.updated,
    };
  }

  async delete(path: string, opts: DeleteOptions = {}): Promise<void> {
    const storage = await this.getStorage();
    const bucket = storage.bucket(this.bucketName);
    const file = bucket.file(path);
    await file.delete({
      ifGenerationMatch: opts.ifGenerationMatch,
      ifMetagenerationMatch: opts.ifMetagenerationMatch,
      ignoreNotFound: true,
    });
  }

  async list(prefix: string): Promise<ListedObject[]> {
    const storage = await this.getStorage();
    const bucket = storage.bucket(this.bucketName);
    const [files] = await bucket.getFiles({ prefix });
    return files.map((file: any) => ({
      name: file.name as string,
      generation: Number(file.metadata?.generation ?? 0),
      metageneration: Number(file.metadata?.metageneration ?? 0),
      updated: file.metadata?.updated,
      size: Number(file.metadata?.size ?? 0),
    }));
  }
}
