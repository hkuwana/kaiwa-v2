const blogPosts = import.meta.glob('../../lib/blog/*.md', { eager: true });

export const load = async ({ parent }) => {
	interface BlogModuleMeta {
		metadata?: {
			title?: string;
			description?: string;
			excerpt?: string;
			author?: string;
			date?: string;
			tags?: string[];
			published?: boolean;
			readTime?: string;
		};
	}
	const { seo } = await parent();
	const posts = Object.entries(blogPosts)
		.map(([path, module]) => {
			const filename = path.split('/').pop()?.replace('.md', '') || '';
			const metadata = (module as BlogModuleMeta).metadata || {};

			return {
				slug: filename,
				title: metadata.title || filename.replace(/_/g, ' ').replace(/-/g, ' '),
				description: metadata.description || `Blog post about ${filename}`,
				excerpt: metadata.excerpt || '',
				author: metadata.author || 'Kaiwa Team',
				date: metadata.date || new Date().toISOString(),
				tags: metadata.tags || [],
				published: metadata.published !== false,
				path: `/blog/${filename}`,
				readTime: metadata.readTime || estimateReadTime(metadata.excerpt || '')
			};
		})
		.filter((post) => post.published)
		.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

	const blogIndexSeo = {
		title: 'Kaiwa Blog - Language Learning Tips and Insights',
		description:
			'Explore articles on language learning, conversation practice, and cultural insights from the Kaiwa team.'
	};

	return {
		posts,
		seo: { ...seo, ...blogIndexSeo }
	};
};

function estimateReadTime(text: string): string {
	const wordsPerMinute = 200;
	const words = text.split(' ').length;
	const minutes = Math.ceil(words / wordsPerMinute);
	return `${minutes} min read`;
}
