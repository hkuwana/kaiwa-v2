// src/routes/api/dev/stripe-setup-check/+server.ts
// Check Stripe webhook and environment setup

import { json } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

// Only allow in development mode
if (!dev) {
	throw new Error('Setup check endpoint only available in development');
}

export const GET: RequestHandler = async () => {
	const setupInfo = {
		timestamp: new Date().toISOString(),
		environment: 'development',
		stripe: {
			hasSecretKey: !!env.STRIPE_SECRET_KEY,
			secretKeyPrefix: env.STRIPE_SECRET_KEY?.substring(0, 12) + '...',
			hasWebhookSecret: !!env.STRIPE_WEBHOOK_SECRET,
			webhookSecretPrefix: env.STRIPE_WEBHOOK_SECRET?.substring(0, 12) + '...',
			hasPublishableKey: !!env.STRIPE_PUBLISHABLE_KEY,
			publishableKeyPrefix: env.STRIPE_PUBLISHABLE_KEY?.substring(0, 12) + '...',
		},
		webhookEndpoints: {
			main: 'http://localhost:5173/api/stripe/webhook',
			test: 'http://localhost:5173/api/dev/webhook-test',
			setupCheck: 'http://localhost:5173/api/dev/stripe-setup-check'
		},
		setupInstructions: {
			step1: 'Install Stripe CLI: brew install stripe/stripe-cli/stripe',
			step2: 'Login to Stripe: stripe login',
			step3: 'Forward webhooks: stripe listen --forward-to localhost:5173/api/stripe/webhook',
			step4: 'Copy the webhook secret (whsec_...) to your .env file as STRIPE_WEBHOOK_SECRET',
			alternativeStep3: 'Or use ngrok: ngrok http 5173',
			alternativeStep4: 'Then configure webhook URL in Stripe Dashboard to your ngrok URL'
		},
		requiredEvents: [
			'checkout.session.completed',
			'customer.subscription.created', 
			'customer.subscription.updated',
			'payment_intent.succeeded'
		],
		troubleshooting: {
			noWebhooks: 'If webhooks not received, check Stripe CLI is running or ngrok is active',
			wrongSecret: 'If webhook signature fails, verify STRIPE_WEBHOOK_SECRET matches your setup',
			noResponse: 'If checkout succeeds but no tier update, check webhook events are configured'
		}
	};

	return json(setupInfo);
};