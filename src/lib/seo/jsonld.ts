export type JsonLdObject = Record<string, unknown>;

export function createHomePageJsonLd(baseUrl: string): JsonLdObject {
	return {
		'@context': 'https://schema.org',
		'@type': 'WebSite',
		name: 'Kaiwa',
		url: baseUrl,
		description:
			'Practice real conversations in 5 minutes a day with your AI language partner. Build speaking confidence before talking with real people.',
		inLanguage: 'en',
		publisher: {
			'@type': 'Organization',
			name: 'Kaiwa'
		}
	};
}

export function createAboutPageJsonLd(baseUrl: string): JsonLdObject {
	return {
		'@context': 'https://schema.org',
		'@type': 'AboutPage',
		name: 'About Kaiwa',
		url: `${baseUrl}/about`,
		description:
			'Learn how Kaiwa helps you move beyond gamified drills to real conversations with the people you care about.',
		isPartOf: {
			'@type': 'WebSite',
			name: 'Kaiwa',
			url: baseUrl
		}
	};
}

export function createDocsIndexJsonLd(baseUrl: string): JsonLdObject {
	return {
		'@context': 'https://schema.org',
		'@type': 'CollectionPage',
		name: 'Kaiwa Documentation',
		url: `${baseUrl}/docs`,
		description:
			'Architecture, guides, and feature documentation for developing and operating Kaiwa.',
		isPartOf: {
			'@type': 'WebSite',
			name: 'Kaiwa',
			url: baseUrl
		}
	};
}

export function createDocsArticleJsonLd(
	args: {
		slug: string;
		title: string;
		description: string;
		date?: string;
		tags?: string[];
	},
	baseUrl: string
): JsonLdObject {
	const url = `${baseUrl}/docs/${args.slug}`;

	return {
		'@context': 'https://schema.org',
		'@type': 'TechArticle',
		headline: args.title,
		description: args.description,
		url,
		datePublished: args.date ? new Date(args.date).toISOString() : undefined,
		keywords: args.tags && args.tags.length > 0 ? args.tags : undefined,
		isPartOf: {
			'@type': 'CreativeWorkSeries',
			name: 'Kaiwa Documentation',
			url: `${baseUrl}/docs`
		},
		publisher: {
			'@type': 'Organization',
			name: 'Kaiwa'
		}
	};
}

export function createBlogIndexJsonLd(baseUrl: string): JsonLdObject {
	const url = `${baseUrl}/blog`;

	return {
		'@context': 'https://schema.org',
		'@type': 'Blog',
		name: 'Kaiwa Blog',
		url,
		description:
			'Articles on speaking confidence, conversation practice, and learning with an AI language partner.',
		publisher: {
			'@type': 'Organization',
			name: 'Kaiwa'
		}
	};
}

