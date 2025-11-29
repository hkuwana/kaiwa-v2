import type { RequestHandler } from './$types';

/**
 * Dynamic XML Sitemap Generator
 *
 * Best practices implemented:
 * - Only includes indexable, 200-status URLs
 * - Uses proper lastmod dates
 * - Excludes noindex pages, redirects, and private areas
 * - Separates content by type for better organization
 *
 * @see https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
 */

const SITE_URL = 'https://trykaiwa.com';

// Supported languages for conversation pages
const LANGUAGES = [
	'en',
	'es',
	'fr',
	'de',
	'it',
	'pt',
	'ja',
	'ko',
	'zh',
	'ar',
	'hi',
	'ru',
	'vi',
	'nl',
	'fil',
	'id',
	'tr'
];

interface SitemapEntry {
	url: string;
	lastmod?: string;
	changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
	priority: number;
}

// Core marketing pages
const corePages: SitemapEntry[] = [
	{ url: '/', changefreq: 'weekly', priority: 1.0 },
	{ url: '/pricing', changefreq: 'weekly', priority: 0.9 },
	{ url: '/about', changefreq: 'monthly', priority: 0.8 },
	{ url: '/philosophy', changefreq: 'monthly', priority: 0.7 }
];

// Content pages (blog, docs, etc.)
const contentPages: SitemapEntry[] = [
	{ url: '/blog', changefreq: 'daily', priority: 0.8 },
	{ url: '/docs', changefreq: 'weekly', priority: 0.7 },
	{ url: '/faq', changefreq: 'monthly', priority: 0.7 },
	{ url: '/changelog', changefreq: 'weekly', priority: 0.6 }
];

// Legal pages (lower priority)
const legalPages: SitemapEntry[] = [
	{ url: '/privacy', changefreq: 'yearly', priority: 0.3 },
	{ url: '/terms', changefreq: 'yearly', priority: 0.3 }
];

// Generate language conversation pages
const languagePages: SitemapEntry[] = LANGUAGES.map((lang) => ({
	url: `/conversation?lang=${lang}&mode=traditional&voice=alloy`,
	changefreq: 'monthly' as const,
	priority: 0.8
}));

export const GET: RequestHandler = async () => {
	const today = new Date().toISOString().split('T')[0];

	// Combine all pages
	const allPages: SitemapEntry[] = [
		...corePages,
		...contentPages,
		...legalPages,
		...languagePages
	];

	// Generate XML
	const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${allPages
	.map(
		(page) => `  <url>
    <loc>${SITE_URL}${page.url}</loc>
    <lastmod>${page.lastmod || today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(sitemap, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'max-age=3600' // Cache for 1 hour
		}
	});
};
