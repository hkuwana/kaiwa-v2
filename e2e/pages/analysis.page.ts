import { expect, type Locator, type Page } from '@playwright/test';

export class AnalysisPage {
	readonly page: Page;
	readonly insightsSection: Locator;
	readonly vocabularySection: Locator;
	readonly grammarSection: Locator;
	readonly pronounciationSection: Locator;
	readonly progressChart: Locator;
	readonly fullAnalysisCta: Locator;
	readonly downloadButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.insightsSection = page.locator('[data-testid="insights"], .insights');
		this.vocabularySection = page.locator('[data-testid="vocabulary"], .vocabulary');
		this.grammarSection = page.locator('[data-testid="grammar"], .grammar');
		this.pronounciationSection = page.locator('[data-testid="pronunciation"], .pronunciation');
		this.progressChart = page.locator('[data-testid="progress-chart"], .chart');
		this.fullAnalysisCta = page.getByRole('button', { name: /full analysis|upgrade/i });
		this.downloadButton = page.getByRole('button', { name: /download|export/i });
	}

	async goto(): Promise<void> {
		await this.page.goto('/analysis');
	}

	async gotoWithConversationId(conversationId: string): Promise<void> {
		await this.page.goto(`/analysis?conversationId=${conversationId}`);
	}

	async expectQuickInsights(): Promise<void> {
		await expect(this.insightsSection).toBeVisible();
	}

	async expectVocabularyVisible(): Promise<void> {
		await expect(this.vocabularySection).toBeVisible();
	}

	async expectGrammarVisible(): Promise<void> {
		await expect(this.grammarSection).toBeVisible();
	}

	async expectFullAnalysisCta(): Promise<void> {
		await expect(this.fullAnalysisCta).toBeVisible();
	}

	async expectProgressChartVisible(): Promise<void> {
		await expect(this.progressChart).toBeVisible();
	}

	async clickFullAnalysis(): Promise<void> {
		await this.fullAnalysisCta.click();
	}

	async downloadAnalysis(): Promise<void> {
		await this.downloadButton.click();
	}
}
