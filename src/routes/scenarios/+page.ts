export const load = async ({ parent, data }) => {
	const { seo, ...parentData } = await parent();

	return {
		...parentData,
		...data,
		seo: {
			...seo,
			title: 'Practice Scenarios - Flight Simulator for the Heart | Kaiwa',
			description:
				'Explore all conversation scenarios on Kaiwa. From building confidence to high-stakes family dinners, practice the conversations that matter most in a safe, judgment-free space.',
			keywords:
				'conversation scenarios, language practice scenarios, relationship conversations, family dinner practice, first date practice, emotional conversations, cross-cultural communication',
			ogType: 'website'
		}
	};
};
