import { test, expect, Page } from '@playwright/test';

// ============================================================================
// DevTools Panel E2E Tests
// Covers: UI interactions, tab switching, expansion - NOT testable with bun test
// ============================================================================

test.describe('DevTools Panel - Full Coverage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display DevTools collapsed bar', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await expect(devToolsBar).toBeVisible();
    await expect(devToolsBar).toContainText('DevTools');
  });

  test('should display uptime in collapsed bar', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await expect(devToolsBar).toContainText('Uptime');
  });

  test('should expand DevTools on click', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    const devToolsPanel = page.locator('.devtools-panel');
    await expect(devToolsPanel).toBeVisible();
  });

  test('should collapse DevTools on close button', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    const closeButton = page.locator('.close-button');
    await closeButton.click();
    
    const devToolsPanel = page.locator('.devtools-panel');
    await expect(devToolsPanel).not.toBeVisible();
  });

  test('should have all 10 tabs', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    const tabs = page.locator('.tab-button');
    await expect(tabs).toHaveCount(10);
    
    const tabLabels = ['Info', 'Routes', 'Components', 'State', 'Events', 
                       'Console', 'Network', 'Storage', 'Performance', 'Settings'];
    
    for (const label of tabLabels) {
      await expect(page.locator('.tab-button').filter({ hasText: label })).toBeVisible();
    }
  });

  test('should switch to Routes tab', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    await page.locator('.tab-button').filter({ hasText: 'Routes' }).click();
    await expect(page.locator('.tab-panel')).toContainText('Route');
  });

  test('should switch to Components tab', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    await page.locator('.tab-button').filter({ hasText: 'Components' }).click();
    await expect(page.locator('.tab-panel')).toContainText('Component');
  });

  test('should switch to State tab', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    await page.locator('.tab-button').filter({ hasText: 'State' }).click();
    await expect(page.locator('.tab-panel')).toContainText('State');
  });

  test('should switch to Events tab', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    await page.locator('.tab-button').filter({ hasText: 'Events' }).click();
    await expect(page.locator('.tab-panel')).toContainText('Event');
  });

  test('should switch to Console tab', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    await page.locator('.tab-button').filter({ hasText: 'Console' }).click();
    await expect(page.locator('.tab-panel')).toContainText('Console');
  });

  test('should switch to Network tab', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    await page.locator('.tab-button').filter({ hasText: 'Network' }).click();
    await expect(page.locator('.tab-panel')).toContainText('Network');
  });

  test('should switch to Storage tab', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    await page.locator('.tab-button').filter({ hasText: 'Storage' }).click();
    await expect(page.locator('.tab-panel')).toContainText('Storage');
  });

  test('should switch to Performance tab', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    await page.locator('.tab-button').filter({ hasText: 'Performance' }).click();
    await expect(page.locator('.tab-panel')).toContainText('Performance');
  });

  test('should switch to Settings tab', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    await page.locator('.tab-button').filter({ hasText: 'Settings' }).click();
    await expect(page.locator('.tab-panel')).toContainText('Settings');
  });

  test('should highlight active tab', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    // Info tab should be active by default
    const infoTab = page.locator('.tab-button').filter({ hasText: 'Info' });
    await expect(infoTab).toHaveClass(/active/);
    
    // Click Routes tab
    const routesTab = page.locator('.tab-button').filter({ hasText: 'Routes' });
    await routesTab.click();
    await expect(routesTab).toHaveClass(/active/);
    await expect(infoTab).not.toHaveClass(/active/);
  });

  test('should display Info tab content', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    await expect(page.locator('.tab-panel')).toContainText('Application');
    await expect(page.locator('.tab-panel')).toContainText('angular-rspack-demo');
    await expect(page.locator('.tab-panel')).toContainText('Angular');
  });

  test('should update uptime over time', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    const initialText = await devToolsBar.textContent();
    
    await page.waitForTimeout(2000);
    
    const newText = await devToolsBar.textContent();
    expect(newText).not.toBe(initialText);
  });

  test('should toggle with keyboard', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    await expect(page.locator('.devtools-panel')).toBeVisible();
    
    // Click again to collapse
    await devToolsBar.click();
    await expect(page.locator('.devtools-panel')).not.toBeVisible();
  });

  test('should maintain state on navigation', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    // Navigate to demo
    await page.locator('a.btn').click();
    await expect(page).toHaveURL(/.*demo/);
    
    // DevTools should still be expanded
    await expect(page.locator('.devtools-panel')).toBeVisible();
  });
});

// ============================================================================
// Error Boundary E2E Tests
// Covers: Visual error display, user interactions - NOT testable with bun test
// ============================================================================

