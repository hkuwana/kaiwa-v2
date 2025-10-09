import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { EmailReminderService } from '$lib/server/services/email-reminder.service';
import { EmailReminderEnhancedService } from '$lib/server/services/email-reminder-enhanced.service';
import { FounderEmailService } from '$lib/server/services/founder-email.service';
import { userRepository } from '$lib/server/repositories';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

const TEST_EMAIL = 'weijo34@gmail.com';

/**
 * Email testing endpoint for development
 * Sends test emails to a specific test email address
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		// Check authentication
		if (!locals.user) {
			return json({ error: 'Not authenticated' }, { status: 401 });
		}

		const { emailType, userId } = await request.json();

		if (!emailType) {
			return json({ error: 'emailType is required' }, { status: 400 });
		}

		// Use current user's ID if not provided
		const targetUserId = userId || locals.user.id;

		// Get user data
		const user = await userRepository.findUserById(targetUserId);
		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Initialize Resend
		const resend = new Resend(env.RESEND_API_KEY || 're_dummy_resend_key');

		let result;
		let emailSubject = '';
		let emailHtml = '';

		// Generate email based on type
		switch (emailType) {
			case 'practice_reminder': {
				const reminderData = await (EmailReminderService as any).getPracticeReminderData(
					targetUserId
				);
				if (!reminderData) {
					return json({ error: 'Could not get practice reminder data' }, { status: 500 });
				}
				emailSubject = (EmailReminderService as any).getReminderSubject(reminderData);
				emailHtml = (EmailReminderService as any).getReminderEmailTemplate(reminderData);
				break;
			}

			case 'day1_welcome': {
				emailSubject = `${user.displayName || 'there'}, welcome to Kaiwa! (from Hiro)`;
				emailHtml = (FounderEmailService as any).getDay1Email(user);
				break;
			}

			case 'day2_checkin': {
				emailSubject = `Quick check-in - how's it going?`;
				emailHtml = (FounderEmailService as any).getDay2Email(user);
				break;
			}

			case 'day3_offer': {
				emailSubject = `Can I help? (15 min chat)`;
				emailHtml = (FounderEmailService as any).getDay3Email(user);
				break;
			}

			case 'segmented_new_user': {
				const emailData = await (EmailReminderEnhancedService as any).getSegmentedEmail(
					user,
					'new_user'
				);
				emailSubject = emailData.subject;
				emailHtml = emailData.html;
				break;
			}

			case 'segmented_slightly_inactive': {
				const emailData = await (EmailReminderEnhancedService as any).getSegmentedEmail(
					user,
					'slightly_inactive'
				);
				emailSubject = emailData.subject;
				emailHtml = emailData.html;
				break;
			}

			case 'segmented_moderately_inactive': {
				const emailData = await (EmailReminderEnhancedService as any).getSegmentedEmail(
					user,
					'moderately_inactive'
				);
				emailSubject = emailData.subject;
				emailHtml = emailData.html;
				break;
			}

			case 'segmented_highly_inactive': {
				const emailData = await (EmailReminderEnhancedService as any).getSegmentedEmail(
					user,
					'highly_inactive'
				);
				emailSubject = emailData.subject;
				emailHtml = emailData.html;
				break;
			}

			case 'segmented_dormant': {
				const emailData = await (EmailReminderEnhancedService as any).getSegmentedEmail(
					user,
					'dormant'
				);
				emailSubject = emailData.subject;
				emailHtml = emailData.html;
				break;
			}

			default:
				return json({ error: `Unknown email type: ${emailType}` }, { status: 400 });
		}

		// Send test email
		result = await resend.emails.send({
			from: 'Kaiwa Test <noreply@kaiwa.fly.dev>',
			to: [TEST_EMAIL],
			subject: `[TEST] ${emailSubject}`,
			html: `
				<div style="background: #fef3c7; border: 2px solid #f59e0b; padding: 20px; margin-bottom: 20px; border-radius: 8px;">
					<strong style="color: #92400e;">🧪 TEST EMAIL</strong><br>
					<span style="color: #78350f;">This is a test email sent to ${TEST_EMAIL}</span><br>
					<span style="color: #78350f; font-size: 14px;">Email Type: ${emailType}</span><br>
					<span style="color: #78350f; font-size: 14px;">Test User: ${user.displayName || user.email}</span>
				</div>
				${emailHtml}
			`
		});

		if (result.error) {
			console.error('Failed to send test email:', result.error);
			return json({ error: 'Failed to send test email', details: result.error }, { status: 500 });
		}

		return json({
			success: true,
			message: `Test email sent to ${TEST_EMAIL}`,
			emailId: result.data?.id,
			emailType,
			subject: emailSubject
		});
	} catch (error) {
		console.error('Error sending test email:', error);
		return json(
			{
				error: 'Failed to send test email',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
