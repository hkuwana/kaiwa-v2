import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-node';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import rehypeSlug from 'rehype-slug';
import remarkGfm from 'remark-gfm';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations
	// for more information about preprocessors
	preprocess: [
		vitePreprocess(),
		mdsvex({
			extensions: ['.md', '.svx'],
			remarkPlugins: [remarkGfm],
			rehypePlugins: [rehypeSlug],
			highlight: false // Disable mdsvex's internal syntax highlighting
		})
	],
	onwarn: (warning, handler) => {
		// Suppress accessibility warnings during build
		if (warning.code.startsWith('a11y_')) return;
		// Suppress non_reactive_update warnings for SvelteMap/SvelteSet (they're inherently reactive)
		if (warning.code === 'non_reactive_update') return;
		handler(warning);
	},
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
		// Configure for PostHog session replay with SSR
		paths: {
			relative: false
		}
	},
	extensions: ['.svelte', '.md', '.svx']
};

export default config;
