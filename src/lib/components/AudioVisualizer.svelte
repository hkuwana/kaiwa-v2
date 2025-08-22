<script lang="ts">
	/**
	 * AudioVisualizer.svelte
	 * A Svelte 5 component that visualizes audio levels as a pulsing circle.
	 * It uses Tailwind CSS and daisyUI for styling.
	 */

	interface Props {
		audioLevel?: number;
	}

	// --- PROPS ---
	/**
	 * The audio level, expected to be a number between 0 (silence) and 1 (max volume).
	 * @type {number}
	 */
	let { audioLevel = 0 } = $props();

	// --- REACTIVE VALUES (SVELTE 5 RUNES) ---
	/**
	 * We use the `$derived` rune to compute values that depend on other reactive values (like props).
	 * This is more efficient than using `$:`, as Svelte 5 can track dependencies with more precision.
	 * The scale will range from 1 (no sound) to 2 (max sound) for more dramatic effect.
	 */
	let scale = $derived(1 + audioLevel);

	/**
	 * The opacity of the outer glow will range from 0.1 (no sound) to 0.9 (max sound).
	 * This ensures the glow is more visible and responsive.
	 */
	let opacity = $derived(0.1 + audioLevel * 0.8);

	/**
	 * The blur radius for the glow effect, making it more dynamic.
	 */
	let blurRadius = $derived(2 + audioLevel * 8);

	/**
	 * The color intensity based on audio level.
	 */
	let colorIntensity = $derived(audioLevel > 0.5 ? 'bg-accent-focus' : 'bg-accent');
</script>

<!-- 
	The structure consists of two concentric circles inside a container.
	- The container centers the circles.
	- The inner circle is a static, solid shape.
	- The outer circle is the "glow" that scales and fades based on the audio level.
  -->
<div class="relative flex h-24 w-24 items-center justify-center">
	<!-- Outer Circle (The Pulse/Glow) -->
	<!-- 
	  - Dynamic color class based on audio level
	  - `transition-all duration-75`: Faster, smoother animation for all properties
	  - The `style` attribute applies the reactive scale, opacity, and blur calculated with `$derived`.
	-->
	<div
		class="absolute h-full w-full rounded-full transition-all duration-75 ease-out {colorIntensity}"
		style:transform="scale({scale})"
		style:opacity
		style:filter="blur({blurRadius}px)"
	></div>

	<!-- Inner Circle (The Core) -->
	<!-- 
	  - This circle remains static and provides a solid center for the visualizer.
	  - Dynamic color based on audio level for more visual feedback.
	-->
	<div class="relative h-12 w-12 rounded-full {colorIntensity}/80"></div>

	<!-- Audio Level Indicator Text (for debugging) -->
	{#if audioLevel > 0}
		<div class="absolute -bottom-8 text-xs text-base-content/60">
			{Math.round(audioLevel * 100)}%
		</div>
	{/if}
</div>
