/**
 * IndexNow Service
 *
 * Notifies search engines (Bing, Yandex, Seznam) about content changes instantly.
 * This speeds up indexing significantly compared to waiting for crawlers.
 *
 * Usage:
 *   import { notifyIndexNow, notifyIndexNowBatch } from '$lib/server/services/indexnow.service';
 *
 *   // Single URL
 *   await notifyIndexNow('https://trykaiwa.com/blog/new-post');
 *
 *   // Multiple URLs (up to 10,000 per request)
 *   await notifyIndexNowBatch([
 *     'https://trykaiwa.com/blog/post-1',
 *     'https://trykaiwa.com/blog/post-2'
 *   ]);
 *
 * @see https://www.indexnow.org/documentation
 */

const INDEXNOW_KEY = 'f8e7d6c5b4a3f2e1d0c9b8a7';
const SITE_HOST = 'trykaiwa.com';
const KEY_LOCATION = `https://${SITE_HOST}/${INDEXNOW_KEY}.txt`;

// IndexNow endpoints - submit to one, they share with others
const INDEXNOW_ENDPOINTS = [
	'https://api.indexnow.org/indexnow', // Microsoft/Bing
	'https://www.bing.com/indexnow' // Bing direct
];

interface IndexNowResponse {
	success: boolean;
	statusCode: number;
	message: string;
}

/**
 * Notify IndexNow about a single URL change
 * @param url - The full URL that was created/updated
 * @returns Promise with success status
 */
export async function notifyIndexNow(url: string): Promise<IndexNowResponse> {
	const endpoint = `${INDEXNOW_ENDPOINTS[0]}?url=${encodeURIComponent(url)}&key=${INDEXNOW_KEY}`;

	try {
		const response = await fetch(endpoint, {
			method: 'GET',
			headers: {
				'Content-Type': 'application/json'
			}
		});

		return {
			success: response.ok || response.status === 202,
			statusCode: response.status,
			message: getStatusMessage(response.status)
		};
	} catch (error) {
		console.error('[IndexNow] Failed to notify:', error);
		return {
			success: false,
			statusCode: 0,
			message: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Notify IndexNow about multiple URL changes (batch submission)
 * Supports up to 10,000 URLs per request
 * @param urls - Array of full URLs that were created/updated
 * @returns Promise with success status
 */
export async function notifyIndexNowBatch(urls: string[]): Promise<IndexNowResponse> {
	if (urls.length === 0) {
		return {
			success: true,
			statusCode: 200,
			message: 'No URLs to submit'
		};
	}

	if (urls.length > 10000) {
		console.warn('[IndexNow] Batch exceeds 10,000 URL limit. Truncating.');
		urls = urls.slice(0, 10000);
	}

	const payload = {
		host: SITE_HOST,
		key: INDEXNOW_KEY,
		keyLocation: KEY_LOCATION,
		urlList: urls
	};

	try {
		const response = await fetch(INDEXNOW_ENDPOINTS[0], {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json; charset=utf-8'
			},
			body: JSON.stringify(payload)
		});

		return {
			success: response.ok || response.status === 202,
			statusCode: response.status,
			message: getStatusMessage(response.status)
		};
	} catch (error) {
		console.error('[IndexNow] Batch submission failed:', error);
		return {
			success: false,
			statusCode: 0,
			message: error instanceof Error ? error.message : 'Unknown error'
		};
	}
}

/**
 * Notify IndexNow about all important site pages
 * Call this after major site updates or deployments
 */
export async function notifyIndexNowSiteUpdate(): Promise<IndexNowResponse> {
	const importantUrls = [
		`https://${SITE_HOST}/`,
		`https://${SITE_HOST}/pricing`,
		`https://${SITE_HOST}/about`,
		`https://${SITE_HOST}/blog`,
		`https://${SITE_HOST}/docs`,
		`https://${SITE_HOST}/faq`,
		`https://${SITE_HOST}/changelog`
	];

	return notifyIndexNowBatch(importantUrls);
}

/**
 * Get human-readable status message for IndexNow response codes
 */
function getStatusMessage(statusCode: number): string {
	switch (statusCode) {
		case 200:
			return 'URL submitted successfully';
		case 202:
			return 'URL received, will be processed later';
		case 400:
			return 'Invalid request (check URL format)';
		case 403:
			return 'Key not valid or mismatch with key file';
		case 422:
			return 'URLs not valid or not owned by the key host';
		case 429:
			return 'Too many requests (rate limited)';
		default:
			return `Unexpected status code: ${statusCode}`;
	}
}

// Export config for testing/verification
export const INDEXNOW_CONFIG = {
	key: INDEXNOW_KEY,
	host: SITE_HOST,
	keyLocation: KEY_LOCATION,
	endpoints: INDEXNOW_ENDPOINTS
};
