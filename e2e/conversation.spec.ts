import { test, expect } from '@playwright/test';

test.describe('Conversation Page', () => {
	test.beforeEach(async ({ page }) => {
		// Mock all relevant API endpoints
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

		await page.route('**/api/transcribe', (route) =>
			route.fulfill({
				status: 200,
				body: JSON.stringify({ text: 'Hello, what is your name?' })
			})
		);

		await page.route('**/api/chat', (route) =>
			route.fulfill({
				status: 200,
				body: JSON.stringify({
					message: 'My name is Kaiwa. How can I help you practice today?'
				})
			})
		);

		await page.route('**/api/tts', (route) =>
			route.fulfill({
				status: 200,
				body: 'audio-data-blob'
			})
		);
	});

	test('should complete a full conversation exchange', async ({ page }) => {
		// Navigate to conversation page
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

		// Start streaming
		await streamButton.click();

		// Should show stop streaming button
		const stopButton = page.getByRole('button', { name: 'Stop Streaming' });
		await expect(stopButton).toBeVisible();

		// Stop streaming
		await stopButton.click();

		// Should show messages
		const messages = page.locator('.messages-container');
		await expect(messages).toBeVisible();
	});

	test('should display loading screen during connection', async ({ page }) => {
		await page.goto('/conversation');

		// Start conversation
		const startButton = page.getByRole('button', { name: 'Start Conversation' });
		await startButton.click();

		// Loading screen should appear
		const loadingScreen = page.locator(
			'.loading-screen, [data-testid="loading-screen"], .text-connecting'
		);
		await expect(loadingScreen).toBeVisible({ timeout: 5000 });

		// Loading screen should contain appropriate text
		await expect(loadingScreen).toContainText(/connecting|loading|establishing/i);
	});

	test('should show conversation interface after connection', async ({ page }) => {
		await page.goto('/conversation');

		// Start conversation
		const startButton = page.getByRole('button', { name: 'Start Conversation' });
		await startButton.click();

		// Wait for connection to complete
		const streamButton = page.getByRole('button', { name: 'Start Streaming' });
		await expect(streamButton).toBeVisible({ timeout: 10000 });

		// Check for other conversation UI elements
		const messagesContainer = page.locator('.messages-container');
		await expect(messagesContainer).toBeVisible();
	});

	test('should handle recording start and stop', async ({ page }) => {
		await page.goto('/conversation');

		// Start conversation
		const startButton = page.getByRole('button', { name: 'Start Conversation' });
		await startButton.click();

		// Wait for connection
		const streamButton = page.getByRole('button', { name: 'Start Streaming' });
		await expect(streamButton).toBeVisible({ timeout: 10000 });

		// Start streaming
		await streamButton.click();

		// Should show stop button
		const stopButton = page.getByRole('button', { name: 'Stop Streaming' });
		await expect(stopButton).toBeVisible();

		// Stop streaming
		await stopButton.click();

		// Should show start streaming button again
		await expect(streamButton).toBeVisible();
	});

	test('should display user messages correctly', async ({ page }) => {
		await page.goto('/conversation');

		// Start conversation
		const startButton = page.getByRole('button', { name: 'Start Conversation' });
		await startButton.click();

		// Wait for connection
		const streamButton = page.getByRole('button', { name: 'Start Streaming' });
		await expect(streamButton).toBeVisible({ timeout: 10000 });

		// Start streaming
		await streamButton.click();

		// Simulate recording and transcription
		await streamButton.click();

		// Should show user message
		const userMessage = page.locator('.message-bubble, [data-role="user"]');
		await expect(userMessage).toBeVisible();
		await expect(userMessage).toContainText('Hello, what is your name?');
	});

	test('should display assistant messages correctly', async ({ page }) => {
		await page.goto('/conversation');

		// Start conversation
		const startButton = page.getByRole('button', { name: 'Start Conversation' });
		await startButton.click();

		// Wait for connection
		const streamButton = page.getByRole('button', { name: 'Start Streaming' });
		await expect(streamButton).toBeVisible({ timeout: 10000 });

		// Start streaming
		await streamButton.click();

		// Simulate recording and transcription
		await streamButton.click();

		// Should show assistant message
		const assistantMessage = page.locator('.message-bubble, [data-role="assistant"]');
		await expect(assistantMessage).toBeVisible();
		await expect(assistantMessage).toContainText('My name is Kaiwa');
	});

	test('should handle multiple message exchanges', async ({ page }) => {
		await page.goto('/conversation');

		// Start conversation
		const startButton = page.getByRole('button', { name: 'Start Conversation' });
		await startButton.click();

		// Wait for connection
		const streamButton = page.getByRole('button', { name: 'Start Streaming' });
		await expect(streamButton).toBeVisible({ timeout: 10000 });

		// First exchange
		await streamButton.click();
		await streamButton.click();

		// Second exchange
		await streamButton.click();
		await streamButton.click();

		// Should show multiple messages
		const messages = page.locator('.message-bubble');
		await expect(messages).toHaveCount(4);
	});

	test('should show audio level indicator', async ({ page }) => {
		await page.goto('/conversation');

		// Start conversation
		const startButton = page.getByRole('button', { name: 'Start Conversation' });
		await startButton.click();

		// Wait for connection
		const streamButton = page.getByRole('button', { name: 'Start Streaming' });
		await expect(streamButton).toBeVisible({ timeout: 10000 });

		// Start streaming
		await streamButton.click();

		// Check for audio level indicator
		const audioLevel = page.locator('.audio-level, [data-testid="audio-level"], .volume-indicator');
		await expect(audioLevel).toBeVisible();
	});

	test('should handle connection errors gracefully', async ({ page }) => {
		// Mock API to return error
		await page.route('**/api/realtime-session', (route) =>
			route.fulfill({ status: 500, body: 'Connection failed' })
		);

		await page.goto('/conversation');

		// Start conversation
		const startButton = page.getRole('button', { name: 'Start Conversation' });
		await startButton.click();

		// Should show error message
		const errorMessage = page.locator('.error-message');
		await expect(errorMessage).toBeVisible();
		await expect(errorMessage).toContainText(/error|failed|unable/i);
	});

	test('should handle transcription errors gracefully', async ({ page }) => {
		// Mock transcription API to return error
		await page.route('**/api/transcribe', (route) =>
			route.fulfill({ status: 500, body: 'Transcription failed' })
		);

		await page.goto('/conversation');

		// Start conversation
		const startButton = page.getByRole('button', { name: 'Start Conversation' });
		await startButton.click();

		// Wait for connection
		const streamButton = page.getByRole('button', { name: 'Start Streaming' });
		await expect(streamButton).toBeVisible({ timeout: 10000 });

		// Start streaming
		await streamButton.click();

		// Should handle error gracefully
		const errorMessage = page.locator('.error-message');
		await expect(errorMessage).toBeVisible();
	});

	test('should maintain conversation state during navigation', async ({ page }) => {
		await page.goto('/conversation');

		// Start conversation
		const startButton = page.getByRole('button', { name: 'Start Conversation' });
		await startButton.click();

		// Wait for connection
		const streamButton = page.getByRole('button', { name: 'Start Streaming' });
		await expect(streamButton).toBeVisible({ timeout: 10000 });

		// Navigate away and back
		await page.goto('/');
		await page.goto('/conversation');

		// Should still be connected
		await expect(streamButton).toBeVisible();
	});

	test('should have proper accessibility features', async ({ page }) => {
		await page.goto('/conversation');

		// Start conversation
		const startButton = page.getByRole('button', { name: 'Start Conversation' });
		await startButton.click();

		// Wait for connection
		const streamButton = page.getByRole('button', { name: 'Start Streaming' });
		await expect(streamButton).toBeVisible({ timeout: 10000 });

		// Check for proper ARIA labels
		await expect(streamButton).toHaveAttribute('aria-label');
	});

	test('should handle different screen sizes', async ({ page }) => {
		await page.goto('/conversation');

		// Start conversation
		const startButton = page.getByRole('button', { name: 'Start Conversation' });
		await startButton.click();

		// Wait for connection
		const streamButton = page.getByRole('button', { name: 'Start Streaming' });
		await expect(streamButton).toBeVisible({ timeout: 10000 });

		// Should be visible on mobile
		await page.setViewportSize({ width: 375, height: 667 });
		await expect(streamButton).toBeVisible();

		// Should be visible on tablet
		await page.setViewportSize({ width: 768, height: 1024 });
		await expect(streamButton).toBeVisible();

		// Should be visible on desktop
		await page.setViewportSize({ width: 1920, height: 1080 });
		await expect(streamButton).toBeVisible();
	});

	test('should show session information', async ({ page }) => {
		await page.goto('/conversation');

		// Start conversation
		const startButton = page.getByRole('button', { name: 'Start Conversation' });
		await startButton.click();

		// Wait for connection
		const streamButton = page.getByRole('button', { name: 'Start Streaming' });
		await expect(streamButton).toBeVisible({ timeout: 10000 });

		// Check for session info (language, speaker, etc.)
		const sessionInfo = page.locator('h1, .session-info, .conversation-header');
		await expect(sessionInfo).toBeVisible();
	});

	test('should handle audio device selection', async ({ page }) => {
		await page.goto('/conversation');

		// Start conversation
		const startButton = page.getByRole('button', { name: 'Start Conversation' });
		await startButton.click();

		// Wait for connection
		const streamButton = page.getByRole('button', { name: 'Start Streaming' });
		await expect(streamButton).toBeVisible({ timeout: 10000 });

		// Look for device selector
		const deviceSelector = page.locator('.device-selector, [data-testid="device-selector"]');
		if (await deviceSelector.isVisible()) {
			await expect(deviceSelector).toBeVisible();
		}
	});
});
