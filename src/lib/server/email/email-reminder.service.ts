import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { scenarioAttemptsRepository } from '$lib/server/repositories/scenario-attempts.repository';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { userRepository } from '$lib/server/repositories';
import { scenarioRepository } from '$lib/server/repositories';
import { EmailPermissionService } from './email-permission.service';
import type { User, Scenario } from '$lib/server/db/types';
import { userPreferencesRepository } from '$lib/server/repositories/user-preferences.repository';
import { languageRepository } from '$lib/server/repositories/language.repository';
import { survivalPhrases } from '$lib/data/survival-phrases';

// Initialize Resend
const resend = new Resend(env.RESEND_API_KEY || 're_dummy_resend_key');

export interface PracticeReminderData {
	user: User;
	lastScenario?: Scenario;
	recommendedScenarios: Scenario[];
	lastPracticeDate?: Date;
	streakDays: number;
	targetLanguage?: {
		name: string;
		code: string;
	};
	survivalPhrase?: {
		phrase: string;
		translation: string;
	};
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
				from: 'Hiro <hiro@trykaiwa.com>',
				replyTo: 'hiro@trykaiwa.com',
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
	public static async getPracticeReminderData(
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
			const targetLanguage = await this.getTargetLanguageInfo(userId);
			const survivalPhrase = targetLanguage ? this.pickSurvivalPhrase(targetLanguage.code) : null;

			return {
				user,
				lastScenario: lastScenario || undefined,
				recommendedScenarios,
				lastPracticeDate: lastPracticeDate || undefined,
				streakDays,
				targetLanguage,
				survivalPhrase: survivalPhrase || undefined
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
					(s: Scenario) => s.difficulty === lastScenario.difficulty || s.role === lastScenario.role
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
	 * Personal subjects with user's name that feel like a real 1-on-1 email
	 */
	public static getReminderSubject(data: PracticeReminderData): string {
		const { user, lastPracticeDate, streakDays, targetLanguage } = data;
		// Extract first name from display name or email
		let firstName = user.displayName?.trim().split(/\s+/)[0] || user.email.split('@')[0];
		// If first name looks like an email prefix, capitalize it
		if (!user.displayName && firstName) {
			firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
		}
		const languageName = targetLanguage?.name;

		// For users with active streaks
		if (streakDays > 0) {
			const dayLabel = streakDays === 1 ? 'day' : 'days';
			return `${firstName} - ${streakDays} ${dayLabel} in a row 🔥`;
		}

		// For users who practiced recently but streak broke
		if (lastPracticeDate) {
			const daysSince = Math.floor(
				(Date.now() - lastPracticeDate.getTime()) / (1000 * 60 * 60 * 24)
			);
			if (daysSince === 1) {
				return languageName
					? `${firstName}, quick ${languageName} session?`
					: `${firstName}, quick session?`;
			} else if (daysSince <= 3) {
				return languageName
					? `${firstName} - missing your ${languageName} practice?`
					: `${firstName} - missing practice?`;
			} else if (daysSince <= 7) {
				return `${firstName}, want to jump back in?`;
			}
		}

		// For new users or dormant users (never practiced or long time)
		return languageName
			? `${firstName}, got 5 min for ${languageName}?`
			: `${firstName}, got 5 min?`;
	}

	/**
	 * Generate reminder email template
	 */
	public static getReminderEmailTemplate(data: PracticeReminderData): string {
		const {
			user,
			lastScenario,
			recommendedScenarios,
			lastPracticeDate,
			streakDays,
			targetLanguage,
			survivalPhrase
		} = data;
		// Extract first name consistently
		let firstName = user.displayName?.trim().split(/\s+/)[0] || user.email.split('@')[0];
		if (!user.displayName && firstName) {
			firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
		}
		const languageName = targetLanguage?.name;

		const lastPracticeText = lastPracticeDate
			? `I noticed you practiced ${this.formatDate(lastPracticeDate)}`
			: languageName
				? `I see you signed up but haven't had a chance to try a ${languageName} conversation yet`
				: `I see you signed up but haven't had a chance to try a conversation yet`;

		const streakText =
			streakDays > 0
				? `${streakDays} ${streakDays === 1 ? 'day' : 'days'} in a row 🔥`
				: languageName
					? `Got 5 minutes for ${languageName}?`
					: 'Got 5 minutes to practice?';

		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<style>
					body {
						font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif;
						line-height: 1.5;
						color: #000;
						max-width: 600px;
						margin: 0;
						padding: 20px;
						background-color: #fff;
					}
					p {
						margin: 12px 0;
					}
					a {
						color: #2563eb;
						text-decoration: none;
					}
					a:hover {
						text-decoration: underline;
					}
					.scenario {
						margin: 20px 0;
						padding-left: 8px;
					}
					.footer {
						margin-top: 30px;
						padding-top: 20px;
						border-top: 1px solid #e5e5e5;
						font-size: 12px;
						color: #666;
					}
				</style>
			</head>
			<body>
				<p>Hey ${firstName},</p>

				<p>${streakText}</p>

				<p>${lastPracticeText}. ${streakDays > 0 ? "You're building a great habit—thought" : "Thought"} I'd share a couple scenarios:</p>

					${
						lastScenario
							? `
						<div class="scenario">
							<strong>Continue with: ${lastScenario.title}</strong><br>
							${lastScenario.description}<br>
							<a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/?scenario=${lastScenario.id}">→ Try it</a>
						</div>
					`
							: ''
					}

					${recommendedScenarios
						.map(
							(scenario) => `
						<div class="scenario">
							<strong>${scenario.title}</strong><br>
							${scenario.description}<br>
							<a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/?scenario=${scenario.id}">→ Try it</a>
						</div>
					`
						)
						.join('')}

					<p><a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}">Or start any conversation →</a></p>

					${
						survivalPhrase
							? `
					<p style="margin-top: 20px;"><strong>Quick tip:</strong> ${survivalPhrase.translation} (${survivalPhrase.phrase})</p>
					`
							: ''
					}

					<p>Even just 5 minutes helps. No pressure—whenever you're ready.</p>

					<p style="margin-top: 20px;">Want to chat about your language goals? <a href="https://calendar.google.com/calendar/u/0/appointments/schedules/AcZssZ2xfiCKe9x6L4f5RLBBUdNrFKd-9cqiHxZyQ2L48KPVc-X4pXuApUm2tVy3QNJQqZC43N0mh-pr">Grab 15 min on my calendar</a>.</p>

					<p style="margin-top: 24px;">– Hiro<br><span style="color: #666;">P.S. This is my personal email—just reply if you have questions or feedback. I read everything.</span></p>
					
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

	private static async getTargetLanguageInfo(
		userId: string
	): Promise<{ name: string; code: string }> {
		try {
			const preferences = await userPreferencesRepository.getAllUserPreferences(userId);
			if (!preferences || preferences.length === 0) {
				return { name: '', code: '' };
			}

			const targetLanguage = await languageRepository.findLanguageById(
				preferences[0].targetLanguageId
			);

			if (!targetLanguage) {
				return { name: '', code: '' };
			}

			return {
				name: targetLanguage.name,
				code: targetLanguage.code
			};
		} catch (error) {
			console.error('Error fetching target language:', error);
			return { name: '', code: '' };
		}
	}

	private static pickSurvivalPhrase(
		languageCode: string
	): { phrase: string; translation: string } | null {
		if (!languageCode) {
			return null;
		}

		for (const phrase of survivalPhrases) {
			const translation = phrase.translations[languageCode as keyof typeof phrase.translations];
			if (translation) {
				return {
					phrase: phrase.phrase,
					translation
				};
			}
		}

		return null;
	}
}
