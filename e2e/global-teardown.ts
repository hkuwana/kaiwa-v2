import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
	const { baseURL } = config.projects[0].use;

	if (baseURL && baseURL !== 'http://localhost:4173') {
		console.log(`🏁 Completed smoke tests against: ${baseURL}`);
		console.log('📊 Check the test results above for any failures');
	} else {
		console.log('🏁 Completed local smoke tests');
	}

	// Add any additional cleanup here if needed
}

export default globalTeardown;
