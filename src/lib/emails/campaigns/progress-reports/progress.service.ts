import { logger } from '$lib/logger';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { userRepository } from '$lib/server/repositories';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { EmailPermissionService } from '$lib/emails/shared/email-permission';
import type { User, ConversationSession } from '$lib/server/db/types';

const resend = new Resend(env.RESEND_API_KEY || 're_dummy_resend_key');

/**
 * Progress Reports Email Service
 *
 * Sends weekly progress reports to users showing their learning stats.
 * Typically sent on Saturday to summarize the week's practice.
 *
 * Features:
 * - Shows conversation sessions completed this week
 * - Shows languages practiced
 * - Shows total practice time
 * - Encourages continued practice
 */
export class ProgressReportsEmailService {
	public static readonly SENDER_EMAIL = 'hiro@trykaiwa.com';
	public static readonly SENDER_NAME = 'Hiro';

	/**
	 * Send progress reports to all eligible users
	 */
	static async sendProgressReports(): Promise<{
		sent: number;
		skipped: number;
		failed: number;
	}> {
		if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
			logger.warn('RESEND_API_KEY not configured, skipping progress reports send');
			return { sent: 0, skipped: 0, failed: 0 };
		}

		const eligibleUserIds = await EmailPermissionService.getProgressReportEligibleUsers();
		if (eligibleUserIds.length === 0) {
			logger.info('No progress report subscribers found.');
			return { sent: 0, skipped: 0, failed: 0 };
		}

		let sent = 0;
		let skipped = 0;
		let failed = 0;

		for (const userId of eligibleUserIds) {
			const user = await userRepository.findUserById(userId);
			if (!user || !user.email) {
				skipped++;
				continue;
			}

			// Get this week's sessions
			const thisWeekStart = this.getWeekStart(new Date());
			const allSessions = await conversationSessionsRepository.getUserSessions(userId, 100);
			const thisWeekSessions = allSessions.filter((s) => new Date(s.startTime) >= thisWeekStart);

			// Skip if no practice this week
			if (thisWeekSessions.length === 0) {
				skipped++;
				continue;
			}

			const stats = this.calculateStats(thisWeekSessions);
			const html = this.buildProgressReportEmail(user, stats);

			const result = await resend.emails.send({
				from: `${this.SENDER_NAME} <${this.SENDER_EMAIL}>`,
				replyTo: this.SENDER_EMAIL,
				to: [user.email],
				subject: `Your Kaiwa Weekly Report – ${stats.sessionCount} conversations this week!`,
				html
			});

			if (result.error) {
				logger.error('Failed to send progress report to user', user.id, result.error);
				failed++;
				continue;
			}

			sent++;

			// Rate-limit safety
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		logger.info(`Progress reports sent: ${sent} emails, skipped: ${skipped}, failed: ${failed}`);
		return { sent, skipped, failed };
	}

	/**
	 * Send progress report to a specific user
	 */
	static async sendProgressReportToUser(userId: string): Promise<boolean> {
		if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
			logger.warn('RESEND_API_KEY not configured, skipping progress report send');
			return true;
		}

		// Check email permissions
		if (!(await EmailPermissionService.canReceiveProgressReports(userId))) {
			logger.warn(`User ${userId} not eligible for progress reports`);
			return false;
		}

		const user = await userRepository.findUserById(userId);
		if (!user || !user.email) {
			logger.warn(`User ${userId} not found or has no email`);
			return false;
		}

		// Get this week's sessions
		const thisWeekStart = this.getWeekStart(new Date());
		const allSessions = await conversationSessionsRepository.getUserSessions(userId, 100);
		const thisWeekSessions = allSessions.filter((s) => new Date(s.startTime) >= thisWeekStart);

		// Skip if no practice this week
		if (thisWeekSessions.length === 0) {
			logger.info(`No sessions this week for user ${userId}, skipping report`);
			return false;
		}

		const stats = this.calculateStats(thisWeekSessions);
		const html = this.buildProgressReportEmail(user, stats);

		const result = await resend.emails.send({
			from: `${this.SENDER_NAME} <${this.SENDER_EMAIL}>`,
			replyTo: this.SENDER_EMAIL,
			to: [user.email],
			subject: `Your Kaiwa Weekly Report – ${stats.sessionCount} conversations this week!`,
			html
		});

		if (result.error) {
			logger.error('Failed to send progress report to user', user.id, result.error);
			return false;
		}

