/**
 * E2E Tests: Quit Behavior (Web-Only Mode)
 * Tests quit button behavior in web-only dev mode where Tauri IPC is not available
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady, clickQuitButton, waitForConsoleMessage, startMonitor } from './helpers';

test.describe('Quit Behavior - Web-Only Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('2.1.2.web - Quit button logs message in web-only mode', async ({ page }) => {
    // Set up console listener
    const consolePromise = waitForConsoleMessage(
      page,
      /Quit requested in web dev mode/,
      5000
    );

    // Click quit button
    await clickQuitButton(page);

    // Verify console message appeared
    const message = await consolePromise;
    expect(message).toContain('Quit requested in web dev mode');
    expect(message).toContain('close the tab/window manually');

    // Verify page is still open (not closed)
    await expect(page.locator('main.container')).toBeVisible();
  });

  test('2.1.2.web - Quit button remains functional after multiple clicks', async ({ page }) => {
    const messages: string[] = [];
    
    page.on('console', (msg) => {
      if (msg.text().includes('Quit requested')) {
        messages.push(msg.text());
      }
    });

    // Click quit three times
    await clickQuitButton(page);
    await page.waitForTimeout(200);
    
    await clickQuitButton(page);
    await page.waitForTimeout(200);
    
    await clickQuitButton(page);
    await page.waitForTimeout(500);

    // Should have three console messages
    expect(messages.length).toBeGreaterThanOrEqual(3);
    
    // Button still visible and functional
    await expect(page.getByRole('button', { name: /quit/i })).toBeVisible();
  });

  test('2.1.3.web - Quit while monitor running (web mode)', async ({ page }) => {
    // Start monitor (will use fake backend in web mode)
    await startMonitor(page);
    
    // Verify monitor is running
    await expect(page.locator('.running-chip')).toBeVisible();

    // Click quit
    const consolePromise = waitForConsoleMessage(page, /Quit requested/);
    await clickQuitButton(page);
    await consolePromise;

    // Monitor should still be running (no automatic stop)
    await expect(page.locator('.running-chip')).toBeVisible();
    
    // Page should still be open
    await expect(page.locator('main.container')).toBeVisible();
  });

  test('2.1.2.web - No JavaScript errors on quit', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    await clickQuitButton(page);
    await page.waitForTimeout(500);

    // Should have no uncaught errors
    expect(errors).toEqual([]);
  });

  test('2.1.2.web - Quit button has correct accessibility attributes', async ({ page }) => {
    const quitButton = page.getByRole('button', { name: /quit/i });
    
    // Check button is keyboard accessible
    await quitButton.focus();
    await expect(quitButton).toBeFocused();
    
    // Check title attribute exists
    const title = await quitButton.getAttribute('title');
    expect(title).toBeTruthy();
    expect(title).toMatch(/quit/i);
    
    // Check button can be activated with Enter
    const consolePromise = waitForConsoleMessage(page, /Quit requested/);
    await page.keyboard.press('Enter');
    await consolePromise;
  });
});
