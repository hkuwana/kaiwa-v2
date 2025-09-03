<script lang="ts">
	import ThemeSwitcher from './ThemeSwitcher.svelte';
	import type { User } from '$lib/server/db/types'; 

	const { user }: { user: User } = $props();
	// Get user data from page data
</script>

<nav class="navbar bg-neutral text-neutral-content shadow-sm">
	<div class="navbar-start">
		<div class="dropdown">
			<div tabindex="0" role="button" class="btn btn-ghost lg:hidden">
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
				tabindex="0"
				class="dropdown-content menu z-[1] mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
			>
				<li><a href="/pricing" class="text-neutral-content">Pricing</a></li>
				<li><a href="/privacy" class="text-neutral-content">Privacy</a></li>
				{#if user.id !== 'guest'}
					<li><a href="/profile" class="text-neutral-content">Profile</a></li>
				{/if}
			</ul>
		</div>
		<a href="/" class="btn text-xl text-base-content btn-ghost">Kaiwa</a>
	</div>
	<div class="navbar-center hidden lg:flex">
		<ul class="menu menu-horizontal px-1">
			<li><a href="/pricing" class="text-neutral-content">Pricing</a></li>
			<li><a href="/privacy" class="text-neutral-content">Privacy</a></li>
		</ul>
	</div>

	<div class="navbar-end">
		{#if user.id !== 'guest'}
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn avatar btn-circle btn-ghost">
					{#if user.avatarUrl}
						<div class="w-24 rounded-full">
							<img alt="User avatar" src={user.avatarUrl} />
						</div>
					{:else}
						<div class="w-24 rounded-full bg-primary text-neutral-content">
							<span class="text-3xl">{user.displayName?.slice(0, 1).toUpperCase()}</span>
						</div>
					{/if}
				</div>
				<ul
					tabindex="0"
					class="dropdown-content menu z-[1] mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
				>
					<li><a href="/conversation" class="text-neutral-content">Start Practice</a></li>
					<li><a href="/profile" class="text-neutral-content">Profile</a></li>
					<li><a href="/logout" class="text-neutral-content">Logout</a></li>
				</ul>
			</div>
		{:else}
			<a href="/auth" class="btn btn-outline btn-primary">Get Started</a>
		{/if}
		<ThemeSwitcher />
	</div>
</nav>
