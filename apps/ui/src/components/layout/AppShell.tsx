import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';

export function AppShell() {
  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  );
}
