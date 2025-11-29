export interface BlogMetadata {
	title: string;
	description: string;
	excerpt?: string;
	author?: string;
	date: string;
	tags?: string[];
	published?: boolean;
	readTime?: string;
	slug?: string;
}

export interface BlogPost {
	slug: string;
	metadata: BlogMetadata;
	content: () => string;
}

export function calculateReadingTime(content: string): string {
	const wordsPerMinute = 200;
	const words = content.split(/\s+/).length;
	const minutes = Math.ceil(words / wordsPerMinute);
	return `${minutes} min read`;
}

export function generateTableOfContents(
	content: string
): Array<{ title: string; anchor: string; level: number }> {
	const headingRegex = /^(#{1,6})\s+(.+)$/gm;
	const toc: Array<{ title: string; anchor: string; level: number }> = [];
	let match;

	while ((match = headingRegex.exec(content)) !== null) {
		const level = match[1].length;
		const title = match[2].trim();
		const anchor = title
			.toLowerCase()
			.replace(/[^\w\s-]/g, '')
			.replace(/\s+/g, '-');

		toc.push({ title, anchor, level });
	}

	return toc;
}

export function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return date.toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	});
}

export function generateSlug(title: string): string {
	return title
		.toLowerCase()
		.replace(/[^\w\s-]/g, '')
		.replace(/\s+/g, '-')
		.trim();
}

export function createBlogJsonLd(
	metadata: BlogMetadata,
	url: string,
	options?: {
		content?: string;
		wordCount?: number;
		modifiedDate?: string;
		image?: string;
	}
) {
	return {
		'@context': 'https://schema.org',
		'@type': 'BlogPosting',
		headline: metadata.title,
		description: metadata.description,
		articleBody: options?.content || metadata.excerpt,
		wordCount: options?.wordCount,
		author: {
			'@type': 'Person',
			name: metadata.author ?? 'Kaiwa Team'
		},
		datePublished: new Date(metadata.date).toISOString(),
		dateModified: options?.modifiedDate
			? new Date(options.modifiedDate).toISOString()
			: new Date(metadata.date).toISOString(),
		publisher: {
			'@type': 'Organization',
			name: 'Kaiwa',
			logo: {
				'@type': 'ImageObject',
				url: 'https://trykaiwa.com/favicon.png'
			}
		},
		mainEntityOfPage: {
			'@type': 'WebPage',
			'@id': url
		},
		image: options?.image || 'https://trykaiwa.com/og-image.png',
		thumbnailUrl: options?.image || 'https://trykaiwa.com/og-image.png',
		keywords: metadata.tags?.join(', ') || '',
		inLanguage: 'en'
	};
}
