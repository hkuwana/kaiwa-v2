import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { userRepository } from '$lib/server/repositories';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { scenarioRepository } from '$lib/server/repositories';
import { EmailPermissionService } from './email-permission.service';
import type { Scenario, User } from '$lib/server/db/types';
import { userPreferencesRepository } from '$lib/server/repositories/user-preferences.repository';
import { languageRepository } from '$lib/server/repositories/language.repository';

const resend = new Resend(env.RESEND_API_KEY || 're_dummy_resend_key');

export type UserSegment =
	| 'new_user'
	| 'slightly_inactive'
	| 'moderately_inactive'
	| 'highly_inactive'
	| 'dormant';

/**
 * Enhanced email reminder service with segmented messaging
 *
 * Different email templates based on user activity level:
 * - New users: Welcome, show what they can do
 * - Slightly inactive (1-3 days): Gentle reminder
 * - Moderately inactive (3-7 days): Motivation boost
 * - Highly inactive (7-30 days): Re-engagement
 * - Dormant (30+ days): Win-back campaign
 */
export class EmailReminderEnhancedService {
	/**
	 * Send segmented reminder email
	 */
	static async sendSegmentedReminder(userId: string, segment: UserSegment): Promise<boolean> {
		try {
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

			const user = await userRepository.findUserById(userId);
			if (!user) {
				console.warn(`User ${userId} not found`);
				return false;
			}

			const { subject, html } = await this.getSegmentedEmail(user, segment);

			const result = await resend.emails.send({
				from: 'Kaiwa <noreply@trykaiwa.com',
				to: [user.email],
				subject,
				html
			});

			if (result.error) {
				console.error('Failed to send segmented reminder:', result.error);
				return false;
			}

			console.log('Segmented reminder sent successfully:', result.data?.id);
			return true;
		} catch (error) {
			console.error('Error sending segmented reminder:', error);
			return false;
		}
	}

	/**
	 * Get email content based on segment
	 */
	public static async getSegmentedEmail(
		user: User,
		segment: UserSegment
	): Promise<{ subject: string; html: string }> {
		switch (segment) {
			case 'new_user':
				return this.getNewUserEmail(user);
			case 'slightly_inactive':
				return this.getSlightlyInactiveEmail(user);
			case 'moderately_inactive':
				return this.getModeratelyInactiveEmail(user);
			case 'highly_inactive':
				return this.getHighlyInactiveEmail(user);
			case 'dormant':
				return this.getDormantUserEmail(user);
			default:
				return this.getSlightlyInactiveEmail(user);
		}
	}

	/**
	 * NEW USER: Welcome and show them what's possible
	 */
	private static async getNewUserEmail(user: User): Promise<{ subject: string; html: string }> {
		const displayName = user.displayName || 'there';
		const scenarios = await scenarioRepository.findActiveScenarios();
		const featured = scenarios.slice(0, 3);

		return {
			subject: `${displayName}, ready for your first conversation? 🎯`,
			html: this.getEmailTemplate({
				displayName,
				headline: "You're all set! Let's start your first conversation",
				message: `
					<p>Welcome to Kaiwa! You've taken the first step by signing up. Now comes the fun part: your first conversation.</p>

					<p>Here's what makes this different:</p>
					<ul>
						<li>✨ <strong>No grammar drills</strong> - Just real conversations</li>
						<li>🎯 <strong>Personalized scenarios</strong> - Talk about what matters to you</li>
						<li>💬 <strong>Instant feedback</strong> - Learn as you speak</li>
						<li>🚀 <strong>5 minutes</strong> - That's all it takes to start</li>
					</ul>

					<div style="background: #e0f2fe; border-left: 4px solid #0288d1; padding: 20px; margin: 20px 0; border-radius: 8px;">
						<strong style="color: #0288d1;">💡 Quick Start Tip:</strong><br>
						Start with an easy scenario like "Coffee Shop Order" or "Hotel Check-in". You'll be surprised how much you can say!
					</div>
				`,
				cta: {
					text: 'Start My First Conversation',
					url: `${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}`
				},
				scenarios: featured,
				footer: `
					<p style="font-size: 14px; color: #666;">
						<strong>New here?</strong> Try your first conversation - it takes less than 5 minutes and there's no pressure. You can stop anytime.
					</p>
				`
			})
		};
	}

	/**
	 * SLIGHTLY INACTIVE (1-3 days): Gentle nudge
	 */
	private static async getSlightlyInactiveEmail(
		user: User
	): Promise<{ subject: string; html: string }> {
		const displayName = user.displayName || 'there';
		const sessions = await conversationSessionsRepository.getUserSessions(user.id, 1);
		const lastSession = sessions[0];
		const daysSince = lastSession
			? Math.floor((Date.now() - lastSession.startTime.getTime()) / (1000 * 60 * 60 * 24))
			: 0;

		return {
			subject: `Miss you already! Ready to practice today? 💪`,
			html: this.getEmailTemplate({
				displayName,
				headline: `It's been ${daysSince} ${daysSince === 1 ? 'day' : 'days'}. Ready to keep the momentum?`,
				message: `
					<p>You did great last time! The best way to make progress is consistency - even just 5 minutes today makes a difference.</p>

					<div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 8px;">
						<strong style="color: #d97706;">⚡ Did you know?</strong><br>
						Research shows that daily practice (even short sessions) is 3x more effective than occasional long study sessions.
					</div>

					<p><strong>Pick up where you left off:</strong></p>
				`,
				cta: {
					text: 'Continue Practicing',
					url: `${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}`
				},
				footer: `
					<p style="font-size: 14px; color: #666;">
						Too busy today? Even 3 minutes helps. You can start small and build from there.
					</p>
				`
			})
		};
	}

	/**
	 * MODERATELY INACTIVE (3-7 days): Motivation boost
	 */
	private static async getModeratelyInactiveEmail(
		user: User
	): Promise<{ subject: string; html: string }> {
		const displayName = user.displayName || 'there';

		return {
			subject: `Don't let your progress fade! Come back? 🌟`,
			html: this.getEmailTemplate({
				displayName,
				headline: 'Your language skills are waiting for you',
				message: `
					<p>Hey ${displayName},</p>

					<p>It's been a week since we've seen you. Life gets busy - we get it. But here's the thing: you've already invested time in learning. Don't let that progress slip away.</p>

					<div style="background: #dcfce7; border-left: 4px solid #22c55e; padding: 20px; margin: 20px 0; border-radius: 8px;">
						<strong style="color: #16a34a;">💚 Your Progress Matters:</strong><br>
						Every conversation you have builds neural pathways. Taking a week off means those pathways start to fade. But the good news? One practice session brings them right back.
					</div>

					<p><strong>What's holding you back?</strong></p>
					<ul>
						<li>Feeling rusty? <em>Normal! It comes back fast.</em></li>
						<li>Don't have much time? <em>5 minutes is enough.</em></li>
						<li>Lost motivation? <em>We'll help you find it again.</em></li>
					</ul>
				`,
				cta: {
					text: "Let's Get Back to It",
					url: `${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}`
				},
				footer: `
					<p style="font-size: 14px; color: #666;">
						Not interested anymore? <a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/profile/email-preferences">Update your email preferences</a>
					</p>
				`
			})
		};
	}

	/**
	 * HIGHLY INACTIVE (7-30 days): Re-engagement
	 */
	private static async getHighlyInactiveEmail(
		user: User
	): Promise<{ subject: string; html: string }> {
		const displayName = user.displayName || 'there';

		return {
			subject: `We miss you! Here's what's new 🎁`,
			html: this.getEmailTemplate({
				displayName,
				headline: "Come back and see what's new!",
				message: `
					<p>Hi ${displayName},</p>

					<p>It's been a few weeks. Maybe Kaiwa wasn't quite right for you, or maybe life got in the way. Either way, we'd love to have you back.</p>

					<div style="background: #f3e8ff; border-left: 4px solid #a855f7; padding: 20px; margin: 20px 0; border-radius: 8px;">
						<strong style="color: #9333ea;">🆕 What's New Since You Left:</strong><br>
						<ul style="margin: 10px 0;">
							<li>New conversation scenarios added weekly</li>
							<li>Improved voice recognition and feedback</li>
							<li>Better progress tracking</li>
							<li>More realistic conversations</li>
						</ul>
					</div>

					<p><strong>We want to understand:</strong> What would make Kaiwa more useful for you?</p>
					<ul>
						<li>Different conversation topics?</li>
						<li>Shorter practice sessions?</li>
						<li>More structured lessons?</li>
					</ul>

					<p>Hit reply and let us know. We read every email.</p>
				`,
				cta: {
					text: 'Give Kaiwa Another Try',
					url: `${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}`
				},
				footer: `
					<p style="font-size: 14px; color: #666;">
						Not coming back? We'd love to know why. <a href="mailto:support@trykaiwa.com?subject=Feedback">Send us feedback</a> or <a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/profile/email-preferences">unsubscribe</a>.
					</p>
				`
			})
		};
	}

