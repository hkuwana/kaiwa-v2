<script lang="ts">
	import DevPanel from '$lib/components/DevPanel.svelte';
</script>

<svelte:head>
	<title>Dev Testing Panel - Kaiwa</title>
	<meta
		name="description"
		content="Test PR #2, #3 and #4: Isolated Services, Store Orchestration, and Modular Realtime Architecture"
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6">
	<div class="container mx-auto max-w-4xl">
		<div class="mb-8">
			<h1 class="mb-2 text-3xl font-bold text-primary">Dev Testing Panel</h1>
			<p class="text-base-content/70">
				Test PR #2, #3 and #4: Isolated Services, Store Orchestration, and Modular Realtime
				Architecture
			</p>
		</div>

		<div class="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title text-xl">Assessment Testing</h2>
					<p class="mb-4 text-base-content/70">
						Test the onboarding assessment flow and results display for guest/first-time users
					</p>
					<div class="flex gap-2">
						<a href="/dev/assessment-test" class="btn btn-sm btn-primary"> Basic Testing </a>
						<a href="/dev/assessment-test/api-simulation" class="btn btn-outline btn-sm">
							API Simulation
						</a>
					</div>
				</div>
			</div>

			<div class="card bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="card-title text-xl">General Testing</h2>
					<p class="mb-4 text-base-content/70">General development and testing tools</p>
					<div class="flex gap-2">
						<a href="/dev/usage-test" class="btn btn-outline btn-sm"> Usage Test </a>
						<a href="/dev/tutorial" class="btn btn-outline btn-sm"> Tutorial </a>
					</div>
				</div>
			</div>
		</div>

		<DevPanel
			status="dev"
			messagesCount={0}
			audioLevel={0}
			isGuestUser={true}
			hasAnalysisResults={false}
			isAnalyzing={false}
			timeInSeconds={0}
			position="bottom-right"
		/>
	</div>
</div>
