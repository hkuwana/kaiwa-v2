import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import {
	notifyIndexNow,
	notifyIndexNowBatch,
	notifyIndexNowSiteUpdate
} from '$lib/server/services/indexnow.service';

/**
 * POST /api/seo/indexnow
 *
 * Notify search engines about URL changes via IndexNow protocol.
 * This speeds up Bing/Perplexity indexing significantly.
 *
 * Request body:
 *   { "url": "https://trykaiwa.com/blog/new-post" }
 *   or
 *   { "urls": ["https://trykaiwa.com/blog/post-1", "https://trykaiwa.com/blog/post-2"] }
 *   or
 *   { "siteUpdate": true } // Notifies about all important pages
 */
export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();

		// Site-wide update
		if (body.siteUpdate === true) {
			const result = await notifyIndexNowSiteUpdate();
			return json({
				success: result.success,
				type: 'siteUpdate',
				statusCode: result.statusCode,
				message: result.message
			});
		}

		// Batch URL submission
		if (Array.isArray(body.urls) && body.urls.length > 0) {
			const result = await notifyIndexNowBatch(body.urls);
			return json({
				success: result.success,
				type: 'batch',
				urlCount: body.urls.length,
				statusCode: result.statusCode,
				message: result.message
			});
		}

		// Single URL submission
		if (typeof body.url === 'string' && body.url.startsWith('http')) {
			const result = await notifyIndexNow(body.url);
			return json({
				success: result.success,
				type: 'single',
				url: body.url,
				statusCode: result.statusCode,
				message: result.message
			});
		}

		return json(
			{
				success: false,
				error: 'Invalid request. Provide "url", "urls" array, or "siteUpdate: true"'
			},
			{ status: 400 }
		);
	} catch (error) {
		console.error('[IndexNow API] Error:', error);
		return json(
			{
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};

/**
 * GET /api/seo/indexnow
 *
 * Returns IndexNow configuration info (for debugging)
 */
export const GET: RequestHandler = async () => {
	return json({
		service: 'IndexNow',
		description: 'Instant indexing notification for Bing, Yandex, and other search engines',
		usage: {
			singleUrl: 'POST with { "url": "https://..." }',
			batchUrls: 'POST with { "urls": ["https://...", ...] }',
			siteUpdate: 'POST with { "siteUpdate": true }'
		},
		documentation: 'https://www.indexnow.org/documentation'
	});
};
