import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '@/components/ui/badge';

describe('Badge', () => {
  describe('rendering', () => {
    it('should render badge with text', () => {
      // Act
      render(<Badge>Active</Badge>);

      // Assert
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should render badge with default variant', () => {
      // Act
      render(<Badge>Default</Badge>);

      // Assert
      const badge = screen.getByText('Default');
      expect(badge).toHaveClass('bg-slate-100');
    });

    it('should render badge with primary variant', () => {
      // Act
      render(<Badge variant="primary">Primary</Badge>);

      // Assert
      const badge = screen.getByText('Primary');
      expect(badge).toHaveClass('bg-brand-50');
    });

    it('should render badge with secondary variant', () => {
      // Act
      render(<Badge variant="secondary">Secondary</Badge>);

      // Assert
      const badge = screen.getByText('Secondary');
      expect(badge).toHaveClass('bg-slate-100');
    });

    it('should render badge with success variant', () => {
      // Act
      render(<Badge variant="success">Success</Badge>);

      // Assert
      const badge = screen.getByText('Success');
      expect(badge).toHaveClass('bg-accent-50');
    });

    it('should render badge with warning variant', () => {
      // Act
      render(<Badge variant="warning">Warning</Badge>);

      // Assert
      const badge = screen.getByText('Warning');
      expect(badge).toHaveClass('bg-amber-50');
    });

    it('should render badge with danger variant', () => {
      // Act
      render(<Badge variant="danger">Danger</Badge>);

      // Assert
      const badge = screen.getByText('Danger');
      expect(badge).toHaveClass('bg-red-50');
    });

    it('should render badge with outline variant', () => {
      // Act
      render(<Badge variant="outline">Outline</Badge>);

      // Assert
      const badge = screen.getByText('Outline');
      expect(badge).toHaveClass('border');
    });
  });

  describe('custom props', () => {
    it('should apply custom className', () => {
      // Act
      render(<Badge className="custom-badge">Custom</Badge>);

      // Assert
      const badge = screen.getByText('Custom');
      expect(badge).toHaveClass('custom-badge');
    });

    it('should forward HTML div attributes', () => {
      // Act
      render(
        <Badge data-testid="test-badge" aria-label="Status badge">
          Test
        </Badge>
      );

      // Assert
      const badge = screen.getByTestId('test-badge');
      expect(badge).toHaveAttribute('aria-label', 'Status badge');
    });

    it('should render children correctly', () => {
      // Act
      render(
        <Badge>
          <span>Status:</span> Active
        </Badge>
      );

      // Assert
      expect(screen.getByText('Status:')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have base classes', () => {
      // Act
      render(<Badge>Base</Badge>);

      // Assert
      const badge = screen.getByText('Base');
      expect(badge).toHaveClass('inline-flex', 'items-center', 'rounded-md', 'text-xs');
    });

    it('should combine variant and custom classes', () => {
      // Act
      render(
        <Badge variant="success" className="ml-2">
          Combined
        </Badge>
      );

      // Assert
      const badge = screen.getByText('Combined');
      expect(badge).toHaveClass('bg-accent-50', 'ml-2');
    });
  });
});
