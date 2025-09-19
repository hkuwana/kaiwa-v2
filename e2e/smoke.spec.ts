import { test, expect } from '@playwright/test';
import { SmokeTestUtils } from './smoke-utils';

test.describe('Smoke Tests', () => {
	let utils: SmokeTestUtils;

	test.beforeEach(async ({ page }) => {
		utils = new SmokeTestUtils(page);
	});

	test('@smoke should load home page successfully', async ({ page }) => {
		await page.goto('/');
		await utils.waitForPageLoad();

		// Check for the main start button
		await utils.checkMainButtonVisible();

		// Verify page title
		await utils.checkPageTitle(/Kaiwa|Conversation/i);

		// Check for essential UI elements
		await utils.checkNavigationVisible();
	});

	test('@smoke should open selection modal', async ({ page }) => {
		await page.goto('/');
		await utils.waitForPageLoad();

		// Open language selector modal
		await utils.openLanguageSelector();

		// Verify modal content
		await expect(page.getByText(/Select Language|Choose Language/i)).toBeVisible();
	});

	test('@smoke should navigate to conversation page', async ({ page }) => {
		await page.goto('/');
		await utils.waitForPageLoad();

		// Open language selector
		await utils.openLanguageSelector();

		// Select language and speaker
		await utils.selectLanguage('Spanish');
		await utils.selectSpeaker('Nova');

		// Click start button
		const mainButton = await utils.waitForMainButtonEnabled();
		await mainButton.click();

		// Should navigate to conversation page
		await expect(page).toHaveURL('/conversation');
	});

	test('@smoke should show conversation interface', async ({ page }) => {
		await utils.navigateToConversation();

		// Start conversation
		await utils.startConversation();

		// Should show loading screen
		const loadingScreen = page.locator(
			'.loading-screen, [data-testid="loading-screen"], .text-connecting'
		);
		await expect(loadingScreen).toBeVisible({ timeout: 5000 });

		// Should eventually show conversation interface
		await utils.waitForConversationInterface();
	});

	test('@smoke should handle basic recording interaction', async ({ page }) => {
		// Mock API endpoints
		await utils.mockApiResponse('**/api/realtime-session', {
			session_id: 'test-session-123',
			client_secret: {
				value: 'test-secret-key',
				expires_at: Date.now() + 3600000
			}
		});

		await utils.navigateToConversation();

		// Start conversation
		await utils.startConversation();

		// Wait for connection
		const streamButton = await utils.waitForConversationInterface();

		// Start streaming
		await streamButton.click();

		// Verify recording interface appears
		await expect(page.locator('[data-testid="record-button"], .record-button')).toBeVisible({
			timeout: 5000
		});
	});

	test('@smoke should handle authentication flow', async ({ page }) => {
		await page.goto(resolve('/auth'));

		// Check auth page loads
		await expect(page.getByRole('button', { name: /Google|Sign in/i })).toBeVisible();

		// Verify page structure
		await expect(page.locator('form')).toBeVisible();
	});

	test('@smoke should handle pricing page', async ({ page }) => {
		await page.goto('/pricing');

		// Check pricing tiers are visible
		await expect(page.getByText(/Free|Pro|Premium/i)).toBeVisible();

		// Verify pricing structure
		await expect(page.locator('[class*="pricing"], .pricing')).toBeVisible();
	});

	test('@smoke should handle navigation between pages', async ({ page }) => {
		await page.goto('/');

		// Navigate to different pages
		await page.goto('/docs');
		await expect(page).toHaveURL('/docs');

		await page.goto('/privacy');
		await expect(page).toHaveURL('/privacy');

		// Return to home
		await page.goto('/');
		await expect(page).toHaveURL('/');
	});

		// eslint-disable-next-line unused-imports/no-unused-vars
	test('@smoke should handle responsive design', async ({ page }) => {
		await utils.checkResponsiveDesign();
	});

	// eslint-disable-next-line unused-imports/no-unused-vars
	test('@smoke should check critical page accessibility', async ({ page }) => {
		// Test critical pages for essential elements
		const pageTests = [
			{
				path: '/',
				elements: ['nav', 'main', 'button']
			},
			{
				path: '/auth',
				elements: ['form', 'button']
			},
			{
				path: '/pricing',
				elements: ['main', 'section']
			}
		];

		for (const test of pageTests) {
			await utils.checkPageAccessibility(test.path, test.elements);
		}
	});
});
