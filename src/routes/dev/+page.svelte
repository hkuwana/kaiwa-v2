<script lang="ts">
	// Organized dev tools directory
	const devTools = [
		{
			category: 'Core Testing & Analysis',
			icon: '🧪',
			tools: [
				{
					href: '/dev/analysis',
					label: 'Analysis',
					desc: 'Test conversation analysis and insights'
				},
				{
					href: '/dev/analysis-test',
					label: 'Analysis Test',
					desc: 'Test analysis components'
				},
				{
					href: '/dev/assessment-test',
					label: 'Assessment Test',
					desc: 'Test onboarding flow and results display'
				},
				{
					href: '/dev/usage',
					label: 'Usage',
					desc: 'Analytics and usage tracking debug tools'
				},
				{
					href: '/dev/usage-test',
					label: 'Usage Test',
					desc: 'Timer functionality and session management'
				}
			]
		},
		{
			category: 'Real-time Communication',
			icon: '🔄',
			tools: [
				{
					href: '/dev/realtime',
					label: 'Realtime Chat',
					desc: 'Test WebRTC and real-time conversation features'
				},
				{
					href: '/dev/realtime-debug',
					label: 'Realtime Debug',
					desc: 'Debug real-time connection and audio pipeline'
				},
				{
					href: '/dev/conversation',
					label: 'Conversations',
					desc: 'View and manage conversation history'
				}
			]
		},
		{
			category: 'UI Components & Animation',
			icon: '🎨',
			tools: [
				{
					href: '/dev/animated',
					label: 'Animated',
					desc: 'Test animations'
				},
				{
					href: '/dev/animation',
					label: 'Animation',
					desc: 'Test various animations'
				},
				{
					href: '/dev/audiovisualizer',
					label: 'Audio Visualizer',
					desc: 'Test audio visualization components'
				},
				{
					href: '/dev/modals',
					label: 'Modals',
					desc: 'Test modal components'
				}
			]
		},
		{
			category: 'Content & Localization',
			icon: '🌍',
			tools: [
				{
					href: '/dev/instructions',
					label: 'Instructions',
					desc: 'Test instruction generation and modules'
				},
				{
					href: '/dev/japanese-scripts',
					label: 'Japanese Scripts',
					desc: 'Test script generation for Japanese learning'
				},
				{
					href: '/dev/messages',
					label: 'Messages',
					desc: 'Test message components'
				}
			]
		},
		{
			category: 'Business & Marketing',
			icon: '💼',
			tools: [
				{
					href: '/dev/competition',
					label: 'Competition',
					desc: 'Competitive analysis and positioning data'
				},
				{
					href: '/dev/competitor',
					label: 'Competitor',
					desc: 'Interactive competitor research quiz'
				},
				{
					href: '/dev/marketing',
					label: 'Marketing',
					desc: 'Marketing components and landing page elements'
				},
				{
					href: '/dev/payment',
					label: 'Payment',
					desc: 'Test Stripe integration and subscription flows'
				},
				{
					href: '/dev/pricing-modal',
					label: 'Pricing Modal',
					desc: 'Test pricing modal component'
				},
				{
					href: '/dev/seo',
					label: 'SEO',
					desc: 'SEO strategy testing and optimization tools'
				},
				{
					href: '/dev/tiers',
					label: 'Tiers',
					desc: 'Test pricing tiers component'
				}
			]
		},
		{
			category: 'Other',
			icon: '📦',
			tools: [
				{
					href: '/dev/cultural-dna',
					label: 'Cultural DNA',
					desc: 'Test cultural DNA components'
				},
				{
					href: '/dev/fab',
					label: 'Fab',
					desc: 'Test floating action button'
				},
				{
					href: '/dev/lifecycle',
					label: 'Lifecycle',
					desc: 'Test lifecycle components'
				}
			]
		}
	];
</script>

<svelte:head>
	<title>Dev Tools Directory - Kaiwa</title>
	<meta name="description" content="Comprehensive development and testing tools for Kaiwa" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6">
	<div class="container mx-auto max-w-6xl">
		<div class="mb-8">
			<h1 class="mb-2 text-4xl font-bold text-primary">🛠️ Dev Tools Directory</h1>
			<p class="text-lg text-base-content/70">
				Comprehensive development and testing tools for Kaiwa
			</p>
		</div>

		<!-- Organized Tool Categories -->
		<div class="space-y-8">
			{#each devTools as category}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="mb-4 card-title text-2xl">
							<span class="text-3xl">{category.icon}</span>
							{category.category}
						</h2>
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{#each category.tools as tool}
								<div class="rounded-lg border p-4 transition-colors hover:bg-base-200">
									<div class="mb-2 flex items-start justify-between">
										<h3 class="font-semibold text-primary">
											<a href={tool.href} class="hover:underline">
												{tool.label}
											</a>
										</h3>
										<a href={tool.href} class="btn btn-ghost btn-xs">→</a>
									</div>
									<p class="text-sm text-base-content/70">{tool.desc}</p>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>