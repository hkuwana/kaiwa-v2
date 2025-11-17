<script lang="ts">
	import OnboardingLifecycle from '$lib/features/scenarios/components/OnboardingLifecycle.svelte';

	import { goto } from '$app/navigation';

	// State for testing different scenarios
	let completedSteps = $state<string[]>([]);
	let showRetentionHints = $state(true);
	let selectedVariant = $state<'mobile' | 'desktop' | 'compact'>('desktop');

	// Test scenarios
	const testScenarios = [
		{
			name: 'Guest User - Just Started',
			path: '/dev/lifecycle',
			completed: [],
			description: 'New user who just landed on the homepage'
		},
		{
			name: 'In Conversation',
			path: '/dev/lifecycle?simulate=conversation',
			completed: ['setup'],
			description: 'User actively practicing conversation'
		},
		{
			name: 'Viewing Analysis',
			path: '/dev/lifecycle?simulate=analysis',
			completed: ['setup', 'conversation'],
			description: 'User viewing their personalized results'
		},
		{
			name: 'Completed Journey',
			path: '/dev/lifecycle?simulate=analysis',
			completed: ['setup', 'conversation', 'analysis'],
			description: 'User has completed the full onboarding cycle'
		}
	];

	function applyScenario(scenario: (typeof testScenarios)[0]) {
		goto(scenario.path);
		completedSteps = [...scenario.completed];
	}

	function toggleStep(stepId: string) {
		if (completedSteps.includes(stepId)) {
			completedSteps = completedSteps.filter((id) => id !== stepId);
		} else {
			completedSteps = [...completedSteps, stepId];
		}
	}
</script>

