import { logger } from '$lib/logger';
import { emailVerificationRepository, userRepository } from '$lib/server/repositories';
import { EmailService } from './email-service';

export class EmailVerificationService {
	/**
	 * Generate a 6-digit verification code
	 */
	private static generateVerificationCode(): string {
		return Math.floor(100000 + Math.random() * 900000).toString();
	}

	/**
	 * Create and send a verification code for a user
	 */
	static async createAndSendVerificationCode(
		userId: string,
		email: string,
		displayName?: string
	): Promise<{ success: boolean; code?: string; error?: string }> {
		try {
			// Clean up any existing unverified codes for this user
			await emailVerificationRepository.deleteUnverifiedVerificationsByUserId(userId);

			// Generate new verification code
			const code = this.generateVerificationCode();
			const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

			// Create verification record
			await emailVerificationRepository.createVerification({
				userId,
				email,
				code,
				expiresAt,
				attempts: 0
			});

			// Send email
			const emailSent = await EmailService.sendVerificationCode({
				email,
				code,
				displayName
			});

			if (!emailSent) {
				// Clean up the verification record if email failed
				await emailVerificationRepository.deleteVerificationByUserId(userId);

				return {
					success: false,
					error: 'Failed to send verification email'
				};
			}

			return { success: true, code };
		} catch (error) {
			logger.error('Error creating verification code:', error);
			return {
				success: false,
				error: 'Failed to create verification code'
			};
		}
	}

	/**
	 * Verify a code for a user
	 */
	static async verifyCode(
		userId: string,
		code: string
	): Promise<{ success: boolean; error?: string }> {
		try {
			// Find the verification record
			const verification = await emailVerificationRepository.findVerificationByCode(userId, code);

			if (!verification) {
				// Increment attempts for failed verification
				await emailVerificationRepository.incrementAttempts(userId);

				return {
					success: false,
					error: 'Invalid or expired verification code'
				};
			}

			// Check if too many attempts
			if (verification.attempts >= 5) {
				return {
					success: false,
					error: 'Too many failed attempts. Please request a new code.'
				};
			}

			// Mark as verified
			await emailVerificationRepository.markAsVerified(verification.id);

			// Update user as email verified
			await userRepository.updateUser(userId, { emailVerified: new Date() });

			return { success: true };
		} catch (error) {
			logger.error('Error verifying code:', error);
			return {
				success: false,
				error: 'Failed to verify code'
			};
		}
	}

	/**
	 * Check if user has a pending verification
	 */
	static async hasPendingVerification(userId: string): Promise<boolean> {
		try {
			const verification =
				await emailVerificationRepository.findPendingVerificationByUserId(userId);
			return !!verification;
		} catch (error) {
			logger.error('Error checking pending verification:', error);
			return false;
		}
	}

	/**
	 * Resend verification code
	 */
	static async resendVerificationCode(
		userId: string,
		email: string,
		displayName?: string
	): Promise<{ success: boolean; error?: string }> {
		try {
			// Check if user already has a recent verification code
			const existing = await emailVerificationRepository.findPendingVerificationByUserId(userId);

			if (existing) {
				// Check if it's too soon to resend (prevent spam)
				const timeSinceCreated = Date.now() - existing.createdAt.getTime();
				if (timeSinceCreated < 60000) {
					// 1 minute cooldown
					return {
						success: false,
						error: 'Please wait before requesting another code'
					};
				}
			}

			return await this.createAndSendVerificationCode(userId, email, displayName);
		} catch (error) {
			logger.error('Error resending verification code:', error);
			return {
				success: false,
				error: 'Failed to resend verification code'
			};
		}
	}
}
