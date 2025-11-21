import { logger } from '$lib/logger';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { userRepository } from '$lib/server/repositories';
import { conversationSessionsRepository } from '$lib/server/repositories/conversation-sessions.repository';
import { EmailPermissionService } from './email-permission.service';
import type { User } from '$lib/server/db/types';
import { userPreferencesRepository } from '$lib/server/repositories/user-preferences.repository';
import { languageRepository } from '$lib/server/repositories/language.repository';
import { CALENDAR_LINK } from '$lib/data/calendar';

const resend = new Resend(env.RESEND_API_KEY || 're_dummy_resend_key');

/**
 * Founder Personal Email Service
 *
 * Personal touch approach for early users:
 * - Day 1 (if no practice): Warm welcome from founder
 * - Day 2 (if still no practice): Check-in, offer help
 * - Day 3 (if still no practice): Personal offer to talk (calendar link)
 *
 * Key principles:
 * - Send from founder's email (hiro@trykaiwa.com)
 * - Personal, conversational tone
 * - Afternoon sending (2-4pm user's local time)
 * - Include calendar link on Day 3
 * - Easy reply for feedback
 */
export class FounderEmailService {
	public static readonly FOUNDER_EMAIL = 'hiro@trykaiwa.com'; // Using verified Resend domain
	public static readonly FOUNDER_NAME = 'Hiro';
	public static readonly CAL_LINK = CALENDAR_LINK;

