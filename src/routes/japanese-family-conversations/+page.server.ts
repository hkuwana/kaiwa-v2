export const load = async ({ url }) => {
	// SEO data optimized for family conversation scenarios
	const seo = {
		title: 'Talk to Your Japanese Grandmother | Family Conversations - Kaiwa',
		description:
			'Connect with your Japanese family through heartfelt conversations. Practice in a safe space before those precious moments that matter.',
		keywords:
			'Japanese family conversations, talk to Japanese grandmother, connect with Japanese family, family Japanese practice, heartfelt Japanese conversations',
		author: 'Kaiwa',
		robots: 'index, follow',
		canonical: url.href,
		url: url.href,
		ogType: 'website',
		twitterCard: 'summary_large_image'
	};

	return {
		seo
	};
};
