// 🧪 Stripe Test Customer API
// Creates test customers for development purposes

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { stripeService } from '$lib/server/services/stripe.service';
import { analytics } from '$lib/server/analyticsService';
import { dev } from '$app/environment';

export const POST: RequestHandler = async ({ locals }) => {
	// Only allow in development
	if (!dev) {
		return json({ error: 'Not available in production' }, { status: 403 });
	}

	try {
		// Get user from session
		const userId = locals.user?.id;
		if (!userId) {
			return json({ error: 'Authentication required' }, { status: 401 });
		}

		// Get user data
		const { db } = await import('$lib/server/db');
		const { users } = await import('$lib/server/db/schema');
		const { eq } = await import('drizzle-orm');

		const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
		if (!user[0]) {
			return json({ error: 'User not found' }, { status: 404 });
		}

        // Create Stripe customer
        const customerId = await stripeService.createCustomer(user[0].id, user[0].email);

		// Track test customer creation
		await analytics.track('test_customer_created', userId, {
			stripe_customer_id: customerId,
			environment: 'development'
		});

		return json({
			success: true,
			customerId,
			message: 'Test customer created successfully'
		});
	} catch (error) {
		console.error('Test customer creation error:', error);

		// Track test failure
		if (locals.user?.id) {
			await analytics.track('test_customer_creation_failed', locals.user.id, {
				error: error instanceof Error ? error.message : 'Unknown error',
				environment: 'development'
			});
		}

		return json(
			{
				error: 'Failed to create test customer',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
