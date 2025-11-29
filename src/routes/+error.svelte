<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

	/* eslint-disable svelte/valid-prop-names-in-kit-pages */
	/* eslint-disable @typescript-eslint/no-explicit-any */
	let { error }: { error: any } = $props();

	// Check if error is related to schema/cookie issues
	const isSchemaCookieError =
		error?.message?.includes('deserialize') ||
		error?.message?.includes('schema') ||
		error?.message?.includes('cookie') ||
		error?.message?.includes('Failed to fetch');

	function clearAndReload() {
		if (browser) {
			// Clear all cookies client-side
			document.cookie.split(';').forEach((c) => {
				document.cookie = c
					.replace(/^ +/, '')
					.replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
			});

			// Clear localStorage
			localStorage.clear();

			// Reload
			window.location.href = '/';
		}
	}
</script>

<svelte:head>
	<title>Error - Kaiwa</title>
</svelte:head>

<div class="flex min-h-screen items-center justify-center bg-base-200 p-4">
	<div class="card w-full max-w-md bg-base-100 shadow-xl">
		<div class="card-body items-center text-center">
			<span class="mb-4 icon-[mdi--alert] h-16 w-16 text-warning"></span>
			<h2 class="mb-2 card-title text-2xl">Oops! Something went wrong</h2>

			{#if isSchemaCookieError}
				<p class="mb-4 text-base-content/70">
					We've updated the app and your browser data needs to be refreshed. This is a one-time fix.
				</p>

				<div class="mb-4 alert alert-info">
					<span class="icon-[mdi--information-outline] h-6 w-6 shrink-0"></span>
					<span>Click below to clear cached data and reload</span>
				</div>

				<button class="btn btn-primary" onclick={clearAndReload}> Clear Data & Reload </button>
			{:else}
				<p class="mb-4 text-base-content/70">
					{error?.message || 'An unexpected error occurred'}
				</p>

				<div class="card-actions">
					<button class="btn btn-primary" onclick={() => goto('/')}> Go Home </button>
					<button class="btn btn-ghost" onclick={() => window.location.reload()}>
						Reload Page
					</button>
				</div>

				{#if page?.status === 404}
					<p class="mt-4 text-sm text-base-content/50">
						Error code: {page.status || 500}
					</p>
				{/if}
			{/if}
		</div>
	</div>
</div>
