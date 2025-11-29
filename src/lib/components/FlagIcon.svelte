<script lang="ts">
	// FlagIcon - Renders country flags using Iconify circle-flags
	// Uses SVG-based flags for consistent rendering across all platforms

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

	// Build the full class string with the icon
	const iconClass = $derived(
		`icon-[circle-flags--${normalizedCode}] ${size} shrink-0 rounded-full ${className}`.trim()
	);
</script>

<span class={iconClass} role="img" aria-label={`${countryCode} flag`}></span>
