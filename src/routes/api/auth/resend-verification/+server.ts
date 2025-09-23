import { json } from '@sveltejs/kit';
import { EmailVerificationService } from '$lib/server/services/emailVerificationService';

export const POST = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Not authenticated' }, { status: 401 });
	}

	try {
		const result = await EmailVerificationService.resendVerificationCode(
			locals.user.id,
			locals.user.email,
			locals.user.displayName || undefined
		);

		if (!result.success) {
			return json({ error: result.error }, { status: 400 });
		}

		return json({ success: true, message: 'Verification code sent successfully' });
	} catch (error) {
		console.error('Error resending verification code:', error);
		return json({ error: 'Failed to resend verification code' }, { status: 500 });
	}
};
