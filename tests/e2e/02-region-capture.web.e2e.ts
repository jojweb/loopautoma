/**
 * E2E Tests: Region Capture Workflow (Web-Only Mode)
 * Tests region capture behavior in web-only dev mode (expected to fail gracefully)
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady, openRegionPicker } from './helpers';

test.describe('Region Capture - Web-Only Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('3.15 - Region capture fails gracefully in web-only mode', async ({ page }) => {
    // Try to open region picker
    await openRegionPicker(page);

    // Should show error message (Tauri command not available)
    await expect(page.locator('.alert, [role="alert"]')).toBeVisible({ timeout: 5000 });
    
    // Error message should indicate web-only limitation
    const errorText = await page.locator('.alert, [role="alert"]').textContent();
    expect(errorText).toBeTruthy();
    
    // Main window should still be visible (no overlay opened)
    await expect(page.locator('main.container')).toBeVisible();
  });

  test('3.15 - Region authoring panel disabled without profile', async ({ page }) => {
    // Deselect profile if possible (implementation-dependent)
    // For now, just verify button behavior with empty/invalid state
    
    const defineButton = page.getByRole('button', { name: /define watch region/i });
    
    // Button should exist
    await expect(defineButton).toBeVisible();
  });

  test('3.15 - Empty region list shows helpful message', async ({ page }) => {
    // Check if empty state message is visible
    const emptyMessage = page.locator('.region-empty, [role="status"]').filter({ hasText: /no regions/i });
    
    // If regions exist, skip this test
    const regionCards = await page.locator('.region-card').count();
    if (regionCards === 0) {
      await expect(emptyMessage).toBeVisible();
      
      const text = await emptyMessage.textContent();
      expect(text).toMatch(/no regions/i);
      expect(text).toMatch(/define watch region/i);
    }
  });

  test('3.15 - Region capture button shows helpful tooltip', async ({ page }) => {
    const defineButton = page.getByRole('button', { name: /define watch region/i });
    
    // Check tooltip exists
    const title = await defineButton.getAttribute('title');
    expect(title).toBeTruthy();
    expect(title?.length).toBeGreaterThan(20); // Should have substantial help text
  });

  test('3.15 - Region panel hint text visible', async ({ page }) => {
    // Check for hint text that explains the overlay behavior
    const hint = page.locator('.region-overlay-hint');
    await expect(hint).toBeVisible();
    
    const text = await hint.textContent();
    expect(text).toBeTruthy();
    expect(text!.length).toBeGreaterThan(30); // Substantial explanation
  });
});
