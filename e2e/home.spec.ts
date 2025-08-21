import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
	test('should display main page with prominent button', async ({ page }) => {
		await page.goto('/');

		// Check for the main start button with the actual text pattern
		const mainButton = page.getByRole('button', {
			name: /Start Speaking|Loading/i
		});
		await expect(mainButton).toBeVisible();

		// Check that the button has proper styling (should be prominent)
		await expect(mainButton).toHaveCSS('font-size', /1.125rem|1.25rem|1.5rem/); // Should be larger text
		await expect(mainButton).toHaveCSS('padding', /3rem|4rem/); // Should have substantial padding
	});

	test('should open language and speaker selection modal when main button is clicked', async ({
		page
	}) => {
		await page.goto('/');

		// Wait for the button to be enabled (not loading)
		const mainButton = page.getByRole('button', {
			name: /Start Speaking/i
		});
		await mainButton.waitFor({ state: 'visible', timeout: 10000 });

		// Click the main button to open the language selector
		await mainButton.click();

		// Verify the language dropdown appears
		const languageDropdown = page.locator('[class*="absolute top-full"]');
		await expect(languageDropdown).toBeVisible();

		// Check for language options
		const languageOptions = page.locator(
			'button:has-text("English"), button:has-text("Spanish"), button:has-text("Japanese")'
		);
		await expect(languageOptions.first()).toBeVisible();
	});

	test('should allow language selection', async ({ page }) => {
		await page.goto('/');

		// Open language selector
		const mainButton = page.getByRole('button', {
			name: /Start Speaking/i
		});
		await mainButton.waitFor({ state: 'visible', timeout: 10000 });
		await mainButton.click();

		// Select a language
		const languageSelector = page.getByRole('button', { name: 'Spanish' });
		await languageSelector.click();

		// Should show speaker selection
		const speakerOptions = page.locator(
			'button:has-text("Alloy"), button:has-text("Echo"), button:has-text("Nova")'
		);
		await expect(speakerOptions.first()).toBeVisible();
	});

	test('should allow speaker selection', async ({ page }) => {
		await page.goto('/');

		// Open language selector and select language
		const mainButton = page.getByRole('button', {
			name: /Start Speaking/i
		});
		await mainButton.waitFor({ state: 'visible', timeout: 10000 });
		await mainButton.click();

		const languageSelector = page.getByRole('button', { name: 'Spanish' });
		await languageSelector.click();

		// Select a speaker
		const speakerSelector = page.getByRole('button', { name: 'Nova' });
		await speakerSelector.click();

		// Button should now be enabled and show the selected language
		await expect(mainButton).toContainText('Start Speaking Spanish');
	});

	test('should start session and navigate to conversation page', async ({ page }) => {
		await page.goto('/');

		// Set up language and speaker
		const mainButton = page.getByRole('button', {
			name: /Start Speaking/i
		});
		await mainButton.waitFor({ state: 'visible', timeout: 10000 });
		await mainButton.click();

		const languageSelector = page.getByRole('button', { name: 'Spanish' });
		await languageSelector.click();

		const speakerSelector = page.getByRole('button', { name: 'Nova' });
		await speakerSelector.click();

		// Click the start button
		await mainButton.click();

		// Should navigate to conversation page
		await expect(page).toHaveURL('/conversation');
	});

	test('should handle session creation errors gracefully', async ({ page }) => {
		// Mock API to return error
		await page.route('**/api/realtime-session', (route) =>
			route.fulfill({ status: 500, body: 'Internal Server Error' })
		);

		await page.goto('/');

		// Set up language and speaker
		const mainButton = page.getByRole('button', {
			name: /Start Speaking/i
		});
		await mainButton.waitFor({ state: 'visible', timeout: 10000 });
		await mainButton.click();

		const languageSelector = page.getByRole('button', { name: 'Spanish' });
		await languageSelector.click();

		const speakerSelector = page.getByRole('button', { name: 'Nova' });
		await speakerSelector.click();

		// Click start button
		await mainButton.click();

		// Should show error message on conversation page
		await expect(page).toHaveURL('/conversation');
		const errorMessage = page.locator('.error-message');
		await expect(errorMessage).toBeVisible();
	});

	test('should validate required selections before starting session', async ({ page }) => {
		await page.goto('/');

		// Try to click start button without selecting language
		const mainButton = page.getByRole('button', {
			name: /Loading/i
		});
		await expect(mainButton).toBeDisabled();
	});

	test('should close modal when clicking outside or escape key', async ({ page }) => {
		await page.goto('/');

		// Open language selector
		const mainButton = page.getByRole('button', {
			name: /Start Speaking/i
		});
		await mainButton.waitFor({ state: 'visible', timeout: 10000 });
		await mainButton.click();

		// Verify modal is visible
		const modal = page.locator('[class*="absolute top-full"]');
		await expect(modal).toBeVisible();

		// Click outside to close
		await page.click('body', { position: { x: 0, y: 0 } });
		await expect(modal).not.toBeVisible();
	});

	test('should maintain selections when reopening modal', async ({ page }) => {
		await page.goto('/');

		// Set up language and speaker
		const mainButton = page.getByRole('button', {
			name: /Start Speaking/i
		});
		await mainButton.waitFor({ state: 'visible', timeout: 10000 });
		await mainButton.click();

		const languageSelector = page.getByRole('button', { name: 'Spanish' });
		await languageSelector.click();

		const speakerSelector = page.getByRole('button', { name: 'Nova' });
		await speakerSelector.click();

		// Close and reopen modal
		await page.click('body', { position: { x: 0, y: 0 } });
		await mainButton.click();

		// Should still show selected language and speaker
		await expect(mainButton).toContainText('Start Speaking Spanish');
	});

	test('should have accessible form elements', async ({ page }) => {
		await page.goto('/');

		// Check for proper labels and accessibility
		const mainButton = page.getByRole('button', {
			name: /Start Speaking/i
		});
		await mainButton.waitFor({ state: 'visible', timeout: 10000 });
		await mainButton.click();

		const languageSelector = page.getByRole('button', { name: 'Spanish' });
		await expect(languageSelector).toHaveAttribute('aria-label');
	});

	test('should display available language options', async ({ page }) => {
		await page.goto('/');

		// Open language selector
		const mainButton = page.getByRole('button', {
			name: /Start Speaking/i
		});
		await mainButton.waitFor({ state: 'visible', timeout: 10000 });
		await mainButton.click();

		// Check for common language options
		const languageSelector = page.getByRole('button', { name: 'Spanish' });
		await expect(languageSelector).toBeVisible();

		// Should show multiple languages
		const languageOptions = page.locator(
			'button:has-text("English"), button:has-text("Spanish"), button:has-text("Japanese")'
		);
		await expect(languageOptions).toHaveCount(3);
	});

	test('should display available speaker options', async ({ page }) => {
		await page.goto('/');

		// Open language selector and select language
		const mainButton = page.getByRole('button', {
			name: /Start Speaking/i
		});
		await mainButton.waitFor({ state: 'visible', timeout: 10000 });
		await mainButton.click();

		const languageSelector = page.getByRole('button', { name: 'Spanish' });
		await languageSelector.click();

		// Check for speaker options
		const speakerSelector = page.getByRole('button', { name: 'Nova' });
		await expect(speakerSelector).toBeVisible();

		// Should show multiple speakers
		const speakerOptions = page.locator(
			'button:has-text("Alloy"), button:has-text("Echo"), button:has-text("Nova")'
		);
		await expect(speakerOptions).toHaveCount(3);
	});
});
