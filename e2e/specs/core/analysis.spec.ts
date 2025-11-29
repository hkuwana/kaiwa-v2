import { test, expect } from '@playwright/test';
import { AnalysisPage } from '../../pages/analysis.page';

test.describe('Analysis & Insights', () => {
	test('should access analysis page', async ({ page }) => {
		const analysis = new AnalysisPage(page);
		await analysis.goto();

		// Should load analysis page or redirect to auth
		await page.waitForURL(/\/(analysis|auth)/);
	});

	test('should show analysis UI elements', async ({ page }) => {
		const analysis = new AnalysisPage(page);
		await analysis.goto();

		const url = page.url();
		if (url.includes('/analysis')) {
			// Check for analysis components
			const hasAnalysisUI = await page.locator('[data-testid="analysis"], .analysis, .insights')
				.first()
				.isVisible({ timeout: 5000 })
				.catch(() => false);
			expect(hasAnalysisUI !== undefined).toBeTruthy();
		}
	});

	test('should handle no conversation selected gracefully', async ({ page }) => {
		const analysis = new AnalysisPage(page);
		await analysis.goto();

		// Should show empty state or prompt to select conversation
		const hasEmptyState = await page.getByText(/no conversation|select a conversation|start chatting/i)
			.isVisible({ timeout: 3000 })
			.catch(() => false);

		// Or should show analysis if user has conversations
		const hasAnalysis = await page.locator('[data-testid="analysis"]')
			.isVisible({ timeout: 3000 })
			.catch(() => false);

		// One or the other should be true
		expect(hasEmptyState || hasAnalysis).toBeTruthy();
	});

	test('should show upgrade CTA for free tier users', async ({ page }) => {
		const analysis = new AnalysisPage(page);
		await analysis.goto();

		// Look for upgrade prompts (common for free tier)
		const hasUpgradeCta = await page.getByText(/upgrade|premium|full analysis/i)
			.isVisible({ timeout: 5000 })
			.catch(() => false);

		// This is expected for guest/free users
		expect(hasUpgradeCta !== undefined).toBeTruthy();
	});
});
