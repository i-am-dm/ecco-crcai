# CityReach Innovation Labs UI - Testing Guide

## Overview

This document provides comprehensive information about the testing infrastructure for the CityReach Innovation Labs UI application.

## Test Stack

- **Unit Testing**: Vitest + @testing-library/react
- **E2E Testing**: Playwright
- **API Mocking**: MSW (Mock Service Worker)
- **Coverage**: @vitest/coverage-v8

## Directory Structure

```
ui-new/
├── tests/
│   ├── setup.ts                    # Global test setup
│   ├── mocks/
│   │   ├── handlers.ts             # MSW API handlers
│   │   └── server.ts               # MSW server setup
│   ├── unit/
│   │   ├── hooks/                  # Hook tests
│   │   │   ├── useAuth.test.ts
│   │   │   ├── useVentures.test.tsx
│   │   │   ├── useKPIMetrics.test.tsx
│   │   │   └── useExportCSV.test.ts
│   │   ├── lib/                    # Utility tests
│   │   │   ├── api.test.ts
│   │   │   └── utils.test.ts
│   │   ├── stores/                 # State management tests
│   │   │   ├── authStore.test.ts
│   │   │   └── uiStore.test.ts
│   │   └── components/             # Component tests
│   │       ├── Button.test.tsx
│   │       └── Badge.test.tsx
│   ├── integration/                # Integration tests
│   │   ├── ventures.test.tsx
│   │   └── dashboard.test.tsx
│   └── e2e/                        # End-to-end tests
│       ├── auth.spec.ts
│       ├── ventures.spec.ts
│       └── dashboard.spec.ts
├── vite.config.ts                  # Vitest configuration
├── playwright.config.ts            # Playwright configuration
└── package.json                    # Test scripts
```

## Test Commands

### Unit and Integration Tests (Vitest)

```bash
# Run tests in watch mode
npm test

# Run tests once
npm run test:run

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- tests/unit/hooks/useAuth.test.ts

# Run tests matching pattern
npm test -- --grep "authentication"
```

### End-to-End Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Run specific browser
npx playwright test --project=chromium
```

### Run All Tests

```bash
# Run both unit and E2E tests
npm run test:all
```

## Test Results Summary

### Current Status

**Unit Tests**: 113/126 passing (89.7%)

**Test Coverage**:
- Hooks: Comprehensive coverage for useAuth, useVentures, useKPIMetrics, useExportCSV
- Stores: Full coverage for authStore and uiStore
- Utilities: Complete coverage for formatting functions and class merging
- Components: Tests for Button and Badge components

**Passing Test Suites**:
1. ✅ useAuth (18 tests) - Authentication state, role checks, permissions
2. ✅ authStore (13 tests) - Login/logout, persistence, subscriptions
3. ✅ uiStore (14 tests) - Theme, environment, sidebar state
4. ✅ utils (21 tests) - formatDate, formatCurrency, formatNumber, cn
5. ✅ useExportCSV (11 tests) - CSV generation, edge cases
6. ✅ useKPIMetrics (6/7 tests) - KPI data fetching, metrics metadata
7. ✅ Button (18 tests) - Variants, sizes, interactions
8. ✅ Badge (13 tests) - Variants, styling, props

**Tests Requiring Attention**:
- useVentures tests (7 failing) - API integration timing issues
- api.test.ts (5 failing) - MSW handler configuration needs refinement
- Integration tests - Need actual UI components to be implemented

## Writing Tests

### Unit Test Example

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/authStore';

describe('useAuth', () => {
  beforeEach(() => {
    // Reset state before each test
    act(() => {
      useAuthStore.getState().logout();
    });
  });

  it('should return authenticated state when user is logged in', () => {
    // Arrange
    act(() => {
      useAuthStore.getState().login(
        { uid: 'user-1', email: 'test@example.com' },
        'mock-token',
        ['Admin']
      );
    });

    // Act
    const { result } = renderHook(() => useAuth());

    // Assert
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.email).toBe('test@example.com');
  });
});
```

