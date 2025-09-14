import type { PageLoad } from './$types';

// Import all markdown files from the docs directory
const docs = import.meta.glob('../../lib/docs/*.md', { eager: true });

export const load: PageLoad = () => {
	// Convert the glob results to a more usable format
	interface DocModule {
		metadata?: { title?: string; description?: string };
	}
	const docList = Object.entries(docs).map(([path, module]) => {
		const filename = path.split('/').pop()?.replace('.md', '') || '';
		return {
			slug: filename,
			title:
				(module as unknown as DocModule).metadata?.title ||
				filename.replace(/_/g, ' ').replace(/-/g, ' '),
			description:
				(module as unknown as DocModule).metadata?.description || `Documentation for ${filename}`,
			path: `/docs/${filename}`
		};
	});

	// Sort by title
	docList.sort((a, b) => a.title.localeCompare(b.title));

	return {
		docs: docList
	};
};
