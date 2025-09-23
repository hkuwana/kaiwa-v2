import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { speakersData } from '$lib/data/speakers';
import type { OpenAI } from 'openai';

interface GenerateImageRequest {
	speakerId: string;
	prompt: string;
	model?: 'dall-e-3' | 'gpt-image-1';
}

export const POST = async ({ request }) => {
	try {
		const { speakerId, prompt, model = 'dall-e-3' }: GenerateImageRequest = await request.json();

		if (!env.OPENAI_API_KEY) {
			return json({ error: 'OpenAI API key not configured' }, { status: 500 });
		}

		if (!speakerId || !prompt) {
			return json({ error: 'Missing speakerId or prompt' }, { status: 400 });
		}

		// Find the speaker
		const speaker = speakersData.find((s) => s.id === speakerId);
		if (!speaker) {
			return json({ error: 'Speaker not found' }, { status: 404 });
		}

		console.log(`Generating image for ${speaker.voiceName} (${speaker.id}) using ${model}`);
		console.log(`Prompt: ${prompt.substring(0, 100)}...`);

		// Prepare API call parameters based on model
		let apiBody: OpenAI.Images.ImageGenerateParams;
		if (model === 'gpt-image-1') {
			apiBody = {
				model: 'gpt-image-1',
				prompt: prompt,
				n: 1,
				size: '1024x1024',
				quality: 'high' // Use 'high' quality for GPT-Image-1
			};
		} else {
			apiBody = {
				model: 'dall-e-3',
				prompt: prompt,
				n: 1,
				size: '1024x1024',
				quality: 'hd', // HD quality for DALL-E 3
				style: 'natural' // Natural style for more realistic anime
			};
		}

		// Call OpenAI Image Generation API
		const response = await fetch('https://api.openai.com/v1/images/generations', {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${env.OPENAI_API_KEY}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(apiBody)
		});

		if (!response.ok) {
			const errorText = await response.text();
			console.error('OpenAI API Error:', errorText);
			return json({ error: `OpenAI API error: ${response.status}` }, { status: 500 });
		}

		const data = await response.json();
		const imageUrl = data.data[0].url;
		const revisedPrompt = data.data[0].revised_prompt; // DALL-E 3 returns enhanced prompt

		console.log(`✅ Generated image for ${speaker.voiceName}: ${imageUrl}`);
		console.log(`📝 DALL-E revised prompt: ${revisedPrompt?.substring(0, 150)}...`);

		return json({
			success: true,
			speaker: {
				id: speaker.id,
				name: speaker.voiceName,
				region: speaker.region,
				language: speaker.languageId
			},
			imageUrl,
			originalPrompt: prompt.substring(0, 200) + '...',
			revisedPrompt: revisedPrompt?.substring(0, 200) + '...' || 'No revised prompt returned'
		});
	} catch (error) {
		console.error('Image generation error:', error);
		return json({ error: 'Failed to generate image' }, { status: 500 });
	}
};

// GET endpoint to list available speakers for testing
export const GET = async () => {
	const japaneseSpeakers = speakersData.filter((s) => s.languageId === 'ja');

	return json({
		message: 'Image generation API ready',
		japaneseSpeakers: japaneseSpeakers.map((s) => ({
			id: s.id,
			name: s.voiceName,
			region: s.region,
			gender: s.gender
		}))
	});
};
