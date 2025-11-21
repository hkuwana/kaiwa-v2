/**
 * Kaiwa Unified Email Template
 *
 * Beautiful, mobile-friendly email template for ALL Kaiwa emails.
 * Features a distinctive dark header inspired by Community Story Spotlight.
 *
 * Works across all campaigns:
 * - Weekly product updates
 * - Practice reminders
 * - Progress reports
 * - Founder emails
 * - Community stories
 * - All other campaigns
 *
 * Mobile-friendly approach:
 * - HTML tables (email client standard)
 * - Inline styles (required for Gmail/Outlook)
 * - Max-width 640px with 100% width for mobile
 * - No external CSS or packages needed
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
	// Dark Header (prominent at top)
	headerCategory: string; // e.g., "Real learners, real wins" or "Practice reminder"
	headerTitle: string; // Main headline
	headerSubtitle?: string; // Optional subheadline

	// Meta
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
			<div style="font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #0369a1; margin: 28px 0 16px;">
				${section.title}
			</div>
		`
				: '';

			const items = section.items
				.map(
					(item) => `
			<div style="margin-bottom: 20px;">
				<div style="font-weight: 600; color: #1e293b; margin-bottom: 6px; font-size: 16px;">
					${item.heading}
				</div>
				<div style="color: #334155; font-size: 14px; line-height: 1.7;">
					${item.description}
				</div>
				${
					item.link
						? `
					<div style="margin-top: 10px;">
						<a href="${item.link.url}" style="display: inline-block; background: #38bdf8; color: #0f172a; font-weight: 600; padding: 10px 20px; border-radius: 999px; text-decoration: none; font-size: 14px;">
							${item.link.text}
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
<html lang="en">
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
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
	<!-- Preheader (hidden in email, shows in inbox preview) -->
	<div style="display: none; max-height: 0; overflow: hidden;">
		${content.preheader || ''}
	</div>

	<!-- Email Container -->
	<table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f8fafc; padding: 32px 0;">
		<tr>
			<td align="center">
				<!-- Main Content -->
				<table width="640" cellpadding="0" cellspacing="0" role="presentation" style="background: #ffffff; border-radius: 18px; overflow: hidden; box-shadow: 0 10px 36px rgba(15,23,42,0.12); max-width: 640px; width: 100%;">
					<!-- Dark Header -->
					<tr>
						<td style="padding: 36px 32px 20px 32px; background: #0f172a;">
							<div style="color: #38bdf8; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 12px;">
								${content.headerCategory}
							</div>
							<div style="color: #ffffff; font-size: 28px; font-weight: 700; line-height: 1.3; margin-bottom: 8px;">
								${content.headerTitle}
							</div>
							${
								content.headerSubtitle
									? `
							<div style="color: #cbd5f5; font-size: 16px; line-height: 1.6;">
								${content.headerSubtitle}
							</div>
							`
									: ''
							}
						</td>
					</tr>

					<!-- Body Content -->
					<tr>
						<td style="padding: 28px 32px;">
							<!-- Greeting & Intro -->
							<div style="font-size: 15px; color: #1e293b; line-height: 1.8; margin-bottom: 20px;">
								${content.greeting ? `${content.greeting}${userName ? ` ${userName}` : ''}, ` : ''}${content.intro}
							</div>

							<!-- Sections -->
							${sections}

							<!-- Closing Note -->
							${
								content.closingNote
									? `
							<div style="color: #334155; font-size: 15px; line-height: 1.8; margin-top: 24px;">
								${content.closingNote}
							</div>
							`
									: ''
							}

							<!-- Signature -->
							${
								content.signature
									? `
							<div style="margin-top: 24px;">
								<div style="color: #1e293b; font-weight: 600; font-size: 15px;">
									${content.signature.name}
								</div>
								<div style="color: #64748b; font-size: 14px;">
									${content.signature.title}
								</div>
								${
									content.signature.ps
										? `
								<div style="color: #64748b; font-size: 13px; margin-top: 12px; line-height: 1.6;">
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
						<td style="padding: 22px 32px; background: #f8fafc; border-top: 1px solid #e2e8f0;">
							<div style="font-size: 12px; color: #64748b; line-height: 1.6;">
								You're receiving this because your Kaiwa email preferences include this email type.
								<a href="{{PREFERENCES_URL}}" style="color: #0369a1; text-decoration: none;">Update preferences</a>
								or <a href="{{UNSUBSCRIBE_URL}}" style="color: #0369a1; text-decoration: none;">unsubscribe</a>.
							</div>
						</td>
					</tr>
				</table>
				<div style="font-size: 11px; color: #94a3b8; margin-top: 12px;">
					© ${new Date().getFullYear()} Kaiwa • Sent ${new Date().toUTCString()}
				</div>
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
