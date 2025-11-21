import { logger } from '$lib/logger';
import { Resend } from 'resend';
import { userRepository } from '$lib/server/repositories';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { EmailPermissionService } from '$lib/emails/shared/email-permission';
import type { User } from '$lib/server/db/types';
import { analyticsEventsRepository } from '$lib/server/repositories/analytics-events.repository';

// Use process.env for compatibility with both SvelteKit and standalone scripts
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_dummy_resend_key';
const PUBLIC_APP_URL = process.env.PUBLIC_APP_URL || 'https://trykaiwa.com';

const resend = new Resend(RESEND_API_KEY);

interface WeeklyStatsData {
	totalMinutes: number;
	totalSessions: number;
	averageSessionMinutes: number;
	mostPracticedLanguage: string | null;
	totalDaysActive: number;
	improvementVsPreviousWeek: number | null;
	totalWordsSpoken: number;
	totalCharactersSpoken: number;
}

export class WeeklyStatsEmailService {
	/**
	 * Send weekly stats email to all eligible users
	 */
	static async sendWeeklyStats(): Promise<{
		sent: number;
		skipped: number;
		errors: string[];
	}> {
		if (!RESEND_API_KEY || RESEND_API_KEY === 're_dummy_resend_key') {
			logger.warn('RESEND_API_KEY not configured, skipping weekly stats send');
			return { sent: 0, skipped: 0, errors: [] };
		}

		const stats = {
			sent: 0,
			skipped: 0,
			errors: [] as string[]
		};

		// Get all users who opted into weekly digest emails
		const eligibleUsers = await EmailPermissionService.getProgressReportEligibleUsers();

		if (eligibleUsers.length === 0) {
			logger.info('No eligible users for weekly stats.');
			return stats;
		}

		logger.info(`📊 Processing weekly stats for ${eligibleUsers.length} users...`);

		for (const userSettings of eligibleUsers) {
			try {
				const user = await userRepository.findUserById(userSettings.userId);
				if (!user || !user.email) {
					stats.skipped++;
					continue;
				}

				// Calculate user's weekly stats
				const weeklyStats = await this.calculateWeeklyStats(user.id);

				// Skip users with no activity this week
				if (weeklyStats.totalSessions === 0) {
					stats.skipped++;
					logger.info(`  ⏭️  Skipping ${user.email} (no activity this week)`);
					continue;
				}

				// Build and send email
				const html = this.buildWeeklyStatsEmail(user, weeklyStats);
				const subject = this.buildSubject(weeklyStats);

				const result = await resend.emails.send({
					from: 'Hiro <hiro@trykaiwa.com>',
					replyTo: 'hiro@trykaiwa.com',
					to: [user.email],
					subject,
					html
				});

				if (result.error) {
					logger.error(`  ❌ Failed to send to ${user.email}:`, result.error);
					stats.errors.push(`${user.email}: ${result.error.message}`);
					stats.skipped++;
					continue;
				}

				stats.sent++;
				logger.info(`  ✅ Sent to ${user.email} (${weeklyStats.totalMinutes} min)`);

				await analyticsEventsRepository.createAnalyticsEvent({
					userId: user.id,
					sessionId: null,
					eventName: 'weekly_stats_sent',
					properties: {
						totalMinutes: weeklyStats.totalMinutes,
						totalSessions: weeklyStats.totalSessions,
						totalDaysActive: weeklyStats.totalDaysActive
					},
					createdAt: new Date()
				});

				// Rate limit to avoid hitting email provider limits
				await new Promise((resolve) => setTimeout(resolve, 100));
			} catch (error) {
				logger.error(`  ❌ Error processing user ${userSettings.userId}:`, error);
				stats.errors.push(`User ${userSettings.userId}: ${error}`);
				stats.skipped++;
			}
		}

		return stats;
	}

	/**
	 * Calculate a user's practice stats for the past 7 days
	 */
	private static async calculateWeeklyStats(userId: string): Promise<WeeklyStatsData> {
		const now = new Date();
		const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

		// Get sessions from this week
		const thisWeekSessions = await conversationSessionsRepository.getUserSessionsInRange(
			userId,
			oneWeekAgo,
			now
		);

		// Get sessions from previous week for comparison
		const lastWeekSessions = await conversationSessionsRepository.getUserSessionsInRange(
			userId,
			twoWeeksAgo,
			oneWeekAgo
		);

		// Calculate total minutes from seconds consumed
		const totalSeconds = thisWeekSessions.reduce(
			(sum, session) => sum + (session.secondsConsumed || 0),
			0
		);
		const totalMinutes = Math.round(totalSeconds / 60);

		// Calculate previous week minutes for comparison
		const lastWeekSeconds = lastWeekSessions.reduce(
			(sum, session) => sum + (session.secondsConsumed || 0),
			0
		);
		const lastWeekMinutes = Math.round(lastWeekSeconds / 60);

		// Calculate improvement percentage
		let improvementVsPreviousWeek: number | null = null;
		if (lastWeekMinutes > 0) {
			improvementVsPreviousWeek = Math.round(
				((totalMinutes - lastWeekMinutes) / lastWeekMinutes) * 100
			);
		}

		// Calculate average session length
		const averageSessionMinutes =
			thisWeekSessions.length > 0 ? Math.round(totalMinutes / thisWeekSessions.length) : 0;

		// Find most practiced language
		const languageCounts: Record<string, number> = {};
		thisWeekSessions.forEach((session) => {
			languageCounts[session.language] = (languageCounts[session.language] || 0) + 1;
		});

		let mostPracticedLanguage: string | null = null;
		let maxCount = 0;
		for (const [language, count] of Object.entries(languageCounts)) {
			if (count > maxCount) {
				maxCount = count;
				mostPracticedLanguage = language;
			}
		}

		// Count unique days with activity
		const activeDays = new Set(
			thisWeekSessions.map((session) => session.startTime.toISOString().split('T')[0])
		);

		return {
			totalMinutes,
			totalSessions: thisWeekSessions.length,
			averageSessionMinutes,
			mostPracticedLanguage,
			totalDaysActive: activeDays.size,
			improvementVsPreviousWeek
		};
	}

	/**
	 * Build email subject line based on user's stats
	 */
	private static buildSubject(stats: WeeklyStatsData): string {
		if (stats.totalMinutes >= 60) {
			return `You practiced ${stats.totalMinutes} minutes this week!`;
		} else if (stats.totalMinutes >= 30) {
			return `Nice! ${stats.totalMinutes} minutes of practice this week`;
		} else if (stats.totalMinutes > 0) {
			return `Your weekly practice update - ${stats.totalMinutes} minutes`;
		} else {
			return 'Your weekly practice stats';
		}
	}

