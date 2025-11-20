/**
 * E2E Tests: Action Recorder Workflow (Desktop Mode)
 * Tests the new UI-level Action Recorder that replaced OS-level input capture
 * 
 * NOTE: These tests are skipped because they test a multi-window Tauri feature
 * (ActionRecorderWindow opens in a separate window) which cannot be tested
 * in the single-page Playwright environment with fake desktop mode.
 * The ActionRecorder functionality is covered by unit tests instead.
 */

import { test, expect } from '@playwright/test';
import {
  waitForAppReady,
  setupFakeDesktopMode,
  getFakeDesktopState,
} from './helpers';

test.describe.skip('Action Recorder Workflow - Desktop Mode', () => {
  test.beforeEach(async ({ page }) => {
    await setupFakeDesktopMode(page);
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('4.1 - Happy path: Open Action Recorder → Click on screenshot → Type text → Done adds actions', async ({ page }) => {
    // Get initial profile state
    const initialState = await getFakeDesktopState(page);
    const initialActions = initialState?.config?.profiles?.[0]?.actions ?? [];
    const initialActionCount = initialActions.length;
    console.log('[Test] Initial action count:', initialActionCount);

    // Click "Record Actions" button
    const recordButton = page.getByRole('button', { name: /record actions/i });
    await expect(recordButton).toBeVisible();
    await recordButton.click();

    // Wait for Action Recorder overlay to appear
    await page.waitForTimeout(500);

    // Verify Action Recorder UI is visible
    const actionRecorder = page.locator('.action-recorder');
    await expect(actionRecorder).toBeVisible();

    // Verify screenshot is displayed
    const screenshot = page.locator('.action-recorder-screenshot img');
    await expect(screenshot).toBeVisible();

    // Verify header elements
    await expect(page.locator('.action-recorder-header')).toContainText(/action recorder/i);
    const startButton = page.getByRole('button', { name: /start/i });
    await expect(startButton).toBeVisible();

    // Start recording
    await startButton.click();
    await page.waitForTimeout(200);

    // Verify recording indicator is visible
    await expect(page.locator('.recording-indicator')).toBeVisible();

    // Simulate clicking on the screenshot (will add a click action)
    await screenshot.click({ position: { x: 100, y: 200 } });
    await page.waitForTimeout(200);

    // Verify action marker appears
    const marker = page.locator('.action-number-marker').first();
    await expect(marker).toBeVisible();
    await expect(marker).toContainText('1');

    // Simulate typing (keyboard events on the document)
    await page.keyboard.type('hello');
    await page.waitForTimeout(300);

    // Verify action legend shows 2 actions (click + type)
    const legendItems = page.locator('.action-recorder-legend .action-item');
    expect(await legendItems.count()).toBe(2);

    // Click "Done" button
    const doneButton = page.getByRole('button', { name: /done/i });
    await doneButton.click();

    // Wait for actions to be saved (with longer timeout for async processing)
    await page.waitForTimeout(1500);

    // Verify Action Recorder is closed
    await expect(actionRecorder).not.toBeVisible();

    // Verify actions were REPLACED (not appended) in the profile
    const finalState = await getFakeDesktopState(page);
    const finalActions = finalState?.config?.profiles?.[0]?.actions ?? [];
    console.log('[Test] Final action count:', finalActions.length);
    console.log('[Test] Final actions:', JSON.stringify(finalActions, null, 2));

    // Actions should be REPLACED, so we expect exactly 2 actions (click + type)
    expect(finalActions.length).toBe(2);

    // Verify the actions contain expected types
    const hasClickAction = finalActions.some((a: any) => a.type === 'Click');
    const hasTypeAction = finalActions.some((a: any) => a.type === 'Type' && a.text?.includes('hello'));

    expect(hasClickAction).toBe(true);
    expect(hasTypeAction).toBe(true);

    // CRITICAL: Verify actions are visible in GraphComposer
    // Navigate to the action sequence section
    const graphComposer = page.locator('.graph-composer, [role="region"]').first();
    await expect(graphComposer).toBeVisible();

    // Look for action items in the graph
    const actionItems = page.locator('.action-card, .action-item, [data-testid="action"]');
    const actionCount = await actionItems.count();
    console.log('[Test] Visible actions in GraphComposer:', actionCount);
    expect(actionCount).toBeGreaterThanOrEqual(2);
  });

  test('4.2 - Action Recorder opens with screenshot displayed', async ({ page }) => {
    const recordButton = page.getByRole('button', { name: /record actions/i });
    await recordButton.click();
    await page.waitForTimeout(500);

    // Verify Action Recorder UI is visible
    const actionRecorder = page.locator('.action-recorder');
    await expect(actionRecorder).toBeVisible();

    // Verify screenshot is displayed
    const screenshot = page.locator('.action-recorder-screenshot');
    await expect(screenshot).toBeVisible();
  });

  test('4.3 - Click coordinates are captured correctly with 80% scaling', async ({ page }) => {
    const recordButton = page.getByRole('button', { name: /record actions/i });
    await recordButton.click();
    await page.waitForTimeout(500);

    // Start recording
    const startButton = page.getByRole('button', { name: /start/i });
    await startButton.click();
    await page.waitForTimeout(200);

    // Click on screenshot at specific position
    const screenshot = page.locator('.action-recorder-screenshot img');
    await screenshot.click({ position: { x: 80, y: 160 } });
    await page.waitForTimeout(200);

    // Verify marker appears
    const marker = page.locator('.action-number-marker').first();
    await expect(marker).toBeVisible();
  });

  test('4.4 - Multiple clicks create numbered markers', async ({ page }) => {
    const recordButton = page.getByRole('button', { name: /record actions/i });
    await recordButton.click();
    await page.waitForTimeout(500);

    const startButton = page.getByRole('button', { name: /start/i });
    await startButton.click();
    await page.waitForTimeout(200);

    // Click three times at different positions
    const screenshot = page.locator('.action-recorder-screenshot img');
    await screenshot.click({ position: { x: 50, y: 50 } });
    await page.waitForTimeout(200);
    await screenshot.click({ position: { x: 100, y: 100 } });
    await page.waitForTimeout(200);
    await screenshot.click({ position: { x: 150, y: 150 } });
    await page.waitForTimeout(200);

    // Verify three markers are visible
    const markers = page.locator('.action-number-marker');
    expect(await markers.count()).toBe(3);
  });

  test('4.5 - Text typing is buffered into single action', async ({ page }) => {
    const recordButton = page.getByRole('button', { name: /record actions/i });
    await recordButton.click();
    await page.waitForTimeout(500);

    const startButton = page.getByRole('button', { name: /start/i });
    await startButton.click();
    await page.waitForTimeout(200);

    // Type some text
    await page.keyboard.type('test message');
    await page.waitForTimeout(300);

    // Verify only one Type action in legend
    const legendItems = page.locator('.action-recorder-legend .action-item');
    expect(await legendItems.count()).toBe(1);
  });
});
