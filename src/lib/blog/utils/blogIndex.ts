import type { BlogPost, BlogMetadata } from './blogProcessor.js';

export async function getAllBlogPosts(): Promise<BlogPost[]> {
	const modules = import.meta.glob('../posts/*.md');
	const posts: BlogPost[] = [];

	for (const [path, resolver] of Object.entries(modules)) {
		const slug = path.split('/').pop()?.replace('.md', '') || '';
		try {
			const module = (await resolver()) as { default: any; metadata: BlogMetadata };

			if (module.metadata?.published !== false) {
				posts.push({
					slug,
					metadata: {
						...module.metadata,
						slug
					},
					content: module.default
				});
			}
		} catch (error) {
			console.error(`Error loading blog post ${slug}:`, error);
		}
	}

	// Sort by date (newest first)
	return posts.sort(
		(a, b) => new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime()
	);
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
	try {
		const module = await import(`../posts/${slug}.md`);

		if (module.metadata?.published === false) {
			return null;
		}

		return {
			slug,
			metadata: {
				...module.metadata,
				slug
			},
			content: module.default
		};
	} catch (error) {
		console.error(`Error loading blog post ${slug}:`, error);
		return null;
	}
}

export function paginatePosts(posts: BlogPost[], page: number, postsPerPage: number = 10) {
	const startIndex = (page - 1) * postsPerPage;
	const endIndex = startIndex + postsPerPage;

	return {
		posts: posts.slice(startIndex, endIndex),
		totalPages: Math.ceil(posts.length / postsPerPage),
		currentPage: page,
		hasNextPage: endIndex < posts.length,
		hasPrevPage: page > 1
	};
}

export function getRelatedPosts(
	currentPost: BlogPost,
	allPosts: BlogPost[],
	limit: number = 3
): BlogPost[] {
	const currentTags = currentPost.metadata.tags || [];

	if (currentTags.length === 0) {
		return allPosts.filter((post) => post.slug !== currentPost.slug).slice(0, limit);
	}

	// Calculate relevance score based on shared tags
	const scoredPosts = allPosts
		.filter((post) => post.slug !== currentPost.slug)
		.map((post) => {
			const postTags = post.metadata.tags || [];
			const sharedTags = currentTags.filter((tag) => postTags.includes(tag));
			return {
				post,
				score: sharedTags.length
			};
		})
		.sort((a, b) => b.score - a.score);

	return scoredPosts.slice(0, limit).map((item) => item.post);
}

export function generateRssFeed(posts: BlogPost[]): string {
	const baseUrl = 'https://trykaiwa.com';
	const pubDate = new Date().toUTCString();

	const items = posts
		.slice(0, 20) // Latest 20 posts
		.map(
			(post) => `
		<item>
			<title><![CDATA[${post.metadata.title}]]></title>
			<description><![CDATA[${post.metadata.description}]]></description>
			<link>${baseUrl}/blog/${post.slug}</link>
			<guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
			<pubDate>${new Date(post.metadata.date).toUTCString()}</pubDate>
			${post.metadata.author ? `<author>noreply@trykaiwa.com (${post.metadata.author})</author>` : ''}
			${post.metadata.tags?.map((tag) => `<category>${tag}</category>`).join('') || ''}
		</item>
	`
		)
		.join('');

	return `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
	<channel>
		<title>Kaiwa Blog</title>
		<description>Insights on conversation practice, language learning, and AI-powered education</description>
		<link>${baseUrl}/blog</link>
		<atom:link href="${baseUrl}/blog/rss.xml" rel="self" type="application/rss+xml" />
		<language>en-US</language>
		<pubDate>${pubDate}</pubDate>
		<lastBuildDate>${pubDate}</lastBuildDate>
		<generator>SvelteKit</generator>
		${items}
	</channel>
</rss>`;
}
