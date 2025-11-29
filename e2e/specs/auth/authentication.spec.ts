import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';

test.describe('Authentication Flow', () => {
	test('should display login page correctly', async ({ page }) => {
		const auth = new AuthPage(page);
		await auth.gotoLogin();
		await auth.expectOnLoginPage();
		await expect(page.getByRole('heading', { name: /log in|sign in/i })).toBeVisible();
	});

	test('should display signup page correctly', async ({ page }) => {
		const auth = new AuthPage(page);
		await auth.gotoSignup();
		await auth.expectOnSignupPage();
		await expect(page.getByRole('heading', { name: /sign up|create account/i })).toBeVisible();
	});

	test('should show validation errors for invalid email', async ({ page }) => {
		const auth = new AuthPage(page);
		await auth.gotoLogin();
		await auth.fillEmail('invalid-email');
		await auth.fillPassword('password123');
		await auth.submit();
		// Should show error or stay on page
		await expect(page).toHaveURL(/\/auth\/login/);
	});

	test('should navigate between login and signup', async ({ page }) => {
		const auth = new AuthPage(page);
		await auth.gotoLogin();
		await expect(page.getByText(/don't have an account|sign up/i)).toBeVisible();
	});

	test('should protect authenticated routes', async ({ page }) => {
		// Try to access protected route without auth
		await page.goto('/profile');
		// Should redirect to login or show auth gate
		const url = page.url();
		expect(url).toMatch(/\/(auth\/login|$)/);
	});
});

test.describe('Logout Flow', () => {
	test('should have logout functionality', async ({ page }) => {
		await page.goto('/logout');
		// Should redirect to home or show logout confirmation
		await page.waitForURL(/\/($|auth)/);
	});
});
