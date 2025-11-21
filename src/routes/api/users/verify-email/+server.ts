import { json } from '@sveltejs/kit';
import { EmailVerificationService } from '$lib/server/services/email-verification.service';
import { FounderEmailService } from '$lib/emails/campaigns/founder-sequence/founder.service';
import { userSettingsRepository } from '$lib/server/repositories';

export const POST = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		const { code } = await request.json();

		if (!code || typeof code !== 'string' || code.length !== 6) {
			return json({ error: 'Invalid verification code format' }, { status: 400 });
		}

		const result = await EmailVerificationService.verifyCode(locals.user.id, code);

		if (!result.success) {
			return json({ error: result.error }, { status: 400 });
		}

		// Send founder welcome email after email verification (fire and forget)
		try {
			const emailSent = await FounderEmailService.sendDay1Welcome(locals.user.id);
			if (emailSent) {
				// Mark that founder email was sent on signup
				await userSettingsRepository.updateSettings(locals.user.id, {
					receivedFounderEmail: true
				});
				console.log('✉️ Founder welcome email sent after email verification', {
					userId: locals.user.id
				});
			}
		} catch (emailError) {
			console.error('⚠️ Failed to send founder welcome email:', emailError);
			// Don't fail the verification if email fails
		}

		return json({ success: true, message: 'Email verified successfully' });
	} catch (error) {
		console.error('Error verifying email:', error);
		return json({ error: 'Failed to verify email' }, { status: 500 });
	}
};