	/**
	 * DORMANT (30+ days): Win-back campaign
	 */
	private static async getDormantUserEmail(user: User): Promise<{ subject: string; html: string }> {
		const displayName = user.displayName || 'there';

		const preferences = await userPreferencesRepository.getAllUserPreferences(user.id);
		let languageName = 'a new language'; // Default fallback
		if (preferences && preferences.length > 0) {
			const targetLanguage = await languageRepository.findLanguageById(
				preferences[0].targetLanguageId
			);
			if (targetLanguage) {
				languageName = targetLanguage.name;
			}
		}

		return {
			subject: `Last chance: Your Kaiwa account is still here 🌸`,
			html: this.getEmailTemplate({
				displayName,
				headline: 'One more try?',
				message: `
					<p>Hi ${displayName},</p>

					<p>It's been over a month since you last used Kaiwa. This is probably our last email to you.</p>

					<p>We're not going to guilt-trip you. Language learning is hard. Life gets busy. We get it.</p>

					<div style="background: #fee2e2; border-left: 4px solid #ef4444; padding: 20px; margin: 20px 0; border-radius: 8px;">
						<strong style="color: #dc2626;">❤️ The Real Question:</strong><br>
						Do you still want to speak ${languageName}? Like, really want to?<br><br>
						If yes, we're here. If no, that's totally okay too.
					</div>

					<p><strong>If you do want to try again:</strong></p>
					<ul>
						<li>Your account and progress are still here</li>
						<li>It takes 2 minutes to jump back in</li>
						<li>No judgment, no pressure</li>
					</ul>

					<p>If not, we'll stop emailing you. No hard feelings.</p>
				`,
				cta: {
					text: 'One More Conversation',
					url: `${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}`
				},
				footer: `
					<p style="font-size: 14px; color: #666;">
						<a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/profile/email-preferences">Unsubscribe from these emails</a> | We'll take you off our list after this.
					</p>
				`
			})
		};
	}

	/**
	 * Email template wrapper
	 */
	private static getEmailTemplate(config: {
		displayName: string;
		headline: string;
		message: string;
		cta: { text: string; url: string };
		scenarios?: Scenario[];
		footer?: string;
	}): string {
		const { displayName, headline, message, cta, scenarios, footer } = config;

		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>${headline} - Kaiwa</title>
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
						border-radius: 12px;
						padding: 40px;
						box-shadow: 0 4px 20px rgba(0,0,0,0.1);
					}
					.header {
						text-align: center;
						margin-bottom: 30px;
					}
					.logo {
						font-size: 32px;
						font-weight: bold;
						background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
						-webkit-background-clip: text;
						-webkit-text-fill-color: transparent;
						margin-bottom: 10px;
					}
					.headline {
						font-size: 24px;
						font-weight: bold;
						color: #1e293b;
						margin: 20px 0;
					}
					.cta-button {
						background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
						color: white;
						padding: 16px 32px;
						text-decoration: none;
						border-radius: 8px;
						display: inline-block;
						font-weight: bold;
						font-size: 16px;
						margin: 20px 0;
						text-align: center;
					}
					.cta-button:hover {
						opacity: 0.9;
					}
					.scenario-card {
						background: #f8f9fa;
						border: 1px solid #e9ecef;
						border-radius: 8px;
						padding: 15px;
						margin: 10px 0;
					}
					.scenario-title {
						font-weight: bold;
						color: #667eea;
						margin-bottom: 5px;
					}
					.footer {
						margin-top: 40px;
						padding-top: 20px;
						border-top: 1px solid #e2e8f0;
						font-size: 14px;
						color: #64748b;
						text-align: center;
					}
					ul {
						padding-left: 20px;
					}
					li {
						margin: 8px 0;
					}
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<div class="logo">Kaiwa</div>
						<div class="headline">${headline}</div>
					</div>

					${message}

					${
						scenarios && scenarios.length > 0
							? `
						<div style="margin: 30px 0;">
							<p><strong>Try these conversations:</strong></p>
							${scenarios
								.map(
									(s) => `
								<div class="scenario-card">
									<div class="scenario-title">${s.title}</div>
									<div style="font-size: 14px; color: #666; margin-bottom: 10px;">${s.description}</div>
									<a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/?scenario=${s.id}" class="cta-button" style="color: white; text-decoration: none; font-size: 14px; padding: 8px 16px;">Try This Scenario</a>
								</div>
							`
								)
								.join('')}
						</div>
					`
							: ''
					}

					<div style="text-align: center; margin: 30px 0;">
						<a href="${cta.url}" class="cta-button" style="color: white; text-decoration: none;">${cta.text}</a>
					</div>

					${footer || ''}

					<div class="footer">
						<p>Sent with ❤️ from Kaiwa</p>
						<p><a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/profile/email-preferences">Email Preferences</a> | <a href="mailto:support@trykaiwa.com">Support</a></p>
						<p>&copy; ${new Date().getFullYear()} Kaiwa. All rights reserved.</p>
					</div>
				</div>
			</body>
			</html>
		`;
	}
}
