# Getting Started - UI Redesign Implementation

This guide provides step-by-step instructions to implement the redesigned UI.

## Prerequisites

- Node.js 20+ (same as backend)
- npm or pnpm
- Access to API at `http://localhost:8085` (or configured endpoint)
- Firebase project for auth (Identity Platform)

## Step 1: Scaffold New Project

```bash
cd /Users/dmeacham/code/ecco-crcai

# Create new Vite + React + TypeScript project
npm create vite@latest ui-new -- --template react-ts

cd ui-new

# Install dependencies
npm install
```

## Step 2: Install Core Dependencies

```bash
# React Router
npm install react-router-dom

# State Management
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install zustand

# API Client
npm install openapi-fetch
npm install -D openapi-typescript

# Forms & Validation
npm install react-hook-form zod @hookform/resolvers

# UI Components (shadcn/ui)
npm install tailwindcss postcss autoprefixer
npm install -D @tailwindcss/forms @tailwindcss/typography
npm install class-variance-authority clsx tailwind-merge
npm install @radix-ui/react-slot @radix-ui/react-dialog @radix-ui/react-dropdown-menu

# Icons
npm install lucide-react

# Charts
npm install recharts

# Auth
npm install firebase

# Utilities
npm install date-fns
```

## Step 3: Configure Tailwind CSS

```bash
# Initialize Tailwind
npx tailwindcss init -p
```

Edit `tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#b91c1c',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#dc2626',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

Edit `src/index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-sans antialiased;
  }
}
```

## Step 4: Environment Configuration

Create `.env.local`:

```env
VITE_API_URL=http://localhost:8085
VITE_DEFAULT_ENV=dev
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
```

Create `src/config.ts`:

```typescript
export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8085',
  defaultEnv: import.meta.env.VITE_DEFAULT_ENV || 'dev',
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  },
};
```

## Step 5: Generate API Client

```bash
# Generate TypeScript types from OpenAPI spec
npx openapi-typescript ../api/openapi.yaml -o src/types/api.ts
```

Create `src/lib/api.ts`:

```typescript
import createClient from 'openapi-fetch';
import type { paths } from '@/types/api';
import { config } from '@/config';
import { useAuthStore } from '@/stores/authStore';

const api = createClient<paths>({
  baseUrl: config.apiUrl,
});

// Add auth interceptor
api.use({
  async onRequest({ request }) {
    const token = useAuthStore.getState().token;
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }

    // Add env query param if not present
    const url = new URL(request.url);
    if (!url.searchParams.has('env')) {
      url.searchParams.set('env', config.defaultEnv);
      request.url = url.toString();
    }
  },

  async onResponse({ response }) {
    if (!response.ok) {
      // Handle auth errors
      if (response.status === 401) {
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
  },
});

export default api;
```

## Step 6: Set Up State Management

### Auth Store (Zustand)

Create `src/stores/authStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  uid: string;
  email: string;
  displayName?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  roles: string[];
  isAuthenticated: boolean;

  login: (user: User, token: string, roles: string[]) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      roles: [],
      isAuthenticated: false,

      login: (user, token, roles) => {
        set({ user, token, roles, isAuthenticated: true });
      },

      logout: () => {
        set({ user: null, token: null, roles: [], isAuthenticated: false });
      },
    }),
    {
      name: 'ecco-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        roles: state.roles,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### UI Store (Zustand)

Create `src/stores/uiStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  theme: 'light' | 'dark';
  env: 'dev' | 'stg' | 'prod';
  sidebarCollapsed: boolean;

  setTheme: (theme: 'light' | 'dark') => void;
  setEnv: (env: 'dev' | 'stg' | 'prod') => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      env: 'dev',
      sidebarCollapsed: false,

      setTheme: (theme) => set({ theme }),
      setEnv: (env) => set({ env }),
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
    }),
    {
      name: 'ecco-ui',
    }
  )
);
```

### Query Client (TanStack Query)

Create `src/lib/queryClient.ts`:

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
    },
  },
});
```

## Step 7: Create Custom Hooks

### useVentures Hook

Create `src/hooks/useVentures.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export function useVentures() {
  return useQuery({
    queryKey: ['ventures'],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/{entity}', {
        params: { path: { entity: 'venture' } },
      });
      if (error) throw new Error('Failed to fetch ventures');
      return data;
    },
  });
}

export function useVenture(id: string) {
  return useQuery({
    queryKey: ['venture', id],
    queryFn: async () => {
      const { data, error } = await api.GET('/v1/{entity}/{id}', {
        params: { path: { entity: 'venture', id } },
      });
      if (error) throw new Error(`Failed to fetch venture ${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateVenture() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ventureData: any) => {
      const { data, error } = await api.POST('/v1/internal/history', {
        body: {
          entity: 'venture',
          data: ventureData,
        },
      });
      if (error) throw new Error('Failed to create venture');
      return data;
    },
    onSuccess: () => {
      // Invalidate ventures list to refetch
      queryClient.invalidateQueries({ queryKey: ['ventures'] });
    },
  });
}
```

### useAuth Hook

Create `src/hooks/useAuth.ts`:

```typescript
import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { user, roles, isAuthenticated, logout } = useAuthStore();

  const hasRole = (role: string) => roles.includes(role);

  const canEdit = (entity: string, ownerId?: string) => {
    if (hasRole('Admin')) return true;
    if (hasRole('Leadership')) return true;
    if (hasRole('Lead') && ownerId === user?.uid) return true;
    return false;
  };

  return {
    user,
    roles,
    isAuthenticated,
    logout,
    hasRole,
    canEdit,
  };
}
```

## Step 8: Set Up Firebase Auth

Create `src/lib/firebase.ts`:

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { config } from '@/config';

const app = initializeApp(config.firebase);
export const auth = getAuth(app);
```

## Step 9: Create Layout Components

### AppShell

Create `src/components/layout/AppShell.tsx`:

```typescript
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export function AppShell() {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 bg-slate-50 dark:bg-slate-900">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
```

### Header

Create `src/components/layout/Header.tsx`:

```typescript
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';

export function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useUIStore();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-700">
      <div className="h-full px-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">CityReach Innovation Labs</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
          {user && (
            <>
              <span className="text-sm">{user.email}</span>
              <button
                onClick={logout}
                className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Sign out
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
```

### Sidebar

Create `src/components/layout/Sidebar.tsx`:

```typescript
import { NavLink } from 'react-router-dom';

export function Sidebar() {
  return (
    <aside className="w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
      <div className="p-6">
        <h2 className="text-lg font-bold gradient-text">CityReach Innovation Labs</h2>
      </div>
      <nav className="p-4 space-y-1">
        <NavLink
          to="/ventures"
          className={({ isActive }) =>
            `block px-4 py-2.5 rounded-xl ${
              isActive
                ? 'bg-brand-600 text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`
          }
        >
          Ventures
        </NavLink>
        <NavLink
          to="/ideas"
          className={({ isActive }) =>
            `block px-4 py-2.5 rounded-xl ${
              isActive
                ? 'bg-brand-600 text-white'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`
          }
        >
          Ideas
        </NavLink>
        {/* Add more links... */}
      </nav>
    </aside>
  );
}
```

## Step 10: Create Routes

### App.tsx

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/routes/login';
import { VenturesListPage } from '@/routes/ventures';
import { VentureDetailPage } from '@/routes/ventures/[id]';
import { useAuth } from '@/hooks/useAuth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/ventures" />} />
            <Route path="/ventures" element={<VenturesListPage />} />
            <Route path="/ventures/:id" element={<VentureDetailPage />} />
            {/* Add more routes... */}
          </Route>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default App;
```

### Login Page

Create `src/routes/login.tsx`:

```typescript
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/stores/authStore';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      const idTokenResult = await userCredential.user.getIdTokenResult();
      const roles = idTokenResult.claims.roles as string[] || ['Contributor'];

      login(
        {
          uid: userCredential.user.uid,
          email: userCredential.user.email!,
          displayName: userCredential.user.displayName || undefined,
        },
        token,
        roles
      );

      navigate('/ventures');
    } catch (err) {
      setError('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-full max-w-md p-8 bg-white rounded-2xl shadow-lg">
        <h1 className="text-2xl font-bold mb-6">Sign In</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
```

### Ventures List Page

Create `src/routes/ventures/index.tsx`:

```typescript
import { Link } from 'react-router-dom';
import { useVentures } from '@/hooks/useVentures';

export function VenturesListPage() {
  const { data, isLoading, error } = useVentures();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Ventures</h1>
      <div className="bg-white rounded-xl shadow">
        <table className="min-w-full">
          <thead>
            <tr className="border-b">
              <th className="px-6 py-3 text-left">ID</th>
              <th className="px-6 py-3 text-left">Title</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Lead</th>
            </tr>
          </thead>
          <tbody>
            {data?.items?.map((venture: any) => (
              <tr key={venture.id} className="border-b hover:bg-slate-50">
                <td className="px-6 py-4">
                  <Link to={`/ventures/${venture.id}`} className="text-brand-600 hover:underline">
                    {venture.id}
                  </Link>
                </td>
                <td className="px-6 py-4">{venture.title}</td>
                <td className="px-6 py-4">{venture.status}</td>
                <td className="px-6 py-4">{venture.lead}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## Step 11: Run Development Server

```bash
npm run dev
```

Open http://localhost:5173

## Step 12: Build for Production

```bash
npm run build
```

Output in `dist/` directory.

## Next Steps

1. Implement remaining entity pages (ideas, experiments, kpis, etc.)
2. Add filtering, sorting, pagination to list views
3. Create forms for entity creation/editing
4. Add charts for KPI visualization
5. Implement portfolio dashboard with aggregates
6. Add tests (Vitest + Playwright)
7. Deploy to Cloud Run or Cloud Storage

## Troubleshooting

### CORS Issues

If you get CORS errors, ensure API Edge has CORS enabled:

```typescript
// In api-edge/src/index.ts
app.use(cors({
  origin: ['http://localhost:5173', 'https://your-domain.com'],
  credentials: true,
}));
```

### Firebase Auth Errors

Ensure Firebase project is configured:
- Identity Platform enabled
- Email/password auth enabled
- Custom claims set for roles

### API Connection Issues

Check:
- API is running at http://localhost:8085
- Environment variables are correct
- Network tab shows requests being made
- Auth token is being sent in headers

## Resources

- [Vite Documentation](https://vitejs.dev)
- [React Router](https://reactrouter.com)
- [TanStack Query](https://tanstack.com/query)
- [shadcn/ui](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com)
- [Firebase Auth](https://firebase.google.com/docs/auth)
