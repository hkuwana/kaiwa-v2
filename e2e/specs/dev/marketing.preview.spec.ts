import { test, expect } from '@playwright/test';

test.describe('Marketing Preview (dev)', () => {
	test('renders feature overview cards', async ({ page }) => {
		await page.goto('/dev/marketing');
		await expect(page.getByRole('heading', { name: /Marketing Preview/i })).toBeVisible();
		await expect(page.getByText(/Value proposition/i)).toBeVisible();
		await expect(page.getByText(/Social proof/i)).toBeVisible();
	});
});
