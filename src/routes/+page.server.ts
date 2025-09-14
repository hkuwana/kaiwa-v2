import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	// Get user data from locals (set by hooks.server.ts)
	const user = locals.user || null;

	// SEO data optimized for family conversations and anxiety-free learning
	const seo = {
		title: 'Connect with Family in Japanese | Anxiety-Free AI Practice - Kaiwa',
		description:
			'Practice Japanese conversations with AI in a safe, judgment-free space. Connect with your family in their native language.',
		keywords:
			'Japanese conversation practice, family conversations Japanese, anxiety-free Japanese learning, AI Japanese tutor, speak Japanese confidently',
		author: 'Kaiwa',
		robots: 'index, follow',
		canonical: url.href,
		url: url.href,
		ogType: 'website',
		twitterCard: 'summary_large_image'
	};

	return {
		user,
		seo
	};
};
