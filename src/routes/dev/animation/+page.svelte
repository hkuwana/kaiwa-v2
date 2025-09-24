<!-- src/routes/dev-animation/+page.svelte -->
<script lang="ts">
	import { onMount } from 'svelte';
	import { fade, fly, scale } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import AnimatedHeadphones from '$lib/features/audio/components/AnimatedHeadphones.svelte';

	let showHeadphones = $state(true);
	let showTooltip = $state(false);
	let animationSpeed = $state(1);
	let currentAnimation = $state<'pulse' | 'bounce' | 'ping' | 'spin' | 'wiggle'>('pulse');
	let isPlaying = $state(true);

	const animations = [
		{ id: 'pulse', name: 'Pulse', class: 'animate-pulse' },
		{ id: 'bounce', name: 'Bounce', class: 'animate-bounce' },
		{ id: 'ping', name: 'Ping', class: 'animate-ping' },
		{ id: 'spin', name: 'Spin', class: 'animate-spin' },
		{ id: 'wiggle', name: 'Wiggle', class: 'animate-wiggle' }
	];

	// Custom wiggle animation
	const wiggleKeyframes = `
		@keyframes wiggle {
			0%, 7% { transform: rotateZ(0); }
			15% { transform: rotateZ(-15deg); }
			20% { transform: rotateZ(10deg); }
			25% { transform: rotateZ(-10deg); }
			30% { transform: rotateZ(6deg); }
			35% { transform: rotateZ(-4deg); }
			40%, 100% { transform: rotateZ(0); }
		}
	`;

	onMount(() => {
		// Auto-rotate through animations
		const interval = setInterval(() => {
			if (isPlaying) {
				const currentIndex = animations.findIndex((a) => a.id === currentAnimation);
				const nextIndex = (currentIndex + 1) % animations.length;
				currentAnimation = animations[nextIndex].id as typeof currentAnimation;
			}
		}, 3000);

		return () => clearInterval(interval);
	});
</script>

