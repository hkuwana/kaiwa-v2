<script lang="ts">
	import { page } from '$app/stores';

	const { children, data } = $props();

	const navItems = [
		{
			href: '/admin/learning-paths',
			label: 'Learning Paths',
			icon: 'icon-[mdi--book-education-outline]'
		},
		{
			href: '/admin/learners',
			label: 'Learners',
			icon: 'icon-[mdi--account-group-outline]'
		}
	];

	function isActive(href: string): boolean {
		return $page.url.pathname.startsWith(href);
	}
</script>

<div class="min-h-screen bg-base-100">
	<!-- Admin Header -->
	<header class="sticky top-0 z-50 border-b border-base-200 bg-base-100/80 backdrop-blur-sm">
		<div class="container mx-auto flex items-center justify-between px-4 py-3">
			<div class="flex items-center gap-4">
				<a href="/admin" class="text-xl font-semibold">Admin</a>
				<nav class="flex gap-1">
					{#each navItems as item}
						<a
							href={item.href}
							class="btn btn-ghost btn-sm {isActive(item.href) ? 'btn-active' : ''}"
						>
							<span class="{item.icon} h-4 w-4"></span>
							{item.label}
						</a>
					{/each}
				</nav>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-sm text-base-content/60">{data.user?.email}</span>
				<a href="/" class="btn btn-ghost btn-sm">Exit Admin</a>
			</div>
		</div>
	</header>

	<!-- Main Content -->
	<main>
		{@render children()}
	</main>
</div>
