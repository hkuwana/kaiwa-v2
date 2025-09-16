<script lang="ts">
	import DevPanel from '$lib/components/DevPanel.svelte';

	// Organized dev tools directory
	const devTools = [
		{
			category: 'Core Testing & Analysis',
			icon: '🧪',
			tools: [
				{ href: '/dev/assessment-test', label: 'Assessment Test', desc: 'Test onboarding flow and results display' },
				{ href: '/dev/assessment-test/api-simulation', label: 'API Simulation', desc: 'Mock assessment API responses' },
				{ href: '/dev/analysis', label: 'Analysis Pipeline', desc: 'Test conversation analysis and insights' },
				{ href: '/dev/usage-test', label: 'Usage Test', desc: 'Timer functionality and session management' },
				{ href: '/dev/usage', label: 'Usage Debug', desc: 'Analytics and usage tracking debug tools' }
			]
		},
		{
			category: 'Real-time Communication',
			icon: '🔄',
			tools: [
				{ href: '/dev/realtime', label: 'Realtime Chat', desc: 'Test WebRTC and real-time conversation features' },
				{ href: '/dev/realtime-debug', label: 'Realtime Debug', desc: 'Debug real-time connection and audio pipeline' },
				{ href: '/dev/conversation', label: 'Conversations', desc: 'View and manage conversation history' },
				{ href: '/dev/messages', label: 'Messages', desc: 'Test message components and script generation' },
				{ href: '/analysis?sessionId=test-session-123', label: 'Analysis Route', desc: 'Test analysis route for ended conversations' }
			]
		},
		{
			category: 'UI Components & Animation',
			icon: '🎨',
			tools: [
				{ href: '/dev/audiovisualizer', label: 'Audio Visualizer', desc: 'Test audio visualization components' },
				{ href: '/dev/animation', label: 'Animation Test', desc: 'Test Tailwind animations and transitions' },
				{ href: '/dev/animated', label: 'AI Art Generation', desc: 'Generate Studio Ghibli-style character art' }
			]
		},
		{
			category: 'Content & Localization',
			icon: '🌍',
			tools: [
				{ href: '/dev/instructions', label: 'Instructions', desc: 'Test instruction generation and modules' },
				{ href: '/dev/japanese-scripts', label: 'Japanese Scripts', desc: 'Test script generation for Japanese learning' },
				{ href: '/dev/tutorial', label: 'Tutorial', desc: 'Test user onboarding tutorial flow' }
			]
		},
		{
			category: 'Business & Marketing',
			icon: '💼',
			tools: [
				{ href: '/dev/payment', label: 'Payment', desc: 'Test Stripe integration and subscription flows' },
				{ href: '/dev/marketing', label: 'Marketing', desc: 'Marketing components and landing page elements' },
				{ href: '/dev/seo', label: 'SEO', desc: 'SEO strategy testing and optimization tools' },
				{ href: '/dev/competition', label: 'Competition', desc: 'Competitive analysis and positioning data' },
				{ href: '/dev/competitor', label: 'Competitor', desc: 'Interactive competitor research quiz' }
			]
		}
	];
</script>

<svelte:head>
	<title>Dev Tools Directory - Kaiwa</title>
	<meta
		name="description"
		content="Comprehensive development and testing tools for Kaiwa"
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6">
	<div class="container mx-auto max-w-6xl">
		<div class="mb-8">
			<h1 class="mb-2 text-4xl font-bold text-primary">🛠️ Dev Tools Directory</h1>
			<p class="text-lg text-base-content/70">
				Comprehensive development and testing tools for Kaiwa
			</p>
		</div>

		<!-- Quick Access Cards -->
		<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
			<div class="card bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
				<div class="card-body">
					<h3 class="card-title text-primary">🚀 Quick Start</h3>
					<p class="text-sm text-base-content/70 mb-3">Jump into core functionality testing</p>
					<div class="flex gap-2 flex-wrap">
						<a href="/dev/assessment-test" class="btn btn-xs btn-primary">Assessment</a>
						<a href="/dev/realtime" class="btn btn-xs btn-primary">Realtime</a>
						<a href="/dev/payment" class="btn btn-xs btn-primary">Payment</a>
					</div>
				</div>
			</div>

			<div class="card bg-gradient-to-br from-secondary/10 to-secondary/5 border border-secondary/20">
				<div class="card-body">
					<h3 class="card-title text-secondary">🎨 Creative Tools</h3>
					<p class="text-sm text-base-content/70 mb-3">UI, animation, and content generation</p>
					<div class="flex gap-2 flex-wrap">
						<a href="/dev/animated" class="btn btn-xs btn-secondary">AI Art</a>
						<a href="/dev/animation" class="btn btn-xs btn-secondary">Animation</a>
						<a href="/dev/marketing" class="btn btn-xs btn-secondary">Marketing</a>
					</div>
				</div>
			</div>

			<div class="card bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20">
				<div class="card-body">
					<h3 class="card-title text-accent">🔍 Debug & Analysis</h3>
					<p class="text-sm text-base-content/70 mb-3">Debugging and analysis tools</p>
					<div class="flex gap-2 flex-wrap">
						<a href="/dev/realtime-debug" class="btn btn-xs btn-accent">Debug</a>
						<a href="/dev/analysis" class="btn btn-xs btn-accent">Analysis</a>
						<a href="/dev/usage" class="btn btn-xs btn-accent">Usage</a>
					</div>
				</div>
			</div>
		</div>

		<!-- Organized Tool Categories -->
		<div class="space-y-8">
			{#each devTools as category}
				<div class="card bg-base-100 shadow-xl">
					<div class="card-body">
						<h2 class="card-title text-2xl mb-4">
							<span class="text-3xl">{category.icon}</span>
							{category.category}
						</h2>
						<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
							{#each category.tools as tool}
								<div class="border rounded-lg p-4 hover:bg-base-200 transition-colors">
									<div class="flex items-start justify-between mb-2">
										<h3 class="font-semibold text-primary">
											<a href={tool.href} class="hover:underline">
												{tool.label}
											</a>
										</h3>
										<a href={tool.href} class="btn btn-xs btn-ghost">→</a>
									</div>
									<p class="text-sm text-base-content/70">{tool.desc}</p>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Dev Panel -->
		<div class="mt-12">
			<h2 class="text-2xl font-bold mb-4">🎛️ Dev Panel</h2>
			<DevPanel
				status="dev"
				messagesCount={0}
				audioLevel={0}
				isGuestUser={true}
				hasAnalysisResults={false}
				isAnalyzing={false}
				timeInSeconds={0}
			/>
		</div>
	</div>
</div>
