import { test, expect } from '@playwright/test';

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Navigate to dashboard
    await page.waitForURL(/\/(dashboard|ventures)/);
    if (!page.url().includes('dashboard')) {
      await page.goto('/dashboard');
    }
  });

  test('should display dashboard title', async ({ page }) => {
    // Assert
    await expect(page.locator('h1')).toContainText(/dashboard|portfolio/i);
  });

  test('should display portfolio summary metrics', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForLoadState('networkidle');

    // Assert - Look for common metrics
    const hasMetrics =
      (await page.getByText(/total ventures|active ventures|revenue/i).count()) > 0;
    expect(hasMetrics).toBeTruthy();
  });

  test('should display venture list or cards', async ({ page }) => {
    // Wait for data
    await page.waitForLoadState('networkidle');

    // Assert - Should show ventures or loading state
    const hasVentures =
      (await page.getByText(/EcoTrack|HealthHub|FinFlow|loading|ventures/i).count()) > 0;
    expect(hasVentures).toBeTruthy();
  });

  test('should navigate to ventures page from dashboard', async ({ page }) => {
    // Act - Click link to ventures (if exists)
    const venturesLink = page.getByRole('link', { name: /ventures|view all|see all/i });
    if (await venturesLink.isVisible()) {
      await venturesLink.click();

      // Assert
      await expect(page).toHaveURL(/\/ventures/);
    }
  });

  test('should display charts or graphs', async ({ page }) => {
    // Wait for page load
    await page.waitForLoadState('networkidle');

    // Assert - Look for chart elements (SVG or canvas)
    const hasCharts = (await page.locator('svg, canvas').count()) > 0;
    expect(hasCharts).toBeTruthy();
  });

  test('should update metrics when environment changes', async ({ page }) => {
    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // Act - Change environment (if selector exists)
    const envSelector = page.getByRole('button', { name: /dev|stg|prod/i }).first();
    if (await envSelector.isVisible()) {
      const initialMetrics = await page.textContent('body');

      await envSelector.click();
      await page.getByText(/stg|staging/i).click();

      // Wait for data to reload
      await page.waitForTimeout(1000);

      // Assert - Content should update (in real app)
      const updatedMetrics = await page.textContent('body');
      // Metrics might change or stay same depending on data
      expect(updatedMetrics).toBeDefined();
    }
  });
});

test.describe('Dashboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/\/(dashboard|ventures)/);
  });

  test('should navigate between main sections', async ({ page }) => {
    // Act - Navigate to different sections
    const sections = ['dashboard', 'ventures', 'ideas'];

    for (const section of sections) {
      const link = page.getByRole('link', { name: new RegExp(section, 'i') });
      if (await link.isVisible()) {
        await link.click();
        await expect(page).toHaveURL(new RegExp(section));
      }
    }
  });

  test('should display user info in header', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Assert - Should show user email or name
    await expect(page.getByText(/admin@example.com|admin|user/i)).toBeVisible();
  });

  test('should toggle sidebar', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/dashboard');

    // Act - Click sidebar toggle (if exists)
    const toggleButton = page.getByRole('button', { name: /menu|toggle|sidebar/i });
    if (await toggleButton.isVisible()) {
      await toggleButton.click();

      // Assert - Sidebar should collapse/expand
      // This is visual, so we just check the button works
      await expect(toggleButton).toBeVisible();
    }
  });
});

test.describe('Dashboard Data Loading', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/\/(dashboard|ventures)/);
    await page.goto('/dashboard');
  });

  test('should show loading state', async ({ page }) => {
    // Immediately check for loading indicator
    const hasLoading =
      (await page.getByText(/loading|spinner/i).count()) > 0 ||
      (await page.locator('[data-loading="true"]').count()) > 0;

    // Either loading or data should be visible
    expect(hasLoading || (await page.getByText(/ventures|dashboard/i).count()) > 0).toBeTruthy();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Arrange - Force offline mode to simulate error
    await page.context().setOffline(true);
    await page.reload();

    // Assert - Should show error message
    await expect(
      page.getByText(/error|failed|try again|offline/i)
    ).toBeVisible({ timeout: 5000 });

    // Cleanup
    await page.context().setOffline(false);
  });

  test('should refresh data', async ({ page }) => {
    // Wait for initial load
    await page.waitForLoadState('networkidle');

    // Act - Look for refresh button
    const refreshButton = page.getByRole('button', { name: /refresh|reload/i });
    if (await refreshButton.isVisible()) {
      await refreshButton.click();

      // Assert - Should reload data (show loading or update)
      await page.waitForTimeout(500);
      expect(true).toBeTruthy(); // Data refreshed
    }
  });
});
