import { Resend } from 'resend';
import { env } from '$env/dynamic/private';

// Initialize Resend with fallback for missing API key
const resend = new Resend(env.RESEND_API_KEY || 're_dummy_resend_key');

export interface EmailVerificationData {
	email: string;
	code: string;
	displayName?: string;
}

export class EmailService {
	/**
	 * Send email verification code
	 */
	static async sendVerificationCode(data: EmailVerificationData): Promise<boolean> {
		try {
			// Check if we have a valid API key
			if (!env.RESEND_API_KEY || env.RESEND_API_KEY === 're_dummy_resend_key') {
				console.warn('RESEND_API_KEY not configured, skipping email send');
				return true; // Return true to not block user flow in development
			}

			const result = await resend.emails.send({
				from: 'Kaiwa <noreply@trykaiwa.com',
				to: [data.email],
				subject: 'Verify your email - Kaiwa',
				html: this.getVerificationEmailTemplate(data)
			});

			if (result.error) {
				console.error('Failed to send verification email:', result.error);
				return false;
			}

			console.log('Verification email sent successfully:', result.data?.id);
			return true;
		} catch (error) {
			console.error('Error sending verification email:', error);
			return false;
		}
	}

	/**
	 * Generate email verification template
	 */
	private static getVerificationEmailTemplate(data: EmailVerificationData): string {
		const greeting = data.displayName ? `Hi ${data.displayName},` : 'Hi there,';

		return `
			<!DOCTYPE html>
			<html>
			<head>
				<meta charset="utf-8">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<title>Verify your email - Kaiwa</title>
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
						border-radius: 8px;
						padding: 40px;
						box-shadow: 0 2px 10px rgba(0,0,0,0.1);
					}
					.header {
						text-align: center;
						margin-bottom: 30px;
					}
					.logo {
						font-size: 28px;
						font-weight: bold;
						color: #2563eb;
						margin-bottom: 10px;
					}
					.verification-code {
						background: #f1f5f9;
						border: 2px solid #e2e8f0;
						border-radius: 8px;
						padding: 20px;
						text-align: center;
						margin: 30px 0;
					}
					.code {
						font-size: 32px;
						font-weight: bold;
						color: #1e40af;
						letter-spacing: 8px;
						font-family: 'Courier New', monospace;
					}
					.footer {
						margin-top: 30px;
						padding-top: 20px;
						border-top: 1px solid #e2e8f0;
						font-size: 14px;
						color: #64748b;
						text-align: center;
					}
					.warning {
						background: #fef3c7;
						border: 1px solid #f59e0b;
						border-radius: 6px;
						padding: 15px;
						margin: 20px 0;
						font-size: 14px;
					}
				</style>
			</head>
			<body>
				<div class="container">
					<div class="header">
						<div class="logo">Kaiwa</div>
						<h1>Verify your email address</h1>
					</div>
					
					<p>${greeting}</p>
					
					<p>Welcome to Kaiwa! To complete your account setup and start your language learning journey, please verify your email address using the code below:</p>
					
					<div class="verification-code">
						<div class="code">${data.code}</div>
					</div>
					
					<p>Enter this 6-digit code in the verification form to activate your account.</p>
					
					<div class="warning">
						<strong>Important:</strong> This code will expire in 15 minutes for security reasons. If you didn't request this verification, please ignore this email.
					</div>
					
					<p>Once verified, you'll have full access to:</p>
					<ul>
						<li>Personalized conversation practice</li>
						<li>Progress tracking and analytics</li>
						<li>AI-powered language coaching</li>
						<li>And much more!</li>
					</ul>
					
					<div class="footer">
						<p>This email was sent from Kaiwa. If you have any questions, please contact our support team.</p>
						<p>&copy; 2024 Kaiwa. All rights reserved.</p>
					</div>
				</div>
			</body>
			</html>
		`;
	}
}
