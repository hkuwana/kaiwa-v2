import { error } from '@sveltejs/kit';

export const load = async ({ params }) => {
	const { slug } = params;

	try {
		// Try to import the markdown file
		const module = await import(`../../../lib/docs/${slug}.md`);

		return {
			content: module.default,
			title: module.metadata?.title || slug,
			description: module.metadata?.description || `Documentation for ${slug}`,
			metadata: module.metadata || {}
		};
	} catch (e: unknown) {
		console.error('error with docs', e);
		// If the file doesn't exist, throw a 404 error

		throw error(404, `Document "${slug}" not found`);
	}
};
