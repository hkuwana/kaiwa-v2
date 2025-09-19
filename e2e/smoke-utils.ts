import { Page, expect } from '@playwright/test';

export class SmokeTestUtils {
	constructor(private page: Page) {}

	async waitForPageLoad(timeout = 10000) {
		await this.page.waitForLoadState('networkidle', { timeout });
	}

	async checkPageTitle(expectedPattern: RegExp) {
		await expect(this.page).toHaveTitle(expectedPattern);
	}

	async checkNavigationVisible() {
		await expect(this.page.locator('nav')).toBeVisible();
	}

	async checkMainButtonVisible() {
		const mainButton = this.page.getByRole('button', {
			name: /Start Speaking|Loading/i
		});
		await expect(mainButton).toBeVisible();
		return mainButton;
	}

	async waitForMainButtonEnabled(timeout = 10000) {
		const mainButton = this.page.getByRole('button', {
			name: /Start Speaking/i
		});
		await mainButton.waitFor({ state: 'visible', timeout });
		return mainButton;
	}

	async openLanguageSelector() {
		const mainButton = await this.waitForMainButtonEnabled();
		await mainButton.click();

		const modal = this.page.locator('[class*="absolute top-full"]');
		await expect(modal).toBeVisible();
		return modal;
	}

	async selectLanguage(languageName: string) {
		const languageSelector = this.page.getByRole('button', { name: languageName });
		await languageSelector.click();
	}

	async selectSpeaker(speakerName: string) {
		const speakerSelector = this.page.getByRole('button', { name: speakerName });
		await speakerSelector.click();
	}

	async navigateToConversation() {
		await this.page.goto('/conversation');
	}

	async startConversation() {
		const startButton = this.page.getByRole('button', { name: 'Start Conversation' });
		await expect(startButton).toBeVisible();
		await startButton.click();
	}

	async waitForConversationInterface(timeout = 15000) {
		const streamButton = this.page.getByRole('button', { name: 'Start Streaming' });
		await expect(streamButton).toBeVisible({ timeout });
		return streamButton;
	}

	async checkResponsiveDesign() {
		const viewports = [
			{ width: 375, height: 667, name: 'Mobile' },
			{ width: 768, height: 1024, name: 'Tablet' },
			{ width: 1280, height: 720, name: 'Desktop' }
		];

		for (const viewport of viewports) {
			await this.page.setViewportSize(viewport);
			await this.page.goto('/');
			await expect(this.page.locator('nav')).toBeVisible();
			console.log(`✅ ${viewport.name} viewport test passed`);
		}
	}

	async checkPageAccessibility(pagePath: string, expectedElements: string[]) {
		await this.page.goto(pagePath);

		for (const element of expectedElements) {
			await expect(this.page.locator(element)).toBeVisible();
		}

		console.log(`✅ Accessibility check passed for ${pagePath}`);
	}

	async mockApiResponse(
		pattern: string,
		response: { [key: string]: string | number | { [key: string]: string | number } }
	) {
		await this.page.route(pattern, (route) =>
			route.fulfill({
				status: 200,
				body: JSON.stringify(response)
			})
		);
	}
}
