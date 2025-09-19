import type { RequestHandler } from './$types';
import { glob } from 'glob';
import path from 'path';

const staticPages = [
	{ url: '', changefreq: 'daily', priority: 1.0 },
	{ url: '/about', changefreq: 'monthly', priority: 0.8 },
	{ url: '/pricing', changefreq: 'weekly', priority: 0.9 },
	{ url: '/philosophy', changefreq: 'monthly', priority: 0.8 },
	{ url: '/privacy', changefreq: 'monthly', priority: 0.5 },
	{ url: '/terms', changefreq: 'monthly', priority: 0.5 }
];

export const GET: RequestHandler = async () => {
	const blogFiles = await glob('src/lib/blog/*.md');

	const blogPosts = blogFiles.map((file) => {
		const slug = path.basename(file, '.md');
		return {
			url: `/blog/${slug}`,
			changefreq: 'weekly',
			priority: 0.9
		};
	});

	const allPages = [...staticPages, ...blogPosts];

	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
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
