
import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { scenarios } from '$lib/prompts/scenarios';
import type { OpenAI } from 'openai';

interface GenerateImageRequest {
	scenarioId: string;
	prompt: string;
	model?: 'dall-e-3' | 'gpt-image-1';
}

export const POST = async ({ request }) => {
	try {
		const { scenarioId, prompt, model = 'dall-e-3' }: GenerateImageRequest = await request.json();

		if (!env.OPENAI_API_KEY) {
			return json({ error: 'OpenAI API key not configured' }, { status: 500 });
		}

		if (!scenarioId || !prompt) {
			return json({ error: 'Missing scenarioId or prompt' }, { status: 400 });
		}

		const scenario = scenarios.find((s) => s.id === scenarioId);
		if (!scenario) {
			return json({ error: 'Scenario not found' }, { status: 404 });
		}

		console.log(`Generating image for ${scenario.title} (${scenario.id}) using ${model}`);
		console.log(`Prompt: ${prompt.substring(0, 100)}...`);

		let apiBody: OpenAI.Images.ImageGenerateParams;
		if (model === 'gpt-image-1') {
			apiBody = {
				model: 'gpt-image-1',
				prompt: prompt,
				n: 1,
				size: '1792x1024',
				quality: 'high'
			};
		} else {
			apiBody = {
				model: 'dall-e-3',
				prompt: prompt,
				n: 1,
				size: '1792x1024',
				quality: 'hd',
				style: 'vivid'
			};
		}

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
		const revisedPrompt = data.data[0].revised_prompt;

		console.log(`✅ Generated image for ${scenario.title}: ${imageUrl}`);
		console.log(`📝 DALL-E revised prompt: ${revisedPrompt?.substring(0, 150)}...`);

		return json({
			success: true,
			scenario: {
				id: scenario.id,
				title: scenario.title,
			},
			imageUrl,
			revisedPrompt: revisedPrompt?.substring(0, 200) + '...' || 'No revised prompt returned'
		});
	} catch (error) {
		console.error('Image generation error:', error);
		return json({ error: 'Failed to generate image' }, { status: 500 });
	}
};
