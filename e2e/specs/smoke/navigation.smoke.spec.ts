import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home.page';

test.describe('Navigation Smoke', () => {
	test('primary navigation exposes accessible links', async ({ page }) => {
		const home = new HomePage(page);
		await home.goto();
		await home.assertNavigationVisible();
		const navLinks = home.navBar.getByRole('link');
		const linkTexts = await navLinks.allTextContents();
		expect(linkTexts.filter((text) => text.trim().length > 0).length).toBeGreaterThanOrEqual(2);
	});
});
