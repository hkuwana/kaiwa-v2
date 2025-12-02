<script lang="ts">
	/**
	 * Admin Dashboard - Central hub for admin functions
	 */

	const adminSections = [
		{
			href: '/admin/learning-paths',
			title: 'Learning Paths',
			description: 'Create, manage, and assign personalized learning paths',
			icon: 'icon-[mdi--book-education-outline]',
			color: 'primary'
		},
		{
			href: '/admin/payment',
			title: 'Payments',
			description: 'Test Stripe integration and subscription flows',
			icon: 'icon-[mdi--credit-card-outline]',
			color: 'success'
		},
		{
			href: '/admin/tiers',
			title: 'Pricing Tiers',
			description: 'View and test pricing tiers and feature comparison',
			icon: 'icon-[mdi--tag-outline]',
			color: 'warning'
		},
		{
			href: '/admin/api-usage',
			title: 'API Usage',
			description: 'Monitor API usage and costs',
			icon: 'icon-[mdi--chart-line]',
			color: 'info'
		}
	];

	const emailTools = [
		{
			href: '/admin/email',
			title: 'Email Tools',
			description: 'Email campaign testing and preview'
		},
		{
			href: '/admin/weekly-stats',
			title: 'Weekly Stats',
			description: 'Send weekly statistics to users'
		},
		{
			href: '/admin/weekly-digest',
			title: 'Weekly Digest',
			description: 'Compose and send weekly product updates'
		},
		{
			href: '/admin/weekly-email',
			title: 'Weekly Email',
			description: 'Markdown editing for weekly emails'
		},
		{
			href: '/admin/pab-invite',
			title: 'PAB Invites',
			description: 'Product Advisory Board invitations'
		}
	];
</script>

<div class="container mx-auto max-w-4xl px-4 py-12">
	<div class="mb-8 text-center">
		<h1 class="mb-2 text-3xl font-light tracking-tight">Admin Dashboard</h1>
		<p class="text-base-content/60">Manage your Kaiwa platform</p>
	</div>

	<!-- Main Admin Sections -->
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

	<!-- Email & Communication Tools -->
	<div class="mt-12">
		<h3 class="mb-4 text-lg font-medium">Email & Communication</h3>
		<div class="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
			{#each emailTools as tool}
				<a
					href={tool.href}
					class="rounded-xl border border-base-200 bg-base-100 p-4 transition hover:border-primary hover:shadow-md"
				>
					<h4 class="font-medium">{tool.title}</h4>
					<p class="mt-1 text-xs text-base-content/60">{tool.description}</p>
				</a>
			{/each}
		</div>
	</div>

	<!-- Quick Links -->
	<div class="mt-12 rounded-xl bg-base-200 p-6">
		<h3 class="mb-4 font-medium">Quick Links</h3>
		<div class="flex flex-wrap gap-2">
			<a href="/dev" class="btn btn-ghost btn-sm">Dev Tools</a>
			<a href="/docs" class="btn btn-ghost btn-sm">Documentation</a>
		</div>
	</div>
</div>
