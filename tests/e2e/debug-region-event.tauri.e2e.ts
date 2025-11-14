/**
 * Debug test to understand event flow
 */

import { test, expect } from '@playwright/test';
import {
  waitForAppReady,
  setupFakeDesktopMode,
  openRegionPicker,
  emitRegionPick,
} from './helpers';

test.describe('Region Event Debug', () => {
  test.beforeEach(async ({ page }) => {
    await setupFakeDesktopMode(page);
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('Debug: Check if region event is received', async ({ page }) => {
    // Set up console listening
    const messages: string[] = [];
    page.on('console', (msg) => {
      messages.push(msg.text());
    });

    // Add debug logging to the page
    await page.evaluate(() => {
      console.log('Adding event listener for region_pick_complete');
      window.addEventListener('loopautoma://region_pick_complete', (evt) => {
        console.log('Event received!', JSON.stringify((evt as CustomEvent).detail));
      });
    });

    await openRegionPicker(page);
    await page.waitForTimeout(500);

    // Emit event
    console.log('Emitting region pick event...');
    await emitRegionPick(page, { x: 100, y: 100, width: 200, height: 150 });

    // Wait a bit
    await page.waitForTimeout(1000);

    console.log('Console messages:', messages);

    // Check if the event was received
    const eventReceived = messages.some(m => m.includes('Event received!'));
    expect(eventReceived).toBe(true);
  });
});
