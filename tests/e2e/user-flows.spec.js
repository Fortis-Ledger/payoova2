import { test, expect } from '@playwright/test';

test.describe('Payoova Wallet User Flows', () => {
  test('should allow user login and wallet creation', async ({ page }) => {
    // Navigate to login page
    await page.goto('/');
    
    // Should show login form
    await expect(page.locator('h1')).toContainText('Your Gateway to');
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    
    // Try demo login
    await page.getByRole('button', { name: 'Try Demo Account' }).click();
    
    // Should navigate to dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByText('Portfolio Overview')).toBeVisible();
    await expect(page.getByText('Welcome, Demo User')).toBeVisible();
  });

  test('should allow wallet generation', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.getByRole('button', { name: 'Try Demo Account' }).click();
    
    // Should be on dashboard
    await expect(page).toHaveURL('/dashboard');
    
    // Look for generate wallet button
    const generateButton = page.getByRole('button', { name: 'Generate Wallet' }).first();
    if (await generateButton.isVisible()) {
      await generateButton.click();
      
      // Wait for wallet creation (mock)
      await page.waitForTimeout(1000);
      
      // Should see success indication or wallet address
      await expect(page.getByText(/0x[a-fA-F0-9]{40}|Wallet created/)).toBeVisible();
    }
  });

  test('should navigate to send crypto page', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.getByRole('button', { name: 'Try Demo Account' }).click();
    
    // Navigate to send page
    await page.getByText('Send Crypto').click();
    
    // Should be on send page
    await expect(page).toHaveURL('/send');
    await expect(page.getByText('Send Cryptocurrency')).toBeVisible();
    await expect(page.getByText('Transfer to any wallet address')).toBeVisible();
  });

  test('should navigate to receive crypto page', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.getByRole('button', { name: 'Try Demo Account' }).click();
    
    // Navigate to receive page
    await page.getByText('Receive Crypto').click();
    
    // Should be on receive page
    await expect(page).toHaveURL('/receive');
    await expect(page.getByText('Receive Cryptocurrency')).toBeVisible();
  });

  test('should navigate to transaction history', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.getByRole('button', { name: 'Try Demo Account' }).click();
    
    // Navigate to transactions page
    await page.getByText('Transactions').click();
    
    // Should be on transactions page
    await expect(page).toHaveURL('/transactions');
    await expect(page.getByText('Transaction History')).toBeVisible();
  });

  test('should allow logout', async ({ page }) => {
    // Login first
    await page.goto('/');
    await page.getByRole('button', { name: 'Try Demo Account' }).click();
    
    // Should be logged in
    await expect(page.getByText('Welcome, Demo User')).toBeVisible();
    
    // Logout
    await page.getByRole('button').filter({ hasText: 'LogOut' }).click();
    
    // Should redirect to login
    await expect(page).toHaveURL('/login');
    await expect(page.getByText('Welcome Back')).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Navigate to app
    await page.goto('/');
    
    // Should show mobile-friendly layout
    await expect(page.getByText('Your Gateway to')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    
    // Login
    await page.getByRole('button', { name: 'Try Demo Account' }).click();
    
    // Should show mobile dashboard
    await expect(page.getByText('Portfolio Overview')).toBeVisible();
  });
});
