import { expect, type Locator, type Page } from '@playwright/test';

export class ScenariosPage {
	readonly page: Page;
	readonly scenarioCards: Locator;
	readonly categoryFilter: Locator;
	readonly difficultyFilter: Locator;
	readonly searchInput: Locator;
	readonly startScenarioButton: Locator;

	constructor(page: Page) {
		this.page = page;
		this.scenarioCards = page.locator('[data-testid="scenario-card"], .scenario-card');
		this.categoryFilter = page.locator('[data-testid="category-filter"]');
		this.difficultyFilter = page.locator('[data-testid="difficulty-filter"]');
		this.searchInput = page.getByPlaceholder(/search/i);
		this.startScenarioButton = page.getByRole('button', { name: /start|practice|begin/i });
	}

	async goto(): Promise<void> {
		await this.page.goto('/scenarios');
	}

	async expectScenariosVisible(): Promise<void> {
		await expect(this.scenarioCards.first()).toBeVisible();
	}

	async expectMinimumScenarios(count: number): Promise<void> {
		const actualCount = await this.scenarioCards.count();
		expect(actualCount).toBeGreaterThanOrEqual(count);
	}

	async selectScenario(scenarioName: string): Promise<void> {
		const scenario = this.page.getByText(scenarioName, { exact: false });
		await scenario.click();
	}

	async searchScenarios(query: string): Promise<void> {
		await this.searchInput.fill(query);
	}

	async filterByCategory(category: string): Promise<void> {
		const categoryButton = this.page.getByRole('button', { name: category });
		await categoryButton.click();
	}

	async expectScenarioDetails(scenarioName: string): Promise<void> {
		await expect(this.page.getByText(scenarioName, { exact: false })).toBeVisible();
		await expect(this.startScenarioButton).toBeVisible();
	}

	async startScenario(): Promise<void> {
		await this.startScenarioButton.first().click();
	}
}
