/**
 * Simple Email Preview Script
 *
 * This generates basic email previews without database dependencies
 * Just run: npx tsx scripts/simple-email-preview.ts
 */

import fs from 'fs';

// Simple mock templates (matching the actual email structure)
function getFounderDay1Email() {
	const firstName = 'Alex';
	const languageName = 'Japanese';
	const appUrl = 'https://trykaiwa.com';

	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			line-height: 1.6;
			color: #333;
			max-width: 600px;
			margin: 0 auto;
			padding: 20px;
		}
		.signature {
			margin-top: 30px;
			padding-top: 20px;
			border-top: 1px solid #e5e7eb;
		}
		.cta {
			background: #667eea;
			color: white;
			padding: 12px 24px;
			border-radius: 6px;
			display: inline-block;
			margin: 20px 0;
			text-decoration: none;
		}
	</style>
</head>
<body>
	<p>Hi ${firstName},</p>

	<p>Thanks for joining Kaiwa! I'm Hiro, and I built this to make speaking ${languageName} feel less intimidating—especially when it's for the people you care about.</p>

	<p><strong>Here's the only goal for today:</strong></p>
	<p>Just aim for <strong>one 5-minute conversation</strong>. That's it. Don't worry about being perfect. The AI tutor is patient and won't judge you. I promise it's way less scary than it seems.</p>

	<p>Why not try it right now?</p>

	<a href="${appUrl}" class="cta">Start My First ${languageName} Conversation (5 min)</a>

	<p>If something's not working or you have questions, just hit reply. I read every email and usually respond within a few hours.</p>

	<div class="signature">
		<div><strong>Hiro</strong></div>
		<div style="color: #6b7280; font-size: 14px;">Founder, Kaiwa</div>
		<div style="margin-top: 8px; font-size: 14px; color: #6b7280;">
			📧 hiro@trykaiwa.com<br>
			🌐 <a href="${appUrl}">trykaiwa.com</a>
		</div>
	</div>

	<p style="margin-top: 30px; font-size: 12px; color: #9ca3af;">
		P.S. If Kaiwa isn't for you, no worries - just <a href="${appUrl}/profile">manage your email preferences →</a> and I'll stop emailing.
	</p>
</body>
</html>
	`;
}

function getPracticeReminderEmail() {
	const firstName = 'Alex';
	const languageName = 'Japanese';
	const appUrl = 'https://trykaiwa.com';

	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
			line-height: 1.5;
			color: #000;
			max-width: 600px;
			margin: 0 auto;
			padding: 20px;
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
		a { color: #2563eb; text-decoration: none; }
	</style>
</head>
<body>
	<p>Hey ${firstName},</p>

	<p>Got 5 minutes for ${languageName}?</p>

	<p>I see you signed up but haven't had a chance to try a conversation yet. Thought I'd share a couple scenarios:</p>

	<div class="scenario">
		<strong>Meeting Your Partner's Parents</strong><br>
		Earn trust over a meal with your partner's parents.<br>
		<a href="${appUrl}/?scenario=family-dinner-introduction">→ Try it</a>
	</div>

	<div class="scenario">
		<strong>Repairing the Relationship</strong><br>
		Repair trust after a misunderstanding with your partner.<br>
		<a href="${appUrl}/?scenario=relationship-apology">→ Try it</a>
	</div>

	<p><a href="${appUrl}">Or start any conversation →</a></p>

	<p>Even just 5 minutes helps. No pressure—whenever you're ready.</p>

	<p style="margin-top: 20px;">Want to chat about your language goals? <a href="https://cal.com/hiroakikuwana/kaiwa">Grab 15 min on my calendar</a>.</p>

	<p style="margin-top: 24px;">– Hiro<br><span style="color: #666;">P.S. This is my personal email—just reply if you have questions or feedback. I read everything.</span></p>

	<div class="footer">
		<p>This email was sent from Kaiwa. <a href="${appUrl}/profile">Manage your email preferences →</a></p>
		<p>&copy; 2025 Kaiwa. All rights reserved.</p>
	</div>
</body>
</html>
	`;
}

// Generate previews
console.log('📧 Generating Email Previews...\n');

const founderHtml = getFounderDay1Email();
const reminderHtml = getPracticeReminderEmail();

fs.writeFileSync('/tmp/founder-email-preview.html', founderHtml);
fs.writeFileSync('/tmp/practice-reminder-preview.html', reminderHtml);

console.log('✅ Email previews generated!\n');
console.log('Open these files in your browser:');
console.log('  - /tmp/founder-email-preview.html');
console.log('  - /tmp/practice-reminder-preview.html\n');

console.log('📧 EMAIL SUBJECTS:');
console.log('  Founder Day 1: "Alex, ready for your first Japanese conversation?"');
console.log('  Practice Reminder: "Alex, got 5 min for Japanese?"\n');

console.log('🔗 Profile Link Test:');
console.log('  All emails link to: https://trykaiwa.com/profile\n');

console.log('📌 Next Steps:');
console.log('  1. Open the HTML files above in your browser');
console.log('  2. Check that links work and formatting looks good');
console.log('  3. When ready, test with real email using the guide in EMAIL_TESTING_GUIDE.md\n');
