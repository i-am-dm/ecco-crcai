import { describe, it, expect } from 'vitest';
import { normalizeIdeaRecord } from '@/lib/ideaNormalizer';

describe('normalizeIdeaRecord', () => {
  it('normalises modern schema ideas with scoring breakdown', () => {
    const idea = normalizeIdeaRecord({
      id: 'IDEA-123',
      theme: 'AI Ops',
      problem: 'Manual processes slow teams down.',
      market: 'Enterprise workflows worth $5B TAM',
      team: 'Needs PM + Eng + Ops',
      tech: 'React, Cloud Run, Vertex AI',
      status: 'Under Review',
      stage: 'Validation',
      stageOwner: 'owner@example.com',
      stageDueDate: '2025-02-01T00:00:00Z',
      createdBy: 'owner@example.com',
      createdAt: '2025-01-10T00:00:00Z',
      updatedAt: '2025-01-11T00:00:00Z',
      tags: ['ai', 'ops'],
      attachments: ['https://example.com/spec'],
      score: {
        overall: 8.4,
        market: 8.9,
        team: 8.0,
        tech: 7.5,
        timing: 8.8,
        notes: 'Great traction',
      },
    });

    expect(idea.id).toBe('IDEA-123');
    expect(idea.theme).toBe('AI Ops');
    expect(idea.market).toContain('TAM');
    expect(idea.score?.overall).toBe(8.4);
    expect(idea.stage).toBe('Validation');
    expect(idea.stageOwner).toBe('owner@example.com');
    expect(idea.tags).toEqual(['ai', 'ops']);
  });

  it('maps legacy schema ideas that only stored numeric score and market size', () => {
    const idea = normalizeIdeaRecord({
      idea_id: 'IDEA-LEGACY',
      title: 'Legacy Concept',
      problemStatement: 'Old schema problem',
      marketSizeUSD: 2500000000,
      teamProfile: ['PM', 'Engineer'],
      techStack: ['Node', 'GCP'],
      status: 'Prioritized',
      stage: 'Pilot',
      score: 72,
    });

    expect(idea.id).toBe('IDEA-LEGACY');
    expect(idea.problem).toBe('Old schema problem');
    expect(idea.market).toContain('TAM');
    expect(idea.team).toContain('PM');
    expect(idea.tech).toContain('Node');
    expect(idea.score?.overall).toBe(72);
    // Unknown legacy status should fall back to default
    expect(idea.status).toBe('New');
    expect(idea.stage).toBe('Idea');
  });
});
