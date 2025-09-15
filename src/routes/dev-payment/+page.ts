// Development page - access controlled by hooks.server.ts
import type { PageLoad } from './$types';

export const prerender = false;

export const load: PageLoad = async () => {
	return {};
};