<svelte:head>
	<title>Onboarding Lifecycle Testing - Kaiwa Dev</title>
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<!-- Header -->
	<div class="mb-8">
		<h1 class="mb-4 text-4xl font-bold">🔄 Onboarding Lifecycle</h1>
		<p class="text-lg text-base-content/70">
			Test and preview the onboarding progress component with different scenarios and variants.
		</p>
	</div>

	<!-- Controls -->
	<div class="mb-8 grid gap-6 lg:grid-cols-3">
		<!-- Test Scenarios -->
		<div class="card bg-base-100 shadow-lg">
			<div class="card-body">
				<h3 class="card-title text-lg">🎭 Test Scenarios</h3>
				<div class="space-y-2">
					{#each testScenarios as scenario (scenario.name)}
						<button
							class="btn btn-block justify-start text-left btn-sm"
							class:btn-primary={JSON.stringify(completedSteps) ===
								JSON.stringify(scenario.completed)}
							onclick={() => applyScenario(scenario)}
						>
							<div class="text-left">
								<div class="font-semibold">{scenario.name}</div>
								<div class="text-xs opacity-70">{scenario.description}</div>
							</div>
						</button>
					{/each}
				</div>
			</div>
		</div>

		<!-- Manual Controls -->
		<div class="card bg-base-100 shadow-lg">
			<div class="card-body">
				<h3 class="card-title text-lg">⚙️ Manual Controls</h3>

				<!-- Path Info -->
				<div class="form-control">
					<div class="label">
						<span class="label-text">Current Path (Auto-detected)</span>
					</div>
					<div class="rounded bg-base-200 p-2 text-sm">
						Uses: <code>$page.url.pathname</code>
					</div>
				</div>

				<!-- Completed Steps -->
				<div class="form-control">
					<div class="label">
						<span class="label-text">Completed Steps</span>
					</div>
					<div class="space-y-1">
						{#each ['setup', 'conversation', 'analysis'] as stepId (stepId)}
							<label class="label cursor-pointer justify-start">
								<input
									type="checkbox"
									class="checkbox mr-2 checkbox-sm"
									checked={completedSteps.includes(stepId)}
									onchange={() => toggleStep(stepId)}
								/>
								<span class="label-text capitalize">{stepId}</span>
							</label>
						{/each}
					</div>
				</div>

				<!-- Options -->
				<div class="form-control">
					<label class="label cursor-pointer">
						<span class="label-text">Show Retention Hints</span>
						<input type="checkbox" class="toggle toggle-sm" bind:checked={showRetentionHints} />
					</label>
				</div>
			</div>
		</div>

		<!-- Variant Selector -->
		<div class="card bg-base-100 shadow-lg">
			<div class="card-body">
				<h3 class="card-title text-lg">🎨 Variants</h3>
				<div class="space-y-2">
					{#each ['desktop', 'mobile', 'compact'] as variant (variant)}
						<label class="label cursor-pointer justify-start">
							<input
								type="radio"
								name="variant"
								class="radio mr-2 radio-sm"
								value={variant}
								bind:group={selectedVariant}
							/>
							<div class="flex flex-col">
								<span class="label-text capitalize">{variant}</span>
								{#if variant === 'compact'}
									<span class="text-xs text-base-content/60">Auto-adapts to route</span>
								{/if}
							</div>
						</label>
					{/each}
				</div>

				<!-- Current State Display -->
				<div class="mt-4 rounded-lg bg-base-200 p-3">
					<div class="space-y-1 text-sm">
						<div>
							<strong>Completed:</strong>
							{completedSteps.length ? completedSteps.join(', ') : 'None'}
						</div>
						<div><strong>Variant:</strong> {selectedVariant}</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Component Preview -->
	<div class="space-y-8">
		<!-- Detailed Preview -->
		{#if selectedVariant === 'desktop'}
			<section>
				<h2 class="mb-4 text-2xl font-bold">📋 Detailed View</h2>
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<OnboardingLifecycle variant="desktop" />
					</div>
				</div>
			</section>
		{/if}

		<!-- Minimal Preview -->
		{#if selectedVariant === 'mobile'}
			<section>
				<h2 class="mb-4 text-2xl font-bold">📊 Minimal View</h2>
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<div class="mx-auto max-w-md">
							<OnboardingLifecycle variant="mobile" />
						</div>
					</div>
				</div>
			</section>
		{/if}

		<!-- Floating Preview -->
		{#if selectedVariant === 'compact'}
			<section>
				<h2 class="mb-4 text-2xl font-bold">📦 Compact Layout</h2>
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<div class="alert alert-info">
							<svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
									clip-rule="evenodd"
								></path>
							</svg>
							<div>
								<h4 class="font-semibold">Compact Layout Active</h4>
								<p class="text-sm">
									The compact layout shows just symbols and minimal text. Perfect for header
									navigation or limited space.
								</p>
							</div>
						</div>

						<!-- Demo content to show floating behavior -->
						<div class="mt-6 space-y-4">
							<div class="flex h-32 items-center justify-center rounded-lg bg-base-200">
								<span class="text-base-content/50">Demo content area 1</span>
							</div>
							<div class="flex h-32 items-center justify-center rounded-lg bg-base-200">
								<span class="text-base-content/50">Demo content area 2</span>
							</div>
							<div class="flex h-32 items-center justify-center rounded-lg bg-base-200">
								<span class="text-base-content/50">Demo content area 3</span>
							</div>
						</div>
					</div>
				</div>
			</section>
		{/if}

		<!-- Implementation Guide -->
		<section>
			<h2 class="mb-4 text-2xl font-bold">🛠️ Implementation Guide</h2>
			<div class="grid gap-6 lg:grid-cols-2">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h3 class="card-title">📁 Component Usage</h3>
						<div class="mockup-code text-sm">
							<pre><code
									>&lt;script&gt;
  import OnboardingLifecycle from '$lib/features/scenarios/components/OnboardingLifecycle.svelte';
&lt;/script&gt;

&lt;!-- Smart variant (recommended) --&gt;
&lt;OnboardingLifecycle
  completedSteps={`["setup"]`}
  showRetentionHints={`true`}
  variant="smart"
/&gt;

&lt;!-- Manual control --&gt;
&lt;OnboardingLifecycle
  completedSteps={`["setup"]`}
  variant="floating"
  hideOnRoutes={`["/conversation"]`}
/&gt;</code
								></pre>
						</div>
					</div>
				</div>

				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h3 class="card-title">🎯 Integration Ideas</h3>
						<div class="space-y-3 text-sm">
							<div>
								<strong>Smart Variant:</strong> ✨ Auto-adapts to routes (recommended for production)
							</div>
							<div>
								<strong>Home Page:</strong> Minimal variant to set expectations without overwhelming
							</div>
							<div>
								<strong>Analysis Pages:</strong> Floating widget for contextual encouragement
							</div>
							<div>
								<strong>Conversations:</strong> Hidden completely to avoid distractions
							</div>
							<div>
								<strong>Mobile Optimized:</strong> Responsive sizing and positioning
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Retention Strategies -->
		<section>
			<h2 class="mb-4 text-2xl font-bold">🎣 Retention Strategy Features</h2>
			<div class="grid gap-4 lg:grid-cols-3">
				<div class="card border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5">
					<div class="card-body">
						<h4 class="card-title text-primary">💡 Expectation Setting</h4>
						<ul class="space-y-1 text-sm">
							<li>• Clear progress indicators</li>
							<li>• Step descriptions</li>
							<li>• Time estimates</li>
							<li>• "What's next" previews</li>
						</ul>
					</div>
				</div>

				<div
					class="card border border-secondary/20 bg-gradient-to-br from-secondary/10 to-secondary/5"
				>
					<div class="card-body">
						<h4 class="card-title text-secondary">🎯 Engagement Hooks</h4>
						<ul class="space-y-1 text-sm">
							<li>• Contextual hints</li>
							<li>• Progress animations</li>
							<li>• Achievement feedback</li>
							<li>• Completion rewards</li>
						</ul>
					</div>
				</div>

				<div class="card border border-accent/20 bg-gradient-to-br from-accent/10 to-accent/5">
					<div class="card-body">
						<h4 class="card-title text-accent">🚀 Motivation Boosters</h4>
						<ul class="space-y-1 text-sm">
							<li>• Curiosity building</li>
							<li>• Social proof hints</li>
							<li>• Value reminders</li>
							<li>• Success previews</li>
						</ul>
					</div>
				</div>
			</div>
		</section>
	</div>
</div>

<!-- Render floating widget when selected -->
<!-- Removed floating widget demo -->
