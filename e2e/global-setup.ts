import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
	const { baseURL } = config.projects[0].use;

	if (baseURL && baseURL !== 'http://localhost:4173') {
		console.log(`🌐 Running smoke tests against: ${baseURL}`);

		// Health check for production
		const browser = await chromium.launch();
		const page = await browser.newPage();

		try {
			await page.goto(baseURL, { timeout: 30000 });
			await page.waitForLoadState('networkidle', { timeout: 10000 });

			// Basic health check
			const title = await page.title();
			console.log(`✅ Production health check passed. Page title: ${title}`);
		} catch (error) {
			console.error(`❌ Production health check failed: ${error}`);
			throw new Error(`Production environment is not accessible: ${error}`);
		} finally {
			await browser.close();
		}
	} else {
		console.log('🏠 Running smoke tests against local development server');
	}
}

export default globalSetup;
