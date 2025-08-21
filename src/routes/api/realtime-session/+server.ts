import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { dev } from '$app/environment';
import { OPENAI_API_KEY } from '$env/static/private';

// Valid OpenAI Realtime API voices
const VALID_OPENAI_VOICES = ['alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse'];

// Simple in-memory rate limiting
const sessionRequests = new Map<string, { timestamp: number; count: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = dev ? 100 : 3; // Max 3 requests per minute in production

export const POST: RequestHandler = async ({ request }) => {
	console.log('🔄 Realtime session creation request received');

	try {
		// Get client IP for rate limiting
		const clientId = request.headers.get('x-forwarded-for') || 'default';

		// Rate limiting
		const now = Date.now();
		const clientRequests = sessionRequests.get(clientId);

		if (clientRequests) {
			if (now - clientRequests.timestamp < RATE_LIMIT_WINDOW) {
				if (clientRequests.count >= MAX_REQUESTS) {
					return json(
						{
							error: 'Too many session requests. Please wait before trying again.'
						},
						{ status: 429 }
					);
				}
				clientRequests.count++;
			} else {
				sessionRequests.set(clientId, { timestamp: now, count: 1 });
			}
		} else {
			sessionRequests.set(clientId, { timestamp: now, count: 1 });
		}

		const {
			sessionId,
			model = 'gpt-4o-mini-realtime-preview-2024-12-17',
			voice = 'alloy'
		} = await request.json();

		if (!sessionId) {
			return json({ error: 'sessionId is required' }, { status: 400 });
		}

		// Validate voice parameter
		if (!VALID_OPENAI_VOICES.includes(voice)) {
			return json(
				{
					error: `Invalid voice: '${voice}'. Supported voices are: ${VALID_OPENAI_VOICES.join(', ')}`,
					details: {
						providedVoice: voice,
						validVoices: VALID_OPENAI_VOICES
					}
				},
				{ status: 400 }
			);
		}

		if (!OPENAI_API_KEY) {
			return json({ error: 'OpenAI API key not configured' }, { status: 500 });
		}

		const requestPayload = {
			model,
			voice
		};

		console.log(
			`Creating realtime session for sessionId: ${sessionId}`,
			JSON.stringify(requestPayload, null, 2)
		);

		// Create ephemeral token for realtime API
		const response = await fetch('https://api.openai.com/v1/realtime/sessions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(requestPayload)
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('OpenAI Realtime API error:', {
				status: response.status,
				statusText: response.statusText,
				response: errorText,
				requestPayload,
				sessionId
			});

			// Provide fallback for development
			if (dev) {
				console.log('Using development fallback token');
				return json({
					client_secret: {
						value: 'dev-fallback-token',
						expires_at: Date.now() + 60000
					},
					session_id: sessionId
				});
			}

			// Try to parse the error response for better error messages
			let errorDetails;
			try {
				errorDetails = JSON.parse(errorText);
			} catch {
				errorDetails = { error: { message: errorText } };
			}

			return json(
				{
					error: 'Failed to create realtime session',
					details: {
						status: response.status,
						statusText: response.statusText,
						response: errorText,
						openAIError: errorDetails.error?.message || 'Unknown OpenAI error',
						requestPayload
					}
				},
				{ status: response.status }
			);
		}

		const sessionData = await response.json();

		console.log('Realtime session created successfully:', sessionData);

		// Log the ephemeral key details
		const clientSecret = sessionData.client_secret?.value || sessionData.client_secret;
		const openaiSessionId = sessionData.id || sessionId;

		console.log('🔑 Ephemeral key details:', {
			sessionId: openaiSessionId,
			clientSecretLength: clientSecret?.length || 0,
			clientSecretPrefix: clientSecret?.substring(0, 8) || 'none',
			expiresAt: sessionData.client_secret?.expires_at || 'unknown'
		});

		// Ensure we return the expected structure that the adapter needs
		return json({
			session_id: openaiSessionId, // Use OpenAI's session ID or fallback to our sessionId
			client_secret: {
				value: clientSecret,
				expires_at: sessionData.client_secret?.expires_at || Date.now() + 60000
			}
		});
	} catch (error) {
		console.error('Realtime session creation error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