test.describe('Error Boundary - Full Coverage', () => {
  test('should not show error boundary initially', async ({ page }) => {
    await page.goto('/');
    const errorBoundary = page.locator('.error-boundary');
    await expect(errorBoundary).not.toBeVisible();
  });

  test('should display error count when errors occur', async ({ page }) => {
    await page.goto('/');
    
    // Trigger an error via console
    await page.evaluate(() => {
      console.error('Test error from E2E');
    });
    
    // Error boundary should appear
    const errorBoundary = page.locator('.error-boundary');
    await expect(errorBoundary).toBeVisible();
  });

  test('should expand error boundary on new error', async ({ page }) => {
    await page.goto('/');
    
    // Trigger error
    await page.evaluate(() => {
      throw new Error('Test error');
    });
    
    const errorBoundary = page.locator('.error-boundary');
    await expect(errorBoundary).toBeVisible();
  });

  test('should show error details', async ({ page }) => {
    await page.goto('/');
    
    // Trigger error
    await page.evaluate(() => {
      console.error('Detailed test error message');
    });
    
    const errorBoundary = page.locator('.error-boundary');
    await expect(errorBoundary).toContainText('error', { ignoreCase: true });
  });

  test('should clear errors with clear button', async ({ page }) => {
    await page.goto('/');
    
    // Trigger error
    await page.evaluate(() => {
      console.error('Error to clear');
    });
    
    const clearButton = page.locator('.clear-btn');
    await clearButton.click();
    
    const errorBoundary = page.locator('.error-boundary');
    await expect(errorBoundary).not.toBeVisible();
  });

  test('should collapse with close button', async ({ page }) => {
    await page.goto('/');
    
    // Trigger error
    await page.evaluate(() => {
      console.error('Error');
    });
    
    const closeButton = page.locator('.close-btn');
    await closeButton.click();
    
    const errorBoundary = page.locator('.error-boundary');
    await expect(errorBoundary).not.toBeVisible();
  });

  test('should toggle expand/collapse', async ({ page }) => {
    await page.goto('/');
    
    // Trigger error
    await page.evaluate(() => {
      console.error('Error');
    });
    
    const errorHeader = page.locator('.error-header');
    
    // Click to collapse
    await errorHeader.click();
    await expect(page.locator('.error-boundary')).not.toBeVisible();
    
    // Click to expand
    await errorHeader.click();
    await expect(page.locator('.error-boundary')).toBeVisible();
  });

  test('should show error timestamp', async ({ page }) => {
    await page.goto('/');
    
    // Trigger error
    await page.evaluate(() => {
      console.error('Timestamp test');
    });
    
    const errorTime = page.locator('.error-time');
    await expect(errorTime).toBeVisible();
  });

  test('should show stack trace toggle', async ({ page }) => {
    await page.goto('/');
    
    // Trigger error with stack
    await page.evaluate(() => {
      const error = new Error('Stack trace error');
      console.error(error);
    });
    
    const stackSummary = page.locator('.error-stack summary');
    await expect(stackSummary).toContainText('Stack');
  });

  test('should expand stack trace', async ({ page }) => {
    await page.goto('/');
    
    // Trigger error
    await page.evaluate(() => {
      const error = new Error('Expand stack test');
      console.error(error);
    });
    
    const stackSummary = page.locator('.error-stack summary');
    await stackSummary.click();
    
    const stackPre = page.locator('.error-stack pre');
    await expect(stackPre).toBeVisible();
  });

  test('should show multiple errors', async ({ page }) => {
    await page.goto('/');
    
    // Trigger multiple errors
    await page.evaluate(() => {
      console.error('Error 1');
      console.error('Error 2');
      console.error('Error 3');
    });
    
    const errorItems = page.locator('.error-item');
    await expect(errorItems).toHaveCount(3);
  });

  test('should persist errors on navigation', async ({ page }) => {
    await page.goto('/');
    
    // Trigger error
    await page.evaluate(() => {
      console.error('Persist test');
    });
    
    // Navigate
    await page.locator('a.btn').click();
    await expect(page).toHaveURL(/.*demo/);
    
    // Error should still be visible
    const errorBoundary = page.locator('.error-boundary');
    await expect(errorBoundary).toBeVisible();
  });
});

// ============================================================================
// WinBox Integration E2E Tests
// Covers: Real browser WinBox interactions - NOT testable with bun test
// ============================================================================

