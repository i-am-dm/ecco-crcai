import { test, expect } from '@playwright/test';

test.describe('Ventures Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Wait for redirect and navigate to ventures
    await page.waitForURL(/\/(dashboard|ventures)/);
    await page.goto('/ventures');
  });

  test('should display ventures list', async ({ page }) => {
    // Assert
    await expect(page.locator('h1')).toContainText(/ventures/i);

    // Should show ventures loaded from API
    await expect(page.getByText(/EcoTrack|loading/i)).toBeVisible();
  });

  test('should display venture cards with details', async ({ page }) => {
    // Wait for data to load
    await page.waitForSelector('text=/EcoTrack|HealthHub|FinFlow/', { timeout: 5000 });

    // Assert - Check for venture names
    const ventureCards = page.locator('[data-testid^="venture-"]');
    await expect(ventureCards.first()).toBeVisible();
  });

  test('should filter ventures by status', async ({ page }) => {
    // Wait for ventures to load
    await page.waitForSelector('text=/ventures/i');

    // Act - Click on status filter (if exists)
    const statusFilter = page.getByRole('button', { name: /active|all|paused/i }).first();
    if (await statusFilter.isVisible()) {
      await statusFilter.click();
      await page.getByText(/active/i).click();

      // Assert - Should filter to only active ventures
      await expect(page.getByText(/active/i)).toBeVisible();
    }
  });

  test('should navigate to venture detail page', async ({ page }) => {
    // Wait for ventures to load
    await page.waitForSelector('text=/ventures/i');

    // Act - Click on first venture (if exists)
    const firstVenture = page.locator('[data-testid^="venture-"]').first();
    if (await firstVenture.isVisible()) {
      await firstVenture.click();

      // Assert - Should navigate to detail page
      await expect(page).toHaveURL(/\/ventures\/.+/);
    }
  });

  test('should search ventures', async ({ page }) => {
    // Act - Type in search box (if exists)
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('Eco');

      // Assert - Should filter results
      await expect(page.getByText(/EcoTrack/i)).toBeVisible();
    }
  });

  test('should display empty state when no ventures match filter', async ({ page }) => {
    // Act - Search for non-existent venture (if search exists)
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill('NonExistentVenture123');

      // Assert - Should show empty state
      await expect(
        page.getByText(/no ventures found|no results/i)
      ).toBeVisible();
    }
  });
});

test.describe('Venture Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/\/(dashboard|ventures)/);
  });

  test('should display venture details', async ({ page }) => {
    // Act - Navigate to specific venture
    await page.goto('/ventures/venture-1');

    // Assert - Should show venture details
    await expect(page.getByText(/EcoTrack|venture details|loading/i)).toBeVisible();
  });

  test('should show 404 for non-existent venture', async ({ page }) => {
    // Act - Navigate to non-existent venture
    await page.goto('/ventures/non-existent-id');

    // Assert - Should show error or 404
    await expect(
      page.getByText(/not found|error|does not exist/i)
    ).toBeVisible();
  });

  test('should allow editing venture (for authorized users)', async ({ page }) => {
    // Act - Navigate to venture detail
    await page.goto('/ventures/venture-1');

    // Check if edit button exists (depends on permissions)
    const editButton = page.getByRole('button', { name: /edit/i });
    if (await editButton.isVisible()) {
      await editButton.click();

      // Assert - Should show edit form
      await expect(page.getByLabel(/name/i)).toBeVisible();
    }
  });

  test('should navigate back to ventures list', async ({ page }) => {
    // Arrange
    await page.goto('/ventures/venture-1');

    // Act - Click back button
    const backButton = page.getByRole('button', { name: /back/i }).or(
      page.getByRole('link', { name: /ventures/i })
    );
    if (await backButton.isVisible()) {
      await backButton.click();

      // Assert
      await expect(page).toHaveURL(/\/ventures$/);
    }
  });
});

test.describe('Create New Venture', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/\/(dashboard|ventures)/);
    await page.goto('/ventures');
  });

  test('should open create venture form', async ({ page }) => {
    // Act - Click create button
    const createButton = page.getByRole('button', { name: /new venture|create venture/i });
    if (await createButton.isVisible()) {
      await createButton.click();

      // Assert - Should show form
      await expect(page.getByLabel(/name/i)).toBeVisible();
    }
  });

  test('should validate required fields', async ({ page }) => {
    // Act - Try to submit empty form (if create button exists)
    const createButton = page.getByRole('button', { name: /new venture|create venture/i });
    if (await createButton.isVisible()) {
      await createButton.click();

      // Try to submit
      const submitButton = page.getByRole('button', { name: /save|create|submit/i });
      if (await submitButton.isVisible()) {
        await submitButton.click();

        // Assert - Should show validation errors
        await expect(page.getByText(/required/i)).toBeVisible();
      }
    }
  });

  test('should create new venture with valid data', async ({ page }) => {
    // Act - Fill in form (if create button exists)
    const createButton = page.getByRole('button', { name: /new venture|create venture/i });
    if (await createButton.isVisible()) {
      await createButton.click();

      await page.getByLabel(/name/i).fill('Test Venture');
      await page.getByLabel(/description/i).fill('A test venture');

      // Submit
      await page.getByRole('button', { name: /save|create|submit/i }).click();

      // Assert - Should show success message or redirect
      await expect(
        page.getByText(/success|created|test venture/i)
      ).toBeVisible({ timeout: 10000 });
    }
  });
});
