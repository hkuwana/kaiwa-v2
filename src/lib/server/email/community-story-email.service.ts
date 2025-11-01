import { Resend } from 'resend';
import { formatDistanceToNow } from 'date-fns';
import { env } from '$env/dynamic/private';
import { communityStories, type CommunityStory, type LearningGoal } from '$lib/data/community-stories';
import { EmailPermissionService } from '$lib/server/email/email-permission.service';
import { analyticsEventsRepository } from '$lib/server/repositories/analytics-events.repository';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { languageRepository } from '$lib/server/repositories/language.repository';
import { userPreferencesRepository } from '$lib/server/repositories/user-preferences.repository';
import { userRepository } from '$lib/server/repositories';
import { EmailSendGuardService } from '$lib/server/email/email-send-guard.service';
import type { User, UserPreferences, ConversationSession } from '$lib/server/db/types';

interface WeeklyPracticeSummary {
	totalMinutes: number;
	sessionCount: number;
	lastSession: ConversationSession | null;
}

interface CommunityStoryContext {
	user: User;
	preferences: UserPreferences | null;
	languageName?: string;
	story: CommunityStory;
	weeklySummary: WeeklyPracticeSummary;
	appUrl: string;
	sentAt: Date;
}

const resend = new Resend(env.RESEND_API_KEY || 're_dummy_resend_key');

function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

function lookupStory(goal?: string | null): CommunityStory {
	if (!goal) {
		return communityStories[0];
	}

	const normalized = goal.toLowerCase() as LearningGoal;
	const match = communityStories.find(
		(story) => story.learningGoal.toLowerCase() === normalized
	);

	return match ?? communityStories[0];
}

function describeWeeklySummary(summary: WeeklyPracticeSummary, languageName?: string): string {
	if (summary.sessionCount === 0) {
		return `No ${languageName ? languageName + ' ' : ''}sessions yet this week — perfect time to start with a single micro story.`;
	}

	const minutes = summary.totalMinutes;
	const plural = summary.sessionCount === 1 ? 'session' : 'sessions';
	return `${summary.sessionCount} ${plural}, ${minutes} minute${minutes === 1 ? '' : 's'} logged this week.`;
}

export class CommunityStoryEmailService {
	static async sendCommunityStories(): Promise<{
		sent: number;
		skipped: number;
		errors: string[];
	}> {
		if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
			console.warn('RESEND_API_KEY not configured, skipping community story send');
			return { sent: 0, skipped: 0, errors: [] };
		}

		const eligibleUserIds = await EmailPermissionService.getCommunityStoryEligibleUsers();
		if (eligibleUserIds.length === 0) {
			console.log('No community story subscribers found.');
			return { sent: 0, skipped: 0, errors: [] };
		}

		let sent = 0;
		let skipped = 0;
		const errors: string[] = [];
		const sentAt = new Date();