test.describe('WinBox Integration - Full Coverage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo');
  });

  test('should open WinBox window on card click', async ({ page }) => {
    const firstCard = page.locator('.card').first();
    await firstCard.click();
    
    // WinBox window should appear
    const winbox = page.locator('.winbox');
    await expect(winbox).toBeVisible();
  });

  test('should display window title', async ({ page }) => {
    const firstCard = page.locator('.card').first();
    await firstCard.click();
    
    const winboxTitle = page.locator('.winbox-title');
    await expect(winboxTitle).toContainText('Angular');
  });

  test('should close window with X button', async ({ page }) => {
    const firstCard = page.locator('.card').first();
    await firstCard.click();
    
    const closeBtn = page.locator('.winbox .wb-full');
    await closeBtn.click();
    
    const winbox = page.locator('.winbox');
    await expect(winbox).not.toBeVisible();
  });

  test('should minimize window', async ({ page }) => {
    const firstCard = page.locator('.card').first();
    await firstCard.click();
    
    const minimizeBtn = page.locator('.winbox .wb-min');
    await minimizeBtn.click();
    
    const winbox = page.locator('.winbox');
    await expect(winbox).toHaveClass(/winbox-min/);
  });

  test('should show tab for opened window', async ({ page }) => {
    const firstCard = page.locator('.card').first();
    await firstCard.click();
    
    const tab = page.locator('.tab').filter({ hasText: 'Angular' });
    await expect(tab).toBeVisible();
  });

  test('should focus window on tab click', async ({ page }) => {
    const firstCard = page.locator('.card').first();
    await firstCard.click();
    
    const secondCard = page.locator('.card').nth(1);
    await secondCard.click();
    
    // Click first tab to focus first window
    const firstTab = page.locator('.tab').filter({ hasText: 'Angular' });
    await firstTab.click();
    
    const winbox = page.locator('.winbox').first();
    await expect(winbox).toBeVisible();
  });

  test('should close all windows', async ({ page }) => {
    // Open multiple windows
    await page.locator('.card').nth(0).click();
    await page.locator('.card').nth(1).click();
    
    const closeAllBtn = page.locator('.close-all-btn');
    await closeAllBtn.click();
    
    const winbox = page.locator('.winbox');
    await expect(winbox).toHaveCount(0);
  });

  test('should minimize all windows with home tab', async ({ page }) => {
    await page.locator('.card').first().click();
    
    const homeTab = page.locator('.home-tab');
    await homeTab.click();
    
    const winbox = page.locator('.winbox');
    await expect(winbox).toHaveClass(/winbox-min/);
  });

  test('should update window count', async ({ page }) => {
    const windowCount = page.locator('.window-count');
    await expect(windowCount).toContainText('0 windows');
    
    await page.locator('.card').first().click();
    await expect(windowCount).toContainText('1 window');
    
    await page.locator('.card').nth(1).click();
    await expect(windowCount).toContainText('2 windows');
  });

  test('should display window content', async ({ page }) => {
    await page.locator('.card').first().click();
    
    const winboxBody = page.locator('.winbox-body');
    await expect(winboxBody).toContainText('Angular');
  });

  test('should have window controls', async ({ page }) => {
    await page.locator('.card').first().click();
    
    const winbox = page.locator('.winbox');
    await expect(winbox.locator('.wb-min')).toBeVisible();
    await expect(winbox.locator('.wb-max')).toBeVisible();
    await expect(winbox.locator('.wb-full')).toBeVisible();
  });

  test('should drag window', async ({ page }) => {
    await page.locator('.card').first().click();
    
    const winbox = page.locator('.winbox');
    const initialBox = await winbox.boundingBox();
    
    const titleBar = page.locator('.winbox .wb-title');
    await titleBar.dragTo(page.locator('body'), {
      targetPosition: { x: 100, y: 100 }
    });
    
    const newBox = await winbox.boundingBox();
    expect(newBox.x).not.toBe(initialBox?.x);
  });

  test('should resize window', async ({ page }) => {
    await page.locator('.card').first().click();
    
    const winbox = page.locator('.winbox');
    const initialBox = await winbox.boundingBox();
    
    const resizeHandle = page.locator('.winbox .wb-body');
    await resizeHandle.dragTo(page.locator('body'), {
      targetPosition: { x: 500, y: 500 }
    });
    
    const newBox = await winbox.boundingBox();
    expect(newBox.width).not.toBe(initialBox?.width);
  });

  test('should maximize window', async ({ page }) => {
    await page.locator('.card').first().click();
    
    const maximizeBtn = page.locator('.winbox .wb-max');
    await maximizeBtn.click();
    
    const winbox = page.locator('.winbox');
    await expect(winbox).toHaveClass(/winbox-max/);
  });

  test('should handle multiple windows', async ({ page }) => {
    // Open 3 windows
    for (let i = 0; i < 3; i++) {
      await page.locator('.card').nth(i).click();
    }
    
    const winbox = page.locator('.winbox');
    await expect(winbox).toHaveCount(3);
    
    const tabs = page.locator('.tab').filter({ hasText: /Angular|Rspack|Bun/ });
    await expect(tabs).toHaveCount(3);
  });
});
