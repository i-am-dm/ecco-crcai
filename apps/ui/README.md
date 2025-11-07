# CityReach Innovation Labs - React UI

Modern React application for the CityReach Innovation Labs venture management platform.

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite 5** - Build tool and dev server
- **Tailwind CSS 3** - Utility-first styling
- **TanStack Query** - Server state management
- **Zustand** - Client state management
- **React Router 6** - Routing
- **Lucide React** - Icons
- **Firebase Auth** - Authentication (optional)

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm

### Installation

```bash
npm install
```

### Configuration

Create a `.env.local` file with:

```env
VITE_API_URL=http://localhost:8085
VITE_DEFAULT_ENV=dev
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

**Note:** Firebase configuration is optional. Without it, the app will use mock authentication for development.

### Development

```bash
npm run dev
```

Open http://localhost:5173

### Build

```bash
npm run build
```

Output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── layout/          # Layout components (Header, Sidebar, Footer)
│   └── ui/              # Reusable UI components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and configurations
│   ├── api.ts          # API client
│   ├── queryClient.ts  # TanStack Query config
│   ├── firebase.ts     # Firebase config
│   └── utils.ts        # Utility functions
├── routes/              # Page components
│   ├── ventures/       # Ventures pages
│   ├── login.tsx       # Login page
│   └── Dashboard.tsx   # Dashboard page
├── stores/              # Zustand stores
│   ├── authStore.ts    # Auth state
│   └── uiStore.ts      # UI preferences
├── types/               # TypeScript types
│   └── api.ts          # API types
├── App.tsx              # Root component
├── main.tsx             # Entry point
└── index.css            # Global styles
```

## Features Implemented

- Authentication with mock login (Firebase optional)
- Protected routes
- Dashboard with key metrics
- Ventures list and detail views
- Dark mode support
- Environment switching (dev/stg/prod)
- Responsive sidebar navigation
- API client with auth interceptors
- Loading and error states
- Type-safe API calls

## API Integration

The app integrates with the CityReach Innovation Labs API at `/v1/*` endpoints. The API client automatically:

- Adds JWT token to requests
- Adds environment query parameter
- Handles 401 errors (logout)
- Provides type-safe request/response handling

## State Management

### Server State (TanStack Query)

Used for API data:
- Automatic caching (5 min stale time)
- Background refetching
- Optimistic updates
- Retry logic

### Client State (Zustand)

Used for:
- Auth state (user, token, roles)
- UI preferences (theme, env, sidebar)

Both stores persist to localStorage.

## Authentication

The app supports two authentication modes:

1. **Firebase Auth** - Production mode with real JWT tokens and RBAC
2. **Mock Auth** - Development mode when Firebase is not configured

To use Firebase:
1. Configure Firebase in `.env.local`
2. Set up Identity Platform in GCP
3. Configure custom claims for roles

## Role-Based Access Control

Roles supported:
- Admin - Full access
- Leadership - Read/write most entities
- Lead - Edit own ventures
- Contributor - Limited access
- Investor - View-only financial data
- Advisor - Scoped view access

## Styling

Uses Tailwind CSS with:
- Custom brand colors (blues and greens)
- Dark mode support
- Responsive design
- Custom components

Brand colors:
- Primary: `brand-600` (#0284c7)
- Accent: `accent-600` (#059669)

## Development Tips

### Adding New Routes

1. Create page component in `src/routes/`
2. Add route in `App.tsx`
3. Add navigation link in `Sidebar.tsx`

### Adding New API Endpoints

1. Update types in `src/types/api.ts`
2. Create custom hook in `src/hooks/`
3. Use hook in component

### Generating API Types

```bash
npx openapi-typescript ../../api/openapi.yaml -o src/types/api.ts
```

## Next Steps

See `ui/_docs/REDESIGN_PLAN.md` for full implementation roadmap.

Phase 1 priorities:
- Ideas module (list, detail, forms)
- Experiments module
- KPIs visualization
- Resources allocation
- Budgets tracking
- Portfolio dashboard

## Troubleshooting

### API Connection Issues

- Ensure API is running at http://localhost:8085
- Check `.env.local` configuration
- Verify CORS is enabled in API

### Firebase Errors

- Check Firebase configuration in `.env.local`
- Ensure Identity Platform is enabled
- Verify custom claims are set for roles

### Build Errors

- Clear `node_modules` and reinstall: `rm -rf node_modules package-lock.json && npm install`
- Check TypeScript errors: `npm run tsc`

## License

Proprietary - CityReach Innovation Labs
