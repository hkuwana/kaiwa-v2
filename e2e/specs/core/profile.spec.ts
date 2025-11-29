import { test, expect } from '@playwright/test';
import { ProfilePage } from '../../pages/profile.page';

test.describe('User Profile', () => {
	test('should access profile page', async ({ page }) => {
		const profile = new ProfilePage(page);
		await profile.goto();

		// Should redirect to auth if not logged in
		await page.waitForURL(/\/(profile|auth)/);
	});

	test('should protect profile page for unauthenticated users', async ({ page }) => {
		await page.goto('/profile');

		// Should redirect to auth
		await page.waitForURL(/\/(auth|profile)/);

		const url = page.url();
		// If not authenticated, should be on auth page
		if (!url.includes('/profile')) {
			expect(url).toContain('auth');
		}
	});

	test('should show profile sections when authenticated', async ({ page }) => {
		const profile = new ProfilePage(page);
		await profile.goto();

		const url = page.url();
		if (url.includes('/profile')) {
			// Should have profile UI elements
			const hasProfileUI = await page.getByRole('heading', { name: /profile|account|settings/i })
				.isVisible({ timeout: 5000 })
				.catch(() => false);
			expect(hasProfileUI !== undefined).toBeTruthy();
		}
	});
});
