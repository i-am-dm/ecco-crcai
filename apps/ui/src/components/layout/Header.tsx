import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/stores/uiStore';
import { Moon, Sun, LogOut, Menu } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme, env, setEnv, toggleSidebar } = useUIStore();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-b border-slate-200 dark:border-slate-700">
      <div className="h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
            CityReach Innovation Labs
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Environment selector */}
          <select
            value={env}
            onChange={(e) => setEnv(e.target.value as 'dev' | 'stg' | 'prod')}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="dev">Dev</option>
            <option value="stg">Staging</option>
            <option value="prod">Production</option>
          </select>

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* User menu */}
          {user && (
            <div className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700">
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {user.email}
              </span>
              <button
                onClick={logout}
                className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-red-600 dark:text-red-400"
                aria-label="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