	/**
	 * Build the HTML email with weekly stats
	 */
	private static buildWeeklyStatsEmail(user: User, stats: WeeklyStatsData): string {
		const firstName = user.displayName?.split(' ')[0] || 'there';
		const languageName = this.formatLanguageName(stats.mostPracticedLanguage);

		// Build encouragement message based on performance
		let encouragement = '';
		if (stats.totalMinutes >= 60) {
			encouragement = "You're crushing it! That's serious dedication.";
		} else if (stats.totalMinutes >= 30) {
			encouragement = "Great consistency! You're building a solid habit.";
		} else if (stats.totalDaysActive >= 3) {
			encouragement = 'Love the consistency. Keep showing up!';
		} else {
			encouragement = 'Every minute counts. Keep going!';
		}

		// Build comparison message
		let comparisonMessage = '';
		if (stats.improvementVsPreviousWeek !== null) {
			if (stats.improvementVsPreviousWeek > 0) {
				comparisonMessage = `<p style="margin: 16px 0; padding: 12px; background: #d1fae5; border-left: 4px solid #10b981; border-radius: 6px; color: #065f46;">
					<strong>📈 ${stats.improvementVsPreviousWeek}% more than last week!</strong>
				</p>`;
			} else if (stats.improvementVsPreviousWeek < 0) {
				comparisonMessage = `<p style="margin: 16px 0; padding: 12px; background: #fef3c7; border-left: 4px solid #f59e0b; border-radius: 6px; color: #78350f;">
					Down ${Math.abs(stats.improvementVsPreviousWeek)}% from last week. Let's get back on track!
				</p>`;
			}
		}

		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Your Weekly Practice Stats</title>
				<style>
					body {
						font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
						line-height: 1.6;
						color: #111827;
						background: #f9fafb;
						margin: 0;
						padding: 0;
					}
					.wrapper {
						max-width: 600px;
						margin: 0 auto;
						padding: 32px 24px 48px;
						background: #ffffff;
					}
					h1 {
						font-size: 28px;
						margin-bottom: 8px;
						color: #111827;
						text-align: center;
					}
					.hero-stat {
						text-align: center;
						font-size: 48px;
						font-weight: bold;
						color: #2563eb;
						margin: 24px 0;
					}
					.subtitle {
						text-align: center;
						color: #6b7280;
						margin-bottom: 32px;
					}
					.stats-grid {
						display: grid;
						grid-template-columns: 1fr 1fr;
						gap: 16px;
						margin: 24px 0;
					}
					.stat-card {
						border: 1px solid #e5e7eb;
						border-radius: 12px;
						padding: 20px;
						background: #f9fafb;
						text-align: center;
					}
					.stat-value {
						font-size: 32px;
						font-weight: bold;
						color: #111827;
						margin: 0;
					}
					.stat-label {
						font-size: 14px;
						color: #6b7280;
						margin-top: 4px;
					}
					.encouragement {
						margin: 24px 0;
						padding: 20px;
						background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
						border-radius: 12px;
						color: white;
						text-align: center;
						font-size: 18px;
						font-weight: 500;
					}
					.cta {
						text-align: center;
						margin: 32px 0;
					}
					.cta a {
						display: inline-block;
						padding: 14px 32px;
						background: #2563eb;
						color: white;
						text-decoration: none;
						border-radius: 8px;
						font-weight: 600;
						font-size: 16px;
					}
					footer {
						margin-top: 40px;
						padding-top: 16px;
						border-top: 1px solid #e5e7eb;
						color: #6b7280;
						font-size: 13px;
						text-align: center;
					}
				</style>
			</head>
			<body>
				<div class="wrapper">
					<h1>Your Weekly Practice Stats</h1>
					<p class="subtitle">Week of ${this.formatDateRange()}</p>

					<div class="hero-stat">
						${stats.totalMinutes} minutes
					</div>

					${comparisonMessage}

					<div class="stats-grid">
						<div class="stat-card">
							<div class="stat-value">${stats.totalSessions}</div>
							<div class="stat-label">Practice sessions</div>
						</div>
						<div class="stat-card">
							<div class="stat-value">${stats.totalDaysActive}</div>
							<div class="stat-label">Active days</div>
						</div>
						<div class="stat-card">
							<div class="stat-value">${stats.averageSessionMinutes}</div>
							<div class="stat-label">Avg minutes/session</div>
						</div>
						<div class="stat-card">
							<div class="stat-value">${languageName}</div>
							<div class="stat-label">Most practiced</div>
						</div>
					</div>

					<div class="encouragement">
						${encouragement}
					</div>

					<div class="cta">
						<a href="${PUBLIC_APP_URL}/practice">Continue practicing</a>
					</div>

					<p style="margin-top: 32px; color: #374151; text-align: center;">
						Keep it up, ${firstName}!<br>
						– Hiro
					</p>

					<footer>
						<p>You're receiving this because you opted into weekly updates.<br>
						Manage preferences in <a href="${PUBLIC_APP_URL}/profile" style="color:#2563eb;">your profile</a>.</p>
					</footer>
				</div>
			</body>
			</html>
		`;
	}

	/**
	 * Format language code to readable name
	 */
	private static formatLanguageName(language: string | null): string {
		if (!language) return 'N/A';

		const languageMap: Record<string, string> = {
			ja: 'Japanese',
			'zh-CN': 'Chinese',
			ko: 'Korean',
			es: 'Spanish',
			fr: 'French',
			de: 'German',
			it: 'Italian',
			pt: 'Portuguese',
			ru: 'Russian'
		};

		return languageMap[language] || language;
	}

	/**
	 * Format the date range for the past week
	 */
	private static formatDateRange(): string {
		const now = new Date();
		const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

		const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
		const startDate = oneWeekAgo.toLocaleDateString('en-US', options);
		const endDate = now.toLocaleDateString('en-US', options);

		return `${startDate} - ${endDate}`;
	}
}
