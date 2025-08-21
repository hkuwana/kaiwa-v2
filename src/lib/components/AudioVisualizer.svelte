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
	 * The scale will range from 1 (no sound) to 1.5 (max sound).
	 */
	let scale = $derived(1 + audioLevel * 0.5);

	/**
	 * The opacity of the outer glow will range from 0.2 (no sound) to 0.7 (max sound).
	 * This ensures the glow is subtly visible even at rest.
	 */
	let opacity = $derived(0.2 + audioLevel * 0.5);
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
	  - `bg-accent`: Uses the daisyUI accent color. You can change this to `bg-primary`, `bg-secondary`, etc.
	  - `transition-transform`, `duration-150`, `ease-out`: These Tailwind classes create the smooth animation.
		When the `scale` or `opacity` value changes, the browser will smoothly transition the transform and opacity properties.
	  - The `style` attribute applies the reactive scale and opacity calculated with `$derived`.
	-->
	<div
		class="absolute h-full w-full rounded-full bg-accent transition-transform duration-150 ease-out"
		style:transform="scale({scale})"
		style:opacity
	></div>

	<!-- Inner Circle (The Core) -->
	<!-- 
	  - This circle remains static and provides a solid center for the visualizer.
	  - `bg-accent/80`: Uses the accent color with 80% opacity for a slightly softer look.
	-->
	<div class="relative h-12 w-12 rounded-full bg-accent/80"></div>
</div>
