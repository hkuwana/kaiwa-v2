import { expect, type Locator, type Page } from '@playwright/test';

export class ProfilePage {
	readonly page: Page;
	readonly displayNameInput: Locator;
	readonly avatarUpload: Locator;
	readonly languagePreferences: Locator;
	readonly notificationSettings: Locator;
	readonly saveButton: Locator;
	readonly successMessage: Locator;
	readonly subscriptionSection: Locator;
	readonly usageStats: Locator;

	constructor(page: Page) {
		this.page = page;
		this.displayNameInput = page.getByLabel(/name|display name/i);
		this.avatarUpload = page.locator('input[type="file"]');
		this.languagePreferences = page.locator('[data-testid="language-preferences"]');
		this.notificationSettings = page.locator('[data-testid="notification-settings"]');
		this.saveButton = page.getByRole('button', { name: /save|update/i });
		this.successMessage = page.locator('[role="alert"].success, .alert-success');
		this.subscriptionSection = page.locator('[data-testid="subscription"], .subscription');
		this.usageStats = page.locator('[data-testid="usage-stats"], .usage');
	}

	async goto(): Promise<void> {
		await this.page.goto('/profile');
	}

	async updateDisplayName(name: string): Promise<void> {
		await this.displayNameInput.fill(name);
	}

	async saveProfile(): Promise<void> {
		await this.saveButton.click();
	}

	async expectSaveSuccess(): Promise<void> {
		await expect(this.successMessage).toBeVisible();
	}

	async expectSubscriptionVisible(): Promise<void> {
		await expect(this.subscriptionSection).toBeVisible();
	}

	async expectUsageStatsVisible(): Promise<void> {
		await expect(this.usageStats).toBeVisible();
	}

	async expectProfileDataLoaded(username: string): Promise<void> {
		await expect(this.displayNameInput).toHaveValue(username);
	}
}
