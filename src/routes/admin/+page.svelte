<script lang="ts">
	/**
	 * Admin Dashboard - Home
	 * Central hub for admin functions
	 */

	const adminSections = [
		{
			href: '/admin/learning-paths',
			title: 'Learning Paths',
			description: 'Create, manage, and assign personalized learning paths to users',
			icon: 'icon-[mdi--book-education-outline]',
			color: 'primary'
		}
	];
</script>

<div class="container mx-auto max-w-4xl px-4 py-12">
	<div class="mb-8 text-center">
		<h1 class="mb-2 text-3xl font-light tracking-tight">Admin Dashboard</h1>
		<p class="text-base-content/60">Manage your Kaiwa platform</p>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		{#each adminSections as section}
			<a
				href={section.href}
				class="group rounded-2xl border border-base-200 bg-base-100 p-6 transition hover:border-{section.color} hover:shadow-lg"
			>
				<div class="mb-4 flex items-center gap-3">
					<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-{section.color}/10">
						<span class="{section.icon} h-6 w-6 text-{section.color}"></span>
					</div>
					<h2 class="text-xl font-medium">{section.title}</h2>
				</div>
				<p class="text-sm text-base-content/60">{section.description}</p>
				<div class="mt-4 flex items-center text-sm text-{section.color}">
					<span>Open</span>
					<span
						class="ml-1 icon-[mdi--arrow-right] h-4 w-4 transition-transform group-hover:translate-x-1"
					></span>
				</div>
			</a>
		{/each}
	</div>

	<div class="mt-12 rounded-xl bg-base-200 p-6">
		<h3 class="mb-4 font-medium">Quick Links</h3>
		<div class="flex flex-wrap gap-2">
			<a href="/dev/admin/learning-paths" class="btn btn-ghost btn-sm">Legacy Admin (Dev)</a>
			<a href="/dev/admin/email" class="btn btn-ghost btn-sm">Email Tools</a>
			<a href="/dev/admin/weekly-stats" class="btn btn-ghost btn-sm">Weekly Stats</a>
		</div>
	</div>
</div>
