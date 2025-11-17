import { logger } from '$lib/logger';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { userSettingsRepository } from '$lib/server/repositories/user-settings.repository';
import { userRepository } from '$lib/server/repositories';
import { analyticsEventsRepository } from '$lib/server/repositories/analytics-events.repository';
import type { User } from '$lib/server/db/types';

const resend = new Resend(env.RESEND_API_KEY || 're_dummy_resend_key');

export interface WeeklyUpdateItem {
	title: string;
	summary: string;
	linkLabel?: string;
	linkUrl?: string;
}

export interface FeedbackFollowUpItem {
	issue: string;
	resolution: string;
	additionalNotes?: string;
	linkLabel?: string;
	linkUrl?: string;
}

export interface WeeklyDigestOptions {
	subject?: string;
	intro?: string;
	updates: WeeklyUpdateItem[];
	upcoming?: WeeklyUpdateItem[];
	productHighlights?: WeeklyUpdateItem[];
	feedbackFollowUps?: Array<{
		userId: string;
		items: FeedbackFollowUpItem[];
	}>;
	sentAt?: Date;
}

export class WeeklyUpdatesEmailService {
	/**
	 * Send a weekly digest email to all users opted into product updates / weekly digest.
	 */
	static async sendWeeklyDigest(options: WeeklyDigestOptions): Promise<{
		sent: number;
		skipped: number;
	}> {
		if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
			logger.warn('RESEND_API_KEY not configured, skipping weekly digest send');
			return { sent: 0, skipped: 0 };
		}

		const subscribers = await userSettingsRepository.getProductUpdateSubscribers();
		if (subscribers.length === 0) {
			logger.info('No weekly digest subscribers found.');
			return { sent: 0, skipped: 0 };
		}

		const followUpMap = new Map<string, FeedbackFollowUpItem[]>();
		options.feedbackFollowUps?.forEach((entry) => {
			if (entry.userId) {
				followUpMap.set(entry.userId, entry.items);
			}
		});

		let sent = 0;
		let skipped = 0;

		for (const settings of subscribers) {
			const user = await userRepository.findUserById(settings.userId);
			if (!user || !user.email) {
				skipped++;
				continue;
			}

			const followUps = followUpMap.get(user.id);
			const html = this.buildWeeklyDigestEmail(user, {
				...options,
				feedbackFollowUps: followUps
					? [
							{
								userId: user.id,
								items: followUps
							}
						]
					: undefined
			});

			const subject =
				options.subject || `Kaiwa Weekly Update – ${this.formatDate(options.sentAt ?? new Date())}`;

			const result = await resend.emails.send({
				from: `Hiro <hiro@trykaiwa.com>`,
				replyTo: 'hiro@trykaiwa.com',
				to: [user.email],
				subject,
				html
			});

			if (result.error) {
				logger.error('Failed to send weekly digest to user', user.id, result.error);
				skipped++;
				continue;
			}

			sent++;

			await analyticsEventsRepository.createAnalyticsEvent({
				userId: user.id,
				sessionId: null,
				eventName: 'weekly_digest_sent',
				properties: {
					updateCount: options.updates.length,
					followUpCount: followUps?.length ?? 0
				},
				createdAt: options.sentAt ?? new Date()
			});

			if (followUps && followUps.length > 0) {
				await analyticsEventsRepository.createAnalyticsEvent({
					userId: user.id,
					sessionId: null,
					eventName: 'feedback_followup_in_digest',
					properties: {
						items: followUps
					},
					createdAt: options.sentAt ?? new Date()
				});
			}

			// Rate-limit safety
			await new Promise((resolve) => setTimeout(resolve, 100));
		}

