<script lang="ts">
	// FlagIcon - Renders country flags using Iconify circle-flags
	// Uses SVG-based flags for consistent rendering across all platforms

	import Icon from '@iconify/svelte';

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

	// Build the icon name for circle-flags
	const iconName = $derived(`circle-flags:${normalizedCode}`);

	// Combine size and additional classes
	const combinedClass = $derived(`${size} shrink-0 rounded-full ${className}`.trim());
</script>

<Icon icon={iconName} class={combinedClass} aria-label={`${countryCode} flag`} />
