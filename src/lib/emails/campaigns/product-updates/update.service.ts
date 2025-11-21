import { logger } from '$lib/logger';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { userRepository } from '$lib/server/repositories';
import type { User } from '$lib/server/db/types';
import { EmailPermissionService } from '$lib/emails/shared/email-permission';
import { generateKaiwaEmail, type KaiwaEmailContent } from '$lib/emails/shared/base-template';

const resend = new Resend(env.RESEND_API_KEY || 're_dummy_resend_key');

/**
 * Product Updates Email Service
 *
 * Sends product updates and feature announcements to users
 * who have opted in to receive product updates.
 *
 * Usage:
 * - sendWeeklyUpdate() - Send weekly updates with clean template
 * - sendProductUpdate() - Legacy simple update format
 * - Can send bulk emails to all subscribers
 */
export class ProductUpdatesEmailService {
	public static readonly SENDER_EMAIL = 'hiro@trykaiwa.com';
	public static readonly SENDER_NAME = 'Hiro';

	/**
	 * Send a weekly update email to all eligible users
	 *
	 * This is the easiest way to send your weekly email:
	 * 1. Edit weekly-update-template.ts
	 * 2. Call this method
	 * 3. Done!
	 */
	static async sendWeeklyUpdate(
		content: KaiwaEmailContent
	): Promise<{ sent: number; skipped: number; failed: number }> {
		if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
			logger.warn('RESEND_API_KEY not configured, skipping email send');
			return { sent: 0, skipped: 0, failed: 0 };
		}

		const eligibleUserIds = await EmailPermissionService.getProductUpdateEligibleUsers();
		if (eligibleUserIds.length === 0) {
			logger.info('No product update subscribers found.');
			return { sent: 0, skipped: 0, failed: 0 };
		}

		let sent = 0;
		let skipped = 0;
		let failed = 0;

		const subject = content.preheader || 'Kaiwa Weekly Update';

		for (const userId of eligibleUserIds) {
			const user = await userRepository.findUserById(userId);
			if (!user || !user.email) {
				skipped++;
				continue;
			}

			// Generate personalized email with user's first name
			const firstName = user.displayName?.split(' ')[0];
			const html = generateKaiwaEmail(content, firstName);

			// Replace placeholders
			const appUrl = env.PUBLIC_APP_URL || 'https://trykaiwa.com';
			const finalHtml = html
				.replace(
					/\{\{UNSUBSCRIBE_URL\}\}/g,
					`${appUrl}/profile/email-preferences?unsubscribe=product-updates`
				)
				.replace(/\{\{PREFERENCES_URL\}\}/g, `${appUrl}/profile/email-preferences`);

			const result = await resend.emails.send({
				from: `${this.SENDER_NAME} <${this.SENDER_EMAIL}>`,
				replyTo: this.SENDER_EMAIL,
				to: [user.email],
				subject,
				html: finalHtml
			});

			if (result.error) {
				logger.error('Failed to send weekly email to user', user.id, result.error);
				failed++;
				continue;
			}

			sent++;

			// Rate-limit safety
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		logger.info(`Weekly email sent: ${sent} emails, skipped: ${skipped}, failed: ${failed}`);
		return { sent, skipped, failed };
	}

	/**
	 * Send a product update email to all eligible users
	 */
	static async sendProductUpdate(options: {
		subject: string;
		title: string;
		summary: string;
		details: string;
		ctaText?: string;
		ctaUrl?: string;
	}): Promise<{ sent: number; skipped: number; failed: number }> {
		if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
			logger.warn('RESEND_API_KEY not configured, skipping product update send');
			return { sent: 0, skipped: 0, failed: 0 };
		}

		const eligibleUserIds = await EmailPermissionService.getProductUpdateEligibleUsers();
		if (eligibleUserIds.length === 0) {
			logger.info('No product update subscribers found.');
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

			const html = this.buildProductUpdateEmail(user, options);

			const result = await resend.emails.send({
				from: `${this.SENDER_NAME} <${this.SENDER_EMAIL}>`,
				replyTo: this.SENDER_EMAIL,
				to: [user.email],
				subject: options.subject,
				html
			});

			if (result.error) {
				logger.error('Failed to send product update to user', user.id, result.error);
				failed++;
				continue;
			}

			sent++;

			// Rate-limit safety
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		logger.info(`Product update sent: ${sent} emails, skipped: ${skipped}, failed: ${failed}`);
		return { sent, skipped, failed };
	}

	/**
	 * Send product update to a specific user
	 */
	static async sendProductUpdateToUser(
		userId: string,
		options: {
			subject: string;
			title: string;
			summary: string;
			details: string;
			ctaText?: string;
			ctaUrl?: string;
		}
	): Promise<boolean> {
		if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
			logger.warn('RESEND_API_KEY not configured, skipping product update send');
			return true;
		}

		// Check email permissions
		if (!(await EmailPermissionService.canReceiveProductUpdates(userId))) {
			logger.warn(`User ${userId} not eligible for product updates`);
			return false;
		}

		const user = await userRepository.findUserById(userId);
		if (!user || !user.email) {
			logger.warn(`User ${userId} not found or has no email`);
			return false;
		}

		const html = this.buildProductUpdateEmail(user, options);

		const result = await resend.emails.send({
			from: `${this.SENDER_NAME} <${this.SENDER_EMAIL}>`,
			replyTo: this.SENDER_EMAIL,
			to: [user.email],
			subject: options.subject,
			html
		});

		if (result.error) {
			logger.error('Failed to send product update to user', user.id, result.error);
			return false;
		}

		logger.info('Product update sent to user:', user.id);
		return true;
	}

	private static buildProductUpdateEmail(
		user: User,
		options: {
			subject: string;
			title: string;
			summary: string;
			details: string;
			ctaText?: string;
			ctaUrl?: string;
		}
	): string {
		const firstName = user.displayName?.split(' ')[0] || 'there';
		const ctaButton =
			options.ctaUrl && options.ctaText
				? `
					<div style="margin: 24px 0;">
						<a href="${options.ctaUrl}" style="background: #667eea; color: white; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 500; display: inline-block;">
							${options.ctaText}
						</a>
					</div>
				`
				: '';

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
						font-size: 24px;
						margin: 0 0 12px;
						color: #1f2937;
					}
					.summary {
						font-size: 16px;
						color: #6b7280;
						margin-bottom: 20px;
						padding: 16px;
						background: #f3f4f6;
						border-radius: 6px;
					}
					.details {
						color: #374151;
						margin: 20px 0;
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

				<h1>${options.title}</h1>

				<div class="summary">
					${options.summary}
				</div>

				<div class="details">
					${options.details}
				</div>

				${ctaButton}

				<p>If you have any questions or feedback about this update, just reply to this email!</p>

				<div class="signature">
					<div class="signature-name">${this.SENDER_NAME}</div>
					<div class="signature-title">Founder, Kaiwa</div>
					<div style="margin-top: 8px; font-size: 14px; color: #6b7280;">
						📧 ${this.SENDER_EMAIL}<br>
						🌐 <a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}">trykaiwa.com</a>
					</div>
				</div>

				<p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">
					You're receiving this because you have product updates enabled in your email preferences.
					<a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/profile/email-preferences">Manage preferences</a>
				</p>
			</body>
			</html>
		`;
	}
}
