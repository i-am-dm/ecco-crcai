import { NavLink } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { useAuth } from '@/hooks/useAuth';
import {
  Home,
  Lightbulb,
  Briefcase,
  FlaskConical,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  BookOpen,
  BarChart3,
  Settings,
  Handshake,
  Coins,
  FileText,
  FolderLock,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRole?: string[];
}

const mainNavItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: Home },
  { label: 'Ideas', path: '/ideas', icon: Lightbulb },
  { label: 'Ventures', path: '/ventures', icon: Briefcase },
  { label: 'Experiments', path: '/experiments', icon: FlaskConical },
];

const operationsNavItems: NavItem[] = [
  { label: 'Resources', path: '/resources', icon: Users },
  { label: 'Budgets', path: '/budgets', icon: DollarSign, requiredRole: ['Admin', 'Leadership', 'Lead'] },
  { label: 'KPIs', path: '/kpis', icon: TrendingUp },
];

const financeNavItems: NavItem[] = [
  { label: 'Investors', path: '/investors', icon: Handshake },
  { label: 'Fundraising', path: '/fundraising', icon: Coins, requiredRole: ['Admin', 'Leadership', 'Lead'] },
  { label: 'Investor Reports', path: '/investor-reports', icon: FileText },
  { label: 'Data Rooms', path: '/datarooms', icon: FolderLock, requiredRole: ['Admin', 'Leadership'] },
  { label: 'Rounds', path: '/rounds', icon: Target, requiredRole: ['Admin', 'Leadership'] },
  { label: 'Cap Tables', path: '/cap-tables', icon: BarChart3, requiredRole: ['Admin', 'Leadership'] },
];

const systemNavItems: NavItem[] = [
  { label: 'Playbooks', path: '/playbooks', icon: BookOpen },
  { label: 'Settings', path: '/settings', icon: Settings, requiredRole: ['Admin'] },
];

export function Sidebar() {
  const { sidebarCollapsed } = useUIStore();
  const { hasRole } = useAuth();

  const filterByRole = (items: NavItem[]) => {
    return items.filter(item => {
      if (!item.requiredRole) return true;
      return item.requiredRole.some(role => hasRole(role));
    });
  };

  const renderNavSection = (title: string, items: NavItem[]) => {
    const filteredItems = filterByRole(items);
    if (filteredItems.length === 0) return null;

    return (
      <div className="mb-6">
        {!sidebarCollapsed && (
          <h3 className="px-4 mb-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            {title}
          </h3>
        )}
        <nav className="space-y-1">
          {filteredItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors',
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800',
                  sidebarCollapsed && 'justify-center'
                )
              }
              title={sidebarCollapsed ? item.label : undefined}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>
      </div>
    );
  };

  return (
    <aside
      className={cn(
        'bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 transition-all duration-300',
        sidebarCollapsed ? 'w-20' : 'w-72'
      )}
    >
      <div className="p-6">
        {!sidebarCollapsed && (
          <h2 className="text-lg font-bold bg-gradient-to-r from-brand-600 to-accent-600 bg-clip-text text-transparent">
            CityReach Innovation Labs
          </h2>
        )}
      </div>

      <div className="px-4 pb-4">
        {renderNavSection('Main', mainNavItems)}
        {renderNavSection('Operations', operationsNavItems)}
        {renderNavSection('Finance', financeNavItems)}
        {renderNavSection('System', systemNavItems)}
      </div>
    </aside>
  );
}
