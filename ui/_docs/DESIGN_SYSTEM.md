# CityReach Innovation Labs - Design System

Version: 1.0
Date: 2025-11-06
Status: Final

## Table of Contents

1. [Brand Identity](#brand-identity)
2. [Color System](#color-system)
3. [Typography](#typography)
4. [Spacing & Sizing](#spacing--sizing)
5. [Component Library](#component-library)
6. [Layout Patterns](#layout-patterns)
7. [Responsive Design](#responsive-design)
8. [Dark Mode](#dark-mode)
9. [Accessibility](#accessibility)
10. [Animation & Motion](#animation--motion)
11. [Entity-Specific Patterns](#entity-specific-patterns)
12. [Implementation Guidelines](#implementation-guidelines)

---

## Brand Identity

### Philosophy
CityReach Innovation Labs's design system embodies **professional clarity with modern sophistication**. We balance:

- **Credibility** - Clean, organized, trustworthy for leadership and investors
- **Efficiency** - Fast, scannable interfaces for busy venture leads
- **Modernity** - Contemporary aesthetics that reflect innovation
- **Scalability** - Patterns that work for 5 ventures or 50+

### Visual Voice
- Clean and spacious (generous whitespace)
- Professional but not corporate
- Data-forward with visual hierarchy
- Subtle animations that enhance (never distract)
- Mobile-responsive by default

---

## Color System

### Primary Palette

```typescript
// Brand (Primary) - Sky Blue
brand: {
  50: '#f0f9ff',   // Lightest backgrounds
  100: '#e0f2fe',  // Hover states
  200: '#bae6fd',  // Borders
  300: '#7dd3fc',  // Subtle accents
  400: '#38bdf8',  // Interactive elements
  500: '#b91c1c',  // Primary CTA, logo (BRAND COLOR)
  600: '#0284c7',  // Primary hover
  700: '#0369a1',  // Primary active
  800: '#075985',  // Dark mode primary
  900: '#0c4a6e',  // Deepest shade
  950: '#082f49',  // Very dark
}

// Accent (Secondary) - Emerald Green
accent: {
  50: '#ecfdf5',   // Success backgrounds
  100: '#d1fae5',  // Success light
  200: '#a7f3d0',  // Success borders
  300: '#6ee7b7',  // Success accents
  400: '#34d399',  // Success interactive
  500: '#dc2626',  // Success primary (ACCENT COLOR)
  600: '#059669',  // Success hover
  700: '#047857',  // Success active
  800: '#065f46',  // Success dark
  900: '#064e3b',  // Success deep
}
```

### Semantic Colors

```typescript
// Status Colors (using Tailwind defaults for consistency)
colors: {
  success: '#dc2626',   // Green - completed, active, positive
  warning: '#f59e0b',   // Amber - caution, pending, attention
  error: '#ef4444',     // Red - failed, critical, danger
  info: '#3b82f6',      // Blue - informational

  // Neutral Grays (Slate)
  slate: {
    50: '#f8fafc',    // Backgrounds
    100: '#f1f5f9',   // Hover backgrounds
    200: '#e2e8f0',   // Borders
    300: '#cbd5e1',   // Disabled text
    400: '#94a3b8',   // Placeholder text
    500: '#64748b',   // Secondary text
    600: '#475569',   // Body text
    700: '#334155',   // Headings
    800: '#1e293b',   // Dark backgrounds
    900: '#0f172a',   // Darkest backgrounds
  }
}
```

### Gradient Combinations

```css
/* Primary Gradient - Hero elements, CTAs */
.gradient-primary {
  background: linear-gradient(135deg, #b91c1c 0%, #433f3a 100%);
}

/* Success Gradient - Positive metrics, wins */
.gradient-success {
  background: linear-gradient(135deg, #dc2626 0%, #34d399 100%);
}

/* Mesh Gradient - Large backgrounds */
.gradient-mesh {
  background:
    radial-gradient(at 0% 0%, rgba(14, 165, 233, 0.15) 0px, transparent 50%),
    radial-gradient(at 100% 100%, rgba(16, 185, 129, 0.15) 0px, transparent 50%);
}

/* Text Gradient - Logos, headings */
.gradient-text {
  background: linear-gradient(135deg, #b91c1c 0%, #433f3a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
```

### Color Usage Guidelines

**Primary Brand Blue (brand-500: #b91c1c)**
- Primary CTAs (Create Venture, Save, Submit)
- Active navigation items
- Links and interactive elements
- Logo and brand elements
- Data visualizations (primary series)

**Accent Green (accent-500: #dc2626)**
- Success states and confirmations
- Positive metrics (revenue up, milestones met)
- Completed tasks
- Available resources

**Semantic Usage**
- Red: Overdue milestones, over budget, critical alerts
- Amber: Approaching deadlines, at-risk ventures, warnings
- Blue: Informational badges, neutral status
- Green: On track, under budget, healthy metrics

**Neutral Grays**
- slate-900: Primary text (dark mode: slate-100)
- slate-600: Secondary text (dark mode: slate-400)
- slate-400: Tertiary text, disabled states
- slate-200: Borders, dividers (dark mode: slate-700)
- slate-50: Backgrounds (dark mode: slate-900)

---

## Typography

### Font Stack

```css
font-family: 'Inter', ui-sans-serif, system-ui, -apple-system,
             BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

**Why Inter?**
- Optimized for screens and UI
- Excellent readability at small sizes
- Variable font support
- Professional, modern, neutral

### Type Scale (Mobile-First)

```typescript
// Display - Hero headlines, splash pages
display: {
  fontSize: '36px',
  lineHeight: '40px',
  fontWeight: 700,
  letterSpacing: '-0.02em',
}

// H1 - Page titles
h1: {
  fontSize: '30px',
  lineHeight: '36px',
  fontWeight: 700,
  letterSpacing: '-0.015em',
}

// H2 - Section headers
h2: {
  fontSize: '24px',
  lineHeight: '32px',
  fontWeight: 600,
  letterSpacing: '-0.01em',
}

// H3 - Card titles, subsections
h3: {
  fontSize: '20px',
  lineHeight: '28px',
  fontWeight: 600,
}

// Body Large - Important body text
bodyLarge: {
  fontSize: '18px',
  lineHeight: '28px',
  fontWeight: 400,
}

// Body - Default text
body: {
  fontSize: '16px',
  lineHeight: '24px',
  fontWeight: 400,
}

// Body Small - Secondary text
bodySmall: {
  fontSize: '14px',
  lineHeight: '20px',
  fontWeight: 400,
}

// Caption - Labels, metadata
caption: {
  fontSize: '12px',
  lineHeight: '16px',
  fontWeight: 500,
}

// Tiny - Timestamps, very small labels
tiny: {
  fontSize: '11px',
  lineHeight: '14px',
  fontWeight: 500,
}
```

### Tailwind Classes

```html
<!-- Display -->
<h1 class="text-4xl font-bold tracking-tight">Display Headline</h1>

<!-- H1 -->
<h1 class="text-3xl font-bold tracking-tight">Page Title</h1>

<!-- H2 -->
<h2 class="text-2xl font-semibold tracking-tight">Section Header</h2>

<!-- H3 -->
<h3 class="text-xl font-semibold">Card Title</h3>

<!-- Body -->
<p class="text-base">Default body text</p>

<!-- Small -->
<p class="text-sm text-slate-600 dark:text-slate-400">Secondary text</p>

<!-- Caption -->
<span class="text-xs font-medium text-slate-500">Label</span>

<!-- Tiny -->
<span class="text-[11px] font-medium text-slate-400">Timestamp</span>
```

### Font Weight Usage

- **300 (Light)** - Large display text only
- **400 (Regular)** - Body text, descriptions
- **500 (Medium)** - Labels, small headings, buttons
- **600 (Semibold)** - Section headings, card titles
- **700 (Bold)** - Page titles, CTAs, emphasis
- **800 (Extrabold)** - Rarely used, data callouts only

---

## Spacing & Sizing

### Spacing Scale (8px Grid)

```typescript
// Base unit: 4px (Tailwind's default)
spacing: {
  0: '0px',
  0.5: '2px',   // Tight spacing within elements
  1: '4px',     // Minimal gap
  2: '8px',     // Default small spacing
  3: '12px',    // Comfortable spacing
  4: '16px',    // Default medium spacing (BASE)
  5: '20px',    // Generous spacing
  6: '24px',    // Section spacing
  8: '32px',    // Large spacing
  10: '40px',   // Extra large spacing
  12: '48px',   // Hero spacing
  16: '64px',   // Page spacing
  20: '80px',   // Very large spacing
  24: '96px',   // Maximum spacing
}
```

### Component Sizing

```typescript
// Heights
heights: {
  input: '40px',        // Input fields, selects (h-10)
  button: '40px',       // Standard buttons (h-10)
  buttonSmall: '32px',  // Small buttons (h-8)
  buttonLarge: '48px',  // Large CTAs (h-12)
  header: '64px',       // Top header (h-16)
  card: 'auto',         // Cards grow with content
}

// Widths
widths: {
  sidebar: '288px',     // Sidebar navigation (w-72)
  sidebarCollapsed: '72px',  // Collapsed sidebar
  maxContent: '1280px', // Max content width (max-w-7xl)
  maxReadable: '720px', // Max readable text (max-w-3xl)
  maxForm: '640px',     // Max form width (max-w-2xl)
}

// Border Radius
borderRadius: {
  sm: '4px',      // Badges, tags
  md: '8px',      // Buttons, inputs
  lg: '12px',     // Cards (default)
  xl: '16px',     // Large cards
  '2xl': '20px',  // Hero cards
  '3xl': '24px',  // Splash sections
  full: '9999px', // Pills, avatars
}
```

### Tailwind Spacing Examples

```html
<!-- Standard card -->
<div class="p-6 space-y-4 rounded-xl">
  <!-- Content -->
</div>

<!-- Section spacing -->
<section class="py-16 px-4 sm:px-6 lg:px-8">
  <!-- Content -->
</section>

<!-- Stack spacing -->
<div class="space-y-6">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

<!-- Inline spacing -->
<div class="flex items-center gap-3">
  <button>Cancel</button>
  <button>Save</button>
</div>
```

---

## Component Library

### Buttons

#### Primary Button (CTA)

```tsx
<button className="
  inline-flex items-center gap-2
  px-4 py-2.5
  text-sm font-bold
  text-white
  bg-gradient-to-r from-brand-600 to-cyan-600
  hover:from-brand-700 hover:to-cyan-700
  active:from-brand-800 active:to-cyan-800
  rounded-xl
  shadow-soft hover:shadow-glow
  transition-all duration-200
  disabled:opacity-50 disabled:cursor-not-allowed
">
  <svg className="w-4 h-4" />
  <span>Create Venture</span>
</button>
```

**States:**
- Default: Gradient brand-600 to cyan-600
- Hover: Gradient shifts darker, shadow grows
- Active: Even darker gradient
- Disabled: 50% opacity, no pointer
- Focus: Ring-2 ring-brand-500 ring-offset-2

#### Secondary Button

```tsx
<button className="
  inline-flex items-center gap-2
  px-4 py-2.5
  text-sm font-medium
  text-slate-700 dark:text-slate-300
  bg-white dark:bg-slate-900
  border border-slate-200 dark:border-slate-700
  hover:bg-slate-50 dark:hover:bg-slate-800/50
  hover:border-slate-300 dark:hover:border-slate-600
  rounded-xl
  transition-all duration-200
">
  <span>Cancel</span>
</button>
```

#### Ghost Button

```tsx
<button className="
  inline-flex items-center gap-2
  px-3 py-2
  text-sm font-medium
  text-slate-600 dark:text-slate-400
  hover:bg-slate-100 dark:hover:bg-slate-800/50
  rounded-lg
  transition-colors
">
  <span>View Details</span>
</button>
```

#### Button Sizes

```tsx
// Small
<button className="px-3 py-1.5 text-xs">Small</button>

// Medium (default)
<button className="px-4 py-2.5 text-sm">Medium</button>

// Large
<button className="px-6 py-3 text-base">Large</button>
```

---

### Status Badges

```tsx
// Success/Active
<span className="
  inline-flex items-center gap-1
  px-2.5 py-1
  text-xs font-medium
  rounded-md
  bg-accent-50 dark:bg-accent-900/40
  text-accent-700 dark:text-accent-300
  ring-1 ring-inset ring-accent-200/70 dark:ring-accent-800/60
">
  Active
</span>

// Warning
<span className="
  inline-flex items-center gap-1
  px-2.5 py-1
  text-xs font-medium
  rounded-md
  bg-amber-50 dark:bg-amber-900/40
  text-amber-700 dark:text-amber-300
  ring-1 ring-inset ring-amber-200/70
">
  At Risk
</span>

// Error
<span className="
  inline-flex items-center gap-1
  px-2.5 py-1
  text-xs font-medium
  rounded-md
  bg-red-50 dark:bg-red-900/40
  text-red-700 dark:text-red-300
  ring-1 ring-inset ring-red-200/70
">
  Overdue
</span>

// Info/Neutral
<span className="
  inline-flex items-center gap-1
  px-2.5 py-1
  text-xs font-medium
  rounded-md
  bg-slate-100 dark:bg-slate-800
  text-slate-700 dark:text-slate-300
  ring-1 ring-inset ring-slate-200 dark:ring-slate-700
">
  Pending
</span>

// Brand
<span className="
  inline-flex items-center gap-1
  px-2.5 py-1
  text-xs font-medium
  rounded-md
  bg-brand-50 dark:bg-brand-900/40
  text-brand-700 dark:text-brand-300
  ring-1 ring-inset ring-brand-200/70
">
  Build
</span>
```

**Status Badge Mapping:**

```typescript
const statusColors = {
  // Venture stages
  'Idea': 'slate',
  'Validation': 'blue',
  'Build': 'brand',
  'Pilot': 'purple',
  'Scale': 'accent',
  'Spin-Out': 'emerald',

  // Health states
  'Active': 'accent',
  'At Risk': 'amber',
  'Critical': 'red',
  'Paused': 'slate',

  // Task states
  'Complete': 'accent',
  'In Progress': 'brand',
  'Blocked': 'red',
  'Pending': 'slate',
}
```

---

### Cards

#### Standard Card

```tsx
<div className="
  rounded-2xl
  bg-white dark:bg-slate-900
  border border-slate-200/70 dark:border-slate-700/60
  shadow-subtle
  p-6
">
  <h3 className="text-lg font-semibold mb-4">Card Title</h3>
  <p className="text-sm text-slate-600 dark:text-slate-400">
    Card content goes here
  </p>
</div>
```

#### Interactive Card (Clickable)

```tsx
<a href="#" className="
  block
  rounded-xl
  bg-white dark:bg-slate-900
  border border-slate-200/70 dark:border-slate-700/60
  hover:border-brand-300 dark:hover:border-brand-700
  hover:shadow-soft
  transition-all duration-200
  p-4
  group
">
  <div className="flex items-center justify-between">
    <div>
      <div className="text-sm font-semibold">V001</div>
      <div className="text-xs text-slate-500">Venture Title</div>
    </div>
    <span className="text-brand-600 group-hover:translate-x-0.5 transition-transform">
      →
    </span>
  </div>
</a>
```

#### Card with Header

```tsx
<div className="
  rounded-2xl
  bg-white dark:bg-slate-900
  border border-slate-200/70 dark:border-slate-700/60
  shadow-subtle
  overflow-hidden
">
  <div className="
    px-6 py-4
    border-b border-slate-100 dark:border-slate-800
    flex items-center justify-between
  ">
    <h2 className="text-sm font-semibold">Ventures</h2>
    <span className="text-xs text-slate-500">25 active</span>
  </div>
  <div className="p-6">
    <!-- Card body -->
  </div>
</div>
```

#### Stat Card

```tsx
<div className="
  rounded-xl
  bg-gradient-to-br from-brand-50 to-cyan-50
  dark:from-brand-900/20 dark:to-cyan-900/20
  border border-brand-100 dark:border-brand-800/40
  p-6
">
  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
    Active Ventures
  </div>
  <div className="mt-2 flex items-baseline gap-2">
    <span className="text-3xl font-bold text-slate-900 dark:text-slate-100">
      24
    </span>
    <span className="text-sm text-accent-600 dark:text-accent-400">
      +3 this month
    </span>
  </div>
</div>
```

---

### Tables

#### Data Table

```tsx
<div className="overflow-x-auto">
  <table className="min-w-full text-sm">
    <thead className="
      bg-slate-50 dark:bg-slate-800/50
      text-slate-600 dark:text-slate-300
    ">
      <tr>
        <th className="text-left font-medium px-6 py-3">ID</th>
        <th className="text-left font-medium px-6 py-3">Lead</th>
        <th className="text-left font-medium px-6 py-3">Status</th>
        <th className="text-right font-medium px-6 py-3">MRR</th>
      </tr>
    </thead>
    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
      <tr className="
        hover:bg-slate-50/60 dark:hover:bg-slate-800/50
        transition-colors
      ">
        <td className="px-6 py-3 font-medium">
          <a href="#" className="text-brand-700 dark:text-brand-400 hover:underline">
            V001
          </a>
        </td>
        <td className="px-6 py-3">Alice</td>
        <td className="px-6 py-3">
          <span className="badge-success">Scale</span>
        </td>
        <td className="px-6 py-3 text-right tabular-nums">$12,500</td>
      </tr>
    </tbody>
  </table>
</div>
```

**Table Guidelines:**
- Always wrap in `overflow-x-auto` for mobile
- Use `tabular-nums` for numeric columns
- Right-align numeric columns
- Hover states for interactivity
- Sticky headers for long tables (optional)

---

### Forms

#### Input Field

```tsx
<div className="space-y-1">
  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
    Venture Name
  </label>
  <input
    type="text"
    className="
      w-full
      px-3 py-2
      text-sm
      bg-white dark:bg-slate-900
      border border-slate-300 dark:border-slate-700
      rounded-lg
      focus:ring-2 focus:ring-brand-500 focus:border-transparent
      placeholder:text-slate-400
    "
    placeholder="Enter venture name"
  />
  <p className="text-xs text-slate-500">
    This will be visible to all team members
  </p>
</div>
```

#### Select Dropdown

```tsx
<div className="space-y-1">
  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
    Status
  </label>
  <select className="
    w-full
    px-3 py-2
    text-sm
    bg-white dark:bg-slate-900
    border border-slate-300 dark:border-slate-700
    rounded-lg
    focus:ring-2 focus:ring-brand-500 focus:border-transparent
  ">
    <option value="">Select status</option>
    <option value="idea">Idea</option>
    <option value="validation">Validation</option>
    <option value="build">Build</option>
  </select>
</div>
```

#### Textarea

```tsx
<div className="space-y-1">
  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
    Description
  </label>
  <textarea
    rows={4}
    className="
      w-full
      px-3 py-2
      text-sm
      bg-white dark:bg-slate-900
      border border-slate-300 dark:border-slate-700
      rounded-lg
      focus:ring-2 focus:ring-brand-500 focus:border-transparent
      placeholder:text-slate-400
    "
    placeholder="Describe the venture..."
  />
</div>
```

#### Checkbox

```tsx
<label className="flex items-start gap-3 cursor-pointer">
  <input
    type="checkbox"
    className="
      mt-0.5
      h-4 w-4
      rounded
      border-slate-300 dark:border-slate-700
      text-brand-600
      focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
    "
  />
  <div>
    <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
      Enable notifications
    </div>
    <div className="text-xs text-slate-500">
      Receive email updates for this venture
    </div>
  </div>
</label>
```

#### Radio Group

```tsx
<div className="space-y-3">
  <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
    Environment
  </div>
  <div className="space-y-2">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="env"
        value="dev"
        className="
          h-4 w-4
          border-slate-300 dark:border-slate-700
          text-brand-600
          focus:ring-2 focus:ring-brand-500
        "
      />
      <span className="text-sm">Development</span>
    </label>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="env"
        value="prod"
        className="
          h-4 w-4
          border-slate-300 dark:border-slate-700
          text-brand-600
          focus:ring-2 focus:ring-brand-500
        "
      />
      <span className="text-sm">Production</span>
    </label>
  </div>
</div>
```

---

### Loading States

#### Skeleton Loader

```tsx
<div className="animate-pulse space-y-4">
  <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
  <div className="space-y-2">
    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
    <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-5/6"></div>
  </div>
</div>
```

#### Spinner

```tsx
<div className="flex items-center justify-center p-8">
  <svg
    className="animate-spin h-8 w-8 text-brand-600"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
</div>
```

#### Progress Bar

```tsx
<div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
  <div
    className="bg-gradient-to-r from-brand-600 to-cyan-600 h-2 rounded-full transition-all duration-300"
    style={{ width: '65%' }}
  />
</div>
```

---

### Empty States

```tsx
<div className="
  text-center
  py-12
  px-4
  rounded-2xl
  border-2 border-dashed border-slate-200 dark:border-slate-700
">
  <svg className="mx-auto h-12 w-12 text-slate-400" />
  <h3 className="mt-4 text-sm font-semibold text-slate-900 dark:text-slate-100">
    No ventures yet
  </h3>
  <p className="mt-2 text-sm text-slate-500">
    Get started by creating your first venture.
  </p>
  <button className="mt-6 px-4 py-2 bg-brand-600 text-white rounded-lg">
    Create Venture
  </button>
</div>
```

---

### Alerts / Toasts

#### Info Alert

```tsx
<div className="
  flex gap-3
  p-4
  rounded-lg
  bg-blue-50 dark:bg-blue-900/20
  border border-blue-100 dark:border-blue-800
">
  <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
  <div className="flex-1">
    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">
      Information
    </h4>
    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
      Your changes have been saved successfully.
    </p>
  </div>
</div>
```

#### Success Alert

```tsx
<div className="
  flex gap-3
  p-4
  rounded-lg
  bg-accent-50 dark:bg-accent-900/20
  border border-accent-100 dark:border-accent-800
">
  <svg className="w-5 h-5 text-accent-600 dark:text-accent-400 flex-shrink-0" />
  <div className="flex-1">
    <h4 className="text-sm font-medium text-accent-900 dark:text-accent-100">
      Success
    </h4>
    <p className="text-sm text-accent-700 dark:text-accent-300 mt-1">
      Venture created successfully.
    </p>
  </div>
</div>
```

#### Warning Alert

```tsx
<div className="
  flex gap-3
  p-4
  rounded-lg
  bg-amber-50 dark:bg-amber-900/20
  border border-amber-100 dark:border-amber-800
">
  <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
  <div className="flex-1">
    <h4 className="text-sm font-medium text-amber-900 dark:text-amber-100">
      Warning
    </h4>
    <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
      This milestone is approaching its deadline.
    </p>
  </div>
</div>
```

#### Error Alert

```tsx
<div className="
  flex gap-3
  p-4
  rounded-lg
  bg-red-50 dark:bg-red-900/20
  border border-red-100 dark:border-red-800
">
  <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
  <div className="flex-1">
    <h4 className="text-sm font-medium text-red-900 dark:text-red-100">
      Error
    </h4>
    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
      Failed to load venture data. Please try again.
    </p>
  </div>
</div>
```

---

## Layout Patterns

### App Shell

```tsx
<div className="min-h-screen flex">
  {/* Sidebar */}
  <aside className="
    w-72
    bg-gradient-to-b from-slate-50 to-white
    dark:from-slate-900 dark:to-slate-900
    border-r border-slate-200/50 dark:border-slate-700/50
    fixed inset-y-0 left-0
    lg:static
  ">
    {/* Sidebar content */}
  </aside>

  {/* Main content */}
  <div className="flex-1 flex flex-col">
    {/* Header */}
    <header className="
      sticky top-0 z-30
      h-16
      glass-effect
      border-b border-slate-200/50 dark:border-slate-700/50
      shadow-soft
    ">
      {/* Header content */}
    </header>

    {/* Main */}
    <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900">
      {/* Page content */}
    </main>

    {/* Footer */}
    <footer className="border-t border-slate-200/70 dark:border-slate-800 py-6">
      {/* Footer content */}
    </footer>
  </div>
</div>
```

### Page Container

```tsx
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
  {/* Page content */}
</div>
```

### Two-Column Layout

```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  {/* Main content - 2/3 width */}
  <div className="lg:col-span-2">
    {/* Content */}
  </div>

  {/* Sidebar - 1/3 width */}
  <div>
    {/* Sidebar content */}
  </div>
</div>
```

### Card Grid

```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {/* Cards */}
</div>
```

### List View with Filters

```tsx
<div className="space-y-6">
  {/* Filter bar */}
  <div className="
    rounded-xl
    bg-white dark:bg-slate-900
    border border-slate-200/70 dark:border-slate-700/60
    p-4
  ">
    <div className="flex flex-wrap gap-3 items-end">
      <div>
        <label className="block text-xs font-medium mb-1">Status</label>
        <select className="...">...</select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1">Lead</label>
        <input type="text" className="..." />
      </div>
      <div className="ml-auto flex gap-2">
        <button className="...">Apply</button>
        <button className="...">Clear</button>
      </div>
    </div>
  </div>

  {/* Results table/grid */}
  <div className="...">
    {/* Content */}
  </div>
</div>
```

### Detail View

```tsx
<div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
  {/* Breadcrumb */}
  <div className="mb-4 text-sm">
    <a href="#" className="text-brand-600 hover:underline">← Back to Ventures</a>
  </div>

  {/* Detail card */}
  <div className="
    rounded-2xl
    bg-white dark:bg-slate-900
    border border-slate-200/70 dark:border-slate-700/60
    shadow-subtle
  ">
    {/* Header */}
    <div className="p-8 border-b border-slate-100 dark:border-slate-800">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">V001</h1>
          <p className="text-sm text-slate-500 mt-1">Venture Title</p>
        </div>
        <div className="flex gap-2">
          <span className="badge-success">Active</span>
          <button className="...">Edit</button>
        </div>
      </div>
    </div>

    {/* Tabs */}
    <div className="border-b border-slate-100 dark:border-slate-800">
      <div className="flex gap-1 px-8">
        <button className="tab-active">Overview</button>
        <button className="tab">Milestones</button>
        <button className="tab">KPIs</button>
        <button className="tab">Team</button>
      </div>
    </div>

    {/* Content */}
    <div className="p-8">
      {/* Tab content */}
    </div>
  </div>
</div>
```

---

## Responsive Design

### Breakpoints (Tailwind Defaults)

```typescript
breakpoints: {
  sm: '640px',   // Small devices (phones landscape)
  md: '768px',   // Medium devices (tablets)
  lg: '1024px',  // Large devices (laptops)
  xl: '1280px',  // Extra large (desktops)
  '2xl': '1536px', // 2X large (large desktops)
}
```

### Mobile-First Approach

Always design for mobile first, then enhance for larger screens:

```tsx
<div className="
  grid
  grid-cols-1           /* Mobile: 1 column */
  sm:grid-cols-2        /* Small: 2 columns */
  lg:grid-cols-3        /* Large: 3 columns */
  xl:grid-cols-4        /* XL: 4 columns */
  gap-4
">
  {/* Cards */}
</div>
```

### Responsive Spacing

```tsx
<section className="
  px-4                  /* Mobile: 16px */
  sm:px-6               /* Small: 24px */
  lg:px-8               /* Large: 32px */
  py-8                  /* Mobile: 32px */
  sm:py-12              /* Small: 48px */
  lg:py-16              /* Large: 64px */
">
  {/* Content */}
</section>
```

### Responsive Typography

```tsx
<h1 className="
  text-2xl              /* Mobile: 24px */
  sm:text-3xl           /* Small: 30px */
  lg:text-4xl           /* Large: 36px */
  font-bold
  tracking-tight
">
  Heading
</h1>
```

### Hide/Show Based on Screen Size

```tsx
{/* Show on mobile only */}
<button className="lg:hidden">
  Menu
</button>

{/* Hide on mobile */}
<nav className="hidden lg:block">
  {/* Desktop nav */}
</nav>

{/* Show on desktop only */}
<span className="hidden md:inline">
  Full text
</span>
```

### Touch Targets

Ensure all interactive elements are at least 44x44px on mobile:

```tsx
<button className="
  min-h-[44px] min-w-[44px]
  p-3
  ...
">
  Button
</button>
```

---

## Dark Mode

### Implementation Strategy

Use Tailwind's `dark:` variant with class-based dark mode:

```html
<html class="dark">
  <!-- Dark mode is active -->
</html>
```

### Dark Mode Color Mapping

```typescript
// Light mode → Dark mode
{
  // Backgrounds
  'bg-white': 'dark:bg-slate-900',
  'bg-slate-50': 'dark:bg-slate-900',
  'bg-slate-100': 'dark:bg-slate-800',

  // Text
  'text-slate-900': 'dark:text-slate-100',
  'text-slate-700': 'dark:text-slate-300',
  'text-slate-600': 'dark:text-slate-400',
  'text-slate-500': 'dark:text-slate-500', // Same

  // Borders
  'border-slate-200': 'dark:border-slate-700',
  'border-slate-300': 'dark:border-slate-600',

  // Brand colors stay mostly the same
  'text-brand-600': 'dark:text-brand-400',
  'bg-brand-600': 'dark:bg-brand-600', // Usually same
}
```

### Dark Mode Examples

```tsx
{/* Background */}
<div className="bg-white dark:bg-slate-900">
  {/* Content */}
</div>

{/* Text */}
<p className="text-slate-700 dark:text-slate-300">
  Body text
</p>

{/* Border */}
<div className="border border-slate-200 dark:border-slate-700">
  {/* Content */}
</div>

{/* Card with full dark mode support */}
<div className="
  rounded-xl
  bg-white dark:bg-slate-900
  border border-slate-200/70 dark:border-slate-700/60
  shadow-subtle
  p-6
">
  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
    Title
  </h3>
  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
    Description
  </p>
</div>
```

### Glass Effect (Backdrop Blur)

```css
.glass-effect {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}

.dark .glass-effect {
  background: rgba(15, 23, 42, 0.9);
}
```

```tsx
<header className="glass-effect border-b border-slate-200/50 dark:border-slate-700/50">
  {/* Header content */}
</header>
```

---

## Accessibility

### WCAG 2.1 AA Compliance

All components must meet WCAG 2.1 Level AA standards.

### Color Contrast

Minimum contrast ratios:
- **Normal text (< 18px):** 4.5:1
- **Large text (≥ 18px or 14px bold):** 3:1
- **UI components and graphics:** 3:1

Our color system is designed to meet these ratios:

```typescript
// Safe combinations
{
  // Light mode
  'text-slate-900 on bg-white': '21:1', // Excellent
  'text-slate-700 on bg-white': '12:1', // Excellent
  'text-slate-600 on bg-white': '7:1',  // Good
  'text-brand-600 on bg-white': '4.5:1', // Pass AA

  // Dark mode
  'text-slate-100 on bg-slate-900': '18:1', // Excellent
  'text-slate-300 on bg-slate-900': '11:1', // Excellent
  'text-brand-400 on bg-slate-900': '4.6:1', // Pass AA
}
```

### Keyboard Navigation

All interactive elements must be keyboard accessible:

```tsx
<button className="
  focus:outline-none
  focus:ring-2
  focus:ring-brand-500
  focus:ring-offset-2
">
  Click me
</button>

<a href="#" className="
  focus:outline-none
  focus:ring-2
  focus:ring-brand-500
  focus:ring-offset-2
  rounded-lg
">
  Link
</a>
```

### Screen Reader Support

```tsx
{/* Button with aria-label */}
<button aria-label="Close dialog">
  <svg>...</svg>
</button>

{/* Icon with screen reader text */}
<button>
  <svg aria-hidden="true">...</svg>
  <span className="sr-only">Close</span>
</button>

{/* Status indicator */}
<span
  className="badge-success"
  role="status"
  aria-label="Status: Active"
>
  Active
</span>

{/* Loading state */}
<div role="status" aria-live="polite">
  <svg className="animate-spin" aria-hidden="true">...</svg>
  <span className="sr-only">Loading...</span>
</div>
```

### Form Accessibility

```tsx
<div>
  <label htmlFor="venture-name" className="...">
    Venture Name
  </label>
  <input
    id="venture-name"
    type="text"
    aria-describedby="venture-name-hint"
    aria-required="true"
    className="..."
  />
  <p id="venture-name-hint" className="text-xs text-slate-500">
    This will be visible to all team members
  </p>
</div>

{/* Error state */}
<div>
  <label htmlFor="email" className="...">Email</label>
  <input
    id="email"
    type="email"
    aria-invalid="true"
    aria-describedby="email-error"
    className="border-red-500 ..."
  />
  <p id="email-error" className="text-xs text-red-600" role="alert">
    Please enter a valid email address
  </p>
</div>
```

### Skip Links

```tsx
<a
  href="#main-content"
  className="
    sr-only
    focus:not-sr-only
    focus:absolute
    focus:top-4
    focus:left-4
    focus:z-50
    focus:px-4
    focus:py-2
    focus:bg-brand-600
    focus:text-white
    focus:rounded-lg
  "
>
  Skip to main content
</a>
```

### ARIA Landmarks

```tsx
<div className="min-h-screen flex">
  <aside role="navigation" aria-label="Main navigation">
    {/* Sidebar */}
  </aside>

  <div className="flex-1 flex flex-col">
    <header role="banner">
      {/* Header */}
    </header>

    <main id="main-content" role="main">
      {/* Main content */}
    </main>

    <footer role="contentinfo">
      {/* Footer */}
    </footer>
  </div>
</div>
```

---

## Animation & Motion

### Animation Principles

1. **Subtle and purposeful** - Enhance UX, don't distract
2. **Fast and responsive** - 200-300ms max for most animations
3. **Respect user preferences** - Honor `prefers-reduced-motion`

### Transition Timings

```typescript
transitions: {
  fast: '150ms',      // Button hover, focus states
  base: '200ms',      // Default transitions
  slow: '300ms',      // Slide-ins, modal open
  slower: '500ms',    // Large transforms
}

easings: {
  default: 'cubic-bezier(0.4, 0, 0.2, 1)',     // ease-in-out
  in: 'cubic-bezier(0.4, 0, 1, 1)',            // ease-in
  out: 'cubic-bezier(0, 0, 0.2, 1)',           // ease-out
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
}
```

### Common Animations

#### Fade In

```tsx
<div className="animate-in fade-in duration-200">
  {/* Content */}
</div>

{/* CSS */}
<style>
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
```

#### Slide In

```tsx
<div className="animate-in slide-in-from-bottom-4 duration-300">
  {/* Content */}
</div>

{/* Or custom CSS */}
<style>
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
```

#### Hover Transforms

```tsx
<button className="
  transition-transform
  hover:scale-105
  active:scale-95
  duration-200
">
  Button
</button>

<a className="
  block
  transition-all
  hover:-translate-y-1
  hover:shadow-lg
  duration-200
">
  Card
</a>
```

#### Loading Spinner

```tsx
<svg className="animate-spin h-8 w-8">
  {/* SVG content */}
</svg>

{/* Tailwind animation */}
@keyframes spin {
  to { transform: rotate(360deg); }
}
```

#### Pulse (Loading state)

```tsx
<div className="animate-pulse">
  <div className="h-4 bg-slate-200 rounded"></div>
</div>
```

### Respect User Preferences

```tsx
<div className="
  transition-all
  duration-200
  motion-reduce:transition-none
">
  {/* Content */}
</div>
```

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Entity-Specific Patterns

### Ventures

#### Venture Card

```tsx
<a href="#" className="
  block
  rounded-xl
  bg-white dark:bg-slate-900
  border border-slate-200/70 dark:border-slate-700/60
  hover:border-brand-300 dark:hover:border-brand-700
  hover:shadow-soft
  transition-all
  p-4
  group
">
  <div className="flex items-start justify-between mb-3">
    <div>
      <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
        V001
      </div>
      <div className="text-xs text-slate-500 mt-0.5">
        Last updated 2 days ago
      </div>
    </div>
    <span className="badge-success">Scale</span>
  </div>

  <h3 className="text-base font-medium text-slate-700 dark:text-slate-300 mb-2">
    Venture Title
  </h3>

  <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-400">
    <div>
      <span className="text-slate-400">Lead:</span> Alice
    </div>
    <div>
      <span className="text-slate-400">MRR:</span> $12.5K
    </div>
  </div>

  <div className="mt-3 flex items-center justify-between">
    <div className="text-xs text-slate-500">
      Next: MVP Launch (14 days)
    </div>
    <span className="text-brand-600 group-hover:translate-x-1 transition-transform">
      →
    </span>
  </div>
</a>
```

#### Venture Status Colors

```typescript
const ventureStatusColors = {
  'Idea': 'slate',       // Gray - early stage
  'Validation': 'blue',  // Blue - exploring
  'Build': 'brand',      // Brand - actively developing
  'Pilot': 'purple',     // Purple - testing
  'Scale': 'accent',     // Green - growing
  'Spin-Out': 'emerald', // Emerald green - graduated
}
```

### Ideas

#### Idea Scoring Display

```tsx
<div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4">
  <div className="text-xs font-medium text-slate-600 dark:text-slate-400 mb-2">
    Scoring
  </div>
  <div className="flex items-end gap-4">
    <div>
      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
        8.2
      </div>
      <div className="text-xs text-slate-500">Overall</div>
    </div>
    <div className="flex-1 space-y-1.5">
      <div>
        <div className="flex items-center justify-between text-xs mb-0.5">
          <span className="text-slate-600 dark:text-slate-400">Market</span>
          <span className="font-medium">9</span>
        </div>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full">
          <div className="h-1.5 bg-brand-600 rounded-full" style={{ width: '90%' }} />
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between text-xs mb-0.5">
          <span className="text-slate-600 dark:text-slate-400">Team</span>
          <span className="font-medium">7</span>
        </div>
        <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full">
          <div className="h-1.5 bg-brand-600 rounded-full" style={{ width: '70%' }} />
        </div>
      </div>
    </div>
  </div>
</div>
```

### KPIs

#### KPI Metric Card

```tsx
<div className="
  rounded-xl
  bg-gradient-to-br from-accent-50 to-cyan-50
  dark:from-accent-900/20 dark:to-cyan-900/20
  border border-accent-100 dark:border-accent-800/40
  p-5
">
  <div className="flex items-start justify-between mb-3">
    <div>
      <div className="text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
        MRR
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
          $24,500
        </span>
        <span className="text-sm text-accent-600 dark:text-accent-400">
          +18%
        </span>
      </div>
    </div>
    <div className="p-2 rounded-lg bg-accent-100 dark:bg-accent-900/40">
      <svg className="w-5 h-5 text-accent-600 dark:text-accent-400" />
    </div>
  </div>

  <div className="text-xs text-slate-500">
    vs. last month
  </div>
</div>
```

### Milestones

#### Milestone Timeline

```tsx
<div className="space-y-4">
  {/* Completed milestone */}
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className="
        h-8 w-8
        rounded-full
        bg-accent-100 dark:bg-accent-900/40
        border-2 border-accent-600 dark:border-accent-400
        flex items-center justify-center
      ">
        <svg className="w-4 h-4 text-accent-600 dark:text-accent-400" />
      </div>
      <div className="flex-1 w-0.5 bg-slate-200 dark:bg-slate-700 mt-2" />
    </div>
    <div className="flex-1 pb-8">
      <div className="flex items-start justify-between mb-1">
        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
          MVP Launch
        </h4>
        <span className="badge-success">Complete</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Completed on Jan 15, 2025
      </p>
    </div>
  </div>

  {/* Current milestone */}
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className="
        h-8 w-8
        rounded-full
        bg-brand-100 dark:bg-brand-900/40
        border-2 border-brand-600 dark:border-brand-400
        flex items-center justify-center
        ring-4 ring-brand-100/50 dark:ring-brand-900/20
      ">
        <div className="h-2 w-2 rounded-full bg-brand-600 dark:bg-brand-400" />
      </div>
      <div className="flex-1 w-0.5 bg-slate-200 dark:bg-slate-700 mt-2" />
    </div>
    <div className="flex-1 pb-8">
      <div className="flex items-start justify-between mb-1">
        <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100">
          First 100 Customers
        </h4>
        <span className="badge-brand">In Progress</span>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Due Feb 28, 2025 (14 days left)
      </p>
    </div>
  </div>

  {/* Upcoming milestone */}
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className="
        h-8 w-8
        rounded-full
        bg-slate-100 dark:bg-slate-800
        border-2 border-slate-300 dark:border-slate-600
      " />
    </div>
    <div className="flex-1">
      <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Series A Fundraise
      </h4>
      <p className="text-sm text-slate-500">
        Target: Q2 2025
      </p>
    </div>
  </div>
</div>
```

### Resources

#### Resource Allocation Card

```tsx
<div className="
  rounded-xl
  bg-white dark:bg-slate-900
  border border-slate-200/70 dark:border-slate-700/60
  p-4
">
  <div className="flex items-start justify-between mb-3">
    <div className="flex items-center gap-3">
      <div className="
        h-10 w-10
        rounded-full
        bg-gradient-to-br from-brand-500 to-cyan-500
        flex items-center justify-center
        text-white text-sm font-medium
      ">
        AJ
      </div>
      <div>
        <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
          Alice Johnson
        </div>
        <div className="text-xs text-slate-500">
          Product Lead
        </div>
      </div>
    </div>
    <span className="badge-success">Available</span>
  </div>

  <div className="space-y-2">
    <div>
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-slate-600 dark:text-slate-400">Utilization</span>
        <span className="font-medium tabular-nums">75%</span>
      </div>
      <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full">
        <div className="h-1.5 bg-accent-600 rounded-full" style={{ width: '75%' }} />
      </div>
    </div>
  </div>

  <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
    <div className="text-xs text-slate-600 dark:text-slate-400">
      Allocated to: V001 (50%), V003 (25%)
    </div>
  </div>
</div>
```

### Budgets

#### Budget Overview Card

```tsx
<div className="
  rounded-xl
  bg-white dark:bg-slate-900
  border border-slate-200/70 dark:border-slate-700/60
  p-6
">
  <div className="flex items-start justify-between mb-4">
    <div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
        Q1 2025 Budget
      </h3>
      <p className="text-sm text-slate-500">
        V001 - Venture Name
      </p>
    </div>
    <span className="badge-warning">87% Spent</span>
  </div>

  <div className="grid grid-cols-2 gap-4 mb-4">
    <div>
      <div className="text-xs text-slate-500 mb-1">Planned</div>
      <div className="text-xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
        $50,000
      </div>
    </div>
    <div>
      <div className="text-xs text-slate-500 mb-1">Actual</div>
      <div className="text-xl font-bold text-amber-600 dark:text-amber-400 tabular-nums">
        $43,500
      </div>
    </div>
  </div>

  <div className="space-y-2">
    <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
      <div className="h-2 bg-amber-500 rounded-full" style={{ width: '87%' }} />
    </div>
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-500">Runway: 45 days</span>
      <span className="text-amber-600 dark:text-amber-400 font-medium">
        $6,500 remaining
      </span>
    </div>
  </div>
</div>
```

---

## Implementation Guidelines

### Component Development Checklist

When creating a new component, ensure:

- [ ] Responsive design (mobile-first)
- [ ] Dark mode support
- [ ] Keyboard navigation
- [ ] Focus states (visible ring)
- [ ] Screen reader support (ARIA labels)
- [ ] Loading states
- [ ] Error states
- [ ] Empty states
- [ ] Hover animations (subtle)
- [ ] Color contrast meets WCAG AA
- [ ] Consistent spacing (8px grid)
- [ ] TypeScript types defined
- [ ] Documented with examples

### Code Style

```tsx
// ✅ Good: Organized classes, readable
<button className="
  inline-flex items-center gap-2
  px-4 py-2.5
  text-sm font-medium
  text-white
  bg-brand-600
  hover:bg-brand-700
  rounded-lg
  transition-colors
">
  Button
</button>

// ❌ Bad: Long single line
<button className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 rounded-lg transition-colors">Button</button>
```

### Utility Class Organization

Order classes logically:

1. Layout (display, position, flex)
2. Sizing (width, height)
3. Spacing (margin, padding)
4. Typography (font, text)
5. Colors (bg, text, border)
6. Effects (shadow, opacity)
7. Interactions (hover, focus)
8. Transitions/animations

### Using shadcn/ui Components

When using shadcn/ui, customize with our brand colors:

```tsx
import { Button } from '@/components/ui/button';

<Button className="bg-brand-600 hover:bg-brand-700">
  Custom Brand Button
</Button>
```

### Custom CSS Variables (Optional)

For advanced theming, use CSS variables:

```css
:root {
  --color-brand-primary: #b91c1c;
  --color-accent-primary: #dc2626;
  --header-height: 64px;
  --sidebar-width: 288px;
}

.dark {
  --color-brand-primary: #38bdf8;
  --color-accent-primary: #34d399;
}
```

### Performance Best Practices

1. **Code splitting** - Lazy load routes and heavy components
2. **Image optimization** - Use WebP, lazy load, proper sizing
3. **Minimize bundle** - Tree-shake unused code
4. **Avoid layout shift** - Use skeleton loaders
5. **Debounce search** - Don't query on every keystroke

### Testing Guidelines

```tsx
// Test component rendering
it('renders venture card', () => {
  render(<VentureCard venture={mockVenture} />);
  expect(screen.getByText('V001')).toBeInTheDocument();
});

// Test interactions
it('navigates on click', () => {
  const { container } = render(<VentureCard venture={mockVenture} />);
  const link = container.querySelector('a');
  expect(link).toHaveAttribute('href', '#ventures/V001');
});

// Test accessibility
it('has proper ARIA labels', () => {
  render(<VentureCard venture={mockVenture} />);
  expect(screen.getByRole('link')).toHaveAccessibleName();
});
```

---

## Design System Updates

This design system is a living document. To propose changes:

1. Review existing patterns
2. Ensure consistency with brand identity
3. Validate accessibility
4. Test on multiple screen sizes
5. Document examples
6. Update this file

**Version History:**
- v1.0 (2025-11-06): Initial release

**Maintainer:** Design Team
**Last Updated:** 2025-11-06

---

## Quick Reference

### Most Common Patterns

```tsx
// Standard page layout
<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
  <h1 className="text-2xl font-bold mb-6">Page Title</h1>
  {/* Content */}
</div>

// Card
<div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/60 shadow-subtle p-6">
  {/* Content */}
</div>

// Primary button
<button className="px-4 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-700 hover:to-cyan-700 rounded-xl transition-all">
  Action
</button>

// Status badge
<span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md bg-accent-50 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300 ring-1 ring-inset ring-accent-200/70">
  Active
</span>

// Input field
<input className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent" />
```

---

## Resources

- **Tailwind CSS Documentation:** https://tailwindcss.com/docs
- **shadcn/ui Components:** https://ui.shadcn.com
- **Heroicons:** https://heroicons.com
- **Inter Font:** https://rsms.me/inter
- **WCAG Guidelines:** https://www.w3.org/WAI/WCAG21/quickref
- **Color Contrast Checker:** https://colourcontrast.cc

---

**End of Design System**
