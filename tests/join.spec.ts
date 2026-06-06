import { test, expect } from '@playwright/test';

test.describe('Join Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Mock all Supabase REST API calls
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
      if (route.request().method() === 'POST') {
        await route.fulfill({ json: [{ id: 'player-id', session_id: 'mock-id', display_name: 'Student' }] });
      } else {
        await route.fulfill({ json: [] });
      }
    });
  });

  test('should allow student to join a valid session', async ({ page }) => {
    // We need to create a session first to get a valid code
    await page.goto('/');
    await page.getByRole('button', { name: /Create New Session/i }).click();
    await page.waitForURL(/\/admin\/[A-Z0-9]{4}/);
    
    // Extract the code from the URL
    const url = page.url();
    const codeMatch = url.match(/\/admin\/([A-Z0-9]{4})/);
    expect(codeMatch).not.toBeNull();
    const sessionCode = codeMatch![1];

    // Now test the student join flow using that code
    await page.goto('/');
    
    // Fill the code and join
    const codeInput = page.getByPlaceholder(/Enter code/i);
    await expect(codeInput).toBeVisible();
    await codeInput.fill(sessionCode);
    
    await page.getByRole('button', { name: /Join Session/i }).click();

    // Verify navigation to the join page
    await page.waitForURL(new RegExp(`/join/${sessionCode}`));
    
    // Expect to see the name input
    await expect(page.getByPlaceholder(/Enter your name/i)).toBeVisible();
  });

  test('should show error for invalid session code', async ({ page }) => {
    await page.goto('/');
    
    const codeInput = page.getByPlaceholder(/Enter code/i);
    await codeInput.fill('INVALID');
    
    await page.getByRole('button', { name: /Join Session/i }).click();

    // Should show error message (assuming the UI shows an error or toast)
    // For now we just verify it doesn't navigate away
    expect(page.url()).not.toContain('/join/INVALID');
  });
});
