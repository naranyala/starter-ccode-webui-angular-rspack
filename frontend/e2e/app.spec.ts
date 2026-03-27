import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display home page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Angular Rspack Demo');
  });

  test('should display subtitle', async ({ page }) => {
    await expect(page.locator('.subtitle')).toContainText('minimal Angular 19 application');
  });

  test('should have demo link', async ({ page }) => {
    const demoLink = page.locator('a.btn');
    await expect(demoLink).toBeVisible();
    await expect(demoLink).toHaveAttribute('routerLink', '/demo');
  });

  test('should navigate to demo page', async ({ page }) => {
    await page.locator('a.btn').click();
    await expect(page).toHaveURL(/.*demo/);
  });
});

test.describe('Demo Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo');
  });

  test('should display demo page title', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Technology Cards');
  });

  test('should display 6 technology cards', async ({ page }) => {
    const cards = page.locator('.card');
    await expect(cards).toHaveCount(6);
  });

  test('should have search input', async ({ page }) => {
    const searchInput = page.locator('.search-input');
    await expect(searchInput).toBeVisible();
  });

  test('should filter cards by search', async ({ page }) => {
    const searchInput = page.locator('.search-input');
    await searchInput.fill('Angular');
    
    const cards = page.locator('.card');
    await expect(cards).toHaveCount(1);
    await expect(cards.first()).toContainText('Angular');
  });

  test('should show no results for non-existent search', async ({ page }) => {
    const searchInput = page.locator('.search-input');
    await searchInput.fill('nonexistent-technology-xyz');
    
    await expect(page.locator('.no-results')).toBeVisible();
  });

  test('should clear search', async ({ page }) => {
    const searchInput = page.locator('.search-input');
    const clearButton = page.locator('.clear-btn');
    
    await searchInput.fill('Angular');
    await clearButton.click();
    
    await expect(searchInput).toHaveValue('');
    await expect(page.locator('.card')).toHaveCount(6);
  });

  test('should have tab bar', async ({ page }) => {
    await expect(page.locator('.tab-bar')).toBeVisible();
  });

  test('should have home tab', async ({ page }) => {
    const homeTab = page.locator('.home-tab');
    await expect(homeTab).toBeVisible();
    await expect(homeTab).toContainText('Home');
  });

  test('should have app header', async ({ page }) => {
    await expect(page.locator('.app-header')).toBeVisible();
  });
});

test.describe('DevTools Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display DevTools collapsed bar', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await expect(devToolsBar).toBeVisible();
    await expect(devToolsBar).toContainText('DevTools');
  });

  test('should expand DevTools on click', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    const devToolsPanel = page.locator('.devtools-panel');
    await expect(devToolsPanel).toBeVisible();
  });

  test('should have 10 tabs in DevTools', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    const tabs = page.locator('.tab-button');
    await expect(tabs).toHaveCount(10);
  });

  test('should switch tabs in DevTools', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    // Click on Routes tab
    await page.locator('.tab-button').filter({ hasText: 'Routes' }).click();
    await expect(page.locator('.tab-panel')).toContainText('Route');
    
    // Click on Console tab
    await page.locator('.tab-button').filter({ hasText: 'Console' }).click();
    await expect(page.locator('.tab-panel')).toContainText('Console');
  });

  test('should collapse DevTools', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    const closeButton = page.locator('.close-button');
    await closeButton.click();
    
    const devToolsPanel = page.locator('.devtools-panel');
    await expect(devToolsPanel).not.toBeVisible();
  });

  test('should display uptime in collapsed bar', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await expect(devToolsBar).toContainText('Uptime');
  });

  test('should show Info tab content', async ({ page }) => {
    const devToolsBar = page.locator('.devtools-bar');
    await devToolsBar.click();
    
    // Info tab should be active by default
    await expect(page.locator('.tab-button.active')).toHaveText('Info');
    await expect(page.locator('.tab-panel')).toContainText('Application');
  });
});

test.describe('Error Boundary', () => {
  test('should not show error boundary when no errors', async ({ page }) => {
    await page.goto('/');
    
    // Error boundary should not be visible initially
    const errorBoundary = page.locator('.error-boundary');
    await expect(errorBoundary).not.toBeVisible();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.devtools-bar')).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.cards-grid')).toBeVisible();
  });

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('.devtools-panel')).not.toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL('/');
    
    await page.locator('a.btn').click();
    await expect(page).toHaveURL(/.*demo/);
    
    await page.locator('.home-tab').click();
    await expect(page).toHaveURL('/');
  });

  test('should handle 404 route', async ({ page }) => {
    await page.goto('/nonexistent-route');
    // Should redirect to home or show 404
    await expect(page.locator('app-root')).toBeVisible();
  });
});

test.describe('Performance', () => {
  test('should load home page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('should load demo page within 3 seconds', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/demo');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have no console errors on home page', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.goto('/');
    
    expect(consoleErrors.length).toBe(0);
  });
});