		logger.info('Progress report sent to user:', user.id);
		return true;
	}

	private static buildProgressReportEmail(
		user: User,
		stats: {
			sessionCount: number;
			totalMinutes: number;
			languages: string[];
		}
	): string {
		const firstName = user.displayName?.split(' ')[0] || 'there';
		const avgMinutes = Math.round(stats.totalMinutes / stats.sessionCount);

		// Motivational messages based on session count
		let encouragement = '';
		if (stats.sessionCount >= 5) {
			encouragement = "You're on fire! 🔥 Keep up this amazing streak.";
		} else if (stats.sessionCount >= 3) {
			encouragement = "Nice work! You're building a solid habit.";
		} else {
			encouragement = 'Great start! Every conversation gets you closer to fluency.';
		}

		const languageList = stats.languages.map((lang) => `<li>${lang}</li>`).join('');

		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<style>
					body {
						font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
						line-height: 1.6;
						color: #333;
						max-width: 600px;
						margin: 0 auto;
						padding: 20px;
						background-color: #ffffff;
					}
					h1 {
						font-size: 28px;
						margin: 0 0 12px;
						color: #1f2937;
					}
					.stats-box {
						background: #f0f9ff;
						border: 2px solid #667eea;
						border-radius: 8px;
						padding: 20px;
						margin: 20px 0;
					}
					.stat-item {
						display: inline-block;
						margin-right: 30px;
						margin-bottom: 15px;
					}
					.stat-number {
						font-size: 32px;
						font-weight: bold;
						color: #667eea;
						display: block;
					}
					.stat-label {
						font-size: 14px;
						color: #6b7280;
						text-transform: uppercase;
					}
					.encouragement {
						font-size: 16px;
						color: #374151;
						margin: 20px 0;
						padding: 16px;
						background: #fef3c7;
						border-left: 4px solid #f59e0b;
						border-radius: 4px;
					}
					.languages-list {
						margin: 20px 0;
					}
					.languages-list strong {
						display: block;
						margin-bottom: 10px;
						color: #1f2937;
					}
					.languages-list ul {
						margin: 0;
						padding-left: 20px;
						color: #374151;
					}
					.languages-list li {
						margin-bottom: 6px;
					}
					.cta {
						background: #667eea;
						color: white;
						padding: 12px 28px;
						border-radius: 6px;
						text-decoration: none;
						font-weight: 500;
						display: inline-block;
						margin: 20px 0;
					}
					.cta:hover {
						background: #5568d3;
						text-decoration: none;
					}
					.signature {
						margin-top: 30px;
						padding-top: 20px;
						border-top: 1px solid #e5e7eb;
					}
					.signature-name {
						font-weight: bold;
						color: #1f2937;
					}
					.signature-title {
						color: #6b7280;
						font-size: 14px;
					}
					a {
						color: #667eea;
						text-decoration: none;
					}
					a:hover {
						text-decoration: underline;
					}
				</style>
			</head>
			<body>
				<p>Hi ${firstName},</p>

				<h1>Your Weekly Learning Report</h1>

				<div class="stats-box">
					<div class="stat-item">
						<span class="stat-number">${stats.sessionCount}</span>
						<span class="stat-label">Conversations</span>
					</div>
					<div class="stat-item">
						<span class="stat-number">${stats.totalMinutes}</span>
						<span class="stat-label">Total Minutes</span>
					</div>
					<div class="stat-item">
						<span class="stat-number">${avgMinutes}</span>
						<span class="stat-label">Avg Duration</span>
					</div>
				</div>

				<div class="encouragement">
					${encouragement}
				</div>

				<div class="languages-list">
					<strong>Languages Practiced This Week:</strong>
					<ul>
						${languageList}
					</ul>
				</div>

				<p>You're making real progress! Keep this momentum going—consistency is the key to language fluency.</p>

				<a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}" class="cta" style="color: white;">
					Continue Practicing
				</a>

				<div class="signature">
					<div class="signature-name">${this.SENDER_NAME}</div>
					<div class="signature-title">Founder, Kaiwa</div>
					<div style="margin-top: 8px; font-size: 14px; color: #6b7280;">
						📧 ${this.SENDER_EMAIL}<br>
						🌐 <a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}">trykaiwa.com</a>
					</div>
				</div>

				<p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">
					You're receiving this because you have progress reports enabled in your email preferences.
					<a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/profile/email-preferences">Manage preferences</a>
				</p>
			</body>
			</html>
		`;
	}

	private static calculateStats(sessions: ConversationSession[]): {
		sessionCount: number;
		totalMinutes: number;
		languages: string[];
	} {
		const languages = new Set<string>();
		let totalSeconds = 0;

		for (const session of sessions) {
			if (session.language?.name) {
				languages.add(session.language.name);
			}

			// Calculate duration from startTime and endTime
			if (session.startTime && session.endTime) {
				const duration =
					(new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000;
				totalSeconds += duration;
			}
		}

		const totalMinutes = Math.round(totalSeconds / 60);

		return {
			sessionCount: sessions.length,
			totalMinutes: Math.max(totalMinutes, 1), // Ensure at least 1 minute
			languages: Array.from(languages).sort()
		};
	}

	private static getWeekStart(date: Date): Date {
		const d = new Date(date);
		const day = d.getDay();
		const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
		return new Date(d.setDate(diff));
	}
}
