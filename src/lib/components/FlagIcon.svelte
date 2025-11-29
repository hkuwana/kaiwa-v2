<script lang="ts">
	// FlagIcon - Renders country flags using Iconify circle-flags
	// Uses inline SVGs for consistent rendering across all platforms

	// Import the circle-flags icon data
	import iconData from '@iconify-json/circle-flags/icons.json';

	interface Props {
		/** ISO 3166-1 alpha-2 country code (e.g., 'jp', 'us', 'gb') */
		countryCode: string;
		/** Size class - can be Tailwind size classes like 'h-5 w-5' or 'h-8 w-8' */
		size?: string;
		/** Additional CSS classes */
		class?: string;
	}

	let { countryCode, size = 'h-5 w-5', class: className = '' }: Props = $props();

	// Normalize country code to lowercase for Iconify
	const normalizedCode = $derived(countryCode?.toLowerCase() || 'xx');

	// Get the SVG body for the country code
	const iconBody = $derived(
		(iconData.icons as Record<string, { body: string }>)[normalizedCode]?.body || ''
	);

	// Combine size and additional classes
	const combinedClass = $derived(`${size} shrink-0 ${className}`.trim());
</script>

{#if iconBody}
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 512 512"
		class={combinedClass}
		role="img"
		aria-label={`${countryCode} flag`}
	>
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{@html iconBody}
	</svg>
{:else}
	<!-- Fallback for unknown country codes -->
	<span class="{combinedClass} flex items-center justify-center rounded-full bg-base-300 text-xs">
		{countryCode?.toUpperCase().slice(0, 2) || '??'}
	</span>
{/if}
