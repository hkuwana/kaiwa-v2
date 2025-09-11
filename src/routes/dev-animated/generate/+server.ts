import { json, type RequestHandler } from '@sveltejs/kit';
import { OPENAI_API_KEY } from '$env/static/private';
import { speakersData } from '$lib/data/speakers';

interface GenerateImageRequest {
	speakerId: string;
	prompt: string;
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { speakerId, prompt }: GenerateImageRequest = await request.json();

		if (!OPENAI_API_KEY) {
			return json({ error: 'OpenAI API key not configured' }, { status: 500 });
		}

		if (!speakerId || !prompt) {
			return json({ error: 'Missing speakerId or prompt' }, { status: 400 });
		}

		// Find the speaker
		const speaker = speakersData.find(s => s.id === speakerId);
		if (!speaker) {
			return json({ error: 'Speaker not found' }, { status: 404 });
		}

		console.log(`Generating image for ${speaker.voiceName} (${speaker.id})`);
		console.log(`Prompt: ${prompt.substring(0, 100)}...`);

		// Call OpenAI DALL-E API
		const response = await fetch('https://api.openai.com/v1/images/generations', {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${OPENAI_API_KEY}`,
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				model: 'dall-e-3',
				prompt: prompt,
				n: 1,
				size: '1024x1024',
				quality: 'standard',
				style: 'natural'
			}),
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('OpenAI API Error:', errorText);
			return json({ error: `OpenAI API error: ${response.status}` }, { status: 500 });
		}

		const data = await response.json();
		const imageUrl = data.data[0].url;

		console.log(`✅ Generated image for ${speaker.voiceName}: ${imageUrl}`);

		return json({
			success: true,
			speaker: {
				id: speaker.id,
				name: speaker.voiceName,
				region: speaker.region,
				language: speaker.languageId
			},
			imageUrl,
			prompt: prompt.substring(0, 200) + '...' // Return truncated prompt for reference
		});

	} catch (error) {
		console.error('Image generation error:', error);
		return json({ error: 'Failed to generate image' }, { status: 500 });
	}
};

// GET endpoint to list available speakers for testing
export const GET: RequestHandler = async () => {
	const japaneseSpeakers = speakersData.filter(s => s.languageId === 'ja');
	
	return json({
		message: 'Image generation API ready',
		japaneseSpeakers: japaneseSpeakers.map(s => ({
			id: s.id,
			name: s.voiceName,
			region: s.region,
			gender: s.gender
		}))
	});
};