import { test, expect } from '@playwright/test';

test.describe('StockDrive IMS End-to-End User Journeys', () => {
  test('Flow 1: Customer purchase accessories end-to-end', async ({ page }) => {
    // 1. Visit storefront
    await page.goto('/');
    await expect(page).toHaveTitle(/StockDrive IMS/i);

    // 2. Sign In as Customer
    await page.click('text=Sign In');
    await expect(page).toHaveURL(/.*login/);

    // Fill credentials using demo button or inputs
    await page.click('text=Customer (customer@stockdrive.com)');
    await page.click('button:has-text("Sign In")');

    // Redirected back to Storefront
    await expect(page).toHaveURL('http://localhost:5173/');

    // 3. Add an accessory to cart
    const firstAddButton = page.locator('button:has-text("Add")').first();
    await firstAddButton.click();

    // Verify toast notification appears
    await expect(page.locator('text=Added').first()).toBeVisible();

    // 4. Navigate to cart
    await page.click('a[aria-label="View shopping cart"]');
    await expect(page).toHaveURL(/.*cart/);
    await expect(page.locator('h1')).toContainText('Shopping Cart');

    // 5. Checkout
    await page.click('button:has-text("Proceed to Checkout")');
    await expect(page.locator('text=Complete Checkout & Mock Payment')).toBeVisible();

    // Confirm mock payment
    await page.click('button:has-text("Pay & Confirm Order")');

    // 6. Verify navigation to Order Detail page
    await expect(page).toHaveURL(/.*orders\/.*/);
    await expect(page.locator('text=Order Status Tracking')).toBeVisible();
    await expect(page.locator('text=TAX INVOICE')).toBeVisible();
  });

  test('Flow 2: Admin stock update with mandatory reason', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login');
    await page.click('text=Admin (admin@stockdrive.com)');
    await page.click('button:has-text("Sign In")');

    // Redirected to Admin Dashboard
    await expect(page).toHaveURL(/.*admin/);
    await expect(page.locator('h1')).toContainText('Dashboard Overview');

    // 2. Navigate to Stock & Ledger
    await page.click('text=Stock & Ledger');
    await expect(page).toHaveURL(/.*admin\/stock/);

    // 3. Open Record Movement modal
    await page.click('button:has-text("Record Movement / Adjustment")');
    await expect(page.locator('text=Record Stock Movement & Ledger Entry')).toBeVisible();

    // 4. Fill form with mandatory reason
    await page.selectOption('select:has-text("Choose Product")', { index: 1 });
    await page.fill('textarea[placeholder*="shipment"]', 'E2E Automated Warehouse Inspection Intake');

    // Submit adjustment
    await page.click('button:has-text("Apply & Save to Ledger")');

    // Verify success toast & ledger entry
    await expect(page.locator('text=Stock adjustment recorded successfully!')).toBeVisible();
    await expect(page.locator('text=E2E Automated Warehouse Inspection Intake').first()).toBeVisible();
  });

  test('Flow 3: Admin order status change and restock notice', async ({ page }) => {
    // 1. Login as Admin
    await page.goto('/login');
    await page.click('text=Admin (admin@stockdrive.com)');
    await page.click('button:has-text("Sign In")');

    // 2. Navigate to Orders Management
    await page.click('text=Orders Management');
    await expect(page).toHaveURL(/.*admin\/orders/);

    // 3. Open Update Status on the first order
    const updateStatusBtn = page.locator('button:has-text("Update Status")').first();
    await updateStatusBtn.click();
    await expect(page.locator('text=Transition status or cancel order')).toBeVisible();

    // 4. Select CANCELLED to verify restock warning
    await page.selectOption('select >> nth=0', 'CANCELLED');
    await expect(page.locator('text=Restock Notice:')).toBeVisible();

    // 5. Submit status transition
    await page.click('button:has-text("Confirm Status Transition")');
    await expect(page.locator('text=status changed to CANCELLED').first()).toBeVisible();
  });
});
