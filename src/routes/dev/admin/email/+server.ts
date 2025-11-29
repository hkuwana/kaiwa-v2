import { json } from '@sveltejs/kit';
import { EmailReminderService } from '$lib/emails/campaigns/reminders/reminder.service';
import { FounderEmailService } from '$lib/emails/campaigns/founder-sequence/founder.service';
import { WeeklyUpdatesEmailService } from '$lib/emails/campaigns/weekly-digest/digest.service';
import { ScenarioInspirationEmailService } from '$lib/emails/campaigns/scenario-inspiration/inspiration.service';
import { CommunityStoryEmailService } from '$lib/emails/campaigns/community-stories/story.service';
import { ProductUpdatesEmailService } from '$lib/emails/campaigns/product-updates/update.service';
import { ProgressReportsEmailService } from '$lib/emails/campaigns/progress-reports/progress.service';
import { userRepository } from '$lib/server/repositories';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

const TEST_EMAIL = 'weijo34@gmail.com';

const buildSampleWeeklyDigestOptions = (userId: string) => ({
	subject: 'Kaiwa Weekly Update – Product improvements & next steps',
	intro: `Here’s the latest from builders HQ. If something feels off or you want to see something different, just reply.`,
	updates: [
		{
			title: 'Faster conversation loading',
			summary:
				'We removed a slow database join so dialogs start ~1.5s faster, especially for folks with older devices.',
			linkLabel: 'Read the changelog',
			linkUrl: `${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/changelog/faster-loading`
		},
		{
			title: 'New family dinner scenario',
			summary: 'Practice navigating cultural questions with in-laws in a low-pressure setting.',
			linkLabel: 'Try the scenario',
			linkUrl: `${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/?scenario=dinner_family`
		}
	],
	productHighlights: [
		{
			title: 'Kaiwa on mobile web',
			summary:
				'We polished the mobile controls so you can squeeze in practice sessions on the train.'
		}
	],
	upcoming: [
		{
			title: 'Custom vocabulary packs',
			summary:
				'We’re testing a way to load partner-specific phrases before each session so you can ask about the things that matter.'
		}
	],
	feedbackFollowUps: [
		{
			userId,
			items: [
				{
					issue: 'Microphone timeouts mid-conversation',
					resolution:
						'We changed the auto-mute threshold to 90 seconds and added a visual timer so you can see when the mic will pause.',
					linkLabel: 'View the fix',
					linkUrl: `${env.PUBLIC_APP_URL || 'https://trykaiwa.com'}/changelog/mic-timeout`
				}
			]
		}
	],
	sentAt: new Date()
});

/**
 * GET endpoint to preview email templates with user data
 * Returns HTML preview without sending actual email
 */
