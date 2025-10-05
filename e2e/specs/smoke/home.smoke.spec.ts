import { test, expect } from '@playwright/test';
import { HomePage } from '../../pages/home.page';

test.describe('Home Smoke', () => {
	test('loads hero CTA and navigation', async ({ page }) => {
		const home = new HomePage(page);
		await home.goto();
		await home.waitForHeroCta();
		await home.assertNavigationVisible();
	});

	test('opens language selector and shows options', async ({ page }) => {
		const home = new HomePage(page);
		await home.goto();
		await home.openLanguageSelector();
		await home.expectModalOpen();
		await home.selectLanguage('Spanish');
		await home.expectStartButtonLabelContains('Spanish');
	});

	test('language selector stays accessible on repeated openings', async ({ page }) => {
		const home = new HomePage(page);
		await home.goto();
		await home.openLanguageSelector();
		await page.keyboard.press('Escape');
		await expect(home.languageDropdown).toBeHidden();
		await home.openLanguageSelector();
		await home.expectModalOpen();
	});
});