		return { sent, skipped };
	}

	/**
	 * Send a direct feedback follow-up to a single user.
	 */
	static async sendDirectFeedbackFollowUp(
		userId: string,
		followUp: FeedbackFollowUpItem
	): Promise<boolean> {
		if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
			logger.warn('RESEND_API_KEY not configured, skipping direct follow-up send');
			return true;
		}

		const user = await userRepository.findUserById(userId);
		if (!user || !user.email) {
			logger.warn(`User ${userId} not found for feedback follow-up.`);
			return false;
		}

		const subject = `We just fixed: ${followUp.issue}`;
		const html = this.buildFeedbackFollowUpEmail(user, followUp);

		const result = await resend.emails.send({
			from: `Hiro <hiro@trykaiwa.com>`,
			replyTo: 'hiro@trykaiwa.com',
			to: [user.email],
			subject,
			html
		});

		if (result.error) {
			logger.error('Failed to send feedback follow-up:', result.error);
			return false;
		}

		await analyticsEventsRepository.createAnalyticsEvent({
			userId,
			sessionId: null,
			eventName: 'feedback_followup_sent',
			properties: followUp,
			createdAt: new Date()
		});

		return true;
	}

	public static buildWeeklyDigestEmail(user: User, options: WeeklyDigestOptions): string {
		const firstName = user.displayName?.split(' ')[0] || 'there';
		const intro =
			options.intro ||
			`Here’s what we shipped at Kaiwa this week, and what we’re working on next. Reply to this email if you want to see something different.`;

		const updatesSection = this.renderUpdateSection('What shipped', options.updates);
		const highlights = options.productHighlights?.length
			? this.renderUpdateSection('Highlights worth noting', options.productHighlights)
			: '';
		const upcoming = options.upcoming?.length
			? this.renderUpdateSection('Coming up next', options.upcoming)
			: '';
		const followUps = this.renderFollowUps(options.feedbackFollowUps?.[0]?.items);

		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Kaiwa Weekly Update</title>
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
						max-width: 640px;
						margin: 0 auto;
						padding: 32px 24px 48px;
						background: #ffffff;
					}
					h1 {
						font-size: 26px;
						margin-bottom: 8px;
						color: #111827;
					}
					h2 {
						font-size: 20px;
						margin: 32px 0 12px;
						color: #1f2937;
					}
					.intro {
						margin-bottom: 24px;
						color: #374151;
					}
					.card {
						border: 1px solid #e5e7eb;
						border-radius: 12px;
						padding: 18px 20px;
						margin-bottom: 16px;
						background: #f9fafb;
					}
					.card h3 {
						margin: 0 0 6px;
						font-size: 16px;
						color: #111827;
					}
					.card p {
						margin: 0;
						color: #4b5563;
						font-size: 14px;
					}
					.card a {
						color: #2563eb;
						text-decoration: none;
						font-weight: 500;
						display: inline-block;
						margin-top: 10px;
					}
					.feedback {
						border-left: 4px solid #2563eb;
						background: #eff6ff;
					}
					footer {
						margin-top: 40px;
						padding-top: 16px;
						border-top: 1px solid #e5e7eb;
						color: #6b7280;
						font-size: 13px;
					}
				</style>
			</head>
			<body>
				<div class="wrapper">
					<h1>Kaiwa Weekly Update</h1>
					<p class="intro">Hi ${firstName}, ${intro}</p>
					${updatesSection}
					${highlights}
					${upcoming}
					${followUps}
					<p style="margin-top: 32px; color: #374151;">
						Thanks for being here.<br>
						– Hiro
					</p>
					<footer>
						<p>You're receiving this because your email preferences allow weekly updates.<br>
						Manage preferences at <a href="${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/profile" style="color:#2563eb;">your profile</a>.</p>
					</footer>
				</div>
			</body>
			</html>
		`;
	}

	private static buildFeedbackFollowUpEmail(user: User, followUp: FeedbackFollowUpItem): string {
		const firstName = user.displayName?.split(' ')[0] || 'there';
		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>We fixed ${followUp.issue}</title>
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
						padding: 32px 24px 40px;
						background: #ffffff;
					}
					h1 {
						font-size: 24px;
						margin-bottom: 16px;
						color: #111827;
					}
					.card {
						border-left: 4px solid #2563eb;
						background: #eff6ff;
						padding: 20px;
						border-radius: 12px;
					}
					.card strong {
						display: block;
						font-size: 16px;
						margin-bottom: 8px;
					}
					.card p {
						margin: 0 0 12px;
						color: #1f2937;
					}
					a {
						color: #2563eb;
						text-decoration: none;
						font-weight: 500;
					}
				</style>
			</head>
			<body>
				<div class="wrapper">
					<h1>We fixed "${followUp.issue}"</h1>
					<p>Hi ${firstName},</p>
					<p>Thanks for flagging this earlier. I wanted you to be the first to know that it's sorted:</p>
					<div class="card">
						<strong>What changed</strong>
						<p>${followUp.resolution}</p>
						${followUp.additionalNotes ? `<p style="color:#4b5563;">${followUp.additionalNotes}</p>` : ''}
						${
							followUp.linkUrl
								? `<a href="${followUp.linkUrl}">${followUp.linkLabel || 'See the update'}</a>`
								: ''
						}
					</div>
					<p style="margin-top: 24px;">If it still feels off, just reply—I'll jump on it.</p>
					<p style="margin-top: 24px;">– Hiro</p>
				</div>
			</body>
			</html>
		`;
	}

	private static renderUpdateSection(title: string, items?: WeeklyUpdateItem[]): string {
		if (!items || items.length === 0) {
			return '';
		}

		const cards = items
			.map((item) => {
				const link =
					item.linkUrl && item.linkLabel
						? `<a href="${item.linkUrl}">${item.linkLabel}</a>`
						: item.linkUrl
							? `<a href="${item.linkUrl}">Learn more</a>`
							: '';
				return `
				<div class="card">
					<h3>${item.title}</h3>
					<p>${item.summary}</p>
					${link}
				</div>
			`;
			})
			.join('');

		return `<h2>${title}</h2>${cards}`;
	}

	private static renderFollowUps(items?: FeedbackFollowUpItem[]): string {
		if (!items || items.length === 0) {
			return '';
		}

		const cards = items
			.map((item) => {
				const link =
					item.linkUrl && item.linkLabel
						? `<a href="${item.linkUrl}">${item.linkLabel}</a>`
						: item.linkUrl
							? `<a href="${item.linkUrl}">See the fix</a>`
							: '';

				return `
				<div class="card feedback">
					<h3>${item.issue}</h3>
					<p><strong>What changed:</strong> ${item.resolution}</p>
					${item.additionalNotes ? `<p>${item.additionalNotes}</p>` : ''}
					${link}
				</div>
			`;
			})
			.join('');

		return `<h2>Made-for-you fixes</h2>${cards}`;
	}

	private static formatDate(date: Date): string {
		return date.toLocaleDateString(undefined, {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
}
