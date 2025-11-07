import { describe, it, expect } from 'vitest';
import { cn, formatDate, formatCurrency, formatNumber } from '@/lib/utils';

describe('utils', () => {
  describe('cn', () => {
    it('should merge class names', () => {
      // Act
      const result = cn('class1', 'class2');

      // Assert
      expect(result).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      // Act
      const result = cn('base', true && 'conditional', false && 'excluded');

      // Assert
      expect(result).toBe('base conditional');
    });

    it('should merge Tailwind classes correctly', () => {
      // Act - Later p-4 should override p-2
      const result = cn('p-2 text-red-500', 'p-4 text-blue-500');

      // Assert - twMerge should handle Tailwind conflicts
      expect(result).toContain('p-4');
      expect(result).toContain('text-blue-500');
    });

    it('should handle empty inputs', () => {
      // Act
      const result = cn();

      // Assert
      expect(result).toBe('');
    });

    it('should handle arrays of classes', () => {
      // Act
      const result = cn(['class1', 'class2'], 'class3');

      // Assert
      expect(result).toBe('class1 class2 class3');
    });
  });

  describe('formatDate', () => {
    it('should format valid date string', () => {
      // Arrange
      const dateStr = '2024-01-15T10:30:00Z';

      // Act
      const result = formatDate(dateStr);

      // Assert
      expect(result).toBe('Jan 15, 2024');
    });

    it('should format Date object', () => {
      // Arrange
      const date = new Date('2024-06-20T00:00:00Z');

      // Act
      const result = formatDate(date);

      // Assert
      expect(result).toContain('2024');
      expect(result).toContain('Jun');
    });

    it('should return N/A for undefined', () => {
      // Act
      const result = formatDate(undefined);

      // Assert
      expect(result).toBe('N/A');
    });

    it('should return N/A for empty string', () => {
      // Act
      const result = formatDate('');

      // Assert
      expect(result).toBe('N/A');
    });
  });

  describe('formatCurrency', () => {
    it('should format positive amounts', () => {
      // Act
      const result = formatCurrency(1234567);

      // Assert
      expect(result).toBe('$1,234,567');
    });

    it('should format zero', () => {
      // Act
      const result = formatCurrency(0);

      // Assert
      expect(result).toBe('$0');
    });

    it('should format negative amounts', () => {
      // Act
      const result = formatCurrency(-5000);

      // Assert
      expect(result).toBe('-$5,000');
    });

    it('should return N/A for undefined', () => {
      // Act
      const result = formatCurrency(undefined);

      // Assert
      expect(result).toBe('N/A');
    });

    it('should return N/A for null', () => {
      // Act
      const result = formatCurrency(null as any);

      // Assert
      expect(result).toBe('N/A');
    });

    it('should format without decimal places', () => {
      // Act
      const result = formatCurrency(1234.56);

      // Assert
      expect(result).toBe('$1,235'); // Should round
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      // Act
      const result = formatNumber(1234567);

      // Assert
      expect(result).toBe('1,234,567');
    });

    it('should format zero', () => {
      // Act
      const result = formatNumber(0);

      // Assert
      expect(result).toBe('0');
    });

    it('should format negative numbers', () => {
      // Act
      const result = formatNumber(-9876);

      // Assert
      expect(result).toBe('-9,876');
    });

    it('should format decimal numbers', () => {
      // Act
      const result = formatNumber(1234.567);

      // Assert
      expect(result).toBe('1,234.567');
    });

    it('should return N/A for undefined', () => {
      // Act
      const result = formatNumber(undefined);

      // Assert
      expect(result).toBe('N/A');
    });

    it('should return N/A for null', () => {
      // Act
      const result = formatNumber(null as any);

      // Assert
      expect(result).toBe('N/A');
    });
  });
});