		for (const userId of eligibleUserIds) {
			try {
				const payload = await this.buildEmailPayload(userId, { sentAt });
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
					console.error('Failed to send community story email:', result.error);
					errors.push(`User ${userId}: ${result.error.message || 'Unknown Resend error'}`);
					skipped++;
					continue;
				}

				sent++;

				await analyticsEventsRepository.createAnalyticsEvent({
					userId,
					sessionId: null,
					eventName: 'community_story_sent',
					properties: {
						storyId: payload.story.id,
						learningGoal: payload.story.learningGoal,
						sessionCount: payload.weeklySummary.sessionCount,
						totalMinutes: payload.weeklySummary.totalMinutes
					},
					createdAt: sentAt
				});

				// Rate limit safety
				await new Promise((resolve) => setTimeout(resolve, 100));
			} catch (error) {
				const message = error instanceof Error ? error.message : 'Unknown community story error';
				errors.push(`User ${userId}: ${message}`);
				console.error('Community story send failed for user', userId, error);
				skipped++;
			}
		}

		return { sent, skipped, errors };
	}

	static async buildEmailPayload(
		userId: string,
		options?: { sentAt?: Date }
	): Promise<
		| (CommunityStoryContext & {
				subject: string;
				html: string;
		  })
		| null
	> {
		const user = await userRepository.findUserById(userId);
		if (!user || !user.email) {
			return null;
		}

		const canReceive = await EmailPermissionService.canReceiveCommunityStories(userId);
		if (!canReceive) {
			return null;
		}

		if (EmailSendGuardService.isWithinFounderSequence(user)) {
			return null;
		}

		if (!(await EmailSendGuardService.canSendAdditionalEmail(userId))) {
			return null;
		}

		const preferences = await userPreferencesRepository.getPreferencesByUserId(userId);
		const story = lookupStory(preferences?.learningGoal ?? null);

		const targetLanguageId = preferences?.targetLanguageId ?? null;
		const languageName = targetLanguageId
			? (await languageRepository.findLanguageById(targetLanguageId))?.name ?? undefined
			: undefined;

		const weeklySummary = await this.computeWeeklySummary(userId);
		const appUrl = env.PUBLIC_APP_URL || 'https://trykaiwa.com';
		const sentAt = options?.sentAt ?? new Date();
		const subject = this.buildSubject({ story, languageName });
		const html = this.renderEmail(
			{
				user,
				preferences,
				languageName,
				story,
				weeklySummary,
				appUrl,
				sentAt
			},
			subject
		);

		return {
			user,
			preferences,
			languageName,
			story,
			weeklySummary,
			appUrl,
			sentAt,
			subject,
			html
		};
	}

	private static async computeWeeklySummary(userId: string): Promise<WeeklyPracticeSummary> {
		const now = new Date();
		const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const sessions = await conversationSessionsRepository.getUserSessionsInRange(userId, weekAgo, now);

		let totalMinutes = 0;
		for (const session of sessions) {
			const seconds = session.durationSeconds ?? session.secondsConsumed ?? 0;
			totalMinutes += Math.round(seconds / 60);
		}

		return {
			totalMinutes,
			sessionCount: sessions.length,
			lastSession: sessions[0] ?? null
		};
	}

	private static buildSubject(input: { story: CommunityStory; languageName?: string }): string {
		const prefix = input.languageName ? `${input.languageName} ` : '';
		return `${prefix}community win: ${input.story.headline}`;
	}

	private static renderEmail(context: CommunityStoryContext, subject: string): string {
		const firstName = context.user.displayName?.split(' ')[0] || context.user.email?.split('@')[0] || 'there';
		const weeklySummaryText = describeWeeklySummary(context.weeklySummary, context.languageName);
		const lastPracticeText = context.weeklySummary.lastSession
			? formatDistanceToNow(new Date(context.weeklySummary.lastSession.startTime), { addSuffix: true })
			: null;
		const actionUrl = `${context.appUrl}${context.story.action.urlPath}`;

		return `
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>${escapeHtml(subject)}</title>
			</head>
			<body style="margin:0; padding:0; background-color:#f8fafc; font-family:'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
				<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#f8fafc; padding:32px 0;">
					<tr>
						<td align="center">
							<table width="640" cellpadding="0" cellspacing="0" role="presentation" style="background:#ffffff; border-radius:18px; overflow:hidden; box-shadow:0 10px 36px rgba(15,23,42,0.12);">
								<tr>
									<td style="padding:36px 32px 20px 32px; background:#0f172a;">
										<div style="color:#38bdf8; font-size:13px; font-weight:600; text-transform:uppercase; letter-spacing:0.08em; margin-bottom:12px;">
											Real learners, real wins
										</div>
										<div style="color:#ffffff; font-size:28px; font-weight:700; line-height:1.3; margin-bottom:8px;">
											${escapeHtml(context.story.headline)}
										</div>
										<div style="color:#cbd5f5; font-size:16px; line-height:1.6;">
											${escapeHtml(context.story.subheadline)}
										</div>
									</td>
								</tr>
								<tr>
									<td style="padding: 28px 32px;">
										<div style="font-size:15px; color:#1e293b; line-height:1.8; margin-bottom:20px;">
											Hey ${escapeHtml(firstName)}, here’s how another learner turned their goal into a ritual you can try this week.
										</div>

										<div style="padding:20px; border:1px solid #e2e8f0; border-radius:12px; background:#f8fafc; margin-bottom:20px;">
											<div style="font-size:14px; color:#0369a1; font-weight:600; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:6px;">
												Weekly pulse
											</div>
											<div style="font-size:15px; color:#1e293b; line-height:1.6; margin-bottom:6px;">
												${escapeHtml(weeklySummaryText)}
											</div>
											${
												lastPracticeText
													? `<div style="font-size:13px; color:#475569;">Last session: ${escapeHtml(lastPracticeText)}</div>`
													: ''
											}
										</div>

										<div style="background:#ffffff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; margin-bottom:24px;">
											<div style="padding:24px; background:#eef2ff;">
												<div style="font-size:15px; color:#3730a3; text-transform:uppercase; font-weight:600; letter-spacing:0.05em; margin-bottom:12px;">
													Inside their playbook
												</div>
												<blockquote style="margin:0; font-size:18px; line-height:1.6; color:#1e1b4b; font-weight:500;">
													“${escapeHtml(context.story.quote.replace(/^“|”$/g, ''))}”
												</blockquote>
												<div style="margin-top:16px; font-size:13px; color:#312e81; font-weight:600;">
													${escapeHtml(context.story.author.name)} — ${escapeHtml(
														context.story.author.role
													)}${context.story.author.location ? `, ${escapeHtml(context.story.author.location)}` : ''}
												</div>
											</div>
											<div style="padding:24px;">
												<div style="font-size:16px; color:#1e293b; font-weight:600; margin-bottom:8px;">
													What changed
												</div>
												<div style="font-size:14px; color:#334155; line-height:1.7; margin-bottom:18px;">
													${escapeHtml(context.story.context)} ${escapeHtml(context.story.result)}
												</div>
												<div style="font-size:14px; color:#1e293b; font-weight:600; margin-bottom:12px;">
													Try their three-part play:
												</div>
												<ul style="margin:0; padding-left:18px; color:#475569; font-size:14px; line-height:1.7;">
													${context.story.playbook
														.map(
															(step) =>
																`<li><strong style="color:#1e293b;">${escapeHtml(
																	step.title
																)}</strong> — ${escapeHtml(step.tip)}</li>`
														)
														.join('')}
												</ul>
											</div>
										</div>

										<div style="padding:24px; background:#0f172a; border-radius:16px; color:#e2e8f0; margin-bottom:24px;">
											<div style="font-size:16px; font-weight:600; color:#bae6fd; margin-bottom:12px;">
												Make it yours tonight
											</div>
											<div style="font-size:14px; line-height:1.7; margin-bottom:18px;">
												${escapeHtml(context.story.action.description)} Kaiwa will set the scene so you can rehearse it before the real moment hits.
											</div>
											<a href="${actionUrl}" style="display:inline-block; background:#38bdf8; color:#0f172a; font-weight:700; padding:12px 24px; border-radius:999px; text-decoration:none;">
												${escapeHtml(context.story.action.label)}
											</a>
										</div>

										<div style="font-size:13px; color:#475569; line-height:1.7;">
											Want a different kind of story? Reply with the moment you’re preparing for and I’ll send a matching playbook.
										</div>
									</td>
								</tr>
								<tr>
									<td style="padding:22px 32px; background:#f8fafc; border-top:1px solid #e2e8f0;">
										<div style="font-size:12px; color:#64748b; line-height:1.6;">
											You’re receiving this because your Kaiwa email preferences include coaching stories & product updates. Update preferences anytime in Settings → Email.
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
