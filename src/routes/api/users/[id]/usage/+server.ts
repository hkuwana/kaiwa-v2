// 📊 Usage API (Production)
// Clean API for checking and recording usage

import { json, error } from '@sveltejs/kit';
import { usageService } from '$lib/server/services/usage.service';
import { tierService } from '$lib/server/tier-service';

export const GET = async ({ locals, params, url }) => {
	const requestedUserId = params.id;
	const currentUserId = locals.user?.id;

	if (!currentUserId) {
		throw error(401, 'Unauthorized');
	}

	// For now, only allow users to see their own usage
	if (currentUserId !== requestedUserId) {
		throw error(403, 'Forbidden');
	}

	const action = url.searchParams.get('action') || 'status';

	try {
		switch (action) {
			case 'status':
				return json(await tierService.getUsageStatus(requestedUserId));
			case 'summary':
				return json(await usageService.getUsageSummary(requestedUserId));

			case 'current':
				return json(await usageService.getCurrentUsage(requestedUserId));

			case 'check': {
				const type = url.searchParams.get('type') as
					| 'conversation'
					| 'seconds'
					| 'realtime_session';
				const amount = url.searchParams.get('amount');

				if (!type || !['conversation', 'seconds', 'realtime_session'].includes(type)) {
					throw error(400, 'Invalid type. Must be: conversation, seconds, or realtime_session');
				}

				const feature = { type, ...(amount && { amount: parseInt(amount) }) };
				return json(await usageService.canUseFeature(requestedUserId, feature));
			}

			default:
				throw error(400, 'Invalid action. Available: status, summary, current, check');
		}
	} catch (err) {
		console.error('Usage API error:', err);
		throw error(500, 'Internal server error');
	}
};

export const POST = async ({ request, locals, params }) => {
	const requestedUserId = params.id;
	const currentUserId = locals.user?.id;

	if (!currentUserId) {
		throw error(401, 'Unauthorized');
	}

	// For now, only allow users to record their own usage
	if (currentUserId !== requestedUserId) {
		throw error(403, 'Forbidden');
	}

	try {
		const { action, data } = await request.json();

		switch (action) {
			case 'record': {
				const { conversations, seconds, realtimeSessions } = data || {};

				if (!conversations && !seconds && !realtimeSessions) {
					throw error(400, 'At least one usage type must be provided');
				}

				await usageService.recordUsage(requestedUserId, {
					conversations,
					seconds,
					realtimeSessions
				});

				return json({
					success: true,
					message: 'Usage recorded successfully',
					recorded: { conversations, seconds, realtimeSessions }
				});
			}

			case 'record_conversation':
				await usageService.recordConversation(requestedUserId);
				return json({ success: true, message: 'Conversation usage recorded' });

			case 'record_seconds': {
				const seconds = data?.seconds;
				if (!seconds || seconds <= 0) {
					throw error(400, 'Valid seconds amount required');
				}
				await usageService.recordSeconds(requestedUserId, seconds);
				return json({ success: true, message: `${seconds} seconds recorded` });
			}

			case 'record_realtime_session':
				await usageService.recordRealtimeSession(requestedUserId);
				return json({ success: true, message: 'Realtime session usage recorded' });

			default:
				throw error(
					400,
					'Invalid action. Available: record, record_conversation, record_seconds, record_realtime_session'
				);
		}
	} catch (err) {
		console.error('Usage API POST error:', err);
		throw error(500, 'Internal server error');
	}
};