	/**
	 * Send Day 1 welcome email if user hasn't practiced
	 */
	static async sendDay1Welcome(userId: string): Promise<boolean> {
		try {
			if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
				logger.warn('RESEND_API_KEY not configured, skipping email send');
				return true;
			}

			// Check email permissions from database
			if (!(await EmailPermissionService.canReceiveFounderEmails(userId))) {
				logger.warn(
					`User ${userId} not eligible for marketing emails (user not found or opted out)`
				);
				return false;
			}

			const user = await userRepository.findUserById(userId);
			if (!user) {
				return false;
			}

			// Check if user has practiced
			const sessions = await conversationSessionsRepository.getUserSessions(userId, 1);
			if (sessions.length > 0) {
				return false; // User already practiced, don't send
			}

			const languageName = await this.resolveTargetLanguageName(userId);
			const firstName = user.displayName?.split(' ')[0] || 'there';

			const result = await resend.emails.send({
				from: `${this.FOUNDER_NAME} <${this.FOUNDER_EMAIL}>`,
				replyTo: this.FOUNDER_EMAIL,
				to: [user.email],
				subject: languageName
					? `${firstName}, ready for your first ${languageName} conversation?`
					: `${firstName}, welcome to Kaiwa! (from Hiro)`,
				html: this.getDay1Email(user, languageName)
			});

			if (result.error) {
				logger.error('Failed to send Day 1 email:', result.error);
				return false;
			}

			logger.info('Day 1 founder email sent:', result.data?.id);
			return true;
		} catch (error) {
			logger.error('Error sending Day 1 email:', error);
			return false;
		}
	}

	/**
	 * Send Day 2 check-in if user still hasn't practiced
	 */
	static async sendDay2CheckIn(userId: string): Promise<boolean> {
		try {
			if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
				return true;
			}

			// Check email permissions from database
			if (!(await EmailPermissionService.canReceiveFounderEmails(userId))) {
				logger.warn(
					`User ${userId} not eligible for marketing emails (user not found or opted out)`
				);
				return false;
			}

			const user = await userRepository.findUserById(userId);
			if (!user) {
				return false;
			}

			// Check if user has practiced
			const sessions = await conversationSessionsRepository.getUserSessions(userId, 1);
			if (sessions.length > 0) {
				return false; // User practiced, don't send
			}

			const languageName = await this.resolveTargetLanguageName(userId);

			const result = await resend.emails.send({
				from: `${this.FOUNDER_NAME} <${this.FOUNDER_EMAIL}>`,
				replyTo: this.FOUNDER_EMAIL,
				to: [user.email],
				subject: languageName
					? `Anything I can do to help with your ${languageName} practice?`
					: `Quick check-in - how's it going?`,
				html: this.getDay2Email(user, languageName)
			});

			if (result.error) {
				logger.error('Failed to send Day 2 email:', result.error);
				return false;
			}

			logger.info('Day 2 founder email sent:', result.data?.id);
			return true;
		} catch (error) {
			logger.error('Error sending Day 2 email:', error);
			return false;
		}
	}

	/**
	 * Send Day 3 personal offer to talk
	 */
	static async sendDay3PersonalOffer(userId: string): Promise<boolean> {
		try {
			if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
				return true;
			}

			// Check email permissions from database
			if (!(await EmailPermissionService.canReceiveFounderEmails(userId))) {
				logger.warn(
					`User ${userId} not eligible for marketing emails (user not found or opted out)`
				);
				return false;
			}

			const user = await userRepository.findUserById(userId);
			if (!user) {
				return false;
			}

			// Check if user has practiced
			const sessions = await conversationSessionsRepository.getUserSessions(userId, 1);
			if (sessions.length > 0) {
				return false; // User practiced, don't send
			}

			const languageName = await this.resolveTargetLanguageName(userId);

			const result = await resend.emails.send({
				from: `${this.FOUNDER_NAME} <${this.FOUNDER_EMAIL}>`,
				replyTo: this.FOUNDER_EMAIL,
				to: [user.email],
				subject: `Can I help? (15 min chat)`,
				html: this.getDay3Email(user, languageName)
			});

			if (result.error) {
				logger.error('Failed to send Day 3 email:', result.error);
				return false;
			}

			logger.info('Day 3 founder email sent:', result.data?.id);
			return true;
		} catch (error) {
			logger.error('Error sending Day 3 email:', error);
			return false;
		}
	}

	/**
	 * Day 1: Warm welcome
	 */
	public static getDay1Email(user: User, languageName: string | null): string {
		const firstName = user.displayName?.split(' ')[0] || 'there';
		const languageCta = languageName ? `${languageName} Conversation` : 'Conversation';

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
					.cta {
						background: #667eea;
						color: white;
						padding: 12px 24px;
						border-radius: 6px;
						display: inline-block;
						margin: 20px 0;
						font-weight: 500;
					}
					.cta:hover {
						background: #5568d3;
						text-decoration: none;
					}
				</style>
			</head>
			<body>
				<p>Hi ${firstName},</p>

				<p>Thanks for joining Kaiwa! I'm Hiro, and I built this to make speaking ${languageName || 'a new language'} feel less intimidating—especially when it's for the people you care about.</p>

				<p><strong>Here's the only goal for today:</strong></p>
				<p>Just aim for <strong>one 5-minute conversation</strong>. That's it. Don't worry about being perfect. The AI tutor is patient and won't judge you. I promise it's way less scary than it seems.</p>

				<p>Why not try it right now?</p>

				<a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}" class="cta" style="color: white; text-decoration: none;">
					Start My First ${languageCta} (5 min)
				</a>

				<p>If something's not working or you have questions, just hit reply. I read every email and usually respond within a few hours.</p>
				<p>If this email feels off, let me know—I'll make it right.</p>

				<p>Looking forward to hearing how it goes,</p>

				<div class="signature">
					<div class="signature-name">${this.FOUNDER_NAME}</div>
					<div class="signature-title">Founder, Kaiwa</div>
					<div style="margin-top: 8px; font-size: 14px; color: #6b7280;">
						📧 ${this.FOUNDER_EMAIL}<br>
						🌐 <a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}">trykaiwa.com</a>
					</div>
				</div>

				<p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">
					P.S. If Kaiwa isn't for you, no worries - just <a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/profile">manage your email preferences →</a> and I'll stop emailing.
				</p>
			</body>
			</html>
		`;
	}

	/**
	 * Day 2: Check-in
	 */
	public static getDay2Email(user: User, languageName: string | null): string {
		const firstName = user.displayName?.split(' ')[0] || 'there';
		const languagePhrase = languageName ? `${languageName} conversation` : 'conversation';

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
					.cta {
						background: #667eea;
						color: white;
						padding: 12px 24px;
						border-radius: 6px;
						display: inline-block;
						margin: 20px 0;
						font-weight: 500;
					}
					.cta:hover {
						background: #5568d3;
						text-decoration: none;
					}
					.feedback-box {
						background: #f9fafb;
						border-left: 3px solid #667eea;
						padding: 15px;
						margin: 20px 0;
					}
				</style>
			</head>
			<body>
				<p>Hey ${firstName},</p>

				<p>Just wanted to check in. Seems like you haven't had a chance to try a ${languagePhrase} yet—totally normal. Anything getting in the way that I can help with?</p>

				<div class="feedback-box">
					<strong>Common concerns I hear:</strong>
					<ul style="margin: 10px 0;">
						<li>"I don't know where to start" → Try the Coffee Shop scenario, it's super easy</li>
						<li>"I'm worried I'll sound bad" → The AI is trained to be encouraging, not critical</li>
						<li>"I don't have time" → Seriously, 5 minutes is enough. Try it while making coffee</li>
						<li>"The UI is confusing" → Let me walk you through it! Hit reply</li>
					</ul>
				</div>

				<p>Is something else holding you back? I'd genuinely love to know so I can make Kaiwa better.</p>

				<p><strong>Or if you're ready, let's do this:</strong></p>

				<a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}" class="cta" style="color: white; text-decoration: none;">
					Just Try It Once (5 min)
				</a>

				<p>Reply anytime - I'm here to help!</p>
				<p>If this email missed the mark, let me know so I can fix it.</p>

				<div class="signature">
					<div class="signature-name">${this.FOUNDER_NAME}</div>
					<div class="signature-title">Founder, Kaiwa</div>
					<div style="margin-top: 8px; font-size: 14px; color: #6b7280;">
						📧 ${this.FOUNDER_EMAIL}
					</div>
				</div>

				<p style="margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center;">
					<a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/profile">Manage your email preferences →</a>
				</p>
			</body>
			</html>
		`;
	}

	/**
	 * Day 3: Personal offer to talk
	 */
	public static getDay3Email(user: User, languageName: string | null): string {
		const firstName = user.displayName?.split(' ')[0] || 'there';
		const languageLabel = languageName || 'a new language';

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
					.cta {
						background: #667eea;
						color: white;
						padding: 14px 28px;
						border-radius: 6px;
						display: inline-block;
						margin: 20px 0;
						font-weight: 500;
						font-size: 16px;
					}
					.cta:hover {
						background: #5568d3;
						text-decoration: none;
					}
					.calendar-box {
						background: #f0f9ff;
						border: 2px solid #667eea;
						border-radius: 8px;
						padding: 20px;
						margin: 20px 0;
						text-align: center;
					}
				</style>
			</head>
			<body>
				<p>Hi ${firstName},</p>

				<p>This is my last email, promise! But I wanted to make one final offer:</p>

				<p><strong>Want to jump on a quick 15-minute call?</strong></p>

				<p>I'm genuinely curious what's not clicking for you with Kaiwa. Maybe it's:</p>
				<ul>
					<li>Something about the app that's confusing?</li>
					<li>You're not sure it'll work for your specific situation?</li>
					<li>You have questions about how to practice effectively?</li>
					<li>Or maybe language learning just isn't a priority right now?</li>
				</ul>

				<p>Whatever it is, I'd love to hear it. Your feedback helps me build a better product for the next person.</p>

				<p>Each week I also send a short update with what we shipped and which learner requests we knocked out. If there's something you need, hit reply so I can include it and loop back once it's live.</p>

				<div class="calendar-box">
					<p style="margin-top: 0;"><strong>Let's talk</strong></p>
					<p style="font-size: 14px; color: #6b7280; margin-bottom: 15px;">
						Pick a time that works for you (no pressure, no sales pitch)
					</p>
					<a href="${this.CAL_LINK}" class="cta" style="color: white; text-decoration: none;">
						📅 Book 15 Minutes with ${this.FOUNDER_NAME}
					</a>
					<p style="font-size: 13px; color: #9ca3af; margin-bottom: 0;">
						Or just reply to this email - either works!
					</p>
				</div>

				<p>And hey, if you're not interested in talking OR trying Kaiwa, that's totally okay. I'll take you off my list after this. No hard feelings.</p>

				<p>But if you <em>do</em> want to learn ${languageLabel} and just haven't found the right approach yet, I'd love to help figure it out with you.</p>

				<p>Thanks for giving Kaiwa a chance,</p>

				<div class="signature">
					<div class="signature-name">${this.FOUNDER_NAME}</div>
					<div class="signature-title">Founder, Kaiwa</div>
					<div style="margin-top: 8px; font-size: 14px; color: #6b7280;">
						📧 ${this.FOUNDER_EMAIL}<br>
						📅 <a href="${this.CAL_LINK}">Book a call</a><br>
						🌐 <a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}">trykaiwa.com</a>
					</div>
				</div>

				<p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">
					P.S. This is genuinely the last email unless you book a call or reply. I respect your inbox!
				</p>

				<p style="margin-top: 20px; font-size: 12px; color: #9ca3af; text-align: center;">
					<a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/profile">Manage your email preferences →</a>
				</p>
			</body>
			</html>
		`;
	}

	public static async resolveTargetLanguageName(userId: string): Promise<string | null> {
		const preferences = await userPreferencesRepository.getAllUserPreferences(userId);

		if (!preferences || preferences.length === 0) {
			return null;
		}

		const targetLanguage = await languageRepository.findLanguageById(
			preferences[0].targetLanguageId
		);

		return targetLanguage?.name ?? null;
	}
}
