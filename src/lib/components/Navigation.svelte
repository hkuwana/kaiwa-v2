<script lang="ts">
	import ThemeSwitcher from './ThemeSwitcher.svelte';
	import type { User } from '$lib/server/db/types';
	import { goto } from '$app/navigation';
	import { dev } from '$app/environment';
	import { resolve } from '$app/paths';
	const { user }: { user: User | null } = $props();
	// Get user data from page data
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
			<ul class="dropdown-content menu z-[60] mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow">
				<li><a href="/about" class="">About</a></li>
				<li><a href="/pricing" class="">Pricing</a></li>
				<li><a href="/privacy" class="">Privacy</a></li>
				{#if user && user.id !== 'guest'}
					<li><a href="/profile" class="">Profile</a></li>
					<li><a href="/user/history" class="">History</a></li>
				{/if}

				{#if dev}
					<li><a href="/dev" class="">Dev Tools</a></li>
				{/if}
			</ul>
		</div>
		<button onclick={() => goto(resolve('/'))} class="btn text-xl btn-ghost">Kaiwa</button>
	</div>
	<div class="navbar-center hidden items-center lg:flex">
		<ul class="menu menu-horizontal px-1">
			<li><a href="/about" class="">About</a></li>
			<li><a href="/pricing" class="">Pricing</a></li>
			<li><a href="/privacy" class="">Privacy</a></li>

			{#if dev}
				<li><a href="/dev" class="">Dev Tools</a></li>
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
					class="dropdown-content menu z-[60] mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
				>
					<li><a href="/conversation" class="">Start Practice</a></li>
					<li><a href="/profile" class="">Profile</a></li>
					<li><a href="/user/history" class="">History</a></li>
					<li><a href="/logout" class="">Logout</a></li>
				</ul>
			</div>
		{:else}
			<a href="/auth" class="btn btn-outline">Sign Up</a>
		{/if}
		<ThemeSwitcher />
	</div>
</nav>
