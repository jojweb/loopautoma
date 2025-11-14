/**
 * E2E Tests: Input Recording Workflow (Web-Only Mode)
 * Tests input recording behavior in web-only dev mode (expected to fail gracefully)
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady, getRecordedEventCount } from './helpers';

test.describe('Input Recording - Web-Only Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('4.14 - Input recording fails gracefully in web-only mode', async ({ page }) => {
    // Click Record button
    const recordButton = page.getByRole('button', { name: /^record$/i });
    await expect(recordButton).toBeVisible();
    await recordButton.click();

    // Should show error message (Tauri command not available or backend rejection)
    await expect(page.locator('.alert, [role="alert"]')).toBeVisible({ timeout: 5000 });
    
    // Error message should indicate limitation
    const errorText = await page.locator('.alert, [role="alert"]').textContent();
    expect(errorText).toBeTruthy();
    
    // Recording chip should NOT appear
    const recordingChip = page.locator('.running-chip', { hasText: 'Recording' });
    await expect(recordingChip).not.toBeVisible();
    
    // Button should remain in "Record" state (not "Stop")
    await expect(recordButton).toBeVisible();
    await expect(recordButton).toHaveText(/record/i);
  });

  test('4.14 - Save button disabled when no events recorded', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: /save as actionsequence/i });
    
    // Initially disabled (no events)
    await expect(saveButton).toBeDisabled();
    
    // Event counter should show 0
    const count = await getRecordedEventCount(page);
    expect(count).toBe(0);
  });

  test('4.14 - Timeline shows empty state initially', async ({ page }) => {
    const timeline = page.locator('.timeline-box');
    await expect(timeline).toBeVisible();
    
    // Should show "No events yet" or similar
    await expect(timeline).toContainText(/no events/i);
  });

  test('4.14 - Clear timeline button disabled when empty', async ({ page }) => {
    const clearButton = page.locator('.timeline-box').getByRole('button', { name: /clear/i });
    await expect(clearButton).toBeVisible();
    await expect(clearButton).toBeDisabled();
  });

  test('4.14 - Recording bar visible and accessible', async ({ page }) => {
    const recordButton = page.getByRole('button', { name: /^record$/i });
    
    // Button is keyboard accessible
    await recordButton.focus();
    await expect(recordButton).toBeFocused();
    
    // Has tooltip
    const title = await recordButton.getAttribute('title');
    expect(title).toBeTruthy();
    expect(title).toMatch(/record/i);
  });

  test('4.14 - Event counter displays correctly', async ({ page }) => {
    // Check counter text format
    const counterText = page.locator('text=/\\d+ recorded step\\(s\\)/');
    await expect(counterText).toBeVisible();
    
    const text = await counterText.textContent();
    expect(text).toMatch(/\d+ recorded step\(s\)/);
  });

  test('4.14 - Timeline header visible', async ({ page }) => {
    const header = page.locator('.timeline-header');
    await expect(header).toBeVisible();
    
    await expect(header).toContainText(/live input timeline/i);
  });
});
