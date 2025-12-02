// 🧪 Stripe Test Customer API
// Creates test customers for development purposes

import { json } from '@sveltejs/kit';
import { stripeService } from '$lib/server/services/stripe.service';
import { analytics } from '$lib/server/analytics-service';
import { dev } from '$app/environment';
import { userRepository } from '$lib/server/repositories/user.repository';

export const POST = async ({ locals }) => {
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

		const user = await userRepository.findUserById(userId);
		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		if (!user.email) {
			return json({ error: 'User email required to create Stripe customer' }, { status: 400 });
		}

		// Create Stripe customer
		const customerId = await stripeService.createCustomer(user.id, user.email);

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
