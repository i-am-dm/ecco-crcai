import { http, HttpResponse } from 'msw';
import { config } from '@/config';

const baseUrl = config.apiUrl;

// Mock snapshots
const mockVentureSnapshots: Record<string, any> = {
  'venture-1': {
    id: 'venture-1',
    entity: 'venture',
    env: 'dev',
    schema_version: '1.0.0',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-15T00:00:00Z',
    title: 'EcoTrack',
    status: 'Active',
    lead: 'user-1',
    stage: 'growth',
  },
  'venture-2': {
    id: 'venture-2',
    entity: 'venture',
    env: 'dev',
    schema_version: '1.0.0',
    created_at: '2024-02-01T00:00:00Z',
    updated_at: '2024-02-15T00:00:00Z',
    title: 'HealthHub',
    status: 'Active',
    lead: 'user-2',
    stage: 'seed',
  },
  'venture-3': {
    id: 'venture-3',
    entity: 'venture',
    env: 'dev',
    schema_version: '1.0.0',
    created_at: '2024-03-01T00:00:00Z',
    updated_at: '2024-03-15T00:00:00Z',
    title: 'FinFlow',
    status: 'Paused',
    lead: 'user-1',
    stage: 'ideation',
  },
};

const mockVentureManifests = {
  items: Object.values(mockVentureSnapshots).map((snap) => ({
    id: snap.id,
    entity: snap.entity,
    env: snap.env,
    schema_version: snap.schema_version,
    updated_at: snap.updated_at,
    ptr: `env/${snap.env}/snapshots/ventures/${snap.id}.json`,
    title: snap.title,
    status: snap.status,
    lead: snap.lead,
    stage: snap.stage,
  })),
};

const mockIdeaSnapshots: Record<string, any> = {
  'idea-1': {
    id: 'idea-1',
    entity: 'idea',
    env: 'dev',
    schema_version: '1.0.0',
    created_at: '2024-01-10T00:00:00Z',
    updated_at: '2024-01-12T00:00:00Z',
    theme: 'AI-Powered Analytics',
    problem: 'Analysts need faster insights across fragmented tools.',
    market: 'Enterprise analytics teams; 500 logos with $2M ARR potential.',
    team: 'Data PM + ML engineer + design lead.',
    tech: 'React, Node, Vertex AI embeddings.',
    status: 'New',
    stage: 'Idea',
    stage_owner: 'user-1',
    stage_due_date: '2024-02-01T00:00:00Z',
    score: { overall: 8.5, market: 8, team: 9, tech: 8, timing: 9 },
    tags: ['AI', 'Analytics'],
  },
  'idea-2': {
    id: 'idea-2',
    entity: 'idea',
    env: 'dev',
    schema_version: '1.0.0',
    created_at: '2024-02-10T00:00:00Z',
    updated_at: '2024-02-18T00:00:00Z',
    theme: 'Mobile App Redesign',
    problem: 'Legacy UX blocks onboarding for 40% of users.',
    market: 'Consumer health; TAM $4B with direct conversion uplift.',
    team: 'Product trio + contract UX studio.',
    tech: 'Flutter, Supabase, Firebase auth.',
    status: 'Under Review',
    stage: 'Validation',
    stage_owner: 'user-2',
    stage_due_date: '2024-03-01T00:00:00Z',
    score: { overall: 7.4, market: 7, team: 8, tech: 7, timing: 7 },
    tags: ['Mobile', 'UX'],
  },
};

const mockIdeaManifests = {
  items: Object.values(mockIdeaSnapshots).map((snap) => ({
    id: snap.id,
    entity: snap.entity,
    env: snap.env,
    schema_version: snap.schema_version,
    updated_at: snap.updated_at,
    ptr: `env/${snap.env}/snapshots/ideas/${snap.id}.json`,
    title: snap.theme,
    status: snap.status,
    stage: snap.stage,
    stageOwner: snap.stage_owner,
    stage_owner: snap.stage_owner,
    stageDueDate: snap.stage_due_date,
    stage_due_date: snap.stage_due_date,
    theme: snap.theme,
    problem: snap.problem,
    market: snap.market,
    team: snap.team,
    tech: snap.tech,
    score: snap.score,
    tags: snap.tags,
    created_at: snap.created_at,
    createdAt: snap.created_at,
  })),
};

const mockKPIMetrics = {
  items: [
    {
      id: 'kpi-1',
      entity: 'kpi_metric',
      data: {
        id: 'kpi-1',
        name: 'Monthly Revenue',
        value: 125000,
        unit: 'USD',
        venture_id: 'venture-1',
        period: '2024-01',
      },
    },
  ],
};

export const handlers = [
  // List ventures
  http.get(`${baseUrl}/v1/venture`, () => {
    return HttpResponse.json(mockVentureManifests);
  }),

  // Get single venture
  http.get(`${baseUrl}/v1/venture/:id`, ({ params }) => {
    const { id } = params;
    const venture = mockVentureSnapshots[String(id)];

    if (!venture) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(venture);
  }),

  // Create/Update venture
  http.post(`${baseUrl}/v1/internal/history`, async () => {
    return new HttpResponse(JSON.stringify({ accepted: true }), {
      status: 202,
      headers: { 'content-type': 'application/json' },
    });
  }),

  // List ideas
  http.get(`${baseUrl}/v1/idea`, () => {
    return HttpResponse.json(mockIdeaManifests);
  }),

  // Get single idea
  http.get(`${baseUrl}/v1/idea/:id`, ({ params }) => {
    const { id } = params;
    const idea = mockIdeaSnapshots[String(id)];

    if (!idea) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(idea);
  }),

  // List KPI metrics
  http.get(`${baseUrl}/v1/kpi_metric`, () => {
    return HttpResponse.json(mockKPIMetrics);
  }),

  // Get single KPI metric
  http.get(`${baseUrl}/v1/kpi_metric/:id`, ({ params }) => {
    const { id } = params;
    const kpi = mockKPIMetrics.items.find((k) => k.id === id);

    if (!kpi) {
      return new HttpResponse(null, { status: 404 });
    }

    return HttpResponse.json(kpi);
  }),

  // KPI series data
  http.get(`${baseUrl}/v1/kpis/:metric/series`, ({ params, request }) => {
    const metric = String(params.metric || 'MRR');
    const now = new Date('2024-01-15T00:00:00Z');
    const series = Array.from({ length: 4 }).map((_, idx) => {
      const date = new Date(now);
      date.setMonth(now.getMonth() - (3 - idx));
      return {
        date: date.toISOString().slice(0, 10),
        value: 100000 + idx * 5000,
      };
    });

    const byVenture = [
      {
        ventureId: 'venture-1',
        ventureName: 'EcoTrack',
        latestValue: 125000,
        previousValue: 118000,
        change: 7000,
        changePercent: 5.9,
        lastUpdated: now.toISOString(),
      },
      {
        ventureId: 'venture-2',
        ventureName: 'HealthHub',
        latestValue: 98000,
        previousValue: 95000,
        change: 3000,
        changePercent: 3.1,
        lastUpdated: now.toISOString(),
      },
    ];

    return HttpResponse.json({
      metric,
      series,
      byVenture,
    });
  }),
];
