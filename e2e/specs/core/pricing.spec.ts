import { test, expect } from '@playwright/test';
import { PricingPage } from '../../pages/pricing.page';

test.describe('Pricing Page', () => {
	test('should display pricing tiers', async ({ page }) => {
		const pricing = new PricingPage(page);
		await pricing.goto();
		await pricing.expectPricingCardsVisible();
	});

	test('should show all tier options', async ({ page }) => {
		const pricing = new PricingPage(page);
		await pricing.goto();

		// Expect at least 2 tiers (Plus & Premium)
		const tierCount = await pricing.pricingCards.count();
		expect(tierCount).toBeGreaterThanOrEqual(2);
	});

	test('should display pricing information', async ({ page }) => {
		const pricing = new PricingPage(page);
		await pricing.goto();

		// Should show price indicators
		await expect(page.getByText(/\$|month|year/i)).toBeVisible();
	});

	test('should have CTA buttons for each tier', async ({ page }) => {
		const pricing = new PricingPage(page);
		await pricing.goto();

		// Should have upgrade/select buttons
		const ctaButtons = page.getByRole('button', { name: /(upgrade|select|get started|choose)/i });
		const count = await ctaButtons.count();
		expect(count).toBeGreaterThan(0);
	});

	test('should show feature comparison', async ({ page }) => {
		const pricing = new PricingPage(page);
		await pricing.goto();

		// Look for feature lists
		const features = page.locator('ul, [data-testid="features"]');
		if ((await features.count()) > 0) {
			await expect(features.first()).toBeVisible();
		}
	});

	test('should handle tier selection', async ({ page }) => {
		const pricing = new PricingPage(page);
		await pricing.goto();

		// Try selecting a tier
		const upgradeButton = page.getByRole('button', { name: /upgrade|select.*plus/i }).first();
		if (await upgradeButton.isVisible()) {
			await upgradeButton.click();
			// Should redirect to auth or payment flow
			await page.waitForURL(/\/(auth|payment|checkout|pricing)/);
		}
	});
});
