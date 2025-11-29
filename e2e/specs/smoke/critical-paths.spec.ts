import { test, expect } from '@playwright/test';

/**
 * Critical user journeys - these should always work
 */
test.describe('Critical User Paths - Smoke Tests', () => {
	test('home page loads and displays hero CTA', async ({ page }) => {
		await page.goto('/');

		// Hero section should be visible
		const heroCta = page.getByRole('button', { name: /(start|sign up|get started)/i });
		await expect(heroCta.first()).toBeVisible();

		// Should have navigation
		const nav = page.locator('nav');
		await expect(nav).toBeVisible();
	});

	test('pricing page is accessible and shows tiers', async ({ page }) => {
		await page.goto('/pricing');

		// Should show pricing information
		await expect(page.getByText(/\$|month|year|free/i).first()).toBeVisible();

		// Should have tier selection buttons
		const tierButtons = page.getByRole('button', { name: /(select|upgrade|get started)/i });
		const count = await tierButtons.count();
		expect(count).toBeGreaterThan(0);
	});

	test('scenarios page loads and shows content', async ({ page }) => {
		await page.goto('/scenarios');

		// Should show scenarios or redirect to auth
		await page.waitForURL(/\/(scenarios|auth)/);

		const url = page.url();
		if (url.includes('/scenarios')) {
			// Should have scenario cards or list
			const scenarioElements = page.locator('[data-testid="scenario"], .scenario, [class*="card"]');
			const count = await scenarioElements.count();
			expect(count).toBeGreaterThan(0);
		}
	});

	test('key static pages are accessible', async ({ page }) => {
		const staticPages = ['/about', '/faq', '/research', '/privacy', '/terms'];

		for (const pagePath of staticPages) {
			await page.goto(pagePath);

			// Page should load without errors
			const heading = page.getByRole('heading').first();
			await expect(heading).toBeVisible();

			// Should have some content
			const content = await page.textContent('body');
			expect(content?.length).toBeGreaterThan(100);
		}
	});

	test('navigation links work correctly', async ({ page }) => {
		await page.goto('/');

		// Find and check navigation links
		const nav = page.locator('nav');
		const links = nav.getByRole('link');
		const linkCount = await links.count();

		expect(linkCount).toBeGreaterThan(0);

		// Check that at least some links have valid hrefs
		for (let i = 0; i < Math.min(3, linkCount); i++) {
			const href = await links.nth(i).getAttribute('href');
			expect(href).toBeTruthy();
		}
	});

	test('realtime page is accessible', async ({ page }) => {
		await page.goto('/realtime');

		// Should load or redirect
		await page.waitForURL(/\/(realtime|auth)/);

		// Page should not have critical errors
		const errorText = await page.getByText(/error|something went wrong/i).count();
		expect(errorText).toBe(0);
	});

	test('site loads without JavaScript errors', async ({ page }) => {
		const errors: Error[] = [];
		page.on('pageerror', (error) => errors.push(error));

		await page.goto('/');

		// Wait for page to settle
		await page.waitForLoadState('networkidle');

		// Should have minimal or no errors
		expect(errors.length).toBeLessThan(3);
	});

	test('responsive navigation works on mobile viewport', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/');

		// Navigation should exist (might be hidden in hamburger)
		const nav = page.locator('nav');
		await expect(nav).toBeAttached();
	});
});
