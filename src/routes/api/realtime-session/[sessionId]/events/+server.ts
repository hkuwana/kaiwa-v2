import { dev } from '$app/environment';

export const GET = async ({ params, setHeaders }) => {
	const { sessionId } = params;

	// Set headers for Server-Sent Events
	setHeaders({
		'Content-Type': 'text/event-stream',
		'Cache-Control': 'no-cache',
		Connection: 'keep-alive',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Headers': 'Cache-Control'
	});

	// Create a readable stream for SSE
	const stream = new ReadableStream({
		start(controller) {
			// Send initial connection message
			const message = `data: ${JSON.stringify({
				type: 'connected',
				sessionId,
				timestamp: new Date().toISOString()
			})}\n\n`;

			controller.enqueue(new TextEncoder().encode(message));

			// For development, simulate some events
			if (dev) {
				setTimeout(() => {
					const transcriptMessage = `data: ${JSON.stringify({
						type: 'transcript',
						text: 'Hello, how are you today?',
						timestamp: new Date().toISOString()
					})}\n\n`;
					controller.enqueue(new TextEncoder().encode(transcriptMessage));
				}, 2000);

				setTimeout(() => {
					const responseMessage = `data: ${JSON.stringify({
						type: 'response',
						text: "I'm doing well, thank you for asking! How can I help you practice today?",
						timestamp: new Date().toISOString()
					})}\n\n`;
					controller.enqueue(new TextEncoder().encode(responseMessage));
				}, 4000);
			}

			// Keep connection alive
			const keepAlive = setInterval(() => {
				const keepAliveMessage = `: keepalive\n\n`;
				controller.enqueue(new TextEncoder().encode(keepAliveMessage));
			}, 30000);

			// Clean up on close
			return () => {
				clearInterval(keepAlive);
			};
		}
	});

	return new Response(stream);
};
