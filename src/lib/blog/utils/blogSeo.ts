import type { BlogMetadata } from './blogProcessor.js';

export interface BlogSeoData {
	title: string;
	description: string;
	ogType: 'article' | 'website';
	ogImage?: string;
	twitterCard?: 'summary' | 'summary_large_image';
	canonical?: string;
	article?: {
		published_time: string;
		modified_time?: string;
		authors: string[];
		tags: string[];
		section?: string;
	};
}

export function createBlogSeo(
	metadata: BlogMetadata,
	slug: string,
	baseUrl: string = 'https://trykaiwa.com'
): BlogSeoData {
	const url = `${baseUrl}/blog/${slug}`;

	return {
		title: `${metadata.title} | Kaiwa Blog`,
		description: metadata.description,
		ogType: 'article',
		ogImage: `${baseUrl}/og-image.png`,
		twitterCard: 'summary_large_image',
		canonical: url,
		article: {
			published_time: new Date(metadata.date).toISOString(),
			modified_time: new Date(metadata.date).toISOString(),
			authors: [metadata.author || 'Kaiwa Team'],
			tags: metadata.tags || [],
			section: 'Blog'
		}
	};
}

export function createBlogListSeo(baseUrl: string = 'https://trykaiwa.com'): BlogSeoData {
	return {
		title: 'Blog | Kaiwa - Conversation Practice & Language Learning',
		description:
			'Discover insights on conversation practice, language learning techniques, and AI-powered education from the Kaiwa team.',
		ogType: 'website',
		ogImage: `${baseUrl}/og-image.png`,
		twitterCard: 'summary_large_image',
		canonical: `${baseUrl}/blog`
	};
}

export function generateMetaTags(seoData: BlogSeoData): string {
	const tags: string[] = [
		`<title>${seoData.title}</title>`,
		`<meta name="description" content="${seoData.description}">`,
		`<meta property="og:title" content="${seoData.title}">`,
		`<meta property="og:description" content="${seoData.description}">`,
		`<meta property="og:type" content="${seoData.ogType}">`,
		`<meta name="twitter:card" content="${seoData.twitterCard || 'summary'}">`,
		`<meta name="twitter:title" content="${seoData.title}">`,
		`<meta name="twitter:description" content="${seoData.description}">`
	];

	if (seoData.ogImage) {
		tags.push(`<meta property="og:image" content="${seoData.ogImage}">`);
		tags.push(`<meta name="twitter:image" content="${seoData.ogImage}">`);
	}

	if (seoData.canonical) {
		tags.push(`<link rel="canonical" href="${seoData.canonical}">`);
		tags.push(`<meta property="og:url" content="${seoData.canonical}">`);
	}

	if (seoData.article) {
		tags.push(
			`<meta property="article:published_time" content="${seoData.article.published_time}">`
		);
		if (seoData.article.modified_time) {
			tags.push(
				`<meta property="article:modified_time" content="${seoData.article.modified_time}">`
			);
		}
		seoData.article.authors.forEach((author) => {
			tags.push(`<meta property="article:author" content="${author}">`);
		});
		seoData.article.tags.forEach((tag) => {
			tags.push(`<meta property="article:tag" content="${tag}">`);
		});
		if (seoData.article.section) {
			tags.push(`<meta property="article:section" content="${seoData.article.section}">`);
		}
	}

	return tags.join('\n');
}
