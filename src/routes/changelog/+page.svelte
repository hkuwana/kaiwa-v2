<script lang="ts">
	const { data } = $props();

	const typeColors = {
		feature: 'badge-success',
		improvement: 'badge-info',
		fix: 'badge-warning',
		update: 'badge-primary'
	};

	const typeIcons = {
		feature: 'icon-[mdi--star-four-points]',
		improvement: 'icon-[mdi--trending-up]',
		fix: 'icon-[mdi--wrench]',
		update: 'icon-[mdi--refresh]'
	};

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'long',
			day: 'numeric'
		});
	}

	function parseCommitType(message: string): 'feature' | 'improvement' | 'fix' | 'update' {
		if (message.startsWith('feat') || message.startsWith('add')) return 'feature';
		if (message.startsWith('fix')) return 'fix';
		if (message.startsWith('improve') || message.startsWith('refactor')) return 'improvement';
		return 'update';
	}

	function cleanCommitMessage(message: string): string {
		// Remove conventional commit prefix
		return message
			.replace(/^(feat|fix|improve|update|refactor|chore|style|docs)(\([^)]+\))?:\s*/i, '')
			.trim();
	}
</script>

<svelte:head>
	<title>Changelog | Kaiwa</title>
	<meta
		name="description"
		content="See what's new in Kaiwa. Latest updates, features, and improvements."
	/>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-16 sm:py-20">
	<div class="mb-12 text-center">
		<h1 class="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">Changelog</h1>
		<p class="mx-auto max-w-2xl text-lg text-base-content/70">
			Stay up to date with the latest improvements and new features
		</p>
	</div>

	<!-- Curated Updates -->
	{#if data.changelog.length > 0}
		<div class="mb-16">
			<h2 class="mb-6 text-2xl font-semibold">Recent Updates</h2>
			<div class="space-y-6">
				{#each data.changelog as entry (entry.date + entry.title)}
					<div class="rounded-xl border bg-base-100 p-6 shadow-sm">
						<div class="mb-3 flex flex-wrap items-center gap-3">
							<span class="badge {typeColors[entry.type]} gap-1">
								<span class="{typeIcons[entry.type]} h-3 w-3"></span>
								{entry.type}
							</span>
							<span class="text-sm text-base-content/60">{formatDate(entry.date)}</span>
						</div>
						<h3 class="mb-2 text-xl font-semibold">{entry.title}</h3>
						<p class="text-base-content/80">{entry.description}</p>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Recent Commits (from git) -->
	{#if data.recentCommits.length > 0}
		<div>
			<h2 class="mb-6 text-2xl font-semibold">Development Activity</h2>
			<div class="rounded-xl border bg-base-100 p-6">
				<div class="space-y-4">
					{#each data.recentCommits as commit (commit.hash)}
						{@const commitType = parseCommitType(commit.message)}
						<div
							class="flex items-start gap-4 border-b border-base-200 pb-4 last:border-0 last:pb-0"
						>
							<span class="badge badge-ghost badge-sm {typeColors[commitType]} mt-1">
								<span class="{typeIcons[commitType]} h-3 w-3"></span>
							</span>
							<div class="flex-1">
								<p class="font-medium">{cleanCommitMessage(commit.message)}</p>
								<p class="mt-1 text-sm text-base-content/50">
									{commit.date}
								</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>
	{/if}

	<!-- Empty State -->
	{#if data.changelog.length === 0 && data.recentCommits.length === 0}
		<div class="rounded-xl bg-base-200 p-12 text-center">
			<span class="mx-auto mb-4 icon-[mdi--history] h-16 w-16 text-base-content/30"></span>
			<h3 class="mb-2 text-xl font-semibold">No Updates Yet</h3>
			<p class="text-base-content/70">Check back soon for the latest improvements!</p>
		</div>
	{/if}

	<!-- Subscribe CTA -->
	<div class="mt-16 rounded-2xl bg-linear-to-br from-primary/10 to-accent/10 p-8 text-center">
		<h3 class="mb-4 text-xl font-semibold">Stay in the Loop</h3>
		<p class="mb-6 text-base-content/70">
			Get notified about new features and improvements directly to your inbox.
		</p>
		<a href="/profile" class="btn btn-primary">
			<span class="icon-[mdi--bell-outline] h-5 w-5"></span>
			Manage Notifications
		</a>
	</div>
</div>
