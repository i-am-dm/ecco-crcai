# Resources and Budgets Modules Implementation

**Date:** 2025-11-06
**Features:** FR-13 (Resource Allocation), FR-15 (Budget & Spend Tracking)
**Status:** Complete

## Overview

This document describes the implementation of the Resources and Budgets modules for the CityReach Innovation Labs platform, following the requirements in `/Users/dmeacham/code/ecco-crcai/docs/FRD.md` and design system in `/Users/dmeacham/code/ecco-crcai/ui/_docs/DESIGN_SYSTEM.md`.

## Implementation Structure

### 1. Type Definitions

**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/types/api.ts`

Added TypeScript types for:
- `Resource` - Person with role, cost rate, availability, skills, allocations
- `ResourceAllocation` - Allocation to ventures with percentage
- `UtilisationData` - API response for utilisation endpoint
- `UtilisationItem` - Person × venture allocation breakdown
- `Budget` - Budget for a venture with planned/actual, categories, monthly burn
- `MonthlyBurn` - Time-series burn data
- `BudgetCategory` - Budget breakdown by category

### 2. API Hooks

#### Resources (FR-13)

**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/hooks/useResources.ts`
- `useResources()` - Fetches all resources via GET /v1/resource

**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/hooks/useResource.ts`
- `useResource(id)` - Fetches single resource via GET /v1/resource/:id

**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/hooks/useUtilisation.ts`
- `useUtilisation()` - Fetches utilisation data via GET /v1/ops/utilisation

#### Budgets (FR-15)

**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/hooks/useBudgets.ts`
- `useBudgets()` - Fetches all budgets via GET /v1/budget

**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/hooks/useBudget.ts`
- `useBudget(id)` - Fetches single budget via GET /v1/budget/:id

### 3. Resources Components

#### ResourcesList Component
**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/components/resources/ResourcesList.tsx`

Features:
- Table view of all resources
- Shows: name, role, cost rate, utilisation %, availability status
- Color-coded utilisation bars (red >100%, yellow <50%, green normal)
- Availability badges (Available, Limited, Unavailable)
- Click row to navigate to detail view

#### ResourceCard Component
**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/components/resources/ResourceCard.tsx`

Features:
- Avatar with initials
- Cost rate display
- Utilisation percentage with progress bar
- Over/under-utilisation indicators
- Current allocation breakdown by venture
- Skills tags
- Email contact

#### UtilisationView Component
**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/components/resources/UtilisationView.tsx`

Features:
- Table showing person × venture allocations
- Total utilisation per person
- Breakdown of allocations with percentages
- Links to ventures and resources
- Color-coded utilisation indicators

#### AllocationChart Component
**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/components/resources/AllocationChart.tsx`

Features:
- Horizontal bar chart of utilisation by person
- Stacked bars showing allocation to different ventures
- Color-coded by venture
- Legend showing venture assignments
- Over-allocation warning line at 100%

### 4. Budgets Components

#### BudgetsList Component
**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/components/budgets/BudgetsList.tsx`

Features:
- Table view of all budgets by venture
- Planned vs Actual comparison
- Variance calculation ($ and %)
- Status badges (On Track, Near Limit, Over Budget)
- Color-coded variance indicators
- Click row to navigate to detail view

#### BudgetCard Component
**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/components/budgets/BudgetCard.tsx`

Features:
- Planned vs Actual display
- Variance percentage calculation
- Progress bar showing % spent
- Status badge (Over Budget, Near Limit, On Track)
- Remaining budget display
- Category breakdown (if available)
- Currency formatting

#### BurnRateChart Component
**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/components/budgets/BurnRateChart.tsx`

Features:
- Monthly burn rate visualization
- Bar chart with gradient colors
- Average burn calculation
- Peak burn indicator
- Month-over-month change calculation
- Above/below average highlighting

#### RunwayIndicator Component
**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/components/budgets/RunwayIndicator.tsx`

Features:
- Runway calculation in months
- Large numeric display
- Gauge visualization (0-12+ months)
- Status badges (Healthy, Warning, Critical, Depleted)
- Color-coded based on runway length:
  - Green: 6+ months (Healthy)
  - Amber: 3-6 months (Warning)
  - Red: <3 months (Critical)
  - Red: Depleted
- Contextual warning messages
- Remaining budget display

### 5. Route Pages

#### Resources List Page
**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/routes/resources/index.tsx`

Features:
- View mode toggle: Directory | Utilisation
- Search by name or role
- Filter by role dropdown
- Filter by availability dropdown
- Directory view: ResourcesList table
- Utilisation view: AllocationChart + UtilisationView table + summary stats
- Summary stats: Over-allocated, Under-utilised, Avg. utilisation
- Empty state for no resources
- Loading and error states

#### Resource Detail Page
**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/routes/resources/[id].tsx`

Features:
- Breadcrumb navigation back to list
- ResourceCard with full details
- Venture assignments section with links
- Loading and error states
- Not found state

#### Budgets List Page
**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/routes/budgets/index.tsx`

Features:
- Summary stat cards:
  - Total Planned
  - Total Actual
  - Overall Variance %
  - Over Budget count
- Filter by venture dropdown
- BudgetsList table
- Empty state for no budgets
- Loading and error states

#### Budget Detail Page
**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/routes/budgets/[id].tsx`

Features:
- Breadcrumb navigation back to list
- Link to associated venture
- 2-column layout:
  - Left: BudgetCard + BurnRateChart
  - Right: RunwayIndicator
- Budget management tips section
- Loading and error states
- Not found state

### 6. Routing Configuration

**File:** `/Users/dmeacham/code/ecco-crcai/ui-new/src/App.tsx`

