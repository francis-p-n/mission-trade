import { test, expect } from '@playwright/test';

test.describe('Admin Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock all Supabase REST API calls to return empty arrays or mock objects
    await page.route('**/rest/v1/sessions*', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ json: [{ id: 'mock-id', session_code: 'TEST', current_round: 0 }] });
      } else {
        await route.fulfill({ json: [{ id: 'mock-id', session_code: 'TEST', current_round: 0, status: 'lobby' }] });
      }
    });
    await page.route('**/rest/v1/paths*', async route => {
      await route.fulfill({ json: [] });
    });
    await page.route('**/rest/v1/players*', async route => {
      await route.fulfill({ json: [] });
    });
    await page.route('**/rest/v1/events*', async route => {
      await route.fulfill({ json: [] });
    });
    await page.route('**/rest/v1/rounds*', async route => {
      await route.fulfill({ json: [] });
    });
  });

  test('should navigate to admin and create a new session', async ({ page }) => {
    await page.goto('/');

    // Wait for the button to be visible and click it
    const createButton = page.getByRole('button', { name: /Create New Session/i });
    await expect(createButton).toBeVisible();
    await createButton.click();

    // After creating a session, it should navigate to the admin session dashboard
    await page.waitForURL(/\/admin\/[A-Z0-9]{4}/);

    // Login to the admin dashboard
    const passwordInput = page.getByPlaceholder(/Admin password/i);
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('mission2024');
    await page.getByRole('button', { name: /Login/i }).click();

    // Verify the dashboard loads by checking for common admin elements
    await expect(page.getByText('Session:')).toBeVisible();
    await expect(page.getByRole('button', { name: /Show Intro Screen/i })).toBeVisible();
  });
});
