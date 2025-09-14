import type { RequestHandler } from './$types';

const pages = [
	{ url: '', changefreq: 'daily', priority: 1.0 },
	{ url: '/about', changefreq: 'monthly', priority: 0.8 },
	{ url: '/pricing', changefreq: 'weekly', priority: 0.9 },
	{ url: '/auth', changefreq: 'monthly', priority: 0.7 },
	{ url: '/privacy', changefreq: 'monthly', priority: 0.5 },
	{ url: '/terms', changefreq: 'monthly', priority: 0.5 }
];

export const GET: RequestHandler = async () => {
	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
	.map(
		(page) => `
	<url>
		<loc>https://kaiwa.app${page.url}</loc>
		<changefreq>${page.changefreq}</changefreq>
		<priority>${page.priority}</priority>
		<lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
	</url>`
	)
	.join('')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml'
		}
	});
};
