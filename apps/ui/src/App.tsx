import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/stores/authStore';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/routes/login';
import { DashboardPage } from '@/routes/Dashboard';
import { VenturesListPage } from '@/routes/ventures';
import { VentureDetailPage } from '@/routes/ventures/[id]';
import { IdeasListPage } from '@/routes/ideas';
import { IdeaDetailPage } from '@/routes/ideas/[id]';
import { NewIdeaPage } from '@/routes/ideas/new';
import { KPIsPage } from '@/routes/kpis';
import { ResourcesListPage } from '@/routes/resources';
import { ResourceDetailPage } from '@/routes/resources/[id]';
import { BudgetsListPage } from '@/routes/budgets';
import { BudgetDetailPage } from '@/routes/budgets/[id]';
import { useEffect } from 'react';
import { PlaybooksListPage } from '@/routes/playbooks';
import { PlaybookDetailPage } from '@/routes/playbooks/[id]';
import { NewPlaybookPage } from '@/routes/playbooks/new';
import { EditPlaybookPage } from '@/routes/playbooks/edit';
import { useUIStore } from '@/stores/uiStore';
import { InvestorsPage } from '@/routes/investors';
import { FundraisingPipelinePage } from '@/routes/fundraising';
import { InvestorReportsPage } from '@/routes/investor-reports';
import { DataRoomsPage } from '@/routes/datarooms';
import { VentureShowPagePublic } from '@/routes/ventures/show/[id]';
import { ExperimentsPage } from '@/routes/experiments';
import { LandingPage } from '@/routes/landing';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (isAuthenticated) {
    return <>{children}</>;
  }

  if (location.pathname === '/' || location.pathname === '') {
    return <LandingPage />;
  }

  return <Navigate to="/login" replace state={{ from: location }} />;
}

function App() {
  const theme = useUIStore((state) => state.theme);

  // Apply theme on mount and when it changes
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/ventures/show/:id" element={<VentureShowPagePublic />} />

          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/ventures" element={<VenturesListPage />} />
            <Route path="/ventures/:id" element={<VentureDetailPage />} />

            {/* Ideas module */}
            <Route path="/ideas" element={<IdeasListPage />} />
            <Route path="/ideas/new" element={<NewIdeaPage />} />
            <Route path="/ideas/:id" element={<IdeaDetailPage />} />

            {/* KPIs module */}
            <Route path="/kpis" element={<KPIsPage />} />

            {/* Resources module (FR-13) */}
            <Route path="/resources" element={<ResourcesListPage />} />
            <Route path="/resources/:id" element={<ResourceDetailPage />} />

            {/* Budgets module (FR-15) */}
            <Route path="/budgets" element={<BudgetsListPage />} />
            <Route path="/budgets/:id" element={<BudgetDetailPage />} />

            {/* Investor & fundraising modules */}
            <Route path="/investors" element={<InvestorsPage />} />
            <Route path="/fundraising" element={<FundraisingPipelinePage />} />
            <Route path="/investor-reports" element={<InvestorReportsPage />} />
            <Route path="/datarooms" element={<DataRoomsPage />} />

            <Route path="/experiments" element={<ExperimentsPage />} />
            <Route path="/rounds" element={<PlaceholderPage title="Rounds" />} />
            <Route path="/cap-tables" element={<PlaceholderPage title="Cap Tables" />} />
            <Route path="/playbooks" element={<PlaybooksListPage />} />
            <Route path="/playbooks/new" element={<NewPlaybookPage />} />
            <Route path="/playbooks/:id" element={<PlaybookDetailPage />} />
            <Route path="/playbooks/:id/edit" element={<EditPlaybookPage />} />
            <Route path="/settings" element={<PlaceholderPage title="Settings" />} />

            {/* 404 */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

// Placeholder component for routes not yet implemented
function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
        {title}
      </h1>
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-12 text-center">
        <p className="text-slate-600 dark:text-slate-400">
          This page is coming soon.
        </p>
      </div>
    </div>
  );
}

export default App;
