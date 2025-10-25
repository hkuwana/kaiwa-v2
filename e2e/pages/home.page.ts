import { expect, type Locator, type Page } from '@playwright/test';

export class HomePage {
	readonly page: Page;
	readonly startButton: Locator;
	readonly navBar: Locator;
	readonly languageDropdown: Locator;

	constructor(page: Page) {
		this.page = page;
		this.startButton = page.getByRole('button', { name: /Start (Chat|Roleplay|Conversation|Expert|Practicing)/i });
		this.navBar = page.locator('nav');
		this.languageDropdown = page.locator(
			'[data-testid="language-selector"], [class*="language"], [class*="dropdown"]'
		);
	}

	async goto(): Promise<void> {
		await this.page.goto('/');
	}

	async waitForHeroCta(): Promise<void> {
		await this.startButton.first().waitFor({ state: 'visible' });
	}

	async openLanguageSelector(): Promise<void> {
		await this.waitForHeroCta();
		await this.startButton.first().click();
	}

	async assertNavigationVisible(): Promise<void> {
		await expect(this.navBar).toBeVisible();
	}

	async selectLanguage(languageName: string): Promise<void> {
		const languageOption = this.page.getByRole('button', { name: languageName, exact: false });
		await expect(languageOption).toBeVisible();
		await languageOption.click();
	}

	async expectModalOpen(): Promise<void> {
		await expect(this.languageDropdown).toBeVisible();
	}
	async expectStartButtonLabelContains(text: string): Promise<void> {
		await expect(this.startButton.first()).toContainText(text, { ignoreCase: true });
	}
}