export const GET = async ({ url, locals }) => {
	try {
		// Check authentication
		if (!locals.user) {
			return new Response('Not authenticated', { status: 401 });
		}

		const emailType = url.searchParams.get('emailType');
		const userId = url.searchParams.get('userId');

		if (!emailType) {
			return new Response('emailType parameter is required', { status: 400 });
		}

		// Use current user's ID if not provided
		const targetUserId = userId || locals.user.id;

		// Get user data
		const user = await userRepository.findUserById(targetUserId);
		if (!user) {
			return new Response('User not found', { status: 404 });
		}

		let emailSubject = '';
		let emailHtml = '';

		// Generate email based on type
		switch (emailType) {
			case 'practice_reminder': {
				const reminderData = await EmailReminderService.getPracticeReminderData(targetUserId);
				if (!reminderData) {
					return new Response('Could not get practice reminder data', { status: 500 });
				}
				emailSubject = EmailReminderService.getReminderSubject(reminderData);
				emailHtml = EmailReminderService.getReminderEmailTemplate(reminderData);
				break;
			}

			case 'day1_welcome': {
				const languageName = await FounderEmailService.resolveTargetLanguageName(targetUserId);
				const firstName = user.displayName?.split(' ')[0] || 'there';
				emailSubject = languageName
					? `${firstName}, ready for your first ${languageName} conversation?`
					: `${firstName}, welcome to Kaiwa! (from Hiro)`;
				emailHtml = FounderEmailService.getDay1Email(user, languageName);
				break;
			}

			case 'day2_checkin': {
				const languageName = await FounderEmailService.resolveTargetLanguageName(targetUserId);
				emailSubject = languageName
					? `Anything I can do to help with your ${languageName} practice?`
					: `Quick check-in - how's it going?`;
				emailHtml = FounderEmailService.getDay2Email(user, languageName);
				break;
			}

			case 'day3_offer': {
				const languageName = await FounderEmailService.resolveTargetLanguageName(targetUserId);
				emailSubject = `Can I help? (15 min chat)`;
				emailHtml = FounderEmailService.getDay3Email(user, languageName);
				break;
			}
			case 'weekly_update': {
				const digestOptions = buildSampleWeeklyDigestOptions(targetUserId);

				emailSubject = digestOptions.subject || 'Kaiwa Weekly Update';
				emailHtml = WeeklyUpdatesEmailService.buildWeeklyDigestEmail(user, digestOptions);
				break;
			}
			case 'scenario_inspiration': {
				const payload = await ScenarioInspirationEmailService.buildEmailPayload(targetUserId);
				if (!payload) {
					return new Response('Unable to build scenario inspiration email (check preferences)', {
						status: 400
					});
				}
				emailSubject = payload.subject;
				emailHtml = payload.html;
				break;
			}
			case 'community_story': {
				const payload = await CommunityStoryEmailService.buildEmailPayload(targetUserId);
				if (!payload) {
					return new Response('Unable to build community story email (check preferences)', {
						status: 400
					});
				}
				emailSubject = payload.subject;
				emailHtml = payload.html;
				break;
			}
			case 'product_update': {
				emailSubject = 'New Feature: AI-Powered Lesson Plans';
				emailHtml = ProductUpdatesEmailService['buildProductUpdateEmail'](user, {
					subject: 'New Feature: AI-Powered Lesson Plans',
					title: 'We just launched AI Lesson Plans',
					summary:
						'Customize your learning path with AI-generated lesson plans tailored to your goals.',
					details: `
						<p>We've been listening to your feedback, and the most common request was: "I want a personalized learning path."</p>
						<p>Today, we're excited to announce <strong>AI Lesson Plans</strong> – a feature that creates custom lesson plans based on your language level, learning goals, and available time.</p>
						<ul>
							<li><strong>Personalized:</strong> Each plan adapts to your pace and proficiency</li>
							<li><strong>Goal-focused:</strong> Whether you're preparing for a trip or impressing your in-laws, we've got a plan for it</li>
							<li><strong>Flexible:</strong> Adjust your plan anytime based on how you're progressing</li>
						</ul>
						<p>This is just the beginning. We're already working on more features based on your feedback.</p>
					`,
					ctaText: 'Try AI Lesson Plans',
					ctaUrl: env.PUBLIC_APP_URL || 'https://trykaiwa.com'
				});
				break;
			}
			case 'progress_report': {
				emailSubject = 'Your Kaiwa Weekly Report – 3 conversations this week!';
				emailHtml = ProgressReportsEmailService['buildProgressReportEmail'](user, {
					sessionCount: 3,
					totalMinutes: 18,
					languages: ['Spanish', 'French']
				});
				break;
			}

			default:
				return new Response(`Unknown email type: ${emailType}`, { status: 400 });
		}

		// Return HTML preview with subject header
		const previewHtml = `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Email Preview</title>
			</head>
			<body style="margin: 0; padding: 0; font-family: system-ui, -apple-system, sans-serif;">
				<div style="background: #e0f2fe; border-bottom: 3px solid #0284c7; padding: 16px; margin-bottom: 0;">
					<div style="max-width: 600px; margin: 0 auto;">
						<div style="color: #075985; font-size: 12px; font-weight: 600; margin-bottom: 8px;">
							📧 EMAIL PREVIEW
						</div>
						<div style="color: #0c4a6e; font-size: 14px; margin-bottom: 4px;">
							<strong>Subject:</strong> ${emailSubject}
						</div>
						<div style="color: #0c4a6e; font-size: 12px;">
							<strong>User:</strong> ${user.displayName || user.email} (${user.email})
						</div>
					</div>
				</div>
				${emailHtml}
			</body>
			</html>
		`;

		return new Response(previewHtml, {
			headers: {
				'Content-Type': 'text/html; charset=utf-8'
			}
		});
	} catch (error) {
		console.error('Error generating email preview:', error);
		return new Response(
			`Error generating preview: ${error instanceof Error ? error.message : 'Unknown error'}`,
			{ status: 500 }
		);
	}
};

/**
 * Email testing endpoint for development
 * Sends test emails to a specific test email address
 */
