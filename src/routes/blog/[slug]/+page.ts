import { error } from '@sveltejs/kit';

export const load = async ({ params, data }) => {
	const { slug } = params;

	try {
		const module = await import(`../../../lib/blog/${slug}.md`);
		const metadata = module.metadata || {};

		if (metadata.published === false) {
			throw error(404, `Blog post "${slug}" not found`);
		}

		const postSeo = {
			title: `${metadata.title} | Kaiwa Blog`,
			description: metadata.description,
			ogType: 'article',
			article: {
				published_time: metadata.date,
				authors: [metadata.author || 'Kaiwa Team'],
				tags: metadata.tags || []
			}
		};

		return {
			content: module.default,
			metadata,
			seo: { ...data.seo, ...postSeo }
		};
	} catch (e: unknown) {
		console.error('Error loading blog post:', e);
		throw error(404, `Blog post "${slug}" not found`);
	}
};
