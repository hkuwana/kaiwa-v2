import { json } from '@sveltejs/kit';
import { EmailVerificationService } from '$lib/server/services/email-verification.service';

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

		return json({ success: true, message: 'Email verified successfully' });
	} catch (error) {
		console.error('Error verifying email:', error);
		return json({ error: 'Failed to verify email' }, { status: 500 });
	}
};
