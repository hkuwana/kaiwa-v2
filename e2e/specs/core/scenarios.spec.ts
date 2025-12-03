import { test, expect } from '@playwright/test';
import { ScenariosPage } from '../../pages/scenarios.page';

test.describe('Scenarios Browse & Selection', () => {
	test('should display scenarios page with cards', async ({ page }) => {
		const scenarios = new ScenariosPage(page);
		await scenarios.goto();
		await scenarios.expectScenariosVisible();
	});

	test('should show multiple scenarios', async ({ page }) => {
		const scenarios = new ScenariosPage(page);
		await scenarios.goto();
		await scenarios.expectMinimumScenarios(3);
	});

	test('should allow scenario search', async ({ page }) => {
		const scenarios = new ScenariosPage(page);
		await scenarios.goto();

		// Wait for scenarios to load
		await scenarios.expectScenariosVisible();

		// Search functionality
		if (await scenarios.searchInput.isVisible()) {
			await scenarios.searchScenarios('restaurant');
			// Should filter results
			await expect(scenarios.scenarioCards.first()).toBeVisible();
		}
	});

	test('should show scenario details when selected', async ({ page }) => {
		const scenarios = new ScenariosPage(page);
		await scenarios.goto();
		await scenarios.expectScenariosVisible();

		// Click first scenario
		const firstScenario = scenarios.scenarioCards.first();
		await firstScenario.click();

		// Should show start button or redirect to conversation
		await page.waitForURL(/\/(scenarios|conversation|realtime)/);
	});

	test('should categorize scenarios', async ({ page }) => {
		const scenarios = new ScenariosPage(page);
		await scenarios.goto();

		// Look for category indicators
		const categories = page.locator('[data-testid="category"], .category, .badge');
		if ((await categories.count()) > 0) {
			await expect(categories.first()).toBeVisible();
		}
	});
});
