import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OPENAI_API_KEY } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Get audio data from request
		const formData = await request.formData();
		const audioFile = formData.get('audio') as File;

		if (!audioFile) {
			return json({ error: 'No audio file provided' }, { status: 400 });
		}

		// Convert audio file to ArrayBuffer
		const audioBuffer = await audioFile.arrayBuffer();

		// Create FormData for OpenAI API
		const openAIFormData = new FormData();
		openAIFormData.append('file', new Blob([audioBuffer], { type: audioFile.type }), 'audio.webm');
		openAIFormData.append('model', 'whisper-1');
		openAIFormData.append('response_format', 'text');

		// Call OpenAI API
		const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${OPENAI_API_KEY}`
			},
			body: openAIFormData
		});

		if (!response.ok) {
			const errorData = await response.json();
			console.error('OpenAI API error:', errorData);
			return json(
				{
					error: 'Transcription failed',
					details: errorData.error?.message || 'Unknown error'
				},
				{ status: response.status }
			);
		}

		const transcript = await response.text();

		return json({
			transcript,
			success: true
		});
	} catch (error) {
		console.error('Transcription error:', error);
		return json(
			{
				error: 'Internal server error',
				details: error instanceof Error ? error.message : 'Unknown error'
			},
			{ status: 500 }
		);
	}
};
