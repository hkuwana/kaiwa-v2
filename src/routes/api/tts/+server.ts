import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { text, voice = 'alloy' } = await request.json();

		if (!text) {
			return new Response('Text is required', { status: 400 });
		}

		// TODO: Replace with your OpenAI API key
		const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

		if (!OPENAI_API_KEY) {
			// Return empty buffer for fallback to browser TTS
			return new Response(new ArrayBuffer(0), {
				headers: { 'Content-Type': 'audio/mpeg' }
			});
		}

		// Forward to OpenAI TTS API
		const response = await fetch('https://api.openai.com/v1/audio/speech', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${OPENAI_API_KEY}`
			},
			body: JSON.stringify({
				model: 'tts-1',
				input: text,
				voice: voice
			})
		});

		if (!response.ok) {
			console.error('OpenAI TTS API error:', response.statusText);
			// Return empty buffer to trigger fallback
			return new Response(new ArrayBuffer(0), {
				headers: { 'Content-Type': 'audio/mpeg' }
			});
		}

		const audioBuffer = await response.arrayBuffer();
		return new Response(audioBuffer, {
			headers: { 'Content-Type': 'audio/mpeg' }
		});
	} catch (error) {
		console.error('TTS error:', error);
		// Return empty buffer to trigger fallback
		return new Response(new ArrayBuffer(0), {
			headers: { 'Content-Type': 'audio/mpeg' }
		});
	}
};
