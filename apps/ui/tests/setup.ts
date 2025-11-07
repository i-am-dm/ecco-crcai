import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll, vi } from 'vitest';
import { server } from './mocks/server';

// Establish API mocking before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests
afterEach(() => {
  server.resetHandlers();
  cleanup();
  // Clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
});

// Clean up after the tests are finished
afterAll(() => {
  server.close();
});

const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));

if (typeof window !== "undefined") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: matchMediaMock,
  });
} else {
  (globalThis as any).matchMedia = matchMediaMock;
}

class MockIntersectionObserver {
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
}

(globalThis as any).IntersectionObserver = MockIntersectionObserver;
