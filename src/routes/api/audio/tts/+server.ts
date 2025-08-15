import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Get text from request
		const { text, voice = 'alloy' } = await request.json();

		if (!text) {
			return json({ error: 'No text provided' }, { status: 400 });
		}

		// Call OpenAI TTS API
		const response = await fetch('https://api.openai.com/v1/audio/speech', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'tts-1',
				input: text,
				voice: voice,
				response_format: 'mp3'
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error('OpenAI TTS API error:', errorData);
			return json(
				{
					error: 'Text-to-speech failed',
					details: errorData.error?.message || 'Unknown error'
				},
				{ status: response.status }
			);
		}

		// Get audio data as ArrayBuffer
		const audioBuffer = await response.arrayBuffer();

		// Convert to base64 for transmission
		const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

		return json({
			audio: base64Audio,
			format: 'mp3',
			success: true
		});
	} catch (error) {
		console.error('TTS error:', error);
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
