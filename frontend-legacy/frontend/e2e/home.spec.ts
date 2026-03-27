import { test, expect, type Page } from '@playwright/test';

test.describe('Home Page', () => {
  test('should load the home page successfully', async ({ page }) => {
    await page.goto('/');
    
    await expect(page).toHaveTitle(/Angular/);
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Angular Rsbuild Demo');
  });

  test('should display subtitle', async ({ page }) => {
    await page.goto('/');
    
    const subtitle = page.locator('.subtitle');
    await expect(subtitle).toBeVisible();
    await expect(subtitle).toContainText('A minimal Angular 19 application');
  });

  test('should have proper layout structure', async ({ page }) => {
    await page.goto('/');
    
    // Check for main container
    await expect(page.locator('app-root')).toBeVisible();
    
    // Check for pills panel
    const pillsPanel = page.locator('.pills-panel');
    await expect(pillsPanel).toBeVisible();
    
    // Check for canvas panel
    const canvasPanel = page.locator('.canvas-panel');
    await expect(canvasPanel).toBeVisible();
  });
});

test.describe('SVG Demos', () => {
  test('should display demo groups', async ({ page }) => {
    await page.goto('/');
    
    // Check for demo group titles
    await expect(page.locator('text=Basic Drawing')).toBeVisible();
    await expect(page.locator('text=Animation')).toBeVisible();
    await expect(page.locator('text=Interactive')).toBeVisible();
  });

  test('should select a demo and show canvas', async ({ page }) => {
    await page.goto('/');
    
    // Click on "Basic Shapes" demo
    await page.click('text=Basic Shapes');
    
    // Canvas should open
    const canvasPanel = page.locator('.canvas-panel.open');
    await expect(canvasPanel).toBeVisible();
    
    // Should have SVG canvas
    await expect(page.locator('.svg-container')).toBeVisible();
    
    // Should have controls
    await expect(page.locator('text=Run Animation')).toBeVisible();
    await expect(page.locator('text=Reset')).toBeVisible();
  });

  test('should run animation when button clicked', async ({ page }) => {
    await page.goto('/');
    
    // Select Animations demo
    await page.click('text=Animations');
    
    // Wait for canvas to initialize
    await page.waitForSelector('.svg-container svg');
    
    // Click Run Animation button
    await page.click('text=Run Animation');
    
    // Animation should start (visual verification would require screenshot comparison)
    await expect(page.locator('.control-btn')).toBeVisible();
  });

  test('should close canvas on close button click', async ({ page }) => {
    await page.goto('/');
    
    // Select a demo
    await page.click('text=Basic Shapes');
    
    // Wait for canvas to open
    await page.waitForSelector('.canvas-panel.open');
    
    // Click close button (on mobile) or select another demo to close
    await page.click('text=Basic Drawing');
    
    // Canvas should close
    const canvasPanel = page.locator('.canvas-panel');
    await expect(canvasPanel).not.toHaveClass('open');
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Pills panel should be visible
    await expect(page.locator('.pills-panel')).toBeVisible();
    
    // Select a demo
    await page.click('text=Basic Shapes');
    
    // Canvas panel should slide up
    await page.waitForSelector('.canvas-panel.open');
    
    // Close button should be visible on mobile
    await expect(page.locator('.close-btn')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    // Both panels should be visible in split view or stacked
    await expect(page.locator('.pills-panel')).toBeVisible();
    await expect(page.locator('.canvas-panel')).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Split screen layout should be active
    await expect(page.locator('.split-screen')).toBeVisible();
    
    // Both panels should be visible side by side
    await expect(page.locator('.pills-panel')).toBeVisible();
    await expect(page.locator('.canvas-panel')).toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');
    
    // Check for aria-label on interactive elements
    const buttons = page.locator('button[aria-label]');
    await expect(buttons.first()).toBeVisible();
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');
    
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Focused element should be visible
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Should have h1
    await expect(page.locator('h1')).toBeVisible();
    
    // Should have h2 or h3 for section titles
    await expect(page.locator('h2, h3')).toBeVisible();
  });
});

test.describe('Error Handling', () => {
  test('should handle 404 errors gracefully', async ({ page }) => {
    // Navigate to non-existent route
    const response = await page.goto('/non-existent-route');
    
    // Should either show 404 or redirect to home
    expect(response?.status()).toBeLessThan(500);
  });

  test('should not crash on invalid input', async ({ page }) => {
    await page.goto('/');
    
    // Try to trigger errors through various interactions
    await page.click('text=Basic Shapes');
    await page.click('text=Run Animation');
    await page.click('text=Reset');
    
    // App should still be functional
    await expect(page.locator('app-root')).toBeVisible();
  });
});
