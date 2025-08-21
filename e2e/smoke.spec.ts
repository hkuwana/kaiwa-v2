import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
	test('@smoke should load home page successfully', async ({ page }) => {
		await page.goto('/');

		// Check for the main start button
		const mainButton = page.getByRole('button', {
			name: /Start Speaking|Loading/i
		});
		await expect(mainButton).toBeVisible();
	});

	test('@smoke should open selection modal', async ({ page }) => {
		await page.goto('/');

		// Wait for the button to be enabled
		const mainButton = page.getByRole('button', {
			name: /Start Speaking/i
		});
		await mainButton.waitFor({ state: 'visible', timeout: 10000 });

		// Click to open language selector
		await mainButton.click();

		// Modal should appear
		const modal = page.locator('[class*="absolute top-full"]');
		await expect(modal).toBeVisible();
	});

	test('@smoke should navigate to conversation page', async ({ page }) => {
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

		// Should navigate to conversation page
		await expect(page).toHaveURL('/conversation');
	});

	test('@smoke should show conversation interface', async ({ page }) => {
		await page.goto('/conversation');

		// Should show start conversation button
		const startButton = page.getByRole('button', { name: 'Start Conversation' });
		await expect(startButton).toBeVisible();

		// Start conversation
		await startButton.click();

		// Should show loading screen
		const loadingScreen = page.locator(
			'.loading-screen, [data-testid="loading-screen"], .text-connecting'
		);
		await expect(loadingScreen).toBeVisible({ timeout: 5000 });

		// Should eventually show conversation interface
		const streamButton = page.getByRole('button', { name: 'Start Streaming' });
		await expect(streamButton).toBeVisible({ timeout: 10000 });
	});

	test('@smoke should handle basic recording interaction', async ({ page }) => {
		// Mock API endpoints
		await page.route('**/api/realtime-session', (route) =>
			route.fulfill({
				status: 200,
				body: JSON.stringify({
					session_id: 'test-session-123',
					client_secret: {
						value: 'test-secret-key',
						expires_at: Date.now() + 3600000
					}
				})
			})
		);

		await page.goto('/conversation');

		// Start conversation
		const startButton = page.getByRole('button', { name: 'Start Conversation' });
		await startButton.click();

		// Wait for connection
		const streamButton = page.getByRole('button', { name: 'Start Streaming' });
		await expect(streamButton).toBeVisible({ timeout: 15000 });

		// Start streaming
		await streamButton.click();

		// Should show stop button
		const stopButton = page.getByRole('button', { name: 'Stop Streaming' });
		await expect(stopButton).toBeVisible();

		// Stop streaming
		await stopButton.click();

		// Should return to start streaming
		await expect(streamButton).toBeVisible();
	});
});