<div class="min-h-screen bg-gradient-to-br from-base-100 via-base-200 to-base-300 p-8">
	<div class="mx-auto max-w-6xl">
		<!-- Header -->
		<div class="mb-12 text-center">
			<h1 class="mb-4 text-5xl font-bold text-primary">🎨 Animation Lab</h1>
			<p class="text-xl text-base-content/70">
				Interactive showcase of loading screen animations and transitions
			</p>
		</div>

		<!-- Controls Panel -->
		<div class="mb-8 rounded-2xl bg-base-100 p-6 shadow-xl">
			<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
				<!-- Animation Controls -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold">🎭 Animation Type</h3>
					<div class="flex flex-wrap gap-2">
						{#each animations as animation}
							<button
								class="btn btn-sm {currentAnimation === animation.id
									? 'btn-primary'
									: 'btn-outline'}"
								onclick={() => (currentAnimation = animation.id as typeof currentAnimation)}
							>
								{animation.name}
							</button>
						{/each}
					</div>
					<label class="flex items-center gap-2">
						<input type="checkbox" bind:checked={isPlaying} class="toggle toggle-primary" />
						<span>Auto-rotate animations</span>
					</label>
				</div>

				<!-- Speed Control -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold">⚡ Speed Control</h3>
					<div class="space-y-2">
						<input
							type="range"
							min="0.1"
							max="3"
							step="0.1"
							bind:value={animationSpeed}
							class="range range-primary"
						/>
						<div class="flex justify-between text-sm">
							<span>Slow</span>
							<span class="font-mono">{animationSpeed.toFixed(1)}x</span>
							<span>Fast</span>
						</div>
					</div>
				</div>

				<!-- Visibility Controls -->
				<div class="space-y-4">
					<h3 class="text-lg font-semibold">👁️ Visibility</h3>
					<div class="space-y-2">
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={showHeadphones} class="toggle toggle-primary" />
							<span>Show Headphones</span>
						</label>
						<label class="flex items-center gap-2">
							<input type="checkbox" bind:checked={showTooltip} class="toggle toggle-primary" />
							<span>Show Tooltip</span>
						</label>
					</div>
				</div>
			</div>
		</div>

		<!-- Animation Showcase -->
		<div class="grid grid-cols-1 gap-8 lg:grid-cols-2">
			<!-- Headphone Animation Demo -->
			<div class="rounded-2xl bg-base-100 p-8 shadow-xl">
				<h3 class="mb-6 text-center text-2xl font-bold">🎧 Headphone Animation</h3>

				{#if showHeadphones}
					<div class="flex justify-center" in:scale={{ duration: 500, delay: 200 }}>
						<AnimatedHeadphones
							animation={currentAnimation}
							size="lg"
							{showTooltip}
							{animationSpeed}
							interactive={true}
						/>
					</div>
				{/if}

				<div class="mt-6 text-center text-sm text-base-content/70">
					Current: <span class="font-mono font-semibold text-primary">{currentAnimation}</span>
				</div>
			</div>

			<!-- Loading States Demo -->
			<div class="rounded-2xl bg-base-100 p-8 shadow-xl">
				<h3 class="mb-6 text-center text-2xl font-bold">🔄 Loading States</h3>

				<div class="space-y-6">
					<!-- Connecting State -->
					<div class="rounded-lg border border-base-300 p-4">
						<h4 class="mb-3 font-semibold text-info">Connecting...</h4>
						<div class="flex items-center gap-4">
							<div class="loading loading-lg loading-ring text-info"></div>
							<div class="flex-1">
								<div class="h-2 w-full overflow-hidden rounded-full bg-base-300">
									<div
										class="h-full bg-info transition-all duration-1000 ease-out"
										style="width: 65%"
									></div>
								</div>
								<p class="mt-2 text-sm text-base-content/70">Step 2 of 3</p>
							</div>
						</div>
					</div>

					<!-- Connected State -->
					<div class="rounded-lg border border-base-300 p-4">
						<h4 class="mb-3 font-semibold text-success">Connected!</h4>
						<div class="flex items-center gap-4">
							<div class="flex h-8 w-8 items-center justify-center rounded-full bg-success/20">
								<svg class="h-5 w-5 text-success" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clip-rule="evenodd"
									></path>
								</svg>
							</div>
							<div class="flex-1">
								<p class="text-sm text-base-content/70">Ready to practice!</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Component Showcase -->
		<div class="mt-8 rounded-2xl bg-base-100 p-8 shadow-xl">
			<h3 class="mb-6 text-center text-2xl font-bold">🎯 Component Showcase</h3>

			<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
				<!-- Small Headphones -->
				<div class="text-center">
					<h4 class="mb-3 font-semibold">Small</h4>
					<AnimatedHeadphones animation="pulse" size="sm" showTooltip={false} interactive={false} />
				</div>

				<!-- Medium Headphones -->
				<div class="text-center">
					<h4 class="mb-3 font-semibold">Medium</h4>
					<AnimatedHeadphones
						animation="bounce"
						size="md"
						showTooltip={false}
						interactive={false}
					/>
				</div>

				<!-- Large Headphones -->
				<div class="text-center">
					<h4 class="mb-3 font-semibold">Large</h4>
					<AnimatedHeadphones animation="ping" size="lg" showTooltip={false} interactive={false} />
				</div>

				<!-- Extra Large Headphones -->
				<div class="text-center">
					<h4 class="mb-3 font-semibold">Extra Large</h4>
					<AnimatedHeadphones
						animation="wiggle"
						size="xl"
						showTooltip={false}
						interactive={false}
					/>
				</div>
			</div>
		</div>

		<!-- Transition Effects Demo -->
		<div class="mt-8 rounded-2xl bg-base-100 p-8 shadow-xl">
			<h3 class="mb-6 text-center text-2xl font-bold">✨ Transition Effects</h3>

			<div class="grid grid-cols-1 gap-6 md:grid-cols-3">
				<!-- Fade Transition -->
				<div class="text-center">
					<button
						class="btn mb-4 btn-outline btn-primary"
						onclick={() => (showHeadphones = !showHeadphones)}
					>
						Toggle Fade
					</button>
					{#if showHeadphones}
						<div
							class="mx-auto h-16 w-16 rounded-lg bg-primary/20"
							in:fade={{ duration: 500 }}
							out:fade={{ duration: 300 }}
						></div>
					{/if}
				</div>

				<!-- Fly Transition -->
				<div class="text-center">
					<button
						class="btn mb-4 btn-outline btn-secondary"
						onclick={() => (showTooltip = !showTooltip)}
					>
						Toggle Fly
					</button>
					{#if showTooltip}
						<div
							class="mx-auto h-16 w-16 rounded-lg bg-secondary/20"
							in:fly={{ y: 50, duration: 500, easing: quintOut }}
							out:fly={{ y: -50, duration: 300 }}
						></div>
					{/if}
				</div>

				<!-- Scale Transition -->
				<div class="text-center">
					<button
						class="btn mb-4 btn-outline btn-accent"
						onclick={() => (showHeadphones = !showHeadphones)}
					>
						Toggle Scale
					</button>
					{#if showHeadphones}
						<div
							class="mx-auto h-16 w-16 rounded-lg bg-accent/20"
							in:scale={{ duration: 500, start: 0.5 }}
							out:scale={{ duration: 300, start: 0.5 }}
						></div>
					{/if}
				</div>
			</div>
		</div>

		<!-- Code Preview -->
		<div class="mt-8 rounded-2xl bg-base-100 p-8 shadow-xl">
			<h3 class="mb-6 text-center text-2xl font-bold">💻 Code Preview</h3>
			<div class="overflow-x-auto rounded-lg bg-base-300 p-4">
				<pre class="text-sm"><code
						>// Current Animation: {currentAnimation}
// Speed: {animationSpeed.toFixed(1)}x
// Headphones Visible: {showHeadphones}
// Tooltip Visible: {showTooltip}

// Animation Classes:
{animations.map((a) => `  ${a.id}: "${a.class}"`).join('\n')}

// Component Usage:
&lt;AnimatedHeadphones
  animation="{currentAnimation}"
  size="lg"
  showTooltip={showTooltip}
  animationSpeed={animationSpeed}
  interactive={true}
/&gt;

// Available Props:
// - animation: 'pulse' | 'bounce' | 'ping' | 'spin' | 'wiggle'
// - size: 'sm' | 'md' | 'lg' | 'xl'
// - showTooltip: boolean
// - tooltipText: string
// - className: string
// - animationSpeed: number
// - interactive: boolean</code
					></pre>
			</div>
		</div>
	</div>
</div>
