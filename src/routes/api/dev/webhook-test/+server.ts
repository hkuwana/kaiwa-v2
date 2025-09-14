// src/routes/api/dev/webhook-test/+server.ts
// Simple webhook test endpoint to verify Stripe webhooks are working

import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { RequestHandler } from './$types';

// Only allow in development mode
if (!dev) {
	throw new Error('Webhook test endpoint only available in development');
}

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.text();
	const signature = request.headers.get('stripe-signature');

	console.log('🎣 [WEBHOOK TEST] Received webhook call:');
	console.log('  - Content-Length:', request.headers.get('content-length'));
	console.log('  - Stripe-Signature present:', !!signature);
	console.log('  - Body length:', body.length);
	console.log('  - Body preview:', body.substring(0, 200) + '...');

	if (signature) {
		console.log('  - Signature preview:', signature.substring(0, 50) + '...');
	}

	// Try to parse as JSON to see the event type
	try {
		const event = JSON.parse(body);
		console.log('  - Event type:', event.type);
		console.log('  - Event ID:', event.id);
		console.log('  - Event created:', new Date(event.created * 1000).toISOString());

		if (event.type === 'checkout.session.completed') {
			console.log('🎯 [WEBHOOK TEST] CHECKOUT SESSION COMPLETED detected!');
			console.log('  - Session ID:', event.data.object.id);
			console.log('  - Customer:', event.data.object.customer);
			console.log('  - Subscription:', event.data.object.subscription);
			console.log('  - Metadata:', event.data.object.metadata);
		}
	} catch (parseError) {
		console.log('  - JSON parse error:', parseError);
	}

	return json({
		received: true,
		timestamp: new Date().toISOString(),
		message: 'Webhook test received successfully'
	});
};

export const GET: RequestHandler = async () => {
	return json({
		status: 'Webhook test endpoint is active',
		instructions: [
			'This endpoint helps test if Stripe webhooks are reaching your server',
			'Configure your Stripe webhook URL to: http://localhost:5173/api/dev/webhook-test',
			'Or use Stripe CLI: stripe listen --forward-to localhost:5173/api/dev/webhook-test',
			'Then trigger a test event from Stripe Dashboard or complete a checkout'
		]
	});
};
