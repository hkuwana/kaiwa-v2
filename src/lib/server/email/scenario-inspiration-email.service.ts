import { logger } from '../logger';
import { Resend } from 'resend';
import { formatDistanceToNow } from 'date-fns';
import { env } from '$env/dynamic/private';
import { EmailPermissionService } from '$lib/server/email/email-permission.service';
import { analyticsEventsRepository } from '$lib/server/repositories/analytics-events.repository';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { languageRepository } from '$lib/server/repositories/language.repository';
import { userPreferencesRepository } from '$lib/server/repositories/user-preferences.repository';
import { scenarioRepository } from '$lib/server/repositories/scenario.repository';
import { userRepository } from '$lib/server/repositories';
import { EmailSendGuardService } from '$lib/server/email/email-send-guard.service';
import type { User, UserPreferences, ConversationSession, Scenario } from '$lib/server/db/types';

interface ScenarioRecommendation {
	scenario: Scenario;
	reason: string;
	tone: 'primary' | 'stretch' | 'extra';
}

interface ScenarioInspirationContext {
	user: User;
	preferences: UserPreferences | null;
	languageName?: string;
	dailyGoalMinutes?: number;
	challengePreference: 'comfortable' | 'moderate' | 'challenging';
	learningGoal?: string | null;
	lastSession?: ConversationSession | null;
	recommendations: ScenarioRecommendation[];
	appUrl: string;
	sentAt: Date;
}

const resend = new Resend(env.RESEND_API_KEY || 're_dummy_resend_key');

const challengeToDifficulty: Record<
	ScenarioInspirationContext['challengePreference'],
	Scenario['difficulty']
> = {
	comfortable: 'beginner',
	moderate: 'intermediate',
	challenging: 'advanced'
};

const stretchDifficultyMap: Record<
	ScenarioInspirationContext['challengePreference'],
	Scenario['difficulty']
> = {
	comfortable: 'intermediate',
	moderate: 'advanced',
	challenging: 'advanced'
};

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function formatDifficulty(difficulty: Scenario['difficulty']): string {
	switch (difficulty) {
		case 'beginner':
			return 'Beginner friendly';
		case 'intermediate':
			return 'Intermediate challenge';
		case 'advanced':
			return 'Advanced reps';
		default:
			return 'All levels';
	}
}

function learningGoalTagline(goal?: string | null): string {
	if (!goal) return 'Keep your momentum going this week';

	const lower = goal.toLowerCase();
	if (lower === 'career') return 'Ship confident updates at work';
	if (lower === 'travel') return 'Feel calm when you land';
	if (lower === 'academic') return 'Stay sharp for class and office hours';
	if (lower === 'culture') return 'Jump into the conversations you care about';
	if (lower === 'growth') return 'Stack those confidence wins';
	return 'Keep your connections strong';
}

function learningGoalSubjectFragment(goal?: string | null): string {
	if (!goal) return 'practice';

	switch (goal.toLowerCase()) {
		case 'career':
			return 'career practice';
		case 'travel':
			return 'travel reps';
		case 'academic':
			return 'study flow';
		case 'culture':
			return 'culture hangs';
		case 'growth':
			return 'confidence reps';
		default:
			return 'connection practice';
	}
}

export class ScenarioInspirationEmailService {
	static async sendScenarioInspiration(): Promise<{
		sent: number;
		skipped: number;
		errors: string[];
	}> {
		if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
			logger.warn('RESEND_API_KEY not configured, skipping scenario inspiration send');
			return { sent: 0, skipped: 0, errors: [] };
		}

		const eligibleUserIds = await EmailPermissionService.getScenarioInspirationEligibleUsers();
		if (eligibleUserIds.length === 0) {
			logger.info('No scenario inspiration subscribers found.');
			return { sent: 0, skipped: 0, errors: [] };
		}

		const activeScenarios = await scenarioRepository.findActiveScenarios(200);
		const sentAt = new Date();

		let sent = 0;
		let skipped = 0;
		const errors: string[] = [];

