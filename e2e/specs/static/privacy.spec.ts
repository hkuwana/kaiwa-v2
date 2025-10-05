import { test } from '@playwright/test';
import { StaticPage } from '../../pages/static.page';

test.describe('Privacy Page', () => {
	test('shows policy overview', async ({ page }) => {
		const privacy = new StaticPage(page);
		await privacy.goto('/privacy');
		await privacy.expectHeading(/Privacy/i);
		await privacy.expectContentContains('Language analysis');
	});
});
