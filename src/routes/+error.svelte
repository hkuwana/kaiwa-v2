<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { browser } from '$app/environment';

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

<div class="min-h-screen flex items-center justify-center bg-base-200 p-4">
	<div class="card w-full max-w-md bg-base-100 shadow-xl">
		<div class="card-body items-center text-center">
			<div class="text-6xl mb-4">⚠️</div>
			<h2 class="card-title text-2xl mb-2">Oops! Something went wrong</h2>

			{#if isSchemaCookieError}
				<p class="text-base-content/70 mb-4">
					We've updated the app and your browser data needs to be refreshed. This is a one-time fix.
				</p>

				<div class="alert alert-info mb-4">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						class="stroke-current shrink-0 w-6 h-6"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<span>Click below to clear cached data and reload</span>
				</div>

				<button class="btn btn-primary" onclick={clearAndReload}>
					Clear Data & Reload
				</button>
			{:else}
				<p class="text-base-content/70 mb-4">
					{error?.message || 'An unexpected error occurred'}
				</p>

				<div class="card-actions">
					<button class="btn btn-primary" onclick={() => goto('/')}>
						Go Home
					</button>
					<button class="btn btn-ghost" onclick={() => window.location.reload()}>
						Reload Page
					</button>
				</div>

				{#if $page?.status === 404}
					<p class="text-sm text-base-content/50 mt-4">
						Error code: {$page.status || 500}
					</p>
				{/if}
			{/if}
		</div>
	</div>
</div>
