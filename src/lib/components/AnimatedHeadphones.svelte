<!-- src/lib/components/AnimatedHeadphones.svelte -->
<script lang="ts">
	import { fade, fly, scale } from 'svelte/transition';

	interface Props {
		animation?: 'pulse' | 'bounce' | 'ping' | 'spin' | 'wiggle';
		size?: 'sm' | 'md' | 'lg' | 'xl';
		showTooltip?: boolean;
		tooltipText?: string;
		className?: string;
		animationSpeed?: number;
		interactive?: boolean;
	}

	const {
		animation = 'wiggle',
		size = 'md',
		showTooltip = false,
		tooltipText = 'Use earphones for best experience',
		className = '',
		animationSpeed = 1,
		interactive = true
	}: Props = $props();

	// Size mappings
	const sizeClasses = {
		sm: 'text-2xl',
		md: 'text-4xl',
		lg: 'text-6xl',
		xl: 'text-8xl'
	} as const;

	// Get current size and animation classes
	const sizeClass = $derived(sizeClasses[size as keyof typeof sizeClasses]);
	const animationDuration = $derived(`${3 / animationSpeed}s`);
</script>

<div class="group relative {className}">
	<!-- Animated headphone icon -->
	<div class="relative z-20">
		<div
			class="{sizeClass} text-primary drop-shadow-lg transition-all duration-500 {interactive
				? 'group-hover:scale-110'
				: ''}"
			style="animation-duration: {animationDuration};"
			class:animate-pulse={animation === 'pulse'}
			class:animate-bounce={animation === 'bounce'}
			class:animate-ping={animation === 'ping'}
			class:animate-spin={animation === 'spin'}
			class:animate-wiggle={animation === 'wiggle'}
		>
			🎧
		</div>
	</div>

	<!-- Floating hint text -->
	{#if showTooltip}
		<div
			class="absolute -bottom-8 left-1/2 -translate-x-1/2 transform"
			in:fly={{ y: 20, duration: 300 }}
			out:fly={{ y: -20, duration: 200 }}
		>
			<div
				class="rounded-full bg-primary/90 px-3 py-1 text-xs whitespace-nowrap text-primary-content backdrop-blur-sm"
			>
				{tooltipText}
			</div>
			<!-- Arrow pointing up -->
			<div
				class="absolute -top-1 left-1/2 h-0 w-0 -translate-x-1/2 transform border-r-4 border-b-4 border-l-4 border-transparent border-b-primary/90"
			></div>
		</div>
	{/if}
</div>

<style>
	/* Custom wiggle animation */
	@keyframes wiggle {
		0%,
		7% {
			transform: rotateZ(0);
		}
		15% {
			transform: rotateZ(-15deg);
		}
		20% {
			transform: rotateZ(10deg);
		}
		25% {
			transform: rotateZ(-10deg);
		}
		30% {
			transform: rotateZ(6deg);
		}
		35% {
			transform: rotateZ(-4deg);
		}
		40%,
		100% {
			transform: rotateZ(0);
		}
	}

	.animate-wiggle {
		animation: wiggle 2s ease-in-out infinite;
	}
</style>
