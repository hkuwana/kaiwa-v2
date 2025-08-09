import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const formData = await request.formData();
		const audioFile = formData.get('file') as File;
		const model = formData.get('model') || 'whisper-1';
		const language = formData.get('language') || 'en';

		if (!audioFile) {
			return json({ error: 'No audio file provided' }, { status: 400 });
		}

		// TODO: Replace with your OpenAI API key
		const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

		if (!OPENAI_API_KEY) {
			// Fallback response for development
			return json({
				text: 'Hello, this is a test transcription since no OpenAI API key is configured.'
			});
		}

		// Forward to OpenAI Whisper API
		const openAIFormData = new FormData();
		openAIFormData.append('file', audioFile);
		openAIFormData.append('model', model);
		openAIFormData.append('language', language);

		const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`
			},
			body: openAIFormData
		});

		if (!response.ok) {
			const errorData = await response.text();
			console.error('OpenAI API error:', errorData);
			return json(
				{
					error: 'Transcription service unavailable',
					text: "Sorry, I couldn't understand that. Could you try again?"
				},
				{ status: response.status }
			);
		}

		const data = await response.json();
		return json({ text: data.text });
	} catch (error) {
		console.error('Transcription error:', error);
		return json(
			{
				error: 'Internal server error',
				text: 'Sorry, there was an error processing your speech. Please try again.'
			},
			{ status: 500 }
		);
	}
};
