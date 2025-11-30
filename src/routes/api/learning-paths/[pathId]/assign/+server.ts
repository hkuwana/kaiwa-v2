// src/routes/api/learning-paths/[pathId]/assign/+server.ts

import { json } from '@sveltejs/kit';
import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { createSuccessResponse, createErrorResponse } from '$lib/types/api';
import { learningPathRepository } from '$lib/server/repositories/learning-path.repository';
import { learningPathAssignmentRepository } from '$lib/server/repositories/learning-path-assignment.repository';
import { userRepository } from '$lib/server/repositories/user.repository';
import type { RequestHandler } from './$types';

// Initialize Resend
const resend = new Resend(env.RESEND_API_KEY || 're_dummy_resend_key');

/**
 * POST /api/learning-paths/[pathId]/assign
 *
 * Assign a learning path to a user (admin/creator functionality)
 *
 * Request body:
 * {
 *   email?: string;        // User email (will look up userId)
 *   userId?: string;       // Direct user ID
 *   note?: string;         // Optional admin note
 *   sendEmail?: boolean;   // Send email notification (default: false)
 * }
 *
 * Response:
 * {
 *   success: true,
 *   data: {
 *     assignment: {...},
 *     emailSent?: boolean
 *   }
 * }
 */
export const POST: RequestHandler = async ({ params, request, locals, url }) => {
	try {
		const { pathId } = params;
		const body = await request.json();
		const { email, userId, note, sendEmail = false } = body;

		// Verify admin/creator access (for now, just check if user is logged in)
		if (!locals.user?.id) {
			return json(createErrorResponse('You must be logged in to assign learning paths'), {
				status: 401
			});
		}

		// Validate path exists
		const path = await learningPathRepository.findPathById(pathId);
		if (!path) {
			return json(createErrorResponse('Learning path not found'), { status: 404 });
		}

		// Determine target user
		let targetUserId: string;
		let targetUserEmail: string;
		let targetUserName: string | null = null;

		if (userId) {
			targetUserId = userId;
			// Look up user to get email for notification
			const user = await userRepository.findUserById(userId);
			if (!user) {
				return json(createErrorResponse('User not found'), { status: 404 });
			}
			targetUserEmail = user.email;
			targetUserName = user.displayName;
		} else if (email) {
			// Look up user by email
			const user = await userRepository.findUserByEmail(email.toLowerCase().trim());
			if (!user) {
				return json(
					createErrorResponse(
						`No user found with email: ${email}. The user must have an account first.`
					),
					{ status: 404 }
				);
			}
			targetUserId = user.id;
			targetUserEmail = user.email;
			targetUserName = user.displayName;
		} else {
			return json(createErrorResponse('Either email or userId is required'), { status: 400 });
		}

		// Check if assignment already exists
		const existingAssignment = await learningPathAssignmentRepository.findAssignment(
			targetUserId,
			pathId
		);
		if (existingAssignment) {
			return json(createErrorResponse('User is already assigned to this learning path'), {
				status: 409
			});
		}

		// Create assignment
		const assignment = await learningPathAssignmentRepository.createAssignment({
			pathId,
			userId: targetUserId,
			status: 'active',
			currentDayIndex: 1,
			startsAt: new Date(),
			metadata: {
				invitedBy: locals.user.id,
				inviteNote: note
			}
		});

		// Send email notification if requested
		let emailSent = false;
		if (sendEmail && env.RESEND_API_KEY && env.RESEND_API_KEY !== 're_dummy_resend_key') {
			try {
				const baseUrl = url.origin;
				const pathUrl = `${baseUrl}/path/${pathId}`;

				const result = await resend.emails.send({
					from: 'Kaiwa <hiro@trykaiwa.com>',
					to: [targetUserEmail],
					subject: `Your personalized learning path is ready!`,
					html: buildAssignmentEmailHtml({
						userName: targetUserName || 'there',
						pathTitle: path.title,
						pathDescription: path.description || '',
						pathUrl,
						note: note || '',
						duration: path.schedule?.length || 28
					})
				});

				if (!result.error) {
					emailSent = true;
					console.log('[Assign] Email sent successfully:', result.data?.id);
				} else {
					console.error('[Assign] Failed to send email:', result.error);
				}
			} catch (emailError) {
				console.error('[Assign] Error sending email:', emailError);
				// Don't fail the assignment if email fails
			}
		}

		return json(
			createSuccessResponse({
				assignment,
				emailSent
			}),
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error assigning learning path:', error);

		return json(
			createErrorResponse(
				error instanceof Error ? error.message : 'Failed to assign learning path'
			),
			{ status: 500 }
		);
	}
};

/**
 * Build the email HTML for assignment notification
 */
function buildAssignmentEmailHtml(params: {
	userName: string;
	pathTitle: string;
	pathDescription: string;
	pathUrl: string;
	note: string;
	duration: number;
}): string {
	const { userName, pathTitle, pathDescription, pathUrl, note, duration } = params;

	return `
<!DOCTYPE html>
<html>
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<title>Your Learning Path is Ready</title>
	<style>
		body {
			font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
			line-height: 1.6;
			color: #333;
			max-width: 600px;
			margin: 0 auto;
			padding: 20px;
			background-color: #f8f9fa;
		}
		.container {
			background: white;
			border-radius: 12px;
			padding: 40px;
			box-shadow: 0 2px 10px rgba(0,0,0,0.08);
		}
		.header {
			text-align: center;
			margin-bottom: 30px;
		}
		.logo {
			font-size: 24px;
			font-weight: bold;
			color: #2563eb;
			margin-bottom: 20px;
		}
		h1 {
			font-size: 28px;
			font-weight: 600;
			color: #1a1a1a;
			margin: 0 0 10px 0;
		}
		.path-card {
			background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
			border: 1px solid #bae6fd;
			border-radius: 12px;
			padding: 24px;
			margin: 24px 0;
		}
		.path-title {
			font-size: 20px;
			font-weight: 600;
			color: #0369a1;
			margin: 0 0 8px 0;
		}
		.path-description {
			color: #475569;
			margin: 0 0 16px 0;
		}
		.path-meta {
			font-size: 14px;
			color: #64748b;
		}
		.personal-note {
			background: #fef3c7;
			border-left: 4px solid #f59e0b;
			padding: 16px;
			margin: 24px 0;
			border-radius: 0 8px 8px 0;
		}
		.personal-note-label {
			font-weight: 600;
			color: #92400e;
			font-size: 14px;
			margin-bottom: 8px;
		}
		.cta-button {
			display: inline-block;
			background: #2563eb;
			color: white !important;
			text-decoration: none;
			padding: 14px 32px;
			border-radius: 8px;
			font-weight: 600;
			font-size: 16px;
			margin: 24px 0;
		}
		.cta-container {
			text-align: center;
		}
		.footer {
			margin-top: 32px;
			padding-top: 24px;
			border-top: 1px solid #e2e8f0;
			font-size: 14px;
			color: #64748b;
			text-align: center;
		}
		.footer a {
			color: #2563eb;
		}
	</style>
</head>
<body>
	<div class="container">
		<div class="header">
			<div class="logo">Kaiwa</div>
			<h1>Your learning path is ready!</h1>
		</div>

		<p>Hi ${userName},</p>

		<p>Great news! I've created a personalized learning path just for you. It's designed based on our conversation to help you reach your language goals.</p>

		<div class="path-card">
			<h2 class="path-title">${pathTitle}</h2>
			<p class="path-description">${pathDescription}</p>
			<p class="path-meta">${duration} days of structured practice</p>
		</div>

		${
			note
				? `
		<div class="personal-note">
			<div class="personal-note-label">A note from me:</div>
			<p style="margin: 0; color: #78350f;">${note}</p>
		</div>
		`
				: ''
		}

		<div class="cta-container">
			<a href="${pathUrl}" class="cta-button">View Your Learning Path</a>
		</div>

		<p>If you have any questions or want to adjust anything, just reply to this email - I read every message!</p>

		<p>Best,<br>Hiro</p>

		<div class="footer">
			<p>Kaiwa - Practice conversations that matter</p>
			<p>Questions? Just reply to this email.</p>
		</div>
	</div>
</body>
</html>
	`;
}
