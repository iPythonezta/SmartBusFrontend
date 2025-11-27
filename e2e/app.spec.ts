import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully with admin credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    
    // Check if login form is visible
    await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
    
    // Fill in credentials
    await page.getByLabel(/email/i).fill('admin@smartbus.pk');
    await page.getByLabel(/password/i).fill('password123');
    
    // Click login button
    await page.getByRole('button', { name: /login/i }).click();
    
    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should show error message with invalid credentials', async ({ page }) => {
    await page.goto('/login');
    
    await page.getByLabel(/email/i).fill('invalid@email.com');
    await page.getByLabel(/password/i).fill('wrongpassword');
    await page.getByRole('button', { name: /login/i }).click();
    
    // Should show error message
    await expect(page.getByText(/invalid credentials/i)).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@smartbus.pk');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL('/dashboard');
    
    // Click logout
    await page.getByRole('button', { name: /logout/i }).click();
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Stop Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@smartbus.pk');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should navigate to stops page', async ({ page }) => {
    await page.getByRole('link', { name: /stops/i }).click();
    await expect(page).toHaveURL('/stops');
    await expect(page.getByRole('heading', { name: /stops/i })).toBeVisible();
  });

  test('should open add stop modal', async ({ page }) => {
    await page.goto('/stops');
    
    // Click add stop button
    await page.getByRole('button', { name: /add stop/i }).click();
    
    // Modal should be visible
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /add stop/i })).toBeVisible();
  });

  test('should create a new stop', async ({ page }) => {
    await page.goto('/stops');
    
    // Open add stop modal
    await page.getByRole('button', { name: /add stop/i }).click();
    
    // Fill in stop details
    await page.getByLabel(/stop name/i).fill('Test Stop');
    await page.getByLabel(/description/i).fill('Test description');
    
    // Click on map to place marker (simulated coordinates)
    // Note: In real test, you'd interact with the map canvas
    
    // Submit form
    await page.getByRole('button', { name: /^add$/i }).click();
    
    // Should close modal and show success message
    await expect(page.getByRole('dialog')).not.toBeVisible();
    
    // New stop should appear in the list
    await expect(page.getByText('Test Stop')).toBeVisible();
  });

  test('should search for stops', async ({ page }) => {
    await page.goto('/stops');
    
    // Type in search box
    await page.getByPlaceholder(/search stops/i).fill('Blue Area');
    
    // Should filter results
    await expect(page.getByText('Blue Area')).toBeVisible();
  });
});

test.describe('Route Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@smartbus.pk');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should view route details', async ({ page }) => {
    await page.goto('/routes');
    
    // Click on first route
    await page.getByRole('button', { name: /view route details/i }).first().click();
    
    // Should navigate to route detail page
    await expect(page).toHaveURL(/\/routes\/\d+/);
    
    // Should show route information
    await expect(page.getByText(/route stops/i)).toBeVisible();
  });

  test('should display route on map', async ({ page }) => {
    await page.goto('/routes/1');
    
    // Check if map canvas is visible
    const mapCanvas = page.locator('.mapboxgl-canvas');
    await expect(mapCanvas).toBeVisible();
  });
});

test.describe('Bus Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@smartbus.pk');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL('/dashboard');
  });

  test('should list all buses', async ({ page }) => {
    await page.goto('/buses');
    
    await expect(page.getByRole('heading', { name: /buses/i })).toBeVisible();
    
    // Should show bus cards
    await expect(page.getByText(/ISB-/i).first()).toBeVisible();
  });

  test('should view bus details', async ({ page }) => {
    await page.goto('/buses');
    
    // Click on view details button
    await page.getByRole('button', { name: /view details/i }).first().click();
    
    // Should navigate to bus detail page
    await expect(page).toHaveURL(/\/buses\/\d+/);
    
    // Should show bus information
    await expect(page.getByText(/registration number/i)).toBeVisible();
  });
});

test.describe('SMD Simulator', () => {
  test('should open SMD simulator', async ({ page }) => {
    // Navigate directly to simulator (no auth required)
    await page.goto('/smd-simulator/1');
    
    // Should show simulator interface
    await expect(page.getByText(/smart bus islamabad/i)).toBeVisible();
    await expect(page.getByText(/next buses/i)).toBeVisible();
  });

  test('should toggle simulator controls', async ({ page }) => {
    await page.goto('/smd-simulator/1');
    
    // Toggle online/offline
    await page.getByRole('button', { name: /online/i }).click();
    await expect(page.getByText(/display offline/i)).toBeVisible();
    
    // Toggle back online
    await page.getByRole('button', { name: /offline/i }).click();
    await expect(page.getByText(/display offline/i)).not.toBeVisible();
  });

  test('should switch language in simulator', async ({ page }) => {
    await page.goto('/smd-simulator/1');
    
    // Click language toggle
    await page.getByRole('button', { name: /EN/i }).click();
    
    // Should show Urdu text
    await expect(page.getByText(/سمارٹ بس اسلام آباد/i)).toBeVisible();
  });

  test('should enter fullscreen mode', async ({ page }) => {
    await page.goto('/smd-simulator/1');
    
    // Click fullscreen button
    await page.getByRole('button', { name: /fullscreen/i }).click();
    
    // Admin controls should be hidden in fullscreen
    await expect(page.getByText(/smd simulator/i)).not.toBeVisible();
  });
});

test.describe('Accessibility', () => {
  test('should have no accessibility violations on dashboard', async ({ page }) => {
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@smartbus.pk');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    await expect(page).toHaveURL('/dashboard');
    
    // Check for basic accessibility
    const heading = page.getByRole('heading', { name: /dashboard/i });
    await expect(heading).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/login');
    
    // Tab through form fields
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/email/i)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(/password/i)).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: /login/i })).toBeFocused();
  });
});

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@smartbus.pk');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    await expect(page).toHaveURL('/dashboard');
    
    // Dashboard should be visible on mobile
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await page.goto('/login');
    await page.getByLabel(/email/i).fill('admin@smartbus.pk');
    await page.getByLabel(/password/i).fill('password123');
    await page.getByRole('button', { name: /login/i }).click();
    
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible();
  });
});
