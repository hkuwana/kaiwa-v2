import { error } from '@sveltejs/kit';
import { createDocsArticleJsonLd } from '$lib/seo/jsonld';

export const load = async ({ params, url }) => {
	const { slug } = params;

	try {
		// Try to import the markdown file
		const module = await import(`../../../lib/docs/${slug}.md`);

		const title = module.metadata?.title || slug;
		const description = module.metadata?.description || `Documentation for ${slug}`;
		const metadata = module.metadata || {};
		const jsonLd = createDocsArticleJsonLd(
			{
				slug,
				title,
				description,
				date: metadata.date,
				tags: metadata.tags
			},
			url.origin
		);

		return {
			content: module.default,
			title,
			description,
			metadata,
			jsonLd
		};
	} catch (e: unknown) {
		console.error('error with docs', e);
		// If the file doesn't exist, throw a 404 error

		throw error(404, `Document "${slug}" not found`);
	}
};
