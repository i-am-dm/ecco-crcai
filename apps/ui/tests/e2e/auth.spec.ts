import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should display login page', async ({ page }) => {
    // Assert
    await expect(page.locator('h1')).toContainText('Login');
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test('should show validation error for empty email', async ({ page }) => {
    // Act - Submit without email
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Assert - Should show validation error
    await expect(page.locator('text=/email.*required/i')).toBeVisible();
  });

  test('should show validation error for invalid email', async ({ page }) => {
    // Act
    await page.getByLabel(/email/i).fill('invalid-email');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Assert
    await expect(page.locator('text=/valid email/i')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    // Arrange - Fill in credentials
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('password123');

    // Act - Submit form
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Assert - Should redirect to dashboard
    await expect(page).toHaveURL(/\/(dashboard|ventures)/);
  });

  test('should persist authentication after page reload', async ({ page }) => {
    // Arrange - Login first
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Wait for redirect
    await page.waitForURL(/\/(dashboard|ventures)/);

    // Act - Reload page
    await page.reload();

    // Assert - Should still be logged in (not redirected to login)
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('should logout successfully', async ({ page }) => {
    // Arrange - Login first
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();
    await page.waitForURL(/\/(dashboard|ventures)/);

    // Act - Logout (find logout button in menu/header)
    await page.getByRole('button', { name: /logout|sign out/i }).click();

    // Assert - Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe('Protected Routes', () => {
  test('should redirect to login when accessing protected route without auth', async ({
    page,
  }) => {
    // Act - Try to access protected route
    await page.goto('/ventures');

    // Assert - Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });

  test('should allow access to protected routes when authenticated', async ({ page }) => {
    // Arrange - Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@example.com');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /sign in|login/i }).click();

    // Act - Navigate to protected route
    await page.goto('/ventures');

    // Assert - Should stay on ventures page
    await expect(page).toHaveURL(/\/ventures/);
  });
});
