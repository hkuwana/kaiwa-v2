import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { scenarioAttemptsRepository } from '$lib/server/repositories/scenario-attempts.repository';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { userRepository } from '$lib/server/repositories';
import { scenarioRepository } from '$lib/server/repositories';
import { EmailPermissionService } from './email-permission.service';
import type { User, Scenario } from '$lib/server/db/types';

// Initialize Resend
const resend = new Resend(env.RESEND_API_KEY || 're_dummy_resend_key');

export interface PracticeReminderData {
	user: User;
	lastScenario?: Scenario;
	recommendedScenarios: Scenario[];
	lastPracticeDate?: Date;
	streakDays: number;
}

export class EmailReminderService {
	/**
	 * Send practice reminder email to user
	 */
	static async sendPracticeReminder(userId: string): Promise<boolean> {
		try {
			// Check if we have a valid API key
			if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
				console.warn('RESEND_API_KEY not configured, skipping email send');
				return true;
			}

			// Check email permissions from database
			if (!(await EmailPermissionService.canReceiveDailyReminder(userId))) {
				console.warn(
					`User ${userId} not eligible for daily reminders (user not found or opted out)`
				);
				return false;
			}

			// Get user data
			const user = await userRepository.findUserById(userId);
			if (!user) {
				console.warn(`User ${userId} not found`);
				return false;
			}

			// Get practice data
			const reminderData = await this.getPracticeReminderData(userId);
			if (!reminderData) {
				console.warn(`No practice data found for user ${userId}`);
				return false;
			}

			// Send email
			const result = await resend.emails.send({
				from: 'Kaiwa <noreply@trykaiwa.com',
				to: [user.email],
				subject: this.getReminderSubject(reminderData),
				html: this.getReminderEmailTemplate(reminderData)
			});

			if (result.error) {
				console.error('Failed to send practice reminder:', result.error);
				return false;
			}

			console.log('Practice reminder sent successfully:', result.data?.id);
			return true;
		} catch (error) {
			console.error('Error sending practice reminder:', error);
			return false;
		}
	}

	/**
	 * Get practice reminder data for a user
	 */
	private static async getPracticeReminderData(
		userId: string
	): Promise<PracticeReminderData | null> {
		try {
			// Get user
			const user = await userRepository.findUserById(userId);
			if (!user) return null;

			// Get last completed scenario attempt
			const completedAttempts =
				await scenarioAttemptsRepository.getCompletedScenarioAttemptsByUserId(userId);
			const lastAttempt = completedAttempts[0];
			const lastScenario = lastAttempt
				? await scenarioRepository.findScenarioById(lastAttempt.scenarioId)
				: null;

			// Get recommended scenarios
			const recommendedScenarios = await this.getRecommendedScenarios(userId, lastScenario);

			// Get last practice date and streak
			const lastPracticeDate = lastAttempt?.completedAt || null;
			const streakDays = await this.calculateStreakDays(userId);

			return {
				user,
				lastScenario: lastScenario || undefined,
				recommendedScenarios,
				lastPracticeDate: lastPracticeDate || undefined,
				streakDays
			};
		} catch (error) {
			console.error('Error getting practice reminder data:', error);
			return null;
		}
	}

	/**
	 * Get recommended scenarios for user
	 */
	private static async getRecommendedScenarios(
		userId: string,
		lastScenario?: Scenario | null
	): Promise<Scenario[]> {
		try {
			// Get all active scenarios
			const allScenarios = await scenarioRepository.findActiveScenarios();

			// Get user's completed scenarios
			const completedAttempts =
				await scenarioAttemptsRepository.getCompletedScenarioAttemptsByUserId(userId);
			const completedScenarioIds = new Set(completedAttempts.map((a) => a.scenarioId));

			// Filter out completed scenarios and get 2 recommendations
			const availableScenarios = allScenarios.filter(
				(s: Scenario) => !completedScenarioIds.has(s.id)
			);

			// If user has a last scenario, try to find similar difficulty/category
			if (lastScenario && availableScenarios.length > 0) {
				const similarScenarios = availableScenarios.filter(
					(s: Scenario) =>
						s.difficulty === lastScenario.difficulty || s.category === lastScenario.category
				);

				// Return up to 2 similar scenarios, or random ones if not enough
				return similarScenarios.slice(0, 2).length >= 2
					? similarScenarios.slice(0, 2)
					: availableScenarios.slice(0, 2);
			}

			// Return first 2 available scenarios
			return availableScenarios.slice(0, 2);
		} catch (error) {
			console.error('Error getting recommended scenarios:', error);
			return [];
		}
	}

	/**
	 * Calculate user's practice streak
	 */
	private static async calculateStreakDays(userId: string): Promise<number> {
		try {
			const sessions = await conversationSessionsRepository.getUserSessions(userId, 30);
			if (sessions.length === 0) return 0;

			// Sort by date descending
			sessions.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

			let streak = 0;
			const today = new Date();
			today.setHours(0, 0, 0, 0);

			for (let i = 0; i < sessions.length; i++) {
				const sessionDate = new Date(sessions[i].startTime);
				sessionDate.setHours(0, 0, 0, 0);

				const expectedDate = new Date(today);
				expectedDate.setDate(today.getDate() - i);

				if (sessionDate.getTime() === expectedDate.getTime()) {
					streak++;
				} else {
					break;
				}
			}

			return streak;
		} catch (error) {
			console.error('Error calculating streak:', error);
			return 0;
		}
	}

	/**
	 * Generate reminder email subject
	 */
	private static getReminderSubject(data: PracticeReminderData): string {
		const { lastPracticeDate, streakDays } = data;

		if (streakDays > 0) {
			return `Keep your ${streakDays}-day streak going! 🎯`;
		}

		if (lastPracticeDate) {
			const daysSince = Math.floor(
				(Date.now() - lastPracticeDate.getTime()) / (1000 * 60 * 60 * 24)
			);
			if (daysSince === 1) {
				return 'Ready for another practice session? 💪';
			} else if (daysSince <= 3) {
				return "Don't let your progress slip away! 🌟";
			}
		}

		return 'Time to practice your language skills! 🗣️';
	}

	/**
	 * Generate reminder email template
	 */
	private static getReminderEmailTemplate(data: PracticeReminderData): string {
		const { user, lastScenario, recommendedScenarios, lastPracticeDate, streakDays } = data;
		const displayName = user.displayName || 'there';

		const lastPracticeText = lastPracticeDate
			? `Your last practice was ${this.formatDate(lastPracticeDate)}`
			: "You haven't practiced yet";

		const streakText =
			streakDays > 0
				? `You're on a ${streakDays}-day streak! 🔥`
				: 'Ready to start your practice streak?';

		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Practice Reminder - Kaiwa</title>
				<style>
					body {
						font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
						line-height: 1.6;
						color: #333;
						max-width: 600px;
						margin: 0 auto;
						padding: 20px;
						background-color: #f8f9fa;
					}
					.container {
						background: white;
						border-radius: 8px;
						padding: 40px;
						box-shadow: 0 2px 10px rgba(0,0,0,0.1);
					}
					.header {
						text-align: center;
						margin-bottom: 30px;
					}
					.logo {
						font-size: 28px;
						font-weight: bold;
						color: #2563eb;
						margin-bottom: 10px;
					}
					.streak-badge {
						background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
						color: white;
						padding: 10px 20px;
						border-radius: 20px;
						display: inline-block;
						font-weight: bold;
						margin: 20px 0;
					}
					.scenario-card {
						background: #f8f9fa;
						border: 1px solid #e9ecef;
						border-radius: 8px;
						padding: 20px;
						margin: 15px 0;
					}
					.scenario-title {
						font-weight: bold;
						color: #2563eb;
						margin-bottom: 8px;
					}
					.scenario-desc {
						color: #666;
						font-size: 14px;
						margin-bottom: 12px;
					}
					.cta-button {
						background: #2563eb;
						color: white;
						padding: 12px 24px;
						text-decoration: none;
						border-radius: 6px;
						display: inline-block;
						font-weight: bold;
						margin: 10px 5px;
					}
					.cta-button:hover {
						background: #1d4ed8;
					}
					.footer {
						margin-top: 30px;
						padding-top: 20px;
						border-top: 1px solid #e2e8f0;
						font-size: 14px;
						color: #64748b;
						text-align: center;
					}
					.last-scenario {
						background: #e0f2fe;
						border-left: 4px solid #0288d1;
						padding: 15px;
						margin: 20px 0;
					}
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<div class="logo">Kaiwa</div>
						<h1>Ready for another practice session?</h1>
					</div>
					
					<p>Hi ${displayName},</p>
					
					<div class="streak-badge">
						${streakText}
					</div>
					
					<p>${lastPracticeText}. Here are some scenarios to keep your language learning momentum going:</p>
					
					${
						lastScenario
							? `
						<div class="last-scenario">
							<strong>Continue with:</strong><br>
							<span class="scenario-title">${lastScenario.title}</span><br>
							<span class="scenario-desc">${lastScenario.description}</span>
							<br><a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/conversation?scenario=${lastScenario.id}" class="cta-button" style="color: white; text-decoration: none;">Practice Again</a>
						</div>
					`
							: ''
					}
					
					${recommendedScenarios
						.map(
							(scenario) => `
						<div class="scenario-card">
							<div class="scenario-title">${scenario.title}</div>
							<div class="scenario-desc">${scenario.description}</div>
							<a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/conversation?scenario=${scenario.id}" class="cta-button" style="color: white; text-decoration: none;">Try This Scenario</a>
						</div>
					`
						)
						.join('')}
					
					<div style="text-align: center; margin: 30px 0;">
						<a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/conversation" class="cta-button">Start Any Conversation</a>
					</div>
					
					<p>Remember, even 5 minutes of practice can make a difference. You've got this! 💪</p>
					
					<div class="footer">
						<p>This email was sent from Kaiwa. <a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/profile">Manage your email preferences</a></p>
						<p>&copy; 2024 Kaiwa. All rights reserved.</p>
					</div>
				</div>
			</body>
			</html>
		`;
	}

	/**
	 * Format date for display
	 */
	private static formatDate(date: Date): string {
		const now = new Date();
		const diffTime = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) return 'today';
		if (diffDays === 1) return 'yesterday';
		if (diffDays < 7) return `${diffDays} days ago`;

		return date.toLocaleDateString();
	}

	/**
	 * Send reminder to all users who haven't practiced recently
	 */
	static async sendBulkReminders(): Promise<{ sent: number; failed: number }> {
		try {
			// Get all users eligible for daily reminders based on database preferences
			const eligibleUserIds = await EmailPermissionService.getDailyReminderEligibleUsers();

			let sent = 0;
			let failed = 0;

			for (const userId of eligibleUserIds) {
				const success = await this.sendPracticeReminder(userId);
				if (success) {
					sent++;
				} else {
					failed++;
				}

				// Small delay to avoid rate limiting
				await new Promise((resolve) => setTimeout(resolve, 100));
			}

			console.log(`Bulk reminders sent: ${sent} successful, ${failed} failed`);
			return { sent, failed };
		} catch (error) {
			console.error('Error sending bulk reminders:', error);
			return { sent: 0, failed: 0 };
		}
	}
}
