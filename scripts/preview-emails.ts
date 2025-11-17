/**
 * Email Preview Script
 *
 * This script helps you preview what emails will look like before sending them
 * to real users. Run this to see the actual HTML output.
 *
 * Usage:
 *   npx tsx scripts/preview-emails.ts
 */

import { EmailReminderService } from '$lib/server/email/email-reminder.service';
import { FounderEmailService } from '$lib/server/email/founder-email.service';

async function previewEmails() {
	console.log('📧 Email Preview Tool\n');
	console.log('='.repeat(80));

	// Mock user data for preview
	const mockUser = {
		id: 'preview-user-123',
		email: 'preview@example.com',
		displayName: 'Alex Chen',
		createdAt: new Date()
	};

	console.log('\n📨 PREVIEW: Practice Reminder Email');
	console.log('-'.repeat(80));

	// Get practice reminder data (this will use actual logic)
	const reminderData = await EmailReminderService.getPracticeReminderData(mockUser.id);

	if (reminderData) {
		const subject = EmailReminderService.getReminderSubject(reminderData);
		const html = EmailReminderService.getReminderEmailTemplate(reminderData);

		console.log(`Subject: ${subject}`);
		console.log(`To: ${mockUser.email}`);
		console.log('\nHTML Preview (first 500 chars):');
		console.log(html.substring(0, 500) + '...\n');

		// Save to file for viewing in browser
		const fs = await import('fs');
		fs.writeFileSync('/tmp/reminder-email-preview.html', html);
		console.log('✅ Full HTML saved to: /tmp/reminder-email-preview.html');
	} else {
		console.log('⚠️  Could not generate reminder data (user may not exist in DB)');
	}

	console.log('\n📨 PREVIEW: Founder Day 1 Email');
	console.log('-'.repeat(80));

	const day1Html = FounderEmailService.getDay1Email(
		mockUser as { id: string; email: string; displayName: string; createdAt: Date },
		'Japanese'
	);
	console.log(`Subject: Alex, ready for your first Japanese conversation?`);
	console.log(`To: ${mockUser.email}`);
	console.log('\nHTML Preview (first 500 chars):');
	console.log(day1Html.substring(0, 500) + '...\n');

	const fs = await import('fs');
	fs.writeFileSync('/tmp/founder-day1-preview.html', day1Html);
	console.log('✅ Full HTML saved to: /tmp/founder-day1-preview.html');

	console.log('\n📨 PREVIEW: Founder Day 2 Email');
	console.log('-'.repeat(80));

	const day2Html = FounderEmailService.getDay2Email(
		mockUser as { id: string; email: string; displayName: string; createdAt: Date },
		'Japanese'
	);
	console.log(`Subject: Anything I can do to help with your Japanese practice?`);
	console.log('\nHTML Preview (first 500 chars):');
	console.log(day2Html.substring(0, 500) + '...\n');

	fs.writeFileSync('/tmp/founder-day2-preview.html', day2Html);
	console.log('✅ Full HTML saved to: /tmp/founder-day2-preview.html');

	console.log('\n📨 PREVIEW: Founder Day 3 Email');
	console.log('-'.repeat(80));

	const day3Html = FounderEmailService.getDay3Email(
		mockUser as { id: string; email: string; displayName: string; createdAt: Date },
		'Japanese'
	);
	console.log(`Subject: Can I help? (15 min chat)`);
	console.log('\nHTML Preview (first 500 chars):');
	console.log(day3Html.substring(0, 500) + '...\n');

	fs.writeFileSync('/tmp/founder-day3-preview.html', day3Html);
	console.log('✅ Full HTML saved to: /tmp/founder-day3-preview.html');

	console.log('\n' + '='.repeat(80));
	console.log('\n📌 HOW TO TEST WITH REAL EMAIL:');
	console.log('\n1. Start your dev server: pnpm dev');
	console.log('\n2. Send a test email to your address:');
	console.log('   curl -H "Authorization: Bearer development_secret" \\');
	console.log(
		'     "http://localhost:5173/api/cron/send-reminders?dryRun=false&testEmails=YOUR_EMAIL@example.com"'
	);
	console.log('\n3. Or view in browser:');
	console.log('   - Open /tmp/reminder-email-preview.html');
	console.log('   - Open /tmp/founder-day1-preview.html');
	console.log('   - Open /tmp/founder-day2-preview.html');
	console.log('   - Open /tmp/founder-day3-preview.html');
	console.log('\n⚠️  Remember: ENABLE_AUTOMATED_EMAILS must be "true" to actually send emails\n');
}

// Run preview
previewEmails().catch(console.error);