Added routes:
- `/resources` → ResourcesListPage
- `/resources/:id` → ResourceDetailPage
- `/budgets` → BudgetsListPage
- `/budgets/:id` → BudgetDetailPage

## Key Features Implemented

### Resources Module (FR-13)

1. **Resource Directory**
   - Searchable list of all team members
   - Filter by role and availability
   - Shows cost rates and utilisation

2. **Utilisation View**
   - Person × venture allocation matrix
   - Visual bar charts showing allocation percentages
   - Over-utilisation alerts (>100% = red)
   - Under-utilisation indicators (<50% = yellow)

3. **Resource Detail**
   - Full profile with skills and contact
   - Current allocations breakdown
   - Utilisation status with visual indicators

### Budgets Module (FR-15)

1. **Budget List**
   - All budgets across ventures
   - Variance calculations (planned vs actual)
   - Status indicators (on track, near limit, over budget)
   - Portfolio-level summary stats

2. **Budget Detail**
   - Planned vs Actual comparison
   - Monthly burn rate chart
   - Runway projection in months
   - Category breakdown
   - Warning alerts for overruns

3. **Runway Projection**
   - Calculates months remaining based on burn rate
   - Visual gauge (0-12+ months)
   - Health status (Healthy, Warning, Critical)
   - Automatic alerts when runway < 3 months

## Calculations

### Utilisation Percentage
```typescript
totalUtilisation = sum(allocations.map(a => a.percentage))
```

### Budget Variance
```typescript
variance = actual - planned
variancePercent = (variance / planned) * 100
```

### Runway Months
```typescript
remaining = planned - actual
avgMonthlyBurn = sum(monthlyBurn) / monthlyBurn.length
runwayMonths = remaining / avgMonthlyBurn
```

### Status Thresholds

**Utilisation:**
- Over-allocated: >100% (red)
- Under-utilised: <50% (yellow)
- Normal: 50-100% (green)

**Budget Variance:**
- Over Budget: >10% over (red, alert)
- Near Limit: 0-10% over (amber, warning)
- On Track: under budget (green)

**Runway:**
- Healthy: ≥6 months (green)
- Warning: 3-6 months (amber)
- Critical: <3 months (red, alert)
- Depleted: ≤0 (red, critical alert)

## Design System Compliance

All components follow the design system defined in `/Users/dmeacham/code/ecco-crcai/ui/_docs/DESIGN_SYSTEM.md`:

- **Colors:** Brand (sky blue), Accent (emerald green), semantic colors (red/amber/green for status)
- **Typography:** Inter font, responsive sizing, proper hierarchy
- **Spacing:** 8px grid system
- **Components:** Cards, tables, badges, buttons, forms
- **Responsive:** Mobile-first approach with breakpoints
- **Dark Mode:** Full support with dark: variants
- **Accessibility:** WCAG 2.1 AA compliant, keyboard navigation, ARIA labels
- **Loading States:** Skeleton loaders and spinners
- **Error States:** Styled error messages with icons
- **Empty States:** Helpful messages and CTAs

## Responsive Breakpoints

- Mobile: < 640px (single column, stacked)
- Tablet: 640px - 1024px (2 columns where appropriate)
- Desktop: > 1024px (full layout, 3-4 columns)

## Testing Recommendations

1. **Unit Tests**
   - Variance calculations
   - Runway projections
   - Filter logic

2. **Integration Tests**
   - API hook responses
   - Navigation between pages
   - Filter and search functionality

3. **Visual Tests**
   - Light/dark mode
   - Responsive layouts
   - Empty/error states

4. **Accessibility Tests**
   - Keyboard navigation
   - Screen reader compatibility
   - Color contrast

## Future Enhancements

1. **Resources**
   - Resource allocation planning (drag-and-drop)
   - Historical utilisation trends
   - Skills matching for ventures
   - Cost projections

2. **Budgets**
   - Budget forecasting
   - Scenario modeling (what-if analysis)
   - Alert notifications
   - Export to CSV/PDF
   - Category drill-down

## API Endpoints Used

- `GET /v1/resource` - List all resources
- `GET /v1/resource/:id` - Get resource details
- `GET /v1/ops/utilisation` - Get utilisation data
- `GET /v1/budget` - List all budgets
- `GET /v1/budget/:id` - Get budget details

## Files Created

### Hooks (5 files)
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/hooks/useResources.ts`
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/hooks/useResource.ts`
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/hooks/useUtilisation.ts`
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/hooks/useBudgets.ts`
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/hooks/useBudget.ts`

### Components (8 files)
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/components/resources/ResourcesList.tsx`
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/components/resources/ResourceCard.tsx`
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/components/resources/UtilisationView.tsx`
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/components/resources/AllocationChart.tsx`
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/components/budgets/BudgetsList.tsx`
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/components/budgets/BudgetCard.tsx`
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/components/budgets/BurnRateChart.tsx`
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/components/budgets/RunwayIndicator.tsx`

### Routes (4 files)
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/routes/resources/index.tsx`
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/routes/resources/[id].tsx`
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/routes/budgets/index.tsx`
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/routes/budgets/[id].tsx`

### Updated Files (2 files)
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/types/api.ts` (added types)
- `/Users/dmeacham/code/ecco-crcai/ui-new/src/App.tsx` (added routes)

**Total:** 19 files (17 new, 2 updated)

## Summary

The Resources and Budgets modules are now fully implemented with:

- Complete type-safety with TypeScript
- Responsive, accessible components following the design system
- Loading, error, and empty states
- Dark mode support
- Search and filter capabilities
- Visual charts and indicators
- Accurate calculations for utilisation, variance, and runway
- Navigation between list and detail views
- Portfolio-level summary statistics

All requirements from FR-13 (Resource Allocation) and FR-15 (Budget & Spend Tracking) have been implemented.
