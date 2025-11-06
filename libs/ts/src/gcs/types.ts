export interface WritePreconditions {
  ifGenerationMatch?: number;
  ifMetagenerationMatch?: number;
}

export interface WriteOptions extends WritePreconditions {
  contentType?: string;
  gzip?: boolean;
  metadata?: Record<string, string>;
}

export interface ObjectMetadata {
  bucket: string;
  name: string;
  generation: number;
  metageneration: number;
  size: number;
  contentType?: string;
  updated?: string;
}

export interface WriteResult {
  generation: number;
  metageneration: number;
}

export interface ListedObject {
  name: string;
  generation: number;
  metageneration: number;
  updated?: string;
  size?: number;
}

export interface DeleteOptions {
  ifGenerationMatch?: number;
  ifMetagenerationMatch?: number;
}
