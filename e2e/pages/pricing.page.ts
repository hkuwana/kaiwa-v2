import { expect, type Locator, type Page } from '@playwright/test';

export class PricingPage {
	readonly page: Page;
	readonly pricingCards: Locator;
	readonly freeTierButton: Locator;
	readonly plusTierButton: Locator;
	readonly premiumTierButton: Locator;
	readonly monthlyToggle: Locator;
	readonly annualToggle: Locator;
	readonly featuresSection: Locator;

	constructor(page: Page) {
		this.page = page;
		this.pricingCards = page.locator('[data-testid="pricing-card"], .pricing-card');
		this.freeTierButton = page.getByRole('button', { name: /free|get started/i });
		this.plusTierButton = page.getByRole('button', { name: /plus|upgrade.*plus/i });
		this.premiumTierButton = page.getByRole('button', { name: /premium|upgrade.*premium/i });
		this.monthlyToggle = page.getByRole('button', { name: /monthly/i });
		this.annualToggle = page.getByRole('button', { name: /annual|yearly/i });
		this.featuresSection = page.locator('[data-testid="features"], .features');
	}

	async goto(): Promise<void> {
		await this.page.goto('/pricing');
	}

	async expectPricingCardsVisible(): Promise<void> {
		await expect(this.pricingCards.first()).toBeVisible();
	}

	async expectTierCount(count: number): Promise<void> {
		await expect(this.pricingCards).toHaveCount(count);
	}

	async selectPlusTier(): Promise<void> {
		await this.plusTierButton.first().click();
	}

	async selectPremiumTier(): Promise<void> {
		await this.premiumTierButton.first().click();
	}

	async toggleAnnualPricing(): Promise<void> {
		await this.annualToggle.click();
	}

	async toggleMonthlyPricing(): Promise<void> {
		await this.monthlyToggle.click();
	}

	async expectPriceVisible(price: string): Promise<void> {
		await expect(this.page.getByText(price, { exact: false })).toBeVisible();
	}

	async expectFeatureVisible(feature: string): Promise<void> {
		await expect(this.page.getByText(feature, { exact: false })).toBeVisible();
	}
}
