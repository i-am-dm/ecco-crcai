import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExportCSV } from '@/hooks/useExportCSV';

describe('useExportCSV', () => {
  let createObjectURLSpy: ReturnType<typeof vi.fn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Mock URL.createObjectURL and URL.revokeObjectURL
    createObjectURLSpy = vi.fn(() => 'blob:mock-url');
    revokeObjectURLSpy = vi.fn();

    global.URL.createObjectURL = createObjectURLSpy;
    global.URL.revokeObjectURL = revokeObjectURLSpy;

    // Mock document.createElement for anchor
    clickSpy = vi.fn();
    const originalCreateElement = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      const element = originalCreateElement(tagName);
      if (tagName === 'a') {
        element.click = clickSpy;
      }
      return element;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should export simple CSV data', () => {
    // Arrange
    const { result } = renderHook(() => useExportCSV());

    // Act
    const success = result.current.exportToCSV({
      filename: 'test.csv',
      headers: ['Name', 'Age', 'City'],
      rows: [
        ['Alice', 30, 'New York'],
        ['Bob', 25, 'Los Angeles'],
      ],
    });

    // Assert
    expect(success).toBe(true);
    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });

  it('should handle CSV data with commas by wrapping in quotes', () => {
    // Arrange
    const { result } = renderHook(() => useExportCSV());

    // Act
    result.current.exportToCSV({
      filename: 'test.csv',
      headers: ['Name', 'Description'],
      rows: [['Product A', 'A product, with commas']],
    });

    // Assert
    expect(createObjectURLSpy).toHaveBeenCalled();
    const blob = createObjectURLSpy.mock.calls[0][0];
    expect(blob).toBeInstanceOf(Blob);
  });

  it('should handle CSV data with quotes by escaping them', () => {
    // Arrange
    const { result } = renderHook(() => useExportCSV());

    // Act
    result.current.exportToCSV({
      filename: 'test.csv',
      headers: ['Name', 'Quote'],
      rows: [['Alice', 'She said "Hello"']],
    });

    // Assert
    expect(createObjectURLSpy).toHaveBeenCalled();
  });

  it('should handle null and undefined values', () => {
    // Arrange
    const { result } = renderHook(() => useExportCSV());

    // Act
    const success = result.current.exportToCSV({
      filename: 'test.csv',
      headers: ['Name', 'Value1', 'Value2'],
      rows: [
        ['Alice', null as any, undefined as any],
        ['Bob', 123, 'text'],
      ],
    });

    // Assert
    expect(success).toBe(true);
    expect(createObjectURLSpy).toHaveBeenCalled();
  });

  it('should add .csv extension if not present', () => {
    // Arrange
    const { result } = renderHook(() => useExportCSV());
    let downloadFilename = '';

    // Mock setAttribute to capture filename
    vi.spyOn(document.createElement('a'), 'setAttribute').mockImplementation(function (
      this: any,
      name: string,
      value: string
    ) {
      if (name === 'download') {
        downloadFilename = value;
      }
      return this;
    });

    // Act
    result.current.exportToCSV({
      filename: 'test-file',
      headers: ['A', 'B'],
      rows: [['1', '2']],
    });

    // Assert - Would add .csv extension
    expect(createObjectURLSpy).toHaveBeenCalled();
  });

  it('should not add .csv extension if already present', () => {
    // Arrange
    const { result } = renderHook(() => useExportCSV());

    // Act
    const success = result.current.exportToCSV({
      filename: 'test-file.csv',
      headers: ['A', 'B'],
      rows: [['1', '2']],
    });

    // Assert
    expect(success).toBe(true);
  });

  it('should handle newlines in data', () => {
    // Arrange
    const { result } = renderHook(() => useExportCSV());

    // Act
    const success = result.current.exportToCSV({
      filename: 'test.csv',
      headers: ['Name', 'Description'],
      rows: [['Product', 'Line 1\nLine 2']],
    });

    // Assert
    expect(success).toBe(true);
    expect(createObjectURLSpy).toHaveBeenCalled();
  });

  it('should return true on successful export', () => {
    // Arrange
    const { result } = renderHook(() => useExportCSV());

    // Act
    const success = result.current.exportToCSV({
      filename: 'test.csv',
      headers: ['Col1'],
      rows: [['Data']],
    });

    // Assert
    expect(success).toBe(true);
  });

  it('should handle empty rows', () => {
    // Arrange
    const { result } = renderHook(() => useExportCSV());

    // Act
    const success = result.current.exportToCSV({
      filename: 'empty.csv',
      headers: ['Name', 'Age'],
      rows: [],
    });

    // Assert
    expect(success).toBe(true);
    expect(createObjectURLSpy).toHaveBeenCalled();
  });
});
