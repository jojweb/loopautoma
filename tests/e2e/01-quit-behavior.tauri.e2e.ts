/**
 * Desktop-mode quit behavior tests using the fake Tauri harness.
 */

import { test, expect } from '@playwright/test';
import { waitForAppReady, clickQuitButton, openRegionPicker, setupFakeDesktopMode, getFakeDesktopState } from './helpers';

test.describe('Quit Behavior - Desktop Mode', () => {
  test.beforeEach(async ({ page }) => {
    await setupFakeDesktopMode(page);
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('2.1 - Quit triggers app_quit invoke', async ({ page }) => {
    await clickQuitButton(page);
    const state = await getFakeDesktopState(page);
    expect(state?.quitCount).toBe(1);
  });

  test('2.4 - Quit while overlay active resets state', async ({ page }) => {
    await openRegionPicker(page);
    let state = await getFakeDesktopState(page);
    expect(state?.overlayActive).toBe(true);

    await clickQuitButton(page);
    state = await getFakeDesktopState(page);
    expect(state?.overlayActive).toBe(false);
    expect(state?.quitCount).toBe(1);
  });

  test('2.5 - Quit completes without runtime errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await clickQuitButton(page);
    expect(errors).toEqual([]);
  });
});
