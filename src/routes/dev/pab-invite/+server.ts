import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { sql, gt, and, isNotNull } from 'drizzle-orm';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

const resend = new Resend(env.RESEND_API_KEY || 're_dummy_resend_key');

export const GET: RequestHandler = async ({ url }) => {
	try {
		// Get recent, active users who could be PAB candidates
		const candidates = await db
			.select({
				email: users.email,
				displayName: users.displayName,
				createdAt: users.createdAt,
				lastUsage: users.lastUsage,
				nativeLanguageId: users.nativeLanguageId,
				preferredUILanguageId: users.preferredUILanguageId
			})
			.from(users)
			.where(
				and(
					isNotNull(users.emailVerified), // Only verified emails
					gt(users.createdAt, sql`NOW() - INTERVAL '60 days'`) // Last 60 days
				)
			)
			.orderBy(sql`${users.lastUsage} DESC NULLS LAST`)
			.limit(20);

		return json({
			candidates: candidates.map((c) => ({
				email: c.email,
				displayName: c.displayName || c.email.split('@')[0],
				createdAt: c.createdAt,
				language: c.preferredUILanguageId
			}))
		});
	} catch (error) {
		console.error('Error fetching candidates:', error);
		return json({ error: 'Failed to fetch candidates', candidates: [] }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { emails, template } = await request.json();

		if (!emails || emails.length === 0) {
			return json({ error: 'No emails provided' }, { status: 400 });
		}

		// Check if Resend is configured
		if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
			return json(
				{ error: 'RESEND_API_KEY not configured. Set it up before sending emails.' },
				{ status: 500 }
			);
		}

		// Get user details for personalization
		const userDetails = await db
			.select({
				email: users.email,
				displayName: users.displayName,
				preferredUILanguageId: users.preferredUILanguageId
			})
			.from(users)
			.where(sql`${users.email} = ANY(${emails})`);

		let sentCount = 0;
		const errors: string[] = [];

		// Send emails
		for (const user of userDetails) {
			try {
				const personalizedBody = template
					.replace(/{name}/g, user.displayName || 'there')
					.replace(/{language}/g, getLanguageName(user.preferredUILanguageId));

				const result = await resend.emails.send({
					from: 'Kaiwa <noreply@trykaiwa.com>',
					replyTo: 'weijo34@gmail.com', // Your personal email for replies
					to: [user.email],
					subject: `${user.displayName || 'Hi'}, I have 2 PAB spots left - interested?`,
					html: formatEmailHTML(personalizedBody)
				});

				if (result.error) {
					errors.push(`${user.email}: ${result.error}`);
				} else {
					sentCount++;
				}
			} catch (error) {
				errors.push(`${user.email}: ${error}`);
			}
		}

		if (errors.length > 0) {
			console.error('Email send errors:', errors);
		}

		return json({
			sent: sentCount,
			failed: errors.length,
			errors: errors.length > 0 ? errors : undefined
		});
	} catch (error) {
		console.error('Error sending PAB invites:', error);
		return json({ error: 'Failed to send invites' }, { status: 500 });
	}
};

function getLanguageName(code: string): string {
	const languageMap: Record<string, string> = {
		ja: 'Japanese',
		es: 'Spanish',
		zh: 'Mandarin',
		ar: 'Arabic',
		de: 'German',
		fr: 'French',
		ko: 'Korean',
		en: 'English'
	};
	return languageMap[code] || code;
}

function formatEmailHTML(body: string): string {
	// Convert plain text to HTML with basic formatting
	const htmlBody = body
		.split('\n')
		.map((line) => {
			if (line.trim().startsWith('✅')) {
				return `<li style="margin: 0.5rem 0;">${line.trim()}</li>`;
			}
			return `<p style="margin: 0.75rem 0;">${line}</p>`;
		})
		.join('');

	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Kaiwa Product Advisory Board</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
	<div style="background: white; border-radius: 8px; padding: 40px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
		<div style="text-align: center; margin-bottom: 30px;">
			<div style="font-size: 28px; font-weight: bold; color: #2563eb; margin-bottom: 10px;">Kaiwa</div>
		</div>

		<div style="color: #374151;">
			${htmlBody}
		</div>

		<div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 14px; color: #64748b; text-align: center;">
			<p>Kaiwa - Practice high-stakes conversations in your target language</p>
			<p>&copy; 2024 Kaiwa. All rights reserved.</p>
		</div>
	</div>
</body>
</html>
`;
}
