import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	const robots = `User-agent: *
Allow: /
Disallow: /dev*
Disallow: /test*
Disallow: /api/
Disallow: /auth/error
Disallow: /profile
Disallow: /conversation

Sitemap: https://kaiwa.app/sitemap.xml

# Allow specific search engines
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

# Block AI training crawlers (optional)
User-agent: GPTBot
Disallow: /

User-agent: ChatGPT-User
Disallow: /

User-agent: CCBot
Disallow: /

User-agent: anthropic-ai
Disallow: /

User-agent: Claude-Web
Disallow: /`;

	return new Response(robots, {
		headers: {
			'Content-Type': 'text/plain'
		}
	});
};