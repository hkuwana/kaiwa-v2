import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {
		meta: {
			title: 'Privacy Policy - Kaiwa | Data Protection & Analytics',
			description:
				'Learn how Kaiwa collects, uses, and protects your data for language learning. Understand our data practices, PostHog analytics, and privacy protections.'
		}
	};
};

// Enable prerendering for this page
export const prerender = true;
