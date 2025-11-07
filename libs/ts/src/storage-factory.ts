import type { StorageClient } from './gcs/storage.js';
import { GcsStorage } from './gcs/storage.js';
import { FsStorage } from './gcs/fs.js';
import { resolve } from 'node:path';

export function makeStorage(bucket: string): StorageClient {
  const backend = (process.env.STORAGE_BACKEND || '').toLowerCase();
  if (backend === 'fs') {
    const root = process.env.DATA_ROOT ? resolve(process.env.DATA_ROOT) : resolve(process.cwd(), '.data');
    return new FsStorage(root);
  }
  return new GcsStorage(bucket);
}

