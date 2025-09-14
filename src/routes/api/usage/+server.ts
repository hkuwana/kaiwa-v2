// 📊 Usage API (Production)
// Clean API for checking and recording usage

import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { usageService } from '$lib/server/services/usage.service';

export const GET: RequestHandler = async ({ locals, url }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw error(401, 'Unauthorized');
	}

	const action = url.searchParams.get('action') || 'summary';

	try {
		switch (action) {
			case 'summary':
				return json(await usageService.getUsageSummary(userId));

			case 'current':
				return json(await usageService.getCurrentUsage(userId));

			case 'check': {
				const type = url.searchParams.get('type') as 'conversation' | 'seconds' | 'realtime_session';
				const amount = url.searchParams.get('amount');

				if (!type || !['conversation', 'seconds', 'realtime_session'].includes(type)) {
					throw error(400, 'Invalid type. Must be: conversation, seconds, or realtime_session');
				}

				const feature = { type, ...(amount && { amount: parseInt(amount) }) };
				return json(await usageService.canUseFeature(userId, feature));
			}

			default:
				throw error(400, 'Invalid action. Available: summary, current, check');
		}
	} catch (err) {
		console.error('Usage API error:', err);
		throw error(500, 'Internal server error');
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.id;
	if (!userId) {
		throw error(401, 'Unauthorized');
	}

	try {
		const { action, data } = await request.json();

		switch (action) {
			case 'record': {
				const { conversations, seconds, realtimeSessions } = data || {};

				if (!conversations && !seconds && !realtimeSessions) {
					throw error(400, 'At least one usage type must be provided');
				}

				await usageService.recordUsage(userId, {
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
				await usageService.recordConversation(userId);
				return json({ success: true, message: 'Conversation usage recorded' });

			case 'record_seconds': {
				const seconds = data?.seconds;
				if (!seconds || seconds <= 0) {
					throw error(400, 'Valid seconds amount required');
				}
				await usageService.recordSeconds(userId, seconds);
				return json({ success: true, message: `${seconds} seconds recorded` });
			}

			case 'record_realtime_session':
				await usageService.recordRealtimeSession(userId);
				return json({ success: true, message: 'Realtime session usage recorded' });

			default:
				throw error(400, 'Invalid action. Available: record, record_conversation, record_seconds, record_realtime_session');
		}
	} catch (err) {
		console.error('Usage API POST error:', err);
		throw error(500, 'Internal server error');
	}
};