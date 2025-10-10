<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';

	let unsubscribeResult: {
		success: boolean;
		message: string;
		error?: string;
	} | null = null;
	let loading = true;

	onMount(async () => {
		const success = page.url.searchParams.get('success');
		const error = page.url.searchParams.get('error');
		const type = page.url.searchParams.get('type') || 'all';

		if (success === 'true') {
			unsubscribeResult = {
				success: true,
				message: 'You have been successfully unsubscribed.'
			};
		} else if (error) {
			let errorMessage = 'Failed to process unsubscribe request';
			switch (error) {
				case 'missing_user_id':
					errorMessage = 'Invalid unsubscribe link - missing user ID';
					break;
				case 'invalid_type':
					errorMessage = 'Invalid unsubscribe type';
					break;
				case 'server_error':
					errorMessage = 'Server error occurred';
					break;
			}
			unsubscribeResult = {
				success: false,
				message: errorMessage,
				error: error
			};
		} else {
			unsubscribeResult = {
				success: false,
				message: 'Invalid unsubscribe link',
				error: 'No parameters provided'
			};
		}

		loading = false;
	});

	function getEmailTypeLabel(type: string): string {
		switch (type) {
			case 'marketing':
				return 'marketing emails';
			case 'daily_reminder':
				return 'daily reminder emails';
			case 'product_updates':
				return 'product update emails';
			case 'weekly_digest':
				return 'weekly digest emails';
			case 'security_alerts':
				return 'security alert emails';
			case 'all':
				return 'all emails';
			default:
				return 'emails';
		}
	}
</script>

<svelte:head>
	<title>Unsubscribe - Kaiwa</title>
	<meta name="description" content="Manage your email preferences" />
</svelte:head>

<div class="flex min-h-screen flex-col justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">
	<div class="sm:mx-auto sm:w-full sm:max-w-md">
		<div class="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
			{#if loading}
				<div class="text-center">
					<div class="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
					<p class="mt-4 text-gray-600">Processing your request...</p>
				</div>
			{:else if unsubscribeResult}
				{#if unsubscribeResult.success}
					<div class="text-center">
						<div
							class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100"
						>
							<svg
								class="h-6 w-6 text-green-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M5 13l4 4L19 7"
								/>
							</svg>
						</div>
						<h2 class="mt-6 text-2xl font-bold text-gray-900">Successfully Unsubscribed</h2>
						<p class="mt-2 text-gray-600">
							You have been unsubscribed from {getEmailTypeLabel(
								page.url.searchParams.get('type') || 'all'
							)}.
						</p>
						<p class="mt-4 text-sm text-gray-500">
							You will no longer receive these emails from Kaiwa. If you change your mind, you can
							always update your email preferences in your account settings.
						</p>
					</div>
				{:else}
					<div class="text-center">
						<div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
							<svg
								class="h-6 w-6 text-red-600"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M6 18L18 6M6 6l12 12"
								/>
							</svg>
						</div>
						<h2 class="mt-6 text-2xl font-bold text-gray-900">Unsubscribe Failed</h2>
						<p class="mt-2 text-gray-600">{unsubscribeResult.message}</p>
						{#if unsubscribeResult.error}
							<p class="mt-2 text-sm text-red-600">{unsubscribeResult.error}</p>
						{/if}
					</div>
				{/if}
			{/if}

			<div class="mt-8 text-center">
				<a
					href="/"
					class="inline-flex items-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
				>
					Return to Kaiwa
				</a>
			</div>
		</div>
	</div>
</div>
