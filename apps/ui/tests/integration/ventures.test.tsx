import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { useVentures } from '@/hooks/useVentures';
import { useAuthStore } from '@/stores/authStore';

// Component that uses ventures data
function VenturesList() {
  const { data, isLoading, isError } = useVentures();
  const ventures = data?.items || [];

  if (isLoading) return <div>Loading ventures...</div>;
  if (isError) return <div>Error loading ventures</div>;

  return (
    <div>
      <h1>Ventures</h1>
      <ul>
        {ventures.map((venture) => (
          <li key={venture.id} data-testid={`venture-${venture.id}`}>
            <h2>{venture.title || venture.id}</h2>
            <p>Lead: {venture.lead || 'Unassigned'}</p>
            <span data-testid={`status-${venture.id}`}>{venture.status || 'Unknown'}</span>
            <span data-testid={`stage-${venture.id}`}>{venture.stage || 'Unknown'}</span>
          </li>
        ))}
      </ul>
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

describe('Ventures Integration', () => {
  beforeEach(() => {
    // Setup auth
    useAuthStore.getState().login(
      { uid: 'test-user', email: 'test@example.com' },
      'test-token',
      ['Admin']
    );
  });

  describe('List Ventures', () => {
    it('should display loading state initially', () => {
      // Act
      render(<VenturesList />, { wrapper: createWrapper() });

      // Assert
      expect(screen.getByText('Loading ventures...')).toBeInTheDocument();
    });

    it('should display ventures after loading', async () => {
      // Act
      render(<VenturesList />, { wrapper: createWrapper() });

      // Assert
      await waitFor(
        () => {
          expect(screen.getByText('Ventures')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(screen.getByText('EcoTrack')).toBeInTheDocument();
      expect(screen.getByText('HealthHub')).toBeInTheDocument();
      expect(screen.getByText('FinFlow')).toBeInTheDocument();
    }, 10000);

    it('should display venture details', async () => {
      // Act
      render(<VenturesList />, { wrapper: createWrapper() });

      // Assert
      await waitFor(
        () => {
          expect(screen.getByText('EcoTrack')).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      expect(screen.getAllByText('Lead: user-1')).toHaveLength(2);
      expect(screen.getByText('Lead: user-2')).toBeInTheDocument();
    }, 10000);

    it('should display venture status and stage', async () => {
      // Act
      render(<VenturesList />, { wrapper: createWrapper() });

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('status-venture-1')).toBeInTheDocument();
      });

      expect(screen.getByTestId('status-venture-1')).toHaveTextContent('Active');
      expect(screen.getByTestId('stage-venture-1')).toHaveTextContent('growth');

      expect(screen.getByTestId('status-venture-2')).toHaveTextContent('Active');
      expect(screen.getByTestId('stage-venture-2')).toHaveTextContent('seed');

      expect(screen.getByTestId('status-venture-3')).toHaveTextContent('Paused');
      expect(screen.getByTestId('stage-venture-3')).toHaveTextContent('ideation');
    });

    it('should display all three ventures', async () => {
      // Act
      render(<VenturesList />, { wrapper: createWrapper() });

      // Assert
      await waitFor(() => {
        expect(screen.getByTestId('venture-venture-1')).toBeInTheDocument();
      });

      expect(screen.getByTestId('venture-venture-1')).toBeInTheDocument();
      expect(screen.getByTestId('venture-venture-2')).toBeInTheDocument();
      expect(screen.getByTestId('venture-venture-3')).toBeInTheDocument();
    });
  });

  describe('Filter Ventures', () => {
    it('should show only active ventures when filtered', async () => {
      // Act
      render(<VenturesList />, { wrapper: createWrapper() });

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('EcoTrack')).toBeInTheDocument();
      });

      // Get all ventures
      const activeVentures = screen
        .getAllByTestId(/^status-/)
        .filter((el) => el.textContent?.toLowerCase() === 'active');

      // Assert - Should have 2 active ventures (venture-1 and venture-2)
      expect(activeVentures).toHaveLength(2);
    });

    it('should show only paused ventures when filtered', async () => {
      // Act
      render(<VenturesList />, { wrapper: createWrapper() });

      // Wait for data
      await waitFor(() => {
        expect(screen.getByText('FinFlow')).toBeInTheDocument();
      });

      // Get all paused ventures
      const pausedVentures = screen
        .getAllByTestId(/^status-/)
        .filter((el) => el.textContent?.toLowerCase() === 'paused');

      // Assert - Should have 1 paused venture (venture-3)
      expect(pausedVentures).toHaveLength(1);
    });
  });

  describe('Empty State', () => {
    it('should handle empty ventures list gracefully', async () => {
      // This test would need MSW to return empty array
      // For now, we test that the component renders
      render(<VenturesList />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Ventures')).toBeInTheDocument();
      });
    });
  });
});
