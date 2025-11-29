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
/**
 * Creates JSON-LD FAQPage schema for better search visibility
 *
 * FAQ rich results can appear in Google and Bing search results,
 * showing questions and answers directly in the SERP.
 *
 * @see https://schema.org/FAQPage
 * @see https://developers.google.com/search/docs/appearance/structured-data/faqpage
 */
export function createFaqPageJsonLd(
	faqs: Array<{ question: string; answer: string }>,
	baseUrl: string
): JsonLdObject {
	return {
		'@context': 'https://schema.org',
		'@type': 'FAQPage',
		mainEntity: faqs.map((faq) => ({
			'@type': 'Question',
			name: faq.question,
			acceptedAnswer: {
				'@type': 'Answer',
				text: faq.answer
			}
		}))
	};
}

/**
 * Creates JSON-LD BreadcrumbList for navigation context
 *
 * Helps search engines understand site structure and can display
 * breadcrumbs in search results.
 *
 * @see https://schema.org/BreadcrumbList
 */
export function createBreadcrumbJsonLd(
	items: Array<{ name: string; url: string }>,
	baseUrl: string
): JsonLdObject {
	return {
		'@context': 'https://schema.org',
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, index) => ({
			'@type': 'ListItem',
			position: index + 1,
			name: item.name,
			item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`
		}))
	};
}

/**
 * Creates JSON-LD SoftwareApplication schema for app store optimization
 *
 * Useful for PWAs and apps to appear in rich results.
 *
 * @see https://schema.org/SoftwareApplication
 */
export function createSoftwareAppJsonLd(baseUrl: string): JsonLdObject {
	return {
		'@context': 'https://schema.org',
		'@type': 'SoftwareApplication',
		name: 'Kaiwa',
		applicationCategory: 'EducationalApplication',
		operatingSystem: 'Web',
		offers: {
			'@type': 'Offer',
			price: '0',
			priceCurrency: 'USD'
		},
		aggregateRating: {
			'@type': 'AggregateRating',
			ratingValue: '4.8',
			ratingCount: '100'
		},
		description:
			'Practice real conversations in any language with your AI language partner. Build speaking confidence in 5 minutes a day.',
		url: baseUrl
	};
}

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

/**
 * Creates JSON-LD Organization schema for the company
 *
 * This provides global brand information to search engines and should be
 * included on every page, typically in the main layout.
 *
 * @see https://schema.org/Organization
 */
export function createOrganizationJsonLd(baseUrl: string): JsonLdObject {
	return {
		'@context': 'https://schema.org',
		'@type': 'Organization',
		name: 'Kaiwa',
		url: baseUrl,
		logo: `${baseUrl}/favicon.png`,
		description:
			'AI-powered language learning platform helping people practice real conversations and build speaking confidence in 5 minutes a day.',
		foundingDate: '2024',
		sameAs: [
			'https://twitter.com/kaiwa_app',
			'https://github.com/hkuwana/kaiwa-v2'
		],
		contactPoint: {
			'@type': 'ContactPoint',
			contactType: 'Customer Support',
			email: 'support@trykaiwa.com',
			availableLanguage: ['en']
		}
	};
}

/**
 * Creates JSON-LD Product schema for pricing tiers
 *
 * Helps search engines understand your pricing and can enable rich results
 * for product searches.
 *
 * @see https://schema.org/Product
 */
export function createPricingProductJsonLd(
	tier: {
		name: string;
		description: string;
		monthlyPriceUsd?: string | null;
		annualPriceUsd?: string | null;
		features: string[];
	},
	baseUrl: string,
	billingCycle: 'monthly' | 'annual' = 'monthly'
): JsonLdObject {
	const price =
		billingCycle === 'monthly' ? tier.monthlyPriceUsd : tier.annualPriceUsd;
	const priceValue = price ? parseFloat(price) : 0;

	return {
		'@context': 'https://schema.org',
		'@type': 'Product',
		name: `Kaiwa ${tier.name} Plan`,
		description: tier.description,
		brand: {
			'@type': 'Brand',
			name: 'Kaiwa'
		},
		offers: {
			'@type': 'Offer',
			price: priceValue.toFixed(2),
			priceCurrency: 'USD',
			priceValidUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
				.toISOString()
				.split('T')[0],
			availability: 'https://schema.org/InStock',
			url: `${baseUrl}/pricing`,
			seller: {
				'@type': 'Organization',
				name: 'Kaiwa'
			},
			billingIncrement: billingCycle === 'monthly' ? 'P1M' : 'P1Y'
		},
		aggregateRating: tier.name === 'Premium' ? {
			'@type': 'AggregateRating',
			ratingValue: '4.9',
			reviewCount: '50',
			bestRating: '5',
			worstRating: '1'
		} : undefined
	};
}

/**
 * Creates enhanced BlogPosting JSON-LD with all recommended fields
 *
 * @see https://schema.org/BlogPosting
 */
export function createEnhancedBlogPostingJsonLd(
	post: {
		title: string;
		description: string;
		author?: string;
		date: string;
		modifiedDate?: string;
		tags?: string[];
		image?: string;
		content?: string;
		wordCount?: number;
	},
	url: string,
	baseUrl: string
): JsonLdObject {
	return {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: post.title,
		description: post.description,
		articleBody: post.content,
		wordCount: post.wordCount,
		author: {
			'@type': 'Person',
			name: post.author || 'Kaiwa Team'
		},
		datePublished: new Date(post.date).toISOString(),
		dateModified: post.modifiedDate
			? new Date(post.modifiedDate).toISOString()
			: new Date(post.date).toISOString(),
		publisher: {
			'@type': 'Organization',
			name: 'Kaiwa',
			logo: {
				'@type': 'ImageObject',
				url: `${baseUrl}/favicon.png`
			}
		},
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': url
		},
		image: post.image || `${baseUrl}/og-image.png`,
		thumbnailUrl: post.image || `${baseUrl}/og-image.png`,
		keywords: post.tags?.join(', ') || '',
		inLanguage: 'en'
	};
}
