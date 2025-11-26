import { getLanguageName } from "$lib/data/languages";

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

/**
 * Creates JSON-LD Course schema for learning path templates
 *
 * This helps Google and other search engines understand the structure
 * of learning path programs for better discoverability.
 *
 * @see https://schema.org/Course
 */
export function createLearningPathJsonLd(
	template: {
		title: string;
		description: string;
		targetLanguage: string;
		shareSlug: string;
		schedule: Array<{
			dayIndex: number;
			theme: string;
			difficulty: string;
			description?: string;
		}>;
		metadata?: {
			cefrLevel?: string;
			primarySkill?: string;
			estimatedMinutesPerDay?: number;
			category?: string;
		};
		createdAt: string;
	},
	baseUrl: string
): JsonLdObject {
	const url = `${baseUrl}/program/${template.shareSlug}`;
	const totalDays = template.schedule.length;
	const weeks = Math.ceil(totalDays / 7);

 

	const languageName = getLanguageName(template.targetLanguage) || template.targetLanguage;

	return {
		'@context': 'https://schema.org',
		'@type': 'Course',
		name: template.title,
		description: template.description,
		url,
		provider: {
			'@type': 'Organization',
			name: 'Kaiwa',
			url: baseUrl
		},
		educationalLevel: template.metadata?.cefrLevel || 'Beginner to Intermediate',
		inLanguage: 'en', // Course content/instructions are in English
		about: {
			'@type': 'Thing',
			name: `${languageName} Language`,
			description: `Learning ${languageName} language skills`
		},
		hasCourseInstance: {
			'@type': 'CourseInstance',
			courseMode: 'online',
			courseWorkload: `PT${template.metadata?.estimatedMinutesPerDay || 20}M`, // ISO 8601 duration
			duration: `P${totalDays}D` // ISO 8601 duration (e.g., P28D for 28 days)
		},
		timeRequired: `P${weeks}W`, // Total time in weeks
		numberOfCredits: 0, // Free course
		isAccessibleForFree: true,
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD',
			availability: 'https://schema.org/InStock'
		},
		datePublished: template.createdAt,
		teaches: template.metadata?.primarySkill
			? `${languageName} ${template.metadata.primarySkill}`
			: `${languageName} conversation skills`,
		keywords: [
			languageName,
			'language learning',
			'conversation practice',
			template.metadata?.primarySkill,
			template.metadata?.category
		]
			.filter(Boolean)
			.join(', ')
	};
}