		for (const userId of eligibleUserIds) {
			try {
				const payload = await this.buildEmailPayload(userId, {
					sentAt,
					activeScenarios
				});

				if (!payload) {
					skipped++;
					continue;
				}

				const result = await resend.emails.send({
					from: `Hiro at Kaiwa <hiro@trykaiwa.com>`,
					replyTo: 'hiro@trykaiwa.com',
					to: [payload.user.email as string],
					subject: payload.subject,
					html: payload.html
				});

				if (result.error) {
					logger.error('Failed to send scenario inspiration email:', result.error);
					errors.push(`User ${userId}: ${result.error.message || 'Unknown Resend error'}`);
					skipped++;
					continue;
				}

				sent++;

				await analyticsEventsRepository.createAnalyticsEvent({
					userId,
					sessionId: null,
					eventName: 'scenario_inspiration_sent',
					properties: {
						recommendations: payload.recommendations.map((rec) => ({
							id: rec.scenario.id,
							tone: rec.tone
						})),
						learningGoal: payload.learningGoal ?? null,
						challengePreference: payload.challengePreference
					},
					createdAt: sentAt
				});

				// Small delay to avoid rate limits
				await new Promise((resolve) => setTimeout(resolve, 100));
			} catch (error) {
				const message =
					error instanceof Error ? error.message : 'Unknown scenario inspiration error';
				errors.push(`User ${userId}: ${message}`);
				logger.error('Scenario inspiration send failed for user', userId, error);
				skipped++;
			}
		}

