import { expect, type Page } from '@playwright/test';

export class DevAnalysisTestPage {
	constructor(private readonly page: Page) {}

	async goto(): Promise<void> {
		await this.page.goto('/dev/analysis-test');
	}

	async runAnalysis(mode: 'quick' | 'full' = 'quick'): Promise<void> {
		if (mode === 'full') {
			await this.page.getByRole('radio', { name: 'Full' }).check();
		} else {
			await this.page.getByRole('radio', { name: 'Quick' }).check();
		}

		await this.page.getByRole('button', { name: 'Test Analysis' }).click();
	}

	async expectPreviewSummary(): Promise<void> {
		await expect(this.page.getByText('Analysis Testing Tool')).toBeVisible();
	}
}

export class AnalysisPage {
	constructor(private readonly page: Page) {}

	async expectQuickInsights(): Promise<void> {
		await expect(this.page.getByRole('heading', { name: /Quick Insights/i })).toBeVisible();
		await expect(this.page.getByText(/Conversation Overview/i)).toBeVisible();
	}

	async expectFullAnalysisCta(): Promise<void> {
		await expect(this.page.getByRole('button', { name: /Get Full Analysis/i })).toBeVisible();
	}
}
