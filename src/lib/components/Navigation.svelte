<script lang="ts">
	import ThemeSwitcher from './ThemeSwitcher.svelte';
	import NavLanguageSwitcher from './NavLanguageSwitcher.svelte';
	import type { User } from '$lib/server/db/types';
	import { goto } from '$app/navigation';
	import { dev } from '$app/environment';
	import { resolve } from '$app/paths';
	const { user }: { user: User | null } = $props();
</script>

<nav class="navbar relative z-50 bg-base-100">
	<div class="navbar-start">
		<div class="dropdown">
			<div role="button" class="btn btn-ghost lg:hidden" tabindex="0">
				<span class="icon-[mdi--menu] h-5 w-5"></span>
			</div>
			<ul class="dropdown-content menu z-[60] mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow">
				<li><a href="/about" class="">About</a></li>
				<li><a href="/scenarios" class="">Scenarios</a></li>
				<li><a href="/pricing" class="">Pricing</a></li>
				<li><a href="/privacy" class="">Privacy</a></li>

				{#if dev}
					<li class="menu-title">Dev</li>
					<li><a href="/dev" class="">Dev Home</a></li>
					<li><a href="/research" class="">Research Page</a></li>
					<li><a href="/docs" class="">Docs Hub</a></li>
				{/if}
			</ul>
		</div>
		<button onclick={() => goto(resolve('/'))} class="btn text-xl btn-ghost">Kaiwa</button>
	</div>
	<div class="navbar-center hidden items-center lg:flex">
		<ul class="menu menu-horizontal px-1">
			<li><a href="/about" class="">About</a></li>
			<li><a href="/scenarios" class="">Scenarios</a></li>
			<li><a href="/pricing" class="">Pricing</a></li>
			<li><a href="/privacy" class="">Privacy</a></li>

			{#if dev}
				<li>
					<details>
						<summary>Dev</summary>
						<ul class="rounded-box bg-base-100 p-2 shadow">
							<li><a href="/dev" class="">Dev Home</a></li>
							<li><a href="/research" class="">Research Page</a></li>
							<li><a href="/docs" class="">Docs Hub</a></li>
						</ul>
					</details>
				</li>
			{/if}
		</ul>
	</div>

	<div class="navbar-end gap-2">
		<NavLanguageSwitcher />

		{#if user && user.id !== 'guest'}
			<div class="dropdown dropdown-end">
				<div tabindex="0" role="button" class="btn avatar btn-circle btn-ghost">
					{#if user.avatarUrl}
						<div class="w-24 rounded-full">
							<img alt="User avatar" src={user.avatarUrl} />
						</div>
					{:else}
						<div class="w-24 rounded-full bg-primary text-primary-content">
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
					<li class="divider my-1"></li>
					<li>
						<div class="flex items-center justify-between">
							<span>Light/Dark Mode</span>
							<ThemeSwitcher />
						</div>
					</li>
					<li><a href="/logout" class="">Logout</a></li>
				</ul>
			</div>
		{:else}
			<a href="/auth" class="btn btn-outline">Sign Up</a>
		{/if}
	</div>
</nav>
