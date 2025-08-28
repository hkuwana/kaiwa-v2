// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			user: import('$lib/server/auth').SessionValidationResult['user'];
			session: import('$lib/server/auth').SessionValidationResult['session'];
			guestId: string | null;
			userContext?: import('$lib/server/auth').UserContext; // Enhanced context for orchestrator
		}
		// interface Error {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

// Declare markdown modules for mdsvex
declare module '*.md' {
	import type { SvelteComponent } from 'svelte';

	export default class Comp extends SvelteComponent<{
		title?: string;
		description?: string;
		author?: string;
		date?: string;
		tags?: string[];
		layout?: string;
		metadata?: Record<string, unknown>;
	}> {}

	export const metadata: Record<string, unknown>;
}

declare module '*.svx' {
	import type { SvelteComponent } from 'svelte';

	export default class Comp extends SvelteComponent<{
		title?: string;
		description?: string;
		author?: string;
		date?: string;
		tags?: string[];
		layout?: string;
		metadata?: Record<string, unknown>;
	}> {}

	export const metadata: Record<string, unknown>;
}

export {};