export const POST = async ({ request, locals }) => {
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
				const reminderData = await EmailReminderService.getPracticeReminderData(targetUserId);
				if (!reminderData) {
					return json({ error: 'Could not get practice reminder data' }, { status: 500 });
				}
				emailSubject = EmailReminderService.getReminderSubject(reminderData);
				emailHtml = EmailReminderService.getReminderEmailTemplate(reminderData);
				break;
			}

			case 'day1_welcome': {
				const languageName = await FounderEmailService.resolveTargetLanguageName(targetUserId);
				const firstName = user.displayName?.split(' ')[0] || 'there';
				emailSubject = languageName
					? `${firstName}, ready for your first ${languageName} conversation?`
					: `${firstName}, welcome to Kaiwa! (from Hiro)`;
				emailHtml = FounderEmailService.getDay1Email(user, languageName);
				break;
			}

			case 'day2_checkin': {
				const languageName = await FounderEmailService.resolveTargetLanguageName(targetUserId);
				emailSubject = languageName
					? `Anything I can do to help with your ${languageName} practice?`
					: `Quick check-in - how's it going?`;
				emailHtml = FounderEmailService.getDay2Email(user, languageName);
				break;
			}

			case 'day3_offer': {
				const languageName = await FounderEmailService.resolveTargetLanguageName(targetUserId);
				emailSubject = `Can I help? (15 min chat)`;
				emailHtml = FounderEmailService.getDay3Email(user, languageName);
				break;
			}
			case 'weekly_update': {
				const digestOptions = buildSampleWeeklyDigestOptions(targetUserId);
				emailSubject = digestOptions.subject || 'Kaiwa Weekly Update';
				emailHtml = WeeklyUpdatesEmailService.buildWeeklyDigestEmail(user, digestOptions);
				break;
			}
			case 'scenario_inspiration': {
				const payload = await ScenarioInspirationEmailService.buildEmailPayload(targetUserId);
				if (!payload) {
					return json(
						{ error: 'Unable to build scenario inspiration email (check preferences)' },
						{ status: 400 }
					);
				}
				emailSubject = payload.subject;
				emailHtml = payload.html;
				break;
			}
			case 'community_story': {
				const payload = await CommunityStoryEmailService.buildEmailPayload(targetUserId);
				if (!payload) {
					return json(
						{ error: 'Unable to build community story email (check preferences)' },
						{ status: 400 }
					);
				}
				emailSubject = payload.subject;
				emailHtml = payload.html;
				break;
			}
			case 'product_update': {
				emailSubject = 'New Feature: AI-Powered Lesson Plans';
				emailHtml = ProductUpdatesEmailService['buildProductUpdateEmail'](user, {
					subject: 'New Feature: AI-Powered Lesson Plans',
					title: 'We just launched AI Lesson Plans',
					summary:
						'Customize your learning path with AI-generated lesson plans tailored to your goals.',
					details: `
						<p>We've been listening to your feedback, and the most common request was: "I want a personalized learning path."</p>
						<p>Today, we're excited to announce <strong>AI Lesson Plans</strong> – a feature that creates custom lesson plans based on your language level, learning goals, and available time.</p>
						<ul>
							<li><strong>Personalized:</strong> Each plan adapts to your pace and proficiency</li>
							<li><strong>Goal-focused:</strong> Whether you're preparing for a trip or impressing your in-laws, we've got a plan for it</li>
							<li><strong>Flexible:</strong> Adjust your plan anytime based on how you're progressing</li>
						</ul>
						<p>This is just the beginning. We're already working on more features based on your feedback.</p>
					`,
					ctaText: 'Try AI Lesson Plans',
					ctaUrl: env.PUBLIC_APP_URL || 'https://trykaiwa.com'
				});
				break;
			}
			case 'progress_report': {
				emailSubject = 'Your Kaiwa Weekly Report – 3 conversations this week!';
				emailHtml = ProgressReportsEmailService['buildProgressReportEmail'](user, {
					sessionCount: 3,
					totalMinutes: 18,
					languages: ['Spanish', 'French']
				});
				break;
			}

			default:
				return json({ error: `Unknown email type: ${emailType}` }, { status: 400 });
		}

		// Send test email
		result = await resend.emails.send({
			from: 'Kaiwa Test <noreply@trykaiwa.com>',
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

		console.log('✅ Test email sent successfully:', {
			emailId: result.data?.id,
			to: TEST_EMAIL,
			emailType,
			subject: emailSubject
		});

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
