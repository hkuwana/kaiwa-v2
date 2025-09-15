// 🔒 Development Page Guard
import type { PageLoad } from './$types';

export const prerender = false; // Don't prerender dev routes during build

export const load: PageLoad = async () => {
	 
	return {};
};
