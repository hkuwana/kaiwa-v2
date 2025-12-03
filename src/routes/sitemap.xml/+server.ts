import type { RequestHandler } from './$types';

/**
 * Dynamic XML Sitemap Generator
 *
 * Best practices implemented:
 * - Only includes indexable, 200-status URLs
 * - Uses proper lastmod dates from blog post metadata
 * - Dynamically includes all blog posts and docs
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

interface BlogMetadata {
	title: string;
	date: string;
	published?: boolean;
}

interface DocMetadata {
	title?: string;
	description?: string;
}

// Core marketing pages
const corePages: SitemapEntry[] = [
	{ url: '/', changefreq: 'weekly', priority: 1.0 },
	{ url: '/pricing', changefreq: 'weekly', priority: 0.9 },
	{ url: '/about', changefreq: 'monthly', priority: 0.8 },
	{ url: '/philosophy', changefreq: 'monthly', priority: 0.7 },
	{ url: '/scenarios', changefreq: 'monthly', priority: 0.7 },
	{ url: '/research', changefreq: 'monthly', priority: 0.6 },
	{ url: '/get-your-guide', changefreq: 'monthly', priority: 0.6 }
];

// Content index pages
const contentIndexPages: SitemapEntry[] = [
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

/**
 * Dynamically load all published blog posts
 */
async function getBlogPostEntries(): Promise<SitemapEntry[]> {
	const modules = import.meta.glob('../../lib/blog/posts/*.md');
	const entries: SitemapEntry[] = [];

	for (const [path, resolver] of Object.entries(modules)) {
		const slug = path.split('/').pop()?.replace('.md', '') || '';
		try {
			const module = (await resolver()) as { metadata: BlogMetadata };
			if (module.metadata?.published !== false) {
				entries.push({
					url: `/blog/${slug}`,
					lastmod: module.metadata.date
						? new Date(module.metadata.date).toISOString().split('T')[0]
						: undefined,
					changefreq: 'monthly',
					priority: 0.7
				});
			}
		} catch (error) {
			console.error(`Error loading blog post ${slug} for sitemap:`, error);
		}
	}

	return entries;
}

/**
 * Dynamically load all public documentation pages
 * Only includes user-facing docs, excludes internal/archive docs
 */
async function getDocsEntries(): Promise<SitemapEntry[]> {
	const modules = import.meta.glob('../../lib/docs/*.md', { eager: true });
	const entries: SitemapEntry[] = [];

	// List of public-facing docs (exclude internal, archive, and strategy docs)
	const publicDocPrefixes = [
		'guide-',
		'feature-',
		'core-',
		'process-'
	];
	const excludePatterns = ['archive-', 'strategy-', 'icp-', 'blog-template', 'daily-content', 'whatsapp', 'friend-outreach', 'solo-founder', 'feedback-growth', 'content-calendar', 'content-quick'];

	for (const [path, module] of Object.entries(modules)) {
		const slug = path.split('/').pop()?.replace('.md', '') || '';

		// Check if doc should be included
		const isPublic = publicDocPrefixes.some(prefix => slug.startsWith(prefix));
		const isExcluded = excludePatterns.some(pattern => slug.includes(pattern));

		if (isPublic && !isExcluded) {
			const meta = module as unknown as { metadata?: DocMetadata };
			if (meta.metadata?.title) {
				entries.push({
					url: `/docs/${slug}`,
					changefreq: 'monthly',
					priority: 0.5
				});
			}
		}
	}

	return entries;
}

export const GET: RequestHandler = async () => {
	const today = new Date().toISOString().split('T')[0];

	// Get dynamic content
	const blogPosts = await getBlogPostEntries();
	const docsPages = await getDocsEntries();

	// Combine all pages
	const allPages: SitemapEntry[] = [
		...corePages,
		...contentIndexPages,
		...blogPosts,
		...docsPages,
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
