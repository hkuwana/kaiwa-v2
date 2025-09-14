// 🔒 Development Page Guard
import { guardDevelopmentRoute } from '$lib/guards/dev.guard';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	guardDevelopmentRoute();
	return {};
};
