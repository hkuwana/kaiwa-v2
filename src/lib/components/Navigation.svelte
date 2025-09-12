<script lang="ts">
	import ThemeSwitcher from './ThemeSwitcher.svelte';
	import type { User } from '$lib/server/db/types';
	import { goto, invalidate, invalidateAll } from '$app/navigation';
	import { browser, dev } from '$app/environment';

	const { user }: { user: User | null } = $props();
	// Get user data from page data

	async function handleHome() {
		await goto('/');
	}

	// Dev routes (only shown when running in dev mode)
	const DEV_LINKS = [
		{
			category: 'General',
			links: [{ href: '/dev', label: 'Dev Home' }]
		},
		{
			category: 'Debug & Testing',
			links: [
				{ href: '/dev-realtime-debug', label: 'Realtime Debug' },
				{ href: '/dev-messages', label: 'Messages' },
				{ href: '/dev-conversation', label: 'Conversations' },
				{ href: '/dev-audiovisualizer', label: 'Audio Visualizer' }
			]
		},
		{
			category: 'UI & Content',
			links: [
				{ href: '/dev-instructions', label: 'Instructions' },
				{ href: '/dev-marketing', label: 'Marketing' },
				{ href: '/dev-animated', label: 'Animated' }
			]
		},
		{
			category: 'Strategy',
			links: [{ href: '/dev-competition', label: 'Competition' }]
		},
		{
			category: 'Features',
			links: [{ href: '/dev-payment', label: 'Payment' }]
		}
	];

	// Close the Dev Tools <details> when clicking outside (desktop view)
	let devDetailsEl: HTMLDetailsElement | null = null;
	function handleDocumentClick(e: MouseEvent) {
		if (!devDetailsEl) return;
		const target = e.target as Node | null;
		if (devDetailsEl.open && target && !devDetailsEl.contains(target)) {
			devDetailsEl.open = false;
		}
	}

	import { onMount, onDestroy } from 'svelte';
	onMount(() => {
		// Attach only in browser/dev
		if (dev && browser) {
			document.addEventListener('click', handleDocumentClick, true);
		}
	});
	onDestroy(() => {
		if (dev && browser) {
			document.removeEventListener('click', handleDocumentClick, true);
		}
	});
</script>

<nav class="relative z-50 navbar bg-base-100">
	<div class="navbar-start">
		<div class="dropdown">
			<div role="button" class="btn btn-ghost lg:hidden" tabindex="0">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-5 w-5"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M4 6h16M4 12h8m-8 6h16"
					/>
				</svg>
			</div>
			<ul
				class="dropdown-content menu z-[60] mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
				tabindex="0"
			>
				<li><a href="/about" class="">About</a></li>
				<li><a href="/pricing" class="">Pricing</a></li>
				<li><a href="/privacy" class="">Privacy</a></li>
				{#if user && user.id !== 'guest'}
					<li><a href="/profile" class="">Profile</a></li>
				{/if}

				{#if dev}
					<li class="menu-title"><span>Dev Tools</span></li>
					{#each DEV_LINKS as category}
						<li class="menu-title text-xs"><span>{category.category}</span></li>
						{#each category.links as link}
							<li><a href={link.href} class="pl-4">{link.label}</a></li>
						{/each}
					{/each}
				{/if}
			</ul>
		</div>
		<button onclick={handleHome} class="btn text-xl btn-ghost">Kaiwa</button>
	</div>
	<div class="navbar-center hidden items-center lg:flex">
		<ul class="menu menu-horizontal px-1">
			<li><a href="/about" class="">About</a></li>
			<li><a href="/pricing" class="">Pricing</a></li>
			<li><a href="/privacy" class="">Privacy</a></li>

			{#if dev}
				<li>
					<details bind:this={devDetailsEl}>
						<summary class="">Dev Tools</summary>
						<ul class="w-56 rounded-t-none bg-base-100 p-2">
							{#each DEV_LINKS as category}
								<li class="menu-title text-xs"><span>{category.category}</span></li>
								{#each category.links as link}
									<li><a href={link.href} class="pl-2 text-sm">{link.label}</a></li>
								{/each}
								{#if category !== DEV_LINKS[DEV_LINKS.length - 1]}
									<li><hr class="my-1" /></li>
								{/if}
							{/each}
						</ul>
					</details>
				</li>
			{/if}
		</ul>
	</div>

	<div class="navbar-end">
		{#if user && user.id !== 'guest'}
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn avatar btn-circle btn-ghost">
					{#if user.avatarUrl}
						<div class="w-24 rounded-full">
							<img alt="User avatar" src={user.avatarUrl} />
						</div>
					{:else}
						<div class="w-24 rounded-full bg-primary">
							<span class="text-3xl">{user.displayName?.slice(0, 1).toUpperCase()}</span>
						</div>
					{/if}
				</div>
				<ul
					tabindex="0"
					class="dropdown-content menu z-[60] mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
				>
					<li><a href="/conversation" class="">Start Practice</a></li>
					<li><a href="/profile" class="">Profile</a></li>
					<li><a href="/logout" class="">Logout</a></li>
				</ul>
			</div>
		{:else}
			<a href="/auth" class="btn btn-outline">Sign Up</a>
		{/if}
		<ThemeSwitcher />
	</div>
</nav>
