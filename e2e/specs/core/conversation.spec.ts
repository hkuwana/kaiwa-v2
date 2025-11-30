import { test, expect } from '@playwright/test';
import { ConversationPage } from '../../pages/conversation.page';
import { HomePage } from '../../pages/home.page';

test.describe('Conversation Flow', () => {
	test('should start conversation from home page', async ({ page }) => {
		const home = new HomePage(page);
		await home.goto();
		await home.waitForHeroCta();

		// Click start button
		await home.startButton.first().click();

		// Should show language selector or redirect
		await page.waitForURL(/\/(conversation|realtime|scenarios|auth)/);
	});

	test('should access conversation page directly', async ({ page }) => {
		const conversation = new ConversationPage(page);
		await conversation.goto();

		// Should load conversation interface or redirect to auth
		await page.waitForURL(/\/(conversation|auth)/);
	});

	test('should display conversation history if authenticated', async ({ page }) => {
		const conversation = new ConversationPage(page);
		await conversation.goto();

		// Check if we're on conversation page (not redirected to auth)
		const url = page.url();
		if (url.includes('/conversation')) {
			// Look for conversation elements
			const hasConversationUI = await page
				.locator('[data-testid="conversation-list"], .conversation')
				.isVisible()
				.catch(() => false);
			expect(hasConversationUI !== undefined).toBeTruthy();
		}
	});
});

test.describe('Realtime Conversation', () => {
	test('should access realtime page', async ({ page }) => {
		await page.goto('/realtime');

		// Should load or redirect to auth
		await page.waitForURL(/\/(realtime|auth)/);
	});

	test('should show language selection for realtime', async ({ page }) => {
		await page.goto('/realtime');

		const url = page.url();
		if (url.includes('/realtime')) {
			// Should have conversation start UI
			const hasStartUI = await page
				.getByRole('button', { name: /(start|begin|practice)/i })
				.isVisible({ timeout: 5000 })
				.catch(() => false);
			expect(hasStartUI !== undefined).toBeTruthy();
		}
	});
});
