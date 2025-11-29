import { expect, type Locator, type Page } from '@playwright/test';

export class ConversationPage {
	readonly page: Page;
	readonly startButton: Locator;
	readonly languageSelector: Locator;
	readonly scenarioCard: Locator;
	readonly messageInput: Locator;
	readonly sendButton: Locator;
	readonly chatMessages: Locator;
	readonly endCallButton: Locator;
	readonly muteButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.startButton = page.getByRole('button', { name: /start/i });
		this.languageSelector = page.locator('[data-testid="language-selector"]');
		this.scenarioCard = page.locator('[data-testid="scenario-card"]');
		this.messageInput = page.getByPlaceholder(/type|message|speak/i);
		this.sendButton = page.getByRole('button', { name: /send|submit/i });
		this.chatMessages = page.locator('[data-testid="chat-message"], .message, .chat-bubble');
		this.endCallButton = page.getByRole('button', { name: /end|stop|finish/i });
		this.muteButton = page.getByRole('button', { name: /mute|unmute/i });
	}

	async goto(): Promise<void> {
		await this.page.goto('/conversation');
	}

	async selectLanguage(language: string): Promise<void> {
		const languageButton = this.page.getByRole('button', { name: language });
		await languageButton.click();
	}

	async selectScenario(scenarioName: string): Promise<void> {
		const scenario = this.page.getByText(scenarioName, { exact: false });
		await scenario.click();
	}

	async sendMessage(message: string): Promise<void> {
		await this.messageInput.fill(message);
		await this.sendButton.click();
	}

	async expectConversationStarted(): Promise<void> {
		await expect(this.endCallButton).toBeVisible({ timeout: 10000 });
	}

	async expectMessageVisible(text: string): Promise<void> {
		await expect(this.page.getByText(text, { exact: false })).toBeVisible();
	}

	async expectMessagesCount(minCount: number): Promise<void> {
		await expect(this.chatMessages).toHaveCount(minCount, { timeout: 10000 });
	}

	async endConversation(): Promise<void> {
		await this.endCallButton.click();
	}

	async expectAudioControlsVisible(): Promise<void> {
		await expect(this.muteButton).toBeVisible();
	}
}
