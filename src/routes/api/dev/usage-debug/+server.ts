// 📊 Usage Debug API (Development)
// Test and debug usage tracking and tier limits

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { usageService } from '$lib/server/services/usage.service';
import { userRepository } from '$lib/server/repositories';

export const GET: RequestHandler = async ({ locals, url }) => {


	const userId = locals.user?.id;
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const action = url.searchParams.get('action') || 'summary';

	try {
		const result: Record<string, any> = {
			timestamp: new Date().toISOString(),
			userId,
			action,
			method: 'usage_service'
		};

		// Get user info
		const user = await userRepository.findUserById(userId);
		result.user = {
			id: user?.id,
			email: user?.email,
			exists: !!user
		};

		switch (action) {
			case 'summary':
				result.summary = await usageService.getUsageSummary(userId);
				break;

			case 'current':
				result.current = await usageService.getCurrentUsage(userId);
				break;

			case 'history':
				const months = Math.min(parseInt(url.searchParams.get('months') || '3'), 24); // Limit to 24 months max
				result.history = await usageService.getUsageHistory(userId, months);
				result.historyCount = result.history.length;
				break;

			case 'check_conversation':
				result.check = await usageService.canUseFeature(userId, { type: 'conversation' });
				break;

			case 'check_seconds':
				const seconds = parseInt(url.searchParams.get('seconds') || '300');
				result.check = await usageService.canUseFeature(userId, {
					type: 'seconds',
					amount: seconds
				});
				break;

			case 'check_realtime':
				result.check = await usageService.canUseFeature(userId, { type: 'realtime_session' });
				break;

			case 'check_anki':
				result.check = await usageService.canUseFeature(userId, { type: 'anki_export' });
				break;

			case 'check_extensions':
				result.check = await usageService.canUseFeature(userId, { type: 'session_extension' });
				break;

			case 'check_advanced_voice':
				result.check = await usageService.canUseFeature(userId, { type: 'advanced_voice' });
				break;

			case 'all': {
				const [
					summary,
					current,
					history,
					convCheck,
					secCheck,
					rtCheck,
					ankiCheck,
					extCheck,
					voiceCheck
				] = await Promise.all([
					usageService.getUsageSummary(userId),
					usageService.getCurrentUsage(userId),
					usageService.getUsageHistory(userId, 2),
					usageService.canUseFeature(userId, { type: 'conversation' }),
					usageService.canUseFeature(userId, { type: 'seconds', amount: 600 }),
					usageService.canUseFeature(userId, { type: 'realtime_session' }),
					usageService.canUseFeature(userId, { type: 'anki_export' }),
					usageService.canUseFeature(userId, { type: 'session_extension' }),
					usageService.canUseFeature(userId, { type: 'advanced_voice' })
				]);

				result.summary = summary;
				result.current = current;
				result.history = history;
				result.checks = {
					conversation: convCheck,
					seconds: secCheck,
					realtimeSession: rtCheck,
					ankiExport: ankiCheck,
					sessionExtension: extCheck,
					advancedVoice: voiceCheck
				};
				break;
			}

			default:
				throw new Error(`Unknown action: ${action}`);
		}

		console.log(`📊 Usage debug for user ${userId}: action=${action}`);

		return json(result);
	} catch (err) {
		console.error('Usage debug error:', err);
		return json(
			{
				error: 'Debug failed',
				message: err instanceof Error ? err.message : 'Unknown error',
				timestamp: new Date().toISOString()
			},
			{ status: 500 }
		);
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
 

	const userId = locals.user?.id;
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { action, data } = await request.json();

		const result: Record<string, any> = {
			timestamp: new Date().toISOString(),
			userId,
			action,
			success: false
		};

		switch (action) {
			case 'record_conversation':
				await usageService.recordConversation(userId);
				result.success = true;
				result.message = 'Recorded 1 conversation';
				break;

			case 'record_seconds':
				const seconds = data?.seconds || 300;
				await usageService.recordSeconds(userId, seconds);
				result.success = true;
				result.message = `Recorded ${seconds} seconds (${Math.floor(seconds / 60)} minutes)`;
				break;

			case 'record_realtime':
				await usageService.recordRealtimeSession(userId);
				result.success = true;
				result.message = 'Recorded 1 realtime session';
				break;

			case 'record_multiple':
				const usage = {
					conversations: data?.conversations || 0,
					seconds: data?.seconds || 0,
					realtimeSessions: data?.realtimeSessions || 0,
					ankiExports: data?.ankiExports || 0,
					sessionExtensions: data?.sessionExtensions || 0,
					advancedVoiceSeconds: data?.advancedVoiceSeconds || 0,
					completedSessions: data?.completedSessions || 0,
					overageSeconds: data?.overageSeconds || 0
				};
				await usageService.recordUsage(userId, usage);
				result.success = true;
				result.message = `Recorded usage: ${JSON.stringify(usage)}`;
				break;

			case 'record_anki_export':
				await usageService.recordAnkiExport(userId);
				result.success = true;
				result.message = 'Recorded 1 Anki export';
				break;

			case 'record_session_extension':
				await usageService.recordSessionExtension(userId);
				result.success = true;
				result.message = 'Recorded 1 session extension';
				break;

			case 'record_advanced_voice':
				const voiceSeconds = data?.seconds || 60;
				await usageService.recordAdvancedVoice(userId, voiceSeconds);
				result.success = true;
				result.message = `Recorded ${voiceSeconds} seconds of advanced voice usage`;
				break;

			case 'record_completed_session':
				const sessionLength = data?.sessionLength || 300; // 5 minutes default
				await usageService.recordCompletedSession(userId, sessionLength);
				result.success = true;
				result.message = `Recorded completed session (${sessionLength} seconds)`;
				break;

			case 'set_banked_seconds':
				const bankedSeconds = data?.bankedSeconds || 0;
				await usageService.setBankedSeconds(userId, bankedSeconds);
				result.success = true;
				result.message = `Set banked seconds to ${bankedSeconds}`;
				break;

			case 'simulate_heavy_usage':
				// Simulate a month of heavy usage for testing limits
				await usageService.recordUsage(userId, {
					conversations: 15,
					seconds: 3600, // 1 hour
					realtimeSessions: 5,
					ankiExports: 3,
					sessionExtensions: 2,
					advancedVoiceSeconds: 600, // 10 minutes
					completedSessions: 12,
					overageSeconds: 300 // 5 minutes overage
				});
				result.success = true;
				result.message =
					'Simulated heavy usage: 15 conversations, 1 hour, 5 realtime sessions, 3 Anki exports, 2 extensions, 10min advanced voice, 12 completed sessions, 5min overage';
				break;

			case 'reset_usage':
				// Reset current month usage (dev only)
				await usageService.recordUsage(userId, {
					conversations: 0,
					seconds: 0,
					realtimeSessions: 0
				});
				result.success = true;
				result.message = 'Reset usage for current month (set to 0)';
				break;

			default:
				throw new Error(`Unknown action: ${action}`);
		}

		console.log(`📊 Usage debug action ${action} for user ${userId}: success=${result.success}`);

		return json(result);
	} catch (err) {
		console.error('Usage debug POST error:', err);
		return json(
			{
				error: 'Debug action failed',
				message: err instanceof Error ? err.message : 'Unknown error',
				timestamp: new Date().toISOString()
			},
			{ status: 500 }
		);
	}
};
