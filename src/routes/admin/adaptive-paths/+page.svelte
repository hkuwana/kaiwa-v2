<script lang="ts">
	/**
	 * Admin: Adaptive Learning Paths
	 *
	 * Create and manage adaptive learning paths for testing.
	 */

	import StartAdaptivePath from '$lib/features/learning-path/components/StartAdaptivePath.svelte';
</script>

<svelte:head>
	<title>Adaptive Learning Paths | Admin</title>
</svelte:head>

<div class="container mx-auto max-w-6xl px-4 py-6">
	<!-- Header -->
	<div class="mb-8">
		<div class="flex items-center gap-3 mb-2">
			<a href="/admin" class="btn btn-ghost btn-sm gap-2">
				<span class="icon-[mdi--arrow-left] h-4 w-4"></span>
				Back to Admin
			</a>
		</div>
		<h1 class="text-3xl font-bold">Adaptive Learning Paths</h1>
		<p class="mt-2 text-base-content/70">
			Create and test the new flexible weekly learning system
		</p>
	</div>

	<!-- Info Card -->
	<div class="alert alert-info mb-6">
		<span class="icon-[mdi--information-outline] h-6 w-6 shrink-0"></span>
		<div>
			<h3 class="font-bold">Testing Mode</h3>
			<div class="text-sm mt-1">
				This is the admin interface for creating adaptive learning paths. Users will eventually
				access this through their dashboard once testing is complete.
			</div>
		</div>
	</div>

	<!-- Main Content -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Create New Path -->
		<div class="card bg-base-200">
			<div class="card-body">
				<h2 class="card-title">
					<span class="icon-[mdi--rocket-launch] h-6 w-6"></span>
					Create New Adaptive Path
				</h2>
				<p class="text-sm text-base-content/70">
					Flexible 4-week learning paths that adapt to user progress. No rigid schedules—just
					5-10 minute conversations.
				</p>

				<div class="divider"></div>

				<h3 class="font-semibold mb-2">How It Works:</h3>
				<ul class="list-disc list-inside space-y-1 text-sm text-base-content/70">
					<li>Week 1 starts with anchor theme and conversation seeds</li>
					<li>Users choose session types based on available time (3-15 min)</li>
					<li>Progress tracked by "conversations this week" (not Day X of Y)</li>
					<li>No gamification - just warm encouragement</li>
				</ul>

				<div class="divider"></div>

				<h3 class="font-semibold mb-2">Session Types:</h3>
				<div class="grid grid-cols-2 gap-2 text-sm">
					<div class="badge badge-outline gap-1">☕ Quick Check-in (3-5m)</div>
					<div class="badge badge-outline gap-1">📖 Story Moment (5-8m)</div>
					<div class="badge badge-outline gap-1">❓ Question Game (5-7m)</div>
					<div class="badge badge-outline gap-1">🎭 Mini Roleplay (8-10m)</div>
					<div class="badge badge-outline gap-1">🔄 Review Chat (5-7m)</div>
					<div class="badge badge-outline gap-1">🌊 Deep Dive (12-15m)</div>
				</div>

				<div class="card-actions justify-center mt-6">
					<StartAdaptivePath targetLanguage="nl" userGoal="" />
				</div>
			</div>
		</div>

		<!-- Documentation -->
		<div class="card bg-base-200">
			<div class="card-body">
				<h2 class="card-title">
					<span class="icon-[mdi--book-open-variant] h-6 w-6"></span>
					Documentation
				</h2>

				<div class="space-y-4">
					<div>
						<h3 class="font-semibold mb-2">Theme Templates</h3>
						<div class="space-y-2 text-sm">
							<div class="p-3 bg-base-100 rounded-lg">
								<div class="font-medium">🏠 Daily Life</div>
								<div class="text-base-content/70">Everyday conversations and routines</div>
							</div>
							<div class="p-3 bg-base-100 rounded-lg">
								<div class="font-medium">👨‍👩‍👧 Meeting Family</div>
								<div class="text-base-content/70">Prepare to meet partner's family</div>
							</div>
							<div class="p-3 bg-base-100 rounded-lg">
								<div class="font-medium">💼 Professional</div>
								<div class="text-base-content/70">Work-related language</div>
							</div>
						</div>
					</div>

					<div class="divider"></div>

					<div>
						<h3 class="font-semibold mb-2">Testing Checklist</h3>
						<ul class="space-y-2 text-sm">
							<li class="flex items-start gap-2">
								<span class="icon-[mdi--check-circle] h-5 w-5 text-success shrink-0"></span>
								<span>Database migrated and session types seeded</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="icon-[mdi--circle-outline] h-5 w-5 shrink-0"></span>
								<span>Create path with different themes</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="icon-[mdi--circle-outline] h-5 w-5 shrink-0"></span>
								<span>Test all 6 session types</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="icon-[mdi--circle-outline] h-5 w-5 shrink-0"></span>
								<span>Complete sessions and check progress</span>
							</li>
							<li class="flex items-start gap-2">
								<span class="icon-[mdi--circle-outline] h-5 w-5 shrink-0"></span>
								<span>Verify encouragement messages</span>
							</li>
						</ul>
					</div>

					<div class="divider"></div>

					<div>
						<h3 class="font-semibold mb-2">Quick Links</h3>
						<div class="flex flex-col gap-2">
							<a
								href="/docs/adaptive-learning-system.md"
								class="btn btn-outline btn-sm justify-start gap-2"
								target="_blank"
							>
								<span class="icon-[mdi--file-document-outline] h-4 w-4"></span>
								Full Implementation Guide
							</a>
							<a
								href="/docs/TESTING_ADAPTIVE_LEARNING.md"
								class="btn btn-outline btn-sm justify-start gap-2"
								target="_blank"
							>
								<span class="icon-[mdi--test-tube] h-4 w-4"></span>
								Testing Guide
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Recent/Active Adaptive Paths Table -->
	<div class="card bg-base-200 mt-6">
		<div class="card-body">
			<h2 class="card-title">
				<span class="icon-[mdi--format-list-bulleted] h-6 w-6"></span>
				Your Adaptive Paths
			</h2>
			<p class="text-sm text-base-content/70 mb-4">
				View paths you've created. Navigate to <code class="badge badge-sm">/path/[pathId]</code> to
				see the Week Dashboard.
			</p>

			<div class="text-sm text-base-content/60">
				<p>Tip: After creating a path, you'll be redirected to the Week Dashboard automatically.</p>
				<p class="mt-2">
					You can also access any path directly at <code class="badge badge-sm"
						>/path/[pathId]</code
					>
				</p>
			</div>
		</div>
	</div>

	<!-- Database Setup Warning -->
	<div class="alert alert-warning mt-6">
		<span class="icon-[mdi--alert-outline] h-6 w-6 shrink-0"></span>
		<div>
			<h3 class="font-bold">Database Setup Required</h3>
			<div class="text-sm mt-1">
				Before creating paths, make sure you've run:
				<div class="mt-2 font-mono text-xs bg-base-100 p-2 rounded">
					pnpm db:push<br />
					npx tsx src/lib/server/db/seed/seed-session-types.ts
				</div>
			</div>
		</div>
	</div>
</div>