		return { sent, skipped, errors };
	}

	static async buildEmailPayload(
		userId: string,
		options?: {
			sentAt?: Date;
			activeScenarios?: Scenario[];
		}
	): Promise<
		| (ScenarioInspirationContext & {
				subject: string;
				html: string;
		  })
		| null
	> {
		const user = await userRepository.findUserById(userId);
		if (!user || !user.email) {
			return null;
		}

		// Respect opt-outs even if method is called manually
		const canReceive = await EmailPermissionService.canReceiveScenarioInspiration(userId);
		if (!canReceive) {
			return null;
		}

		if (EmailSendGuardService.isWithinFounderSequence(user)) {
			return null;
		}

		if (!(await EmailSendGuardService.canSendAdditionalEmail(userId))) {
			return null;
		}

		if (await EmailSendGuardService.hasRecentPractice(userId)) {
			return null;
		}

		const preferences = await userPreferencesRepository.getPreferencesByUserId(userId);
		const challengePreference = (preferences?.challengePreference ??
			'comfortable') as ScenarioInspirationContext['challengePreference'];
		const learningGoal = preferences?.learningGoal ?? null;
		const dailyGoalMinutes =
			preferences?.dailyGoalSeconds && preferences.dailyGoalSeconds > 0
				? Math.round(preferences.dailyGoalSeconds / 60)
				: undefined;

		const targetLanguageId = preferences?.targetLanguageId ?? null;
		const languageName = targetLanguageId
			? ((await languageRepository.findLanguageById(targetLanguageId))?.name ?? undefined)
			: undefined;

		const lastSession =
			(await conversationSessionsRepository.getUserSessions(userId, 1))[0] || null;
		const activeScenarios =
			options?.activeScenarios ?? (await scenarioRepository.findActiveScenarios(200));

		const recommendations = this.pickRecommendations(activeScenarios, {
			learningGoal,
			challengePreference,
			currentLevel: preferences?.currentLanguageLevel ?? null
		});

		if (recommendations.length === 0) {
			return null;
		}

		const appUrl = env.PUBLIC_APP_URL || 'https://trykaiwa.com';
		const sentAt = options?.sentAt ?? new Date();
		const subject = this.buildSubject({ languageName, learningGoal, challengePreference });
		const html = this.renderEmail(
			{
				user,
				preferences,
				languageName,
				dailyGoalMinutes,
				challengePreference,
				learningGoal,
				lastSession,
				recommendations,
				appUrl,
				sentAt
			},
			subject
		);

		return {
			user,
			preferences,
			languageName,
			dailyGoalMinutes,
			challengePreference,
			learningGoal,
			lastSession,
			recommendations,
			appUrl,
			sentAt,
			subject,
			html
		};
	}

	private static pickRecommendations(
		activeScenarios: Scenario[],
		context: {
			learningGoal: string | null;
			challengePreference: ScenarioInspirationContext['challengePreference'];
			currentLevel: string | null;
		}
	): ScenarioRecommendation[] {
		if (activeScenarios.length === 0) {
			return [];
		}

		const recommendations: ScenarioRecommendation[] = [];
		const seen = new Set<string>();

		const normalizedGoal = context.learningGoal?.toLowerCase();
		const desiredDifficulty = challengeToDifficulty[context.challengePreference] || 'beginner';
		const stretchDifficulty = stretchDifficultyMap[context.challengePreference] || 'intermediate';

		const goalMatches = normalizedGoal
			? activeScenarios
					.filter(
						(scenario) =>
							(scenario.learningGoal ?? '').toLowerCase().includes(normalizedGoal as string) &&
							scenario.isActive
					)
					.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0))
			: [];

		const difficultyMatches = activeScenarios
			.filter((scenario) => scenario.difficulty === desiredDifficulty && scenario.isActive)
			.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

		const stretchMatches = activeScenarios
			.filter((scenario) => scenario.difficulty === stretchDifficulty && scenario.isActive)
			.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

		const fallbackMatches = activeScenarios
			.filter((scenario) => scenario.isActive)
			.sort((a, b) => (b.usageCount || 0) - (a.usageCount || 0));

		const push = (
			scenario: Scenario | undefined,
			tone: ScenarioRecommendation['tone'],
			reason: string
		) => {
			if (!scenario) return;
			if (seen.has(scenario.id)) return;

			recommendations.push({ scenario, tone, reason });
			seen.add(scenario.id);
		};

		if (goalMatches.length > 0) {
			push(
				goalMatches[0],
				'primary',
				`Pairs with your ${context.learningGoal?.toLowerCase() ?? 'practice'} focus`
			);
		}

		if (recommendations.length === 0 && difficultyMatches.length > 0) {
			push(
				difficultyMatches[0],
				'primary',
				`${formatDifficulty(desiredDifficulty)} set for this week`
			);
		}

		// Add stretch recommendation
		const stretchCandidate =
			stretchMatches.find((scenario) => !seen.has(scenario.id)) ||
			difficultyMatches.find((scenario) => !seen.has(scenario.id)) ||
			fallbackMatches.find((scenario) => !seen.has(scenario.id));

		push(
			stretchCandidate,
			'stretch',
			`Stretch into ${formatDifficulty(stretchDifficulty).toLowerCase()}`
		);

		// Add one extra option as fallback for variety
		const extraCandidate = fallbackMatches.find((scenario) => !seen.has(scenario.id));
		push(extraCandidate, 'extra', 'Mix it up when you want a different vibe');

		return recommendations.slice(0, 3);
	}

	private static buildSubject(input: {
		languageName?: string;
		learningGoal?: string | null;
		challengePreference: ScenarioInspirationContext['challengePreference'];
	}): string {
		const challengeLabel =
			input.challengePreference === 'comfortable'
				? 'confidence reps'
				: input.challengePreference === 'moderate'
					? 'momentum sprints'
					: 'next-level pushes';

		if (input.languageName) {
			return `${input.languageName} ${learningGoalSubjectFragment(input.learningGoal)} for your ${challengeLabel}`;
		}

		return `Fresh ${learningGoalSubjectFragment(input.learningGoal)} for your ${challengeLabel}`;
	}

	private static renderEmail(context: ScenarioInspirationContext, subject: string): string {
		const firstName =
			context.user.displayName?.split(' ')[0] || context.user.email?.split('@')[0] || 'there';
		const lastPractice = context.lastSession?.startTime
			? formatDistanceToNow(new Date(context.lastSession.startTime), { addSuffix: true })
			: 'No sessions yet (let’s change that)';
		const dailyGoalText =
			context.dailyGoalMinutes && context.dailyGoalMinutes > 0
				? `${context.dailyGoalMinutes}-minute daily target`
				: null;
		const tagline = learningGoalTagline(context.learningGoal);

		const renderScenario = (rec: ScenarioRecommendation) => {
			const scenario = rec.scenario;
			const description = scenario.description || '';
			const link = `${context.appUrl}${scenario.id ? `/?scenario=${encodeURIComponent(scenario.id)}` : ''}`;
			const cefr = scenario.cefrLevel ? ` • ${scenario.cefrLevel}` : '';
			const difficultyLabel = formatDifficulty(scenario.difficulty);

			return `
				<tr>
					<td style="padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
						<div style="font-size: 13px; font-weight: 600; color: ${
							rec.tone === 'stretch' ? '#b45309' : rec.tone === 'extra' ? '#0f766e' : '#2563eb'
						}; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px;">
							${rec.tone === 'primary' ? 'This Week' : rec.tone === 'stretch' ? 'Stretch Goal' : 'Wildcard'}
						</div>
						<div style="font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 6px;">
							${escapeHtml(scenario.title)}
						</div>
						<div style="font-size: 14px; color: #475569; line-height: 1.5; margin-bottom: 12px;">
							${escapeHtml(description)}
						</div>
						<div style="font-size: 13px; color: #1e293b; font-weight: 600; margin-bottom: 8px;">
							${difficultyLabel}${cefr}
						</div>
						<div style="font-size: 13px; color: #334155; background: #f8fafc; padding: 10px 12px; border-radius: 8px; margin-bottom: 14px;">
							${escapeHtml(rec.reason)}
						</div>
						<a href="${link}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; font-weight: 600; padding: 10px 18px; border-radius: 8px;">
							Open scenario
						</a>
					</td>
				</tr>
			`;
		};

		return `
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>${escapeHtml(subject)}</title>
			</head>
			<body style="margin:0; padding:0; background-color:#f1f5f9; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
				<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f1f5f9; padding: 32px 0;">
					<tr>
						<td align="center">
							<table width="640" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 12px 40px rgba(15,23,42,0.12);">
								<tr>
									<td style="background:linear-gradient(135deg,#1d4ed8,#0f172a); padding:32px;">
										<div style="color:#bfdbfe; font-size:14px; letter-spacing:0.08em; text-transform:uppercase; font-weight:600; margin-bottom:12px;">
											This Week’s Micro-Coaching
										</div>
										<div style="color:#ffffff; font-size:28px; font-weight:700; line-height:1.25; margin-bottom:12px;">
											${escapeHtml(tagline)}
										</div>
										<div style="color:#e2e8f0; font-size:15px; line-height:1.6;">
											Hey ${escapeHtml(firstName)}, here’s a quick pairing of scenarios that match where you’re at ${
												dailyGoalText ? `and your ${dailyGoalText}` : ''
											}.
										</div>
									</td>
								</tr>
								<tr>
									<td style="padding: 28px 32px;">
										<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom: 24px;">
											<tr>
												<td style="padding:16px; background:#f8fafc; border-radius:12px; border:1px solid #e2e8f0;">
													<div style="font-size:13px; font-weight:600; color:#0369a1; letter-spacing:0.06em; text-transform:uppercase; margin-bottom:6px;">
														Status Snapshot
													</div>
													<div style="font-size:14px; color:#1e293b; line-height:1.6;">
														Last practice: <strong>${escapeHtml(lastPractice)}</strong>${
															context.languageName
																? ` • Focus: ${escapeHtml(context.languageName)}`
																: ''
														}
													</div>
													${
														dailyGoalText
															? `<div style="font-size:13px; color:#475569; margin-top:6px;">Daily rhythm: ${escapeHtml(
																	dailyGoalText
																)}</div>`
															: ''
													}
												</td>
											</tr>
										</table>

										<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="border-spacing:0; row-gap:12px;">
											${context.recommendations.map(renderScenario).join('')}
										</table>

										<div style="margin-top:24px; padding:18px; background:#0f172a; border-radius:12px;">
											<div style="font-size:16px; color:#f8fafc; font-weight:600; margin-bottom:6px;">
												How to use this pairing
											</div>
											<ul style="margin:0; padding-left:20px; color:#cbd5f5; font-size:14px; line-height:1.6;">
												<li>Open the primary scenario tomorrow—treat it as your warm-up.</li>
												<li>Block 10 minutes later this week for the stretch run (a repeat is a win).</li>
												<li>Drop a quick voice note reply if you want me to queue a specific context.</li>
											</ul>
										</div>
									</td>
								</tr>
								<tr>
									<td style="padding:24px 32px; background:#f8fafc; border-top:1px solid #e2e8f0; color:#475569; font-size:13px; line-height:1.5;">
										<div style="font-weight:600; color:#1e293b; margin-bottom:4px;">Need a different situation?</div>
										<div style="margin-bottom:12px;">
											Hit reply with the situation you’re about to walk into (flight, sales call, parent dinner) and I’ll queue a custom scenario.
										</div>
										<div style="font-size:12px; color:#94a3b8;">
											You’re receiving this because your Kaiwa email preferences include product updates & coaching nudges. Update preferences anytime from Settings →
											Email.
										</div>
									</td>
								</tr>
							</table>
							<div style="font-size:11px; color:#94a3b8; margin-top:12px;">
								Sent ${context.sentAt.toUTCString()}
							</div>
						</td>
					</tr>
				</table>
			</body>
		</html>
		`;
	}
}
