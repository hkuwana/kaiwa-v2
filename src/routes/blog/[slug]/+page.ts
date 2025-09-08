import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const { slug } = params;

	try {
		// Try to import the markdown file
		const module = await import(`../../../lib/blog/${slug}.md`);

		// Check if the post is published (default to true if not specified)
		const metadata = module.metadata || {};
		if (metadata.published === false) {
			throw error(404, `Blog post "${slug}" not found`);
		}

		return {
			content: module.default,
			title: metadata.title || slug,
			description: metadata.description || `Blog post about ${slug}`,
			excerpt: metadata.excerpt || '',
			author: metadata.author || 'Kaiwa Team',
			date: metadata.date || new Date().toISOString(),
			tags: metadata.tags || [],
			readTime: metadata.readTime || estimateReadTime(metadata.excerpt || ''),
			metadata: metadata
		};
	} catch (e: unknown) {
		console.error('Error loading blog post:', e);
		// If the file doesn't exist, throw a 404 error
		throw error(404, `Blog post "${slug}" not found`);
	}
};

// Simple read time estimation (words per minute average)
function estimateReadTime(text: string): string {
	const wordsPerMinute = 200;
	const words = text.split(' ').length;
	const minutes = Math.ceil(words / wordsPerMinute);
	return `${minutes} min read`;
}