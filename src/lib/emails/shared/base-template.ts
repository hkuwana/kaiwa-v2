/**
 * Kaiwa Base Email Template
 *
 * Unified, clean email template for ALL Kaiwa emails.
 * Ensures consistent branding and professional appearance across:
 * - Weekly product updates
 * - Practice reminders
 * - Progress reports
 * - Founder emails
 * - All other campaigns
 *
 * Design inspired by Superhuman, Linear, and modern SaaS products.
 */

interface EmailSection {
	title?: string;
	items: Array<{
		heading: string;
		description: string;
		link?: { text: string; url: string };
	}>;
}

export interface KaiwaEmailContent {
	// Header
	logoText?: string; // e.g., "KAIWA" or leave empty for no logo
	preheader?: string; // Shows in inbox preview

	// Opening
	greeting?: string; // e.g., "Hey 👋" or "Hi there"
	intro: string; // Opening paragraph

	// Main content sections
	sections: EmailSection[];

	// Closing
	closingNote?: string;
	signature?: {
		name: string;
		title: string;
		ps?: string;
	};
}

/**
 * Generate clean, professional HTML email using Kaiwa's unified template
 *
 * All Kaiwa emails should use this function to ensure consistent branding.
 */
export function generateKaiwaEmail(content: KaiwaEmailContent, userName?: string): string {
	const sections = content.sections
		.map((section) => {
			const title = section.title
				? `
			<div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; color: #6b7280; margin: 32px 0 16px;">
				${section.title}
			</div>
		`
				: '';

			const items = section.items
				.map(
					(item) => `
			<div style="margin-bottom: 24px;">
				<div style="font-weight: 500; color: #111827; margin-bottom: 4px;">
					${item.heading}
				</div>
				<div style="color: #6b7280; font-size: 14px; line-height: 1.6;">
					${item.description}
				</div>
				${
					item.link
						? `
					<div style="margin-top: 8px;">
						<a href="${item.link.url}" style="color: #667eea; text-decoration: none; font-size: 14px; font-weight: 500;">
							${item.link.text} →
						</a>
					</div>
				`
						: ''
				}
			</div>
		`
				)
				.join('');

			return title + items;
		})
		.join('');

	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta name="x-apple-disable-message-reformatting">
	<!--[if mso]>
	<style>
		table { border-collapse: collapse; }
		.body { font-family: Arial, sans-serif; }
	</style>
	<![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f9fafb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
	<!-- Preheader (hidden in email, shows in inbox preview) -->
	<div style="display: none; max-height: 0; overflow: hidden;">
		${content.preheader || ''}
	</div>

	<!-- Email Container -->
	<table role="presentation" style="width: 100%; border-collapse: collapse; margin: 0; padding: 0;">
		<tr>
			<td align="center" style="padding: 40px 20px;">
				<!-- Main Content -->
				<table role="presentation" style="max-width: 600px; width: 100%; background-color: #ffffff; border-radius: 8px; overflow: hidden;">
					<!-- Header (Optional Logo) -->
					${
						content.logoText
							? `
					<tr>
						<td style="padding: 24px 32px; border-bottom: 1px solid #f3f4f6;">
							<div style="font-size: 11px; font-weight: 700; letter-spacing: 1px; color: #667eea;">
								${content.logoText}
							</div>
						</td>
					</tr>
					`
							: ''
					}

					<!-- Body Content -->
					<tr>
						<td style="padding: 32px;">
							<!-- Greeting -->
							<div style="font-size: 16px; color: #111827; margin-bottom: 16px;">
								${content.greeting || 'Hi'}${userName ? ` ${userName}` : ''}
							</div>

							<!-- Intro -->
							<div style="color: #374151; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
								${content.intro}
							</div>

							<!-- Sections -->
							${sections}

							<!-- Closing Note -->
							${
								content.closingNote
									? `
							<div style="color: #374151; font-size: 15px; line-height: 1.6; margin-top: 32px; padding-top: 24px; border-top: 1px solid #f3f4f6;">
								${content.closingNote}
							</div>
							`
									: ''
							}

							<!-- Signature -->
							${
								content.signature
									? `
							<div style="margin-top: 32px;">
								<div style="color: #111827; font-weight: 500;">
									${content.signature.name}
								</div>
								<div style="color: #6b7280; font-size: 14px;">
									${content.signature.title}
								</div>
								${
									content.signature.ps
										? `
								<div style="color: #6b7280; font-size: 13px; margin-top: 16px; font-style: italic;">
									${content.signature.ps}
								</div>
								`
										: ''
								}
							</div>
							`
									: ''
							}
						</td>
					</tr>

					<!-- Footer -->
					<tr>
						<td style="padding: 24px 32px; background-color: #f9fafb; border-top: 1px solid #f3f4f6;">
							<div style="font-size: 12px; color: #9ca3af; line-height: 1.5;">
								You're receiving this because you opted into Kaiwa emails.
								<a href="{{UNSUBSCRIBE_URL}}" style="color: #667eea; text-decoration: none;">Unsubscribe</a>
								or <a href="{{PREFERENCES_URL}}" style="color: #667eea; text-decoration: none;">manage preferences</a>
							</div>
							<div style="font-size: 11px; color: #d1d5db; margin-top: 8px;">
								© ${new Date().getFullYear()} Kaiwa. All rights reserved.
							</div>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>
	`.trim();
}

/**
 * Color palette for Kaiwa emails
 * Use these values for consistency across all campaigns
 */
export const KAIWA_EMAIL_COLORS = {
	// Brand
	primary: '#667eea',
	primaryDark: '#5568d3',

	// Text
	headingDark: '#111827',
	bodyDark: '#374151',
	bodyMuted: '#6b7280',
	bodyLight: '#9ca3af',

	// Background
	white: '#ffffff',
	grayLight: '#f9fafb',
	grayBorder: '#f3f4f6',

	// Status
	success: '#10b981',
	warning: '#f59e0b',
	error: '#ef4444'
} as const;