### Component Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('should render button with text', () => {
    // Act
    render(<Button>Click me</Button>);

    // Assert
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('should login successfully', async ({ page }) => {
  // Arrange
  await page.goto('/login');

  // Act
  await page.getByLabel(/email/i).fill('admin@example.com');
  await page.getByLabel(/password/i).fill('password123');
  await page.getByRole('button', { name: /sign in/i }).click();

  // Assert
  await expect(page).toHaveURL(/\/(dashboard|ventures)/);
});
```

## MSW (Mock Service Worker)

### Mock Handlers

API mocks are defined in `/Users/dmeacham/code/ecco-crcai/ui-new/tests/mocks/handlers.ts`:

```typescript
export const handlers = [
  // List ventures
  http.get(`${baseUrl}/v1/venture`, () => {
    return HttpResponse.json(mockVentures);
  }),

  // Get single venture
  http.get(`${baseUrl}/v1/venture/:id`, ({ params }) => {
    const { id } = params;
    const venture = mockVentures.items.find((v) => v.id === id);
    return venture
      ? HttpResponse.json(venture)
      : new HttpResponse(null, { status: 404 });
  }),
];
```

### Adding New Mocks

1. Add mock data to `handlers.ts`
2. Create request handler using `http.get()`, `http.post()`, etc.
3. Return `HttpResponse.json()` with mock data

## Coverage Configuration

Coverage thresholds are set in `vite.config.ts`:

```typescript
coverage: {
  provider: 'v8',
  thresholds: {
    lines: 70,
    functions: 70,
    branches: 70,
    statements: 70,
  },
}
```

## Best Practices

### 1. Follow AAA Pattern
```typescript
it('should do something', () => {
  // Arrange - Set up test data
  const user = { id: '1', name: 'Test' };

  // Act - Perform action
  const result = doSomething(user);

  // Assert - Verify outcome
  expect(result).toBe('expected');
});
```

### 2. Use Descriptive Test Names
- ✅ `should allow Admin to edit everything`
- ❌ `test1`

### 3. Test Behavior, Not Implementation
- ✅ `should display error message when login fails`
- ❌ `should set error state to true`

### 4. Clean Up After Tests
```typescript
beforeEach(() => {
  // Reset stores
  useAuthStore.getState().logout();
});

afterEach(() => {
  // Clear mocks
  vi.clearAllMocks();
});
```

### 5. Use Testing Library Queries
Prefer queries in this order:
1. `getByRole` - Most accessible
2. `getByLabelText` - Form fields
3. `getByText` - Text content
4. `getByTestId` - Last resort

## Continuous Integration

### GitHub Actions (Recommended)

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:run
      - run: npm run test:e2e
```

## Debugging Tests

### Vitest Debugging

```bash
# Run single test file in debug mode
node --inspect-brk node_modules/.bin/vitest tests/unit/hooks/useAuth.test.ts
```

### Playwright Debugging

```bash
# Open Playwright Inspector
npm run test:e2e:debug

# Generate trace
npx playwright test --trace on
```

## Known Issues & Limitations

### Current Limitations

1. **Integration Tests**: Some integration tests timeout because they reference components that haven't been built yet. These will pass once the actual UI components are implemented.

2. **MSW Configuration**: A few API tests fail due to MSW handler configuration. These need minor adjustments to match the exact API response structure.

3. **E2E Tests**: E2E tests are written but will only work when the actual authentication and routing is implemented in the application.

### Improvements Needed

1. Add visual regression testing with Playwright
2. Implement test data factories for consistent test data
3. Add performance testing
4. Increase coverage to 85%+

## Next Steps

1. **Implement Missing UI Components**: Build the actual Dashboard, VenturesList, and other components referenced in integration tests
2. **Fix MSW Handlers**: Align mock API responses with actual API structure
3. **Add More Component Tests**: Test all UI components as they are built
4. **Set Up CI/CD**: Configure GitHub Actions for automated testing
5. **Add Accessibility Tests**: Use @testing-library/jest-dom for a11y assertions

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)

## Support

For questions or issues with tests, refer to:
- Test failure logs in the terminal
- Coverage reports in `/Users/dmeacham/code/ecco-crcai/ui-new/coverage/`
- Playwright reports in `/Users/dmeacham/code/ecco-crcai/ui-new/playwright-report/`
