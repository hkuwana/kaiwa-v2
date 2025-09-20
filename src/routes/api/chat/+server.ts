import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const POST = async ({ request }) => {
	try {
		const {
			messages,
			model = 'gpt-3.5-turbo',
			max_tokens = 100,
			temperature = 0.7
		} = await request.json();

		if (!messages || !Array.isArray(messages)) {
			return json({ error: 'Messages array is required' }, { status: 400 });
		}

		const OPENAI_API_KEY = env.OPENAI_API_KEY;

		if (!OPENAI_API_KEY) {
			// Fallback response for development
			const lastUserMessage = messages.filter((m) => m.role === 'user').pop()?.content || '';
			return json({
				choices: [
					{
						message: {
							content: `I heard you say: "${lastUserMessage}". That's great practice! Keep going. (Note: This is a fallback response since no OpenAI API key is configured.)`
						}
					}
				]
			});
		}

		// Forward to OpenAI Chat API
		const response = await fetch('https://api.openai.com/v1/chat/completions', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${OPENAI_API_KEY}`
			},
			body: JSON.stringify({
				model,
				messages,
				max_tokens,
				temperature
			})
		});

		if (!response.ok) {
			const errorData = await response.text();
			console.error('OpenAI API error:', errorData);
			return json(
				{
					error: 'Chat service unavailable',
					choices: [
						{
							message: {
								content: "I'm having trouble connecting right now. Could you try again in a moment?"
							}
						}
					]
				},
				{ status: response.status }
			);
		}

		const data = await response.json();
		return json(data);
	} catch (error) {
		console.error('Chat error:', error);
		return json(
			{
				error: 'Internal server error',
				choices: [
					{
						message: {
							content: "Sorry, I'm having technical difficulties. Please try again."
						}
					}
				]
			},
			{ status: 500 }
		);
	}
};
