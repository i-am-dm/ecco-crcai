import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  describe('rendering', () => {
    it('should render button with text', () => {
      // Act
      render(<Button>Click me</Button>);

      // Assert
      expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
    });

    it('should render button with default variant', () => {
      // Act
      render(<Button>Default</Button>);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('from-brand-600');
    });

    it('should render button with primary variant', () => {
      // Act
      render(<Button variant="primary">Primary</Button>);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('from-brand-600');
    });

    it('should render button with secondary variant', () => {
      // Act
      render(<Button variant="secondary">Secondary</Button>);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-slate-100');
    });

    it('should render button with outline variant', () => {
      // Act
      render(<Button variant="outline">Outline</Button>);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border');
    });

    it('should render button with danger variant', () => {
      // Act
      render(<Button variant="danger">Danger</Button>);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-500');
    });

    it('should render button with ghost variant', () => {
      // Act
      render(<Button variant="ghost">Ghost</Button>);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('hover:bg-slate-100');
    });
  });

  describe('sizes', () => {
    it('should render button with default size', () => {
      // Act
      render(<Button>Default Size</Button>);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
    });

    it('should render button with small size', () => {
      // Act
      render(<Button size="sm">Small</Button>);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8');
    });

    it('should render button with medium size', () => {
      // Act
      render(<Button size="md">Medium</Button>);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10');
    });

    it('should render button with large size', () => {
      // Act
      render(<Button size="lg">Large</Button>);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12');
    });

    it('should render button with icon size', () => {
      // Act
      render(<Button size="icon">+</Button>);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'w-10');
    });
  });

  describe('interaction', () => {
    it('should call onClick when clicked', async () => {
      // Arrange
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);

      // Act
      await user.click(screen.getByRole('button'));

      // Assert
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not call onClick when disabled', async () => {
      // Arrange
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} disabled>
          Disabled
        </Button>
      );

      // Act
      await user.click(screen.getByRole('button'));

      // Assert
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should be disabled when disabled prop is true', () => {
      // Act
      render(<Button disabled>Disabled</Button>);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('custom props', () => {
    it('should apply custom className', () => {
      // Act
      render(<Button className="custom-class">Custom</Button>);

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });

    it('should forward HTML button attributes', () => {
      // Act
      render(
        <Button type="submit" name="submit-btn">
          Submit
        </Button>
      );

      // Assert
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
      expect(button).toHaveAttribute('name', 'submit-btn');
    });

    it('should support ref forwarding', () => {
      // Arrange
      const ref = { current: null } as React.RefObject<HTMLButtonElement>;

      // Act
      render(<Button ref={ref}>With Ref</Button>);

      // Assert
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });
  });
});
