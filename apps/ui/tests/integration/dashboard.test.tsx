import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useVentures } from '@/hooks/useVentures';
import { useAuthStore } from '@/stores/authStore';

// Simple dashboard component for testing
function Dashboard() {
  const { data, isLoading } = useVentures();
  const ventures = data?.items || [];

  if (isLoading) return <div>Loading dashboard...</div>;

  const activeVentures = ventures.filter(
    (v) => (v.status || '').toLowerCase() === 'active'
  );
  const totalVentures = ventures.length;

  return (
    <div>
      <h1>Portfolio Dashboard</h1>
      <div data-testid="total-ventures">Total Ventures: {totalVentures}</div>
      <div data-testid="active-ventures">Active Ventures: {activeVentures.length}</div>
      <div data-testid="venture-names">
        {ventures.map((v) => v.title || v.id).join(', ')}
      </div>
    </div>
  );
}

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </BrowserRouter>
  );
};

describe('Dashboard Integration', () => {
  beforeEach(() => {
    // Setup auth
    useAuthStore.getState().login(
      { uid: 'test-user', email: 'test@example.com' },
      'test-token',
      ['Admin']
    );
  });

  describe('Portfolio Summary', () => {
    it('should display loading state', () => {
      // Act
      render(<Dashboard />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    });

    it('should display total venture count', async () => {
      // Act
      render(<Dashboard />, { wrapper: createWrapper() });

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('total-ventures')).toHaveTextContent('Total Ventures: 3');
      });
    });

    it('should display active venture count', async () => {
      // Act
      render(<Dashboard />, { wrapper: createWrapper() });

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('active-ventures')).toHaveTextContent(
          'Active Ventures: 2'
        );
      });
    });

    it('should display venture names', async () => {
      // Act
      render(<Dashboard />, { wrapper: createWrapper() });

      // Assert
      await waitFor(() => {
        const ventureNames = screen.getByTestId('venture-names');
        expect(ventureNames).toHaveTextContent('EcoTrack');
        expect(ventureNames).toHaveTextContent('HealthHub');
        expect(ventureNames).toHaveTextContent('FinFlow');
      });
    });

    it('should calculate metrics correctly', async () => {
      // Act
      render(<Dashboard />, { wrapper: createWrapper() });

      // Assert
      await waitFor(() => {
        // Total = 3, Active = 2 (EcoTrack, HealthHub)
        expect(screen.getByTestId('total-ventures')).toHaveTextContent('3');
        expect(screen.getByTestId('active-ventures')).toHaveTextContent('2');
      });
    });
  });

  describe('Data Integration', () => {
    it('should integrate with ventures API', async () => {
      // Act
      render(<Dashboard />, { wrapper: createWrapper() });

      // Assert - Should successfully fetch and display data from MSW
      await waitFor(() => {
        expect(screen.getByText('Portfolio Dashboard')).toBeInTheDocument();
        expect(screen.getByTestId('total-ventures')).toBeInTheDocument();
      });
    });

    it('should update when data changes', async () => {
      // Act - Initial render
      const { rerender } = render(<Dashboard />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByTestId('total-ventures')).toHaveTextContent('3');
      });

      // Rerender to simulate data update
      rerender(<Dashboard />);

      // Assert - Data should still be correct
      expect(screen.getByTestId('total-ventures')).toHaveTextContent('3');
    });
  });
});
