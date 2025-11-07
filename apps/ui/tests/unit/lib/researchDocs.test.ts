import { describe, expect, it } from 'vitest';
import {
  deriveAttachmentLinks,
  getLatestVersion,
  getResearchDocTypeMeta,
  normaliseResearchDocs,
} from '@/lib/researchDocs';

describe('researchDocs utils', () => {
  it('normalises raw docs and sorts versions by uploadedAt', () => {
    const raw = [
      {
        id: 'doc-1',
        title: 'Market sizing deck',
        docType: 'market',
        summary: 'Slides used for IC readout',
        tags: 'market, tam',
        versions: [
          {
            version: 'v0.9',
            url: 'https://example.com/doc-1-v0-9.pdf',
            uploaded_at: '2024-12-01T00:00:00Z',
          },
          {
            version: 'v1.0',
            url: 'https://example.com/doc-1-v1.pdf',
            uploaded_at: '2025-01-05T10:00:00Z',
            storage_path: 'gs://bucket/doc-1/v1.pdf',
            uploaded_by: 'alice@ecco.studio',
          },
        ],
      },
    ];

    const docs = normaliseResearchDocs(raw);

    expect(docs).toHaveLength(1);
    expect(docs[0].title).toBe('Market sizing deck');
    expect(docs[0].tags).toEqual(['market', 'tam']);
    expect(docs[0].versions).toHaveLength(2);
    expect(docs[0].versions[0].version).toBe('v1.0'); // newest first
    expect(docs[0].versions[0].storagePath).toBe('gs://bucket/doc-1/v1.pdf');
    expect(docs[0].versions[0].uploadedBy).toBe('alice@ecco.studio');
  });

  it('defaults unknown doc types to "other" and supports string tags', () => {
    const docs = normaliseResearchDocs([
      {
        id: 'doc-2',
        title: 'Ops SOP',
        type: 'something-else',
        tags: ['ops', 'runbook'],
        versions: [
          {
            version: '1.0',
            url: 'https://example.com/doc-2.pdf',
            uploaded_at: '2025-01-06T00:00:00Z',
          },
        ],
      },
    ]);

    expect(docs[0].docType).toBe('other');
    expect(getResearchDocTypeMeta(docs[0].docType).label).toBe('Other');
  });

  it('derives attachment links from docs and existing attachments', () => {
    const docs = normaliseResearchDocs([
      {
        id: 'doc-3',
        title: 'Customer calls',
        docType: 'customer',
        versions: [
          {
            version: 'v1',
            url: 'https://example.com/doc-3.pdf',
            uploaded_at: '2025-01-07T11:00:00Z',
          },
        ],
      },
    ]);

    const attachments = deriveAttachmentLinks(['https://legacy-link'], docs);
    expect(attachments).toEqual([
      'https://legacy-link',
      'https://example.com/doc-3.pdf',
    ]);

    const latest = getLatestVersion(docs[0]);
    expect(latest?.url).toBe('https://example.com/doc-3.pdf');
  });
});
