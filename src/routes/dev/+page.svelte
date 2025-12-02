<script lang="ts">
	// Focused dev tools - only critical debugging/testing tools
	const devTools = [
		// Core Testing & Analysis
		{
			category: '🧪 Core Testing',
			name: 'Analysis',
			href: '/dev/analysis',
			desc: 'Test conversation analysis and insights generation'
		},
		{
			category: '🧪 Core Testing',
			name: 'Guest Analysis',
			href: '/dev/guest-analysis',
			desc: 'Test guest conversion flow with CTA modals'
		},
		{
			category: '🧪 Core Testing',
			name: 'Analysis Test',
			href: '/dev/analysis-test',
			desc: 'Unit testing for analysis components'
		},
		{
			category: '🧪 Core Testing',
			name: 'Assessment Test',
			href: '/dev/assessment-test',
			desc: 'Test language assessment flow'
		},
		{
			category: '🧪 Core Testing',
			name: 'Usage Test',
			href: '/dev/usage-test',
			desc: 'Test timer functionality and session management'
		},
		{
			category: '🧪 Core Testing',
			name: 'Suggestions Preview',
			href: '/dev/suggestions-preview',
			desc: 'Preview analysis suggestions display'
		},

		// Real-time & Audio
		{
			category: '🔄 Real-time & Audio',
			name: 'Realtime Chat',
			href: '/dev/realtime',
			desc: 'Test real-time conversation features'
		},
		{
			category: '🔄 Real-time & Audio',
			name: 'Realtime Debug',
			href: '/dev/realtime-debug',
			desc: 'Debug real-time connection and audio pipeline'
		},
		{
			category: '🔄 Real-time & Audio',
			name: 'Conversations',
			href: '/dev/conversation',
			desc: 'View and manage conversation history'
		},
		{
			category: '🔄 Real-time & Audio',
			name: 'Audio Visualizer',
			href: '/dev/audiovisualizer',
			desc: 'Test audio visualization components'
		},
		{
			category: '🔄 Real-time & Audio',
			name: 'Messages',
			href: '/dev/messages',
			desc: 'Test chat message display and formatting'
		},

		// UI Components
		{
			category: '🎨 UI Components',
			name: 'Modals',
			href: '/dev/modals',
			desc: 'Test modal components and overlays'
		},
		{
			category: '🎨 UI Components',
			name: 'Floating Action Button',
			href: '/dev/fab',
			desc: 'Test FAB component variants'
		},
		{
			category: '🎨 UI Components',
			name: 'Feedback Demo',
			href: '/dev/feedback-demo',
			desc: 'Test toast notifications and feedback'
		},
		{
			category: '🎨 UI Components',
			name: 'Pricing Modal',
			href: '/dev/pricing-modal',
			desc: 'Test subscription pricing modal'
		},

		// Language & Content
		{
			category: '🌍 Language',
			name: 'Instructions',
			href: '/dev/instructions',
			desc: 'Test AI-generated learning instructions'
		},
		{
			category: '🌍 Language',
			name: 'Japanese Scripts',
			href: '/dev/japanese-scripts',
			desc: 'Test Japanese script generation'
		},
		{
			category: '🌍 Language',
			name: 'Scenarios',
			href: '/dev/scenarios',
			desc: 'Test scenario selection and display'
		},

		// Development
		{
			category: '🛠️ Development',
			name: 'Component Lifecycle',
			href: '/dev/lifecycle',
			desc: 'Test component lifecycle and cleanup'
		},
		{
			category: '🛠️ Development',
			name: 'Roadmap',
			href: '/dev/roadmap',
			desc: 'View development roadmap'
		}
	];
</script>

<svelte:head>
	<title>Dev Tools - Kaiwa</title>
	<meta name="description" content="Development and testing tools" />
</svelte:head>

<div class="min-h-screen bg-linear-to-br from-base-100 to-base-200 p-6">
	<div class="container mx-auto max-w-4xl">
		<div class="mb-8">
			<h1 class="mb-2 text-3xl font-bold text-primary">Dev Tools</h1>
			<p class="text-base-content/70">Testing and debugging tools for development</p>
			<p class="mt-2 text-sm text-base-content/50">
				Admin tools moved to <a href="/admin" class="link link-primary">/admin</a>
			</p>
		</div>

		<div class="card bg-base-100 shadow-xl">
			<div class="card-body p-0">
				<div class="overflow-x-auto">
					<table class="table table-zebra">
						<thead>
							<tr>
								<th class="w-1/4">Category</th>
								<th class="w-1/4">Tool</th>
								<th>Description</th>
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
									<td class="text-sm">{tool.category}</td>
									<td class="font-semibold text-primary">{tool.name}</td>
									<td class="text-sm text-base-content/70">{tool.desc}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	</div>
</div>
