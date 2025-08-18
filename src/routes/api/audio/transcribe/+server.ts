import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		if (!OPENAI_API_KEY) {
			return json({ error: 'OpenAI API key not configured' }, { status: 500 });
		}

		const formData = await request.formData();
		const audioFile = formData.get('audio') as File;

		if (!audioFile) {
			return json({ error: 'No audio file provided' }, { status: 400 });
		}

		// Convert File to FormData for OpenAI
		const openAIFormData = new FormData();
		openAIFormData.append('file', audioFile);
		openAIFormData.append('model', 'whisper-1');

		const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`
			},
			body: openAIFormData
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('OpenAI transcription error:', errorText);
			return json({ error: 'Transcription failed' }, { status: response.status });
		}

		const result = await response.json();
		return json({ transcript: result.text });
	} catch (error) {
		console.error('Transcription error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
