// CSP Violation Reporting Endpoint
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const report = await request.json();

		// Log CSP violations for monitoring
		console.warn('🔒 CSP Violation Report:', {
			timestamp: new Date().toISOString(),
			userAgent: request.headers.get('user-agent'),
			report: report['csp-report'] || report
		});

		// In production, you might want to send this to a monitoring service
		// like Sentry, DataDog, or your own analytics system

		return json({ received: true });
	} catch (error) {
		console.error('Error processing CSP report:', error);
		return json({ error: 'Failed to process report' }, { status: 400 });
	}
};
