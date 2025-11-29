<script lang="ts">
	// Flattened dev tools list for compact display
	const devTools = [
		// Product & reference pages worth keeping handy
		{
			category: '📚 Docs & Pages',
			name: 'Research Page',
			href: '/research',
			desc: 'Marketing-facing overview of the research behind Kaiwa'
		},
		{
			category: '📚 Docs & Pages',
			name: 'Documentation Hub',
			href: '/docs',
			desc: 'Browse internal docs, guides, and implementation plans'
		},

		// Product Strategy
		{
			category: '🎯 Strategy & ICPs',
			name: 'ICP Personas',
			href: '/dev/icp',
			desc: 'Interactive guide to Ideal Customer Profiles and go-to-market strategy'
		},

		// Product Roadmap
		{
			category: '🛠️ Development & Planning',
			name: 'Product Roadmap',
			href: '/dev/roadmap',
			desc: 'View development roadmap and feature planning'
		},

		// Core Testing & Analysis
		{
			category: '🧪 Core Testing & Analysis',
			name: 'Analysis',
			href: '/dev/analysis',
			desc: 'Test conversation analysis and insights generation'
		},
		{
			category: '🧪 Core Testing & Analysis',
			name: 'Guest Analysis Playground',
			href: '/dev/guest-analysis',
			desc: 'Test guest conversion flow with CTA modals and limited insights'
		},
		{
			category: '🧪 Core Testing & Analysis',
			name: 'Analysis Test',
			href: '/dev/analysis-test',
			desc: 'Unit testing for analysis components and algorithms'
		},
		{
			category: '🧪 Core Testing & Analysis',
			name: 'Assessment Test',
			href: '/dev/assessment-test',
			desc: 'Test language assessment flow and results display'
		},
		{
			category: '🧪 Core Testing & Analysis',
			name: 'Usage Analytics',
			href: '/dev/api-usage',
			desc: 'Monitor user behavior and feature usage patterns'
		},
		{
			category: '🧪 Core Testing & Analysis',
			name: 'Usage Test',
			href: '/dev/usage-test',
			desc: 'Test timer functionality and session management'
		},

		// Real-time Communication
		{
			category: '🔄 Real-time Communication',
			name: 'Realtime Chat',
			href: '/dev/realtime',
			desc: 'Test WebRTC and real-time conversation features'
		},
		{
			category: '🔄 Real-time Communication',
			name: 'Realtime Debug',
			href: '/dev/realtime-debug',
			desc: 'Debug real-time connection and audio pipeline issues'
		},
		{
			category: '🔄 Real-time Communication',
			name: 'Conversations',
			href: '/dev/conversation',
			desc: 'View and manage conversation history and metadata'
		},
		{
			category: '🔄 Real-time Communication',
			name: 'Audio Visualizer',
			href: '/dev/audiovisualizer',
			desc: 'Test audio visualization and waveform components'
		},

		// Business & Payments
		{
			category: '💰 Business & Payments',
			name: 'Payment',
			href: '/dev/payment',
			desc: 'Test Stripe integration and subscription flows'
		},
		{
			category: '💰 Business & Payments',
			name: 'Pricing Modal',
			href: '/dev/pricing-modal',
			desc: 'Test subscription pricing modal components'
		},
		{
			category: '💰 Business & Payments',
			name: 'Tiers',
			href: '/dev/tiers',
			desc: 'Test pricing tiers and feature comparison display'
		},

		{
			category: '📈 Marketing & Growth',
			name: 'Marketing',
			href: '/dev/marketing',
			desc: 'Email reminders and marketing campaign management'
		},
		{
			category: '📈 Marketing & Growth',
			name: 'Marketing Automation',
			href: '/dev/marketing-automation',
			desc: 'AI content generation and social media automation'
		},
		{
			category: '📈 Marketing & Growth',
			name: 'Competition Analysis',
			href: '/dev/competition-analysis',
			desc: 'Comprehensive competitor research and market analysis'
		},
		{
			category: '📈 Marketing & Growth',
			name: 'Competitor Quiz',
			href: '/dev/competitor',
			desc: 'Interactive competitor research and comparison tool'
		},
		{
			category: '📈 Marketing & Growth',
			name: 'SEO Tools',
			href: '/dev/seo-tools',
			desc: 'Advanced SEO analysis and keyword research tools'
		},
		{
			category: '📈 Marketing & Growth',
			name: 'Content Optimization',
			href: '/dev/content-optimization',
			desc: 'A/B testing and content performance optimization'
		},
		{
			category: '📈 Marketing & Growth',
			name: 'Marketing Analytics',
			href: '/dev/marketing-analytics',
			desc: 'Performance tracking and campaign analytics'
		},
		{
			category: '📈 Marketing & Growth',
			name: 'SEO Dashboard',
			href: '/dev/seo',
			desc: 'SEO strategy testing and content optimization'
		},

		// UI Components & Animation
		{
			category: '🎨 UI Components & Animation',
			name: 'Modals',
			href: '/dev/modals',
			desc: 'Test modal components and overlay interactions'
		},
		{
			category: '🎨 UI Components & Animation',
			name: 'Animated Components',
			href: '/dev/animated',
			desc: 'Test animated UI elements and transitions'
		},
		{
			category: '🎨 UI Components & Animation',
			name: 'Animation Library',
			href: '/dev/animation',
			desc: 'Test animation utilities and custom effects'
		},
		{
			category: '🎨 UI Components & Animation',
			name: 'Floating Action Button',
			href: '/dev/fab',
			desc: 'Test floating action button component variants'
		},

		// Content & Localization
		{
			category: '🌍 Content & Localization',
			name: 'Instructions',
			href: '/dev/instructions',
			desc: 'Test AI-generated learning instructions and prompts'
		},
		{
			category: '🌍 Content & Localization',
			name: 'Japanese Scripts',
			href: '/dev/japanese-scripts',
			desc: 'Test Japanese script generation and romanization'
		},
		{
			category: '🌍 Content & Localization',
			name: 'Message Components',
			href: '/dev/messages',
			desc: 'Test chat message display and formatting'
		},
		{
			category: '🌍 Content & Localization',
			name: 'Cultural DNA',
			href: '/dev/cultural-dna',
			desc: 'Test cultural context and personalization features'
		},

		// Development & Planning
		{
			category: '🛠️ Development & Planning',
			name: 'Component Lifecycle',
			href: '/dev/lifecycle',
			desc: 'Test component lifecycle management and cleanup'
		}
	];
