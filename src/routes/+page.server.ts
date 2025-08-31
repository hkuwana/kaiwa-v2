import type { PageServerLoad } from './$types';
import { subscriptionRepository } from '$lib/server/repositories';

export const load: PageServerLoad = async ({ locals }) => {
	// Get user data from locals (set by hooks.server.ts)
	const user = locals.user || null;

	// If user exists, also load their active subscription to determine effective tier
	let subscription = null;
	if (user) {
		try {
			subscription = await subscriptionRepository.findActiveSubscriptionByUserId(user.id);
		} catch (error) {
			console.error('Error fetching user subscription:', error);
		}
	}

	return {
		user,
		subscription
	};
};
