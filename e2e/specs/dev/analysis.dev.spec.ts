import { test } from '@playwright/test';
import { AnalysisPage, DevAnalysisTestPage } from '../../pages/dev-analysis.page';

test.describe('Dev Analysis Harness', () => {
	test('generates quick analysis preview', async ({ page }) => {
		const devAnalysis = new DevAnalysisTestPage(page);
		await devAnalysis.goto();
		await devAnalysis.expectPreviewSummary();
		await devAnalysis.runAnalysis('quick');
		await page.waitForURL('**/analysis?**');
		const analysis = new AnalysisPage(page);
		await analysis.expectQuickInsights();
		await analysis.expectFullAnalysisCta();
	});

	test('supports switching to full mode from harness', async ({ page }) => {
		const devAnalysis = new DevAnalysisTestPage(page);
		await devAnalysis.goto();
		await devAnalysis.expectPreviewSummary();
		await devAnalysis.runAnalysis('full');
		await page.waitForURL('**/analysis?**');
		const analysis = new AnalysisPage(page);
		await analysis.expectQuickInsights();
	});
});