</script>

<svelte:head>
	<title>Dev Tools Directory - Kaiwa</title>
	<meta name="description" content="Comprehensive development and testing tools for Kaiwa" />
</svelte:head>

<div class="min-h-screen bg-linear-to-br from-base-100 to-base-200 p-6">
	<div class="container mx-auto max-w-5xl">
		<div class="mb-8">
			<h1 class="mb-2 text-4xl font-bold text-primary">🛠️ Dev Tools Directory</h1>
			<p class="text-lg text-base-content/70">
				Comprehensive development and testing tools for Kaiwa
			</p>
		</div>

		<!-- Compact Dev Tools List -->
		<div class="card bg-base-100 shadow-xl">
			<div class="card-body p-0">
				<div class="overflow-x-auto">
					<table class="table table-zebra">
						<thead>
							<tr>
								<th class="w-1/3">Category</th>
								<th class="w-1/4">Tool</th>
								<th>Description</th>
								<th class="w-16"></th>
							</tr>
						</thead>
						<tbody>
							{#each devTools as tool (tool.name)}
								<tr
									class="hover cursor-pointer"
									onclick={() => {
										window.location.href = tool.href;
									}}
								>
									<td class="text-sm font-medium">{tool.category}</td>
									<td class="font-semibold text-primary">{tool.name}</td>
									<td class="text-sm text-base-content/70">{tool.desc}</td>
									<td>
										<a href={tool.href} class="btn btn-ghost btn-xs">→</a>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
</div>
