# Ideas Module

Complete implementation of the Ideas module for CityReach Innovation Labs Platform (FR-1, FR-2, FR-3).

## Overview

The Ideas module handles the complete idea lifecycle from initial submission through validation and stage progression. It implements:

- **FR-1: Idea Intake** - Structured idea submission with required fields (theme, problem, market, team, tech)
- **FR-2: Screening & Scoring** - Display and manage idea scores with breakdown by criteria
- **FR-3: Stage Workflow** - Visual stage progression from Idea → Validation → Build → Launch → Scale → Spin-Out

## File Structure

```
ui-new/src/
├── types/
│   └── idea.ts                      # TypeScript type definitions
├── lib/
│   └── schemas/
│       └── idea.ts                  # Zod validation schemas
├── hooks/
│   ├── useIdeas.ts                  # List query with filtering
│   ├── useIdea.ts                   # Single idea query
│   ├── useCreateIdea.ts            # Create mutation
│   └── useUpdateIdea.ts            # Update mutation
├── components/
│   └── ideas/
│       ├── IdeasList.tsx           # Table view of ideas
│       ├── IdeaCard.tsx            # Card display for grid view
│       ├── IdeaForm.tsx            # Intake form with validation
│       ├── IdeaScoringDisplay.tsx  # Score visualization
│       └── IdeaStageWorkflow.tsx   # Stage progression stepper
└── routes/
    └── ideas/
        ├── index.tsx               # List view with filters
        ├── new.tsx                 # Create new idea
        └── [id].tsx                # Idea detail view
```

## Features

### 1. Idea List View (`/ideas`)

**Features:**
- Grid and table view modes
- Filter by status (New, Under Review, Approved, Rejected, On Hold)
- Filter by stage (Idea, Validation, Build, Launch, Scale, Spin-Out)
- Filter by minimum score
- Sort by date, score, or status
- Responsive design (mobile, tablet, desktop)

**API:**
- `GET /v1/idea` - Lists all ideas via manifest

### 2. Idea Intake Form (`/ideas/new`)

**Features:**
- Form validation using Zod schema
- Required fields:
  - Theme (3-200 chars)
  - Problem (10-2000 chars)
  - Market (10-2000 chars)
  - Team (10-2000 chars)
  - Technology (10-2000 chars)
- Optional fields:
  - Title
  - Description
  - Tags
  - Initial screening scores (overall + market/team/tech/timing) with notes
- Real-time validation feedback
- Error handling

**API:**
- `POST /v1/internal/history` - Creates new idea

### 3. Idea Detail View (`/ideas/:id`)

**Features:**
- Full idea details with all fields
- Stage workflow visualization
- Scoring display (if available)
- Status badges
- Metadata (creator, dates, owner)
- Responsive layout with sidebar

**API:**
- `GET /v1/idea/:id` - Fetches single idea snapshot

### 4. Collaboration Panel (`/ideas/:id` — FR-4)

**Features:**
- Timeline of comments linked to the current idea
- Slack notifications on every new comment (Admins & Leads stay informed)
- Attachment metadata (title + URL) with quick links
- Composer with 4K character limit, live counter, and attachment helper
- Loading skeletons, error states, and optimistic clear on success

**API:**
- `GET /v1/ideas/{ideaId}/comments`
- `POST /v1/ideas/{ideaId}/comments`

### 5. Components

#### IdeaCard
Compact card display for grid view showing:
- Title/theme
- Problem snippet
- Status and stage badges
- Score (if available)
- Owner and date metadata
- Hover effects and transitions

#### IdeasList
Table view showing:
- All idea fields in columns
- Sortable columns
- Clickable rows
- Status and stage badges
- Empty state handling

#### IdeaForm
Form component with:
- React Hook Form integration
- Zod schema validation
- Field-level error messages
- Submit and cancel actions
- Loading states

#### IdeaScoringDisplay
Visual score display with:
- Overall score (large)
- Criteria breakdown (market, team, tech, timing)
- Progress bars for each criterion
- Color coding (green ≥8, blue ≥6, amber ≥4, red <4)
- Optional notes

#### IdeaStageWorkflow
Stage progression stepper with:
- 6 stages: Idea → Validation → Build → Launch → Scale → Spin-Out
- Visual indicators (completed, current, upcoming)
- Responsive (horizontal on desktop, vertical on mobile)
- Smooth animations

## Data Model

### Idea Type
```typescript
interface Idea {
  id: string;

  // Required fields (FR-1)
  theme: string;
  problem: string;
  market: string;
  team: string;
  tech: string;

  // Optional fields
  title?: string;
  description?: string;

  // Screening & Scoring (FR-2)
  score?: {
    overall?: number;
    market?: number;
    team?: number;
    tech?: number;
    timing?: number;
    notes?: string;
  };
  status?: 'New' | 'Under Review' | 'Approved' | 'Rejected' | 'On Hold';

  // Stage workflow (FR-3)
  stage?: 'Idea' | 'Validation' | 'Build' | 'Launch' | 'Scale' | 'Spin-Out';
  stageOwner?: string;
  stageDueDate?: string;

  // Metadata
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  attachments?: string[];
  tags?: string[];
}
```

## API Integration

### Queries
```typescript
// List ideas with filters
const { data: ideas } = useIdeas({
  status: 'Under Review',
  stage: 'Validation',
  minScore: 7,
  sortBy: 'score',
  sortOrder: 'desc'
});

// Get single idea
const { data: idea } = useIdea(ideaId);
```

### Mutations
```typescript
// Create idea
const createIdea = useCreateIdea();
await createIdea.mutateAsync({
  theme: 'AI Sustainability',
  problem: 'Companies lack visibility...',
  market: 'Enterprise SaaS...',
  team: 'Engineering + Design...',
  tech: 'React + Python ML...'
});

// Update idea
const updateIdea = useUpdateIdea();
await updateIdea.mutateAsync({
  id: 'idea_123',
  updates: {
    status: 'Approved',
    score: {
      overall: 8.5,
      market: 9,
      team: 8,
      tech: 8,
      timing: 9
    }
  }
});
```

## Design System Compliance

All components follow the CityReach Innovation Labs Design System:

### Colors
- Brand primary: `#0ea5e9` (sky-500)
- Accent: `#10b981` (emerald-500)
- Status badges use semantic colors
- Dark mode fully supported

### Typography
- Font: Inter
- Type scale: h1, h2, h3, body, bodySmall, caption
- Font weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

### Spacing
- 8px grid system
- Consistent padding: p-4, p-5, p-6, p-8
- Gap spacing: gap-2, gap-3, gap-4

### Components
- Rounded corners: rounded-xl (12px), rounded-2xl (20px)
- Shadows: shadow-subtle, shadow-soft
- Transitions: duration-200, duration-300
- Hover states on all interactive elements

### Responsive
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Grid layouts adapt: 1 column → 2 → 3 → 4
- Touch-friendly targets (min 44x44px)

### Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Focus rings on all interactive elements
- ARIA labels and roles
- Screen reader support
- Color contrast ratios meet standards

## Performance

### Optimization
- TanStack Query caching (30s stale time for lists, 60s for details)
- Client-side filtering and sorting
- Lazy loading for images/attachments
- Optimistic updates on mutations
- Query invalidation on create/update

### Bundle Size
- Tree-shaking enabled
- Dynamic imports for routes
- Minimal dependencies (React Hook Form, Zod, date-fns)

## Testing Checklist

- [ ] List view loads and displays ideas
- [ ] Filters work correctly (status, stage, score)
- [ ] Sorting works (date, score, status)
- [ ] View mode toggle (grid/table) works
- [ ] Create form validates required fields
- [ ] Create form shows validation errors
- [ ] Create form submits successfully
- [ ] Detail view loads and displays all fields
- [ ] Stage workflow shows correct current stage
- [ ] Scoring display shows all criteria
- [ ] Status badges display correct colors
- [ ] Responsive layout works on mobile
- [ ] Dark mode displays correctly
- [ ] Keyboard navigation works
- [ ] Loading states display
- [ ] Error states display
- [ ] Empty states display

## Research Docs (FR-5)

- `ResearchDocsPanel` surfaces under the idea detail main column.
- Editors can add a doc (title, type, summary, optional tags) plus the initial version. Files up to 25 MB stream to `/v1/uploads/research-docs`, which returns `url` + `storagePath` for the history payload.
- Additional versions prepend to the history; metadata persists through `/v1/internal/history`.
- Legacy `attachments[]` automatically syncs with every research doc URL to satisfy FR-5 acceptance (“artifacts referenced in snapshot”).

## Future Enhancements

Potential additions (not in current scope):

1. **Decision Gates** (FR-6)
   - Automated alerts for low scores
   - Stale idea detection

2. **Talent Matching** (FR-7)
   - Suggest team members
   - Skills matrix

3. **Experiments Tracking** (FR-8)
   - Link validation experiments
   - Hypothesis testing

## Troubleshooting

### Build Errors
```bash
# Type check
npx tsc --noEmit

# Build
npm run build
```

### Runtime Errors
- Check API endpoint is running (localhost:8085)
- Check Firebase auth is configured
- Check browser console for errors
- Check network tab for failed requests

### Common Issues
1. **404 on idea detail** - Check ID format and API endpoint
2. **Validation errors** - Check Zod schema matches types
3. **Stale data** - Query cache may need invalidation
4. **Dark mode issues** - Check Tailwind dark: classes

## Related Documentation

- [FRD](../../../docs/FRD.md) - Full requirements (FR-1, FR-2, FR-3)
- [Design System](../../_docs/DESIGN_SYSTEM.md) - Component guidelines
- [API Spec](../../../api/openapi.yaml) - API endpoints
- [GCS Persistence Spec](../../../ecco_gcs_json_persistence_spec_v1.2.md) - Data storage

## Changelog

### v1.0.0 (2025-11-06)
- Initial implementation
- FR-1: Idea intake with validation
- FR-2: Screening and scoring display
- FR-3: Stage workflow visualization
- List, detail, and create views
- Grid and table view modes
- Filtering and sorting
- Full responsive design
- Dark mode support
- Accessibility compliance
