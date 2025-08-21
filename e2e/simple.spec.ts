import { test, expect } from '@playwright/test';

test.describe('Simple E2E Tests', () => {
	test('should load home page', async ({ page }) => {
		await page.goto('/');

		// Check that the page loads
		await expect(page).toHaveTitle(/Kaiwa/);

		// Check that there are buttons
		const buttons = page.locator('button');
		await expect(buttons).toHaveCount(2);

		// Check for the main start button
		const startButton = page.getByRole('button', { name: /Start speaking/ });
		await expect(startButton).toBeVisible();

		// Check for the language selector button
		const languageButton = page.getByRole('button', { name: 'Select language' });
		await expect(languageButton).toBeVisible();
	});

	test('should navigate to conversation page', async ({ page }) => {
		await page.goto('/conversation');

		// Check that the page loads
		await expect(page).toHaveTitle(/Kaiwa/);

		// Check that there's content
		const content = page.locator('h1, button, .conversation-container');
		await expect(content.first()).toBeVisible();
	});

	test('should have basic accessibility', async ({ page }) => {
		await page.goto('/');

		// Check for proper heading structure
		const heading = page.locator('h1');
		await expect(heading).toBeVisible();

		// Check for buttons with proper roles
		const startButton = page.getByRole('button', { name: /Start speaking/ });
		await expect(startButton).toBeVisible();

		const languageButton = page.getByRole('button', { name: 'Select language' });
		await expect(languageButton).toBeVisible();
	});
});
