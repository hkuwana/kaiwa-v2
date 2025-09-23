import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { DEFAULT_VOICE } from '$lib/types/openai.realtime.types';

export const POST = async ({ request }) => {
	try {
		const OPENAI_API_KEY = env.OPENAI_API_KEY;
		if (!OPENAI_API_KEY) {
			return json({ error: 'OpenAI API key not configured' }, { status: 500 });
		}

		const { text, voice = DEFAULT_VOICE } = await request.json();

		if (!text) {
			return json({ error: 'Text is required' }, { status: 400 });
		}

		const response = await fetch('https://api.openai.com/v1/audio/speech', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				model: 'tts-1',
				input: text,
				voice,
				response_format: 'mp3'
			})
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('OpenAI TTS error:', errorText);
			return json({ error: 'Text-to-speech failed' }, { status: response.status });
		}

		// Convert the audio response to base64
		const audioBuffer = await response.arrayBuffer();
		const base64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

		return json({ audio: base64 });
	} catch (error) {
		console.error('TTS error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
