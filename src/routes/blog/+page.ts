import type { PageLoad } from './$types';

// Import all markdown files from the blog directory
const blogPosts = import.meta.glob('../../lib/blog/*.md', { eager: true });

export const load: PageLoad = () => {
	// Convert the glob results to a more usable format
	const posts = Object.entries(blogPosts)
		.map(([path, module]) => {
			const filename = path.split('/').pop()?.replace('.md', '') || '';
			const metadata = (module as any).metadata || {};

			return {
				slug: filename,
				title: metadata.title || filename.replace(/_/g, ' ').replace(/-/g, ' '),
				description: metadata.description || `Blog post about ${filename}`,
				excerpt: metadata.excerpt || '',
				author: metadata.author || 'Kaiwa Team',
				date: metadata.date || new Date().toISOString(),
				tags: metadata.tags || [],
				published: metadata.published !== false, // Default to true unless explicitly false
				path: `/blog/${filename}`,
				readTime: metadata.readTime || estimateReadTime(metadata.excerpt || '')
			};
		})
		// Filter out unpublished posts in production
		.filter((post) => post.published)
		// Sort by date, newest first
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	return {
		posts
	};
};

// Simple read time estimation (words per minute average)
function estimateReadTime(text: string): string {
	const wordsPerMinute = 200;
	const words = text.split(' ').length;
	const minutes = Math.ceil(words / wordsPerMinute);
	return `${minutes} min read`;
}
