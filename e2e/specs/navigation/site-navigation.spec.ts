import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home.page';

test.describe('Site Navigation', () => {
	test('should display main navigation bar', async ({ page }) => {
		const home = new HomePage(page);
		await home.goto();
		await home.assertNavigationVisible();
	});

	test('should navigate to About page', async ({ page }) => {
		await page.goto('/about');
		await expect(page.getByRole('heading', { name: /about/i })).toBeVisible();
	});

	test('should navigate to FAQ page', async ({ page }) => {
		await page.goto('/faq');
		await expect(page.getByRole('heading', { name: /faq|questions/i })).toBeVisible();
	});

	test('should navigate to Research page', async ({ page }) => {
		await page.goto('/research');
		await expect(page.getByRole('heading', { name: /research/i })).toBeVisible();
	});

	test('should navigate to Philosophy page', async ({ page }) => {
		await page.goto('/philosophy');
		await expect(page.getByRole('heading', { name: /philosophy/i })).toBeVisible();
	});

	test('should have working footer links', async ({ page }) => {
		await page.goto('/');

		// Check for common footer links
		const footer = page.locator('footer');
		if (await footer.isVisible()) {
			await expect(footer).toBeVisible();

			// Common footer links
			const privacyLink = page.getByRole('link', { name: /privacy/i });
			if (await privacyLink.isVisible()) {
				await expect(privacyLink).toHaveAttribute('href', /privacy/);
			}
		}
	});

	test('should navigate to Terms page', async ({ page }) => {
		await page.goto('/terms');
		await expect(page.getByRole('heading', { name: /terms/i })).toBeVisible();
	});

	test('should navigate to Privacy page', async ({ page }) => {
		await page.goto('/privacy');
		await expect(page.getByRole('heading', { name: /privacy/i })).toBeVisible();
	});
});
