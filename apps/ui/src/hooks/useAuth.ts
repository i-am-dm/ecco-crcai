import { useAuthStore } from '@/stores/authStore';

export function useAuth() {
  const { user, roles, isAuthenticated, logout } = useAuthStore();

  const hasRole = (role: string) => roles.includes(role);

  const canEdit = (_entity: string, ownerId?: string) => {
    // Admin can edit everything
    if (hasRole('Admin')) return true;

    // Leadership can edit most things
    if (hasRole('Leadership')) return true;

    // Lead can edit their own ventures
    if (hasRole('Lead') && ownerId === user?.uid) return true;

    // Contributor can edit their own items
    if (hasRole('Contributor') && ownerId === user?.uid) return true;

    return false;
  };

  const canView = (entity: string) => {
    // Everyone can view most entities
    if (['venture', 'idea', 'kpi', 'resource'].includes(entity)) {
      return true;
    }

    // Restricted entities
    if (['budget', 'cap_table'].includes(entity)) {
      return hasRole('Admin') || hasRole('Leadership') || hasRole('Lead');
    }

    // Investor-only entities
    if (entity === 'investor') {
      return hasRole('Admin') || hasRole('Leadership') || hasRole('Investor');
    }

    return false;
  };

  return {
    user,
    roles,
    isAuthenticated,
    logout,
    hasRole,
    canEdit,
    canView,
  };
}
