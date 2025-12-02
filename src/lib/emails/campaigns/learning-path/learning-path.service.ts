import { logger } from '$lib/logger';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { userRepository } from '$lib/server/repositories';
import { learningPathAssignmentRepository } from '$lib/server/repositories/learning-path-assignment.repository';
import type { User, LearningPathAssignment } from '$lib/server/db/types';
import { db } from '$lib/server/db';
import { learningPaths } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { trackServerEvent } from '$lib/server/posthog';

const resend = new Resend(env.RESEND_API_KEY || 're_dummy_resend_key');

const PUBLIC_APP_URL = env.PUBLIC_APP_URL || 'https://trykaiwa.com';

export interface LearningPathEmailData {
	user: User;
	assignment: LearningPathAssignment;
	pathTitle: string;
	pathDescription: string;
	currentDay: number;
	totalDays: number;
	todayTheme: string;
	todayDescription?: string;
	weekNumber: number;
}

export class LearningPathEmailService {
	/**
	 * Send daily learning path reminder to a user
	 */
	static async sendDailyReminder(assignmentId: string): Promise<boolean> {
		try {
			if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
				logger.warn('RESEND_API_KEY not configured, skipping email send');
				return true;
			}

			const emailData = await this.getLearningPathEmailData(assignmentId);
			if (!emailData) {
				logger.warn(`No email data found for assignment ${assignmentId}`);
				return false;
			}

			const result = await resend.emails.send({
				from: 'Hiro <hiro@trykaiwa.com>',
				replyTo: 'hiro@trykaiwa.com',
				to: [emailData.user.email],
				subject: this.getSubject(emailData),
				html: this.getEmailTemplate(emailData)
			});

			if (result.error) {
				logger.error('Failed to send learning path reminder:', result.error);
				return false;
			}

			// Mark email as sent
			await learningPathAssignmentRepository.markEmailSent(assignmentId);

			// Track in PostHog for retention funnel
			trackServerEvent('learning_path_email_sent', emailData.user.id, {
				assignment_id: assignmentId,
				path_id: emailData.assignment.pathId,
				path_title: emailData.pathTitle,
				current_day: emailData.currentDay,
				total_days: emailData.totalDays,
				week_number: emailData.weekNumber,
				progress_percent: Math.round((emailData.currentDay / emailData.totalDays) * 100),
				is_milestone: [1, 7, 14, emailData.totalDays].includes(emailData.currentDay),
				email_type: 'daily_reminder'
			});

			logger.info(
				`Learning path reminder sent to ${emailData.user.email} (Day ${emailData.currentDay})`
			);
			return true;
		} catch (error) {
			logger.error('Error sending learning path reminder:', error);
			return false;
		}
	}

	/**
	 * Get email data for a learning path assignment
	 */
	static async getLearningPathEmailData(
		assignmentId: string
	): Promise<LearningPathEmailData | null> {
		try {
			const assignment = await learningPathAssignmentRepository.findAssignmentById(assignmentId);
			if (!assignment) return null;

			const user = await userRepository.findUserById(assignment.userId);
			if (!user || !user.email) return null;

			// Get the learning path
			const path = await db.query.learningPaths.findFirst({
				where: eq(learningPaths.id, assignment.pathId)
			});
			if (!path) return null;

			// Calculate current day (1-indexed for display)
			const currentDay = (assignment.currentDayIndex || 0) + 1;
			const schedule = (path.schedule as Array<{ dayIndex: number; theme: string; description?: string }>) || [];
			const totalDays = schedule.length || 28;

			// Get today's theme from schedule
			const todaySchedule = schedule.find((d) => d.dayIndex === currentDay);
			const todayTheme = todaySchedule?.theme || `Day ${currentDay} Practice`;
			const todayDescription = todaySchedule?.description;

			// Calculate week number
			const weekNumber = Math.ceil(currentDay / 7);

			return {
				user,
				assignment,
				pathTitle: path.title,
				pathDescription: path.description || '',
				currentDay,
				totalDays,
				todayTheme,
				todayDescription,
				weekNumber
			};
		} catch (error) {
			logger.error('Error getting learning path email data:', error);
			return null;
		}
	}

	/**
	 * Get subject line for learning path email
	 */
	private static getSubject(data: LearningPathEmailData): string {
		const { currentDay, totalDays, todayTheme } = data;

		// Milestone days get special subjects
		if (currentDay === 1) {
			return `Day 1: Let's start your journey!`;
		}
		if (currentDay === 7) {
			return `Week 1 complete! Day 7 awaits`;
		}
		if (currentDay === 14) {
			return `Halfway there! Day 14 of ${totalDays}`;
		}
		if (currentDay === totalDays) {
			return `Final day! Complete your ${totalDays}-day journey`;
		}

		return `Day ${currentDay}: ${todayTheme}`;
	}

	/**
	 * Generate email HTML template
	 */
	private static getEmailTemplate(data: LearningPathEmailData): string {
		const { user, pathTitle, currentDay, totalDays, todayTheme, todayDescription, weekNumber } =
			data;
		const firstName = user.displayName?.split(' ')[0] || 'there';
		const progressPercent = Math.round((currentDay / totalDays) * 100);
		const practiceUrl = `${PUBLIC_APP_URL}/conversation?source=learning-path-email`;
		const pathUrl = `${PUBLIC_APP_URL}/path/${data.assignment.pathId}`;
		const unsubscribeUrl = `${PUBLIC_APP_URL}/unsubscribe?type=learning-path&id=${data.assignment.id}`;

		return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <!-- Header -->
  <div style="text-align: center; margin-bottom: 30px;">
    <h1 style="color: #6366f1; margin: 0; font-size: 24px;">Day ${currentDay} of ${totalDays}</h1>
    <p style="color: #666; margin: 5px 0 0 0;">${pathTitle}</p>
  </div>

  <!-- Progress Bar -->
  <div style="background: #e5e7eb; border-radius: 10px; height: 12px; margin-bottom: 30px; overflow: hidden;">
    <div style="background: linear-gradient(90deg, #6366f1, #8b5cf6); height: 100%; width: ${progressPercent}%; border-radius: 10px;"></div>
  </div>

  <!-- Greeting -->
  <p>Hey ${firstName},</p>

  <p>Welcome to <strong>Day ${currentDay}</strong> of your learning journey! You're in Week ${weekNumber} now.</p>

  <!-- Today's Focus -->
  <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #6366f1;">
    <h2 style="margin: 0 0 10px 0; color: #6366f1; font-size: 18px;">Today's Focus</h2>
    <p style="margin: 0; font-size: 16px; font-weight: 600;">${todayTheme}</p>
    ${todayDescription ? `<p style="margin: 10px 0 0 0; color: #666;">${todayDescription}</p>` : ''}
  </div>

  <!-- CTA Button -->
  <div style="text-align: center; margin: 30px 0;">
    <a href="${practiceUrl}" style="display: inline-block; background: linear-gradient(90deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
      Start Today's Practice
    </a>
  </div>

  <!-- Motivation -->
  ${this.getMotivationalMessage(currentDay, totalDays)}

  <!-- View Full Path -->
  <p style="text-align: center; margin-top: 30px;">
    <a href="${pathUrl}" style="color: #6366f1; text-decoration: none;">View your full learning path &rarr;</a>
  </p>

  <!-- Footer -->
  <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #999; font-size: 12px;">
    <p>You're receiving this because you enrolled in a learning path on Kaiwa.</p>
    <p>
      <a href="${unsubscribeUrl}" style="color: #999;">Turn off learning path reminders</a>
    </p>
  </div>

</body>
</html>
`;
	}

	/**
	 * Get motivational message based on progress
	 */
	private static getMotivationalMessage(currentDay: number, totalDays: number): string {
		if (currentDay === 1) {
			return `<p style="color: #666; font-style: italic;">"The journey of a thousand miles begins with a single step." - You've taken yours. Let's go!</p>`;
		}
		if (currentDay <= 3) {
			return `<p style="color: #666;">The first few days are about building momentum. Every practice session counts!</p>`;
		}
		if (currentDay === 7) {
			return `<p style="color: #666; font-style: italic;">One week down! You've proven you can show up. That's the hardest part.</p>`;
		}
		if (currentDay === Math.floor(totalDays / 2)) {
			return `<p style="color: #666; font-style: italic;">Halfway there! Look how far you've come. The second half is where real transformation happens.</p>`;
		}
		if (currentDay >= totalDays - 3) {
			return `<p style="color: #666; font-style: italic;">The finish line is in sight! Just ${totalDays - currentDay} more days. You've got this!</p>`;
		}
		if (currentDay === totalDays) {
			return `<p style="color: #666; font-style: italic;">This is it - your final day! Complete this session and celebrate your achievement.</p>`;
		}

		// Random encouragement for other days
		const messages = [
			"Consistency beats intensity. You're building a real habit here.",
			"Every conversation makes you more confident. Keep going!",
			"Small daily progress adds up to big results.",
			"You're doing something most people only talk about. Be proud!"
		];
		const randomMessage = messages[currentDay % messages.length];
		return `<p style="color: #666;">${randomMessage}</p>`;
	}

	/**
	 * Preview email for testing (without sending)
	 */
	static async previewEmail(assignmentId: string): Promise<string | null> {
		const emailData = await this.getLearningPathEmailData(assignmentId);
		if (!emailData) return null;
		return this.getEmailTemplate(emailData);
	}
}
