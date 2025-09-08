<script lang="ts">
	import { goto } from '$app/navigation';
	import UserPreferencesEditor from '$lib/components/UserPreferencesEditor.svelte';
	import type { UserPreferences } from '$lib/server/db/types';

	const { data } = $props();

	let userPreferences = $state<UserPreferences | null>(data.userPreferences);

	let showDeleteModal = $state(false);
	let deleteConfirmation = $state('');
	let isDeleting = $state(false);
	let deleteError = $state('');

	const requiredText = 'DELETE PROFILE';

	const handleDeleteClick = () => {
		showDeleteModal = true;
		deleteConfirmation = '';
		deleteError = '';
	};

	const handleDeleteSubmit = async () => {
		if (deleteConfirmation !== requiredText) {
			deleteError = `Please type "${requiredText}" exactly to confirm deletion`;
			return;
		}

		isDeleting = true;
		deleteError = '';

		try {
			const response = await fetch('/api/profile/delete-account', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (!response.ok) {
				const result = await response.json();
				deleteError = result.error || 'Failed to delete account';
				return;
			}

			// Account deleted successfully, redirect to home
			goto('/');
		} catch (err) {
			deleteError = 'Network error. Please try again.';
		} finally {
			isDeleting = false;
		}
	};

	const handleCloseModal = () => {
		showDeleteModal = false;
		deleteConfirmation = '';
		deleteError = '';
	};

	const handlePreferencesSave = (updates: Partial<UserPreferences>) => {
		if (userPreferences) {
			userPreferences = { ...userPreferences, ...updates };
		}
	};
</script>

<svelte:head>
	<title>Profile - Kaiwa</title>
	<meta name="description" content="Manage your Kaiwa account settings" />
</svelte:head>

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto px-4 py-8">
		<div class="mx-auto max-w-2xl">
			<!-- Header -->
			<div class="mb-8">
				<h1 class="text-3xl font-bold text-base-content">Profile Settings</h1>
				<p class="mt-2 text-base-content/70">Manage your account and preferences</p>
			</div>

			<!-- Profile Card -->
			<div class="card mb-6 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="mb-4 card-title text-xl">Account Information</h2>

					<div class="space-y-4">
						<div class="form-control">
							<div class="label">
								<span class="label-text font-medium">Email</span>
							</div>
							<div class="input-bordered input bg-base-200">
								{data.user.email}
							</div>
						</div>

						<div class="form-control">
							<div class="label">
								<span class="label-text font-medium">Display Name</span>
							</div>
							<div class="input-bordered input bg-base-200">
								{data.user.displayName || 'Not set'}
							</div>
						</div>

						<div class="form-control">
							<div class="label">
								<span class="label-text font-medium">Account Created</span>
							</div>
							<div class="input-bordered input bg-base-200">
								{data.user.createdAt
									? new Date(data.user.createdAt).toLocaleDateString()
									: 'Unknown'}
							</div>
						</div>

						<div class="form-control">
							<div class="label">
								<span class="label-text font-medium">Email Verified</span>
							</div>
							<div class="flex items-center gap-2">
								{#if (data.user as any).emailVerified}
									<span class="badge badge-success">Verified</span>
									<span class="text-sm text-base-content/70">
										{new Date((data.user as any).emailVerified).toLocaleDateString()}
									</span>
								{:else}
									<span class="badge badge-error">Not Verified</span>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Learning Preferences -->
			<div class="card mb-6 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="mb-4 card-title text-xl">Learning Preferences</h2>
					{#if userPreferences}
						<UserPreferencesEditor
							{userPreferences}
							onSave={handlePreferencesSave}
							compact={false}
						/>
					{:else}
						<div class="alert alert-warning">
							<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
							<span>Unable to load preferences. Please try refreshing the page.</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Danger Zone -->
			<div class="card border-2 border-error/20 bg-base-100 shadow-xl">
				<div class="card-body">
					<h2 class="mb-4 card-title text-xl text-error">Danger Zone</h2>
					<p class="mb-4 text-base-content/70">
						Once you delete your account, there is no going back. Please be certain.
					</p>

					<button type="button" class="btn btn-outline btn-error" onclick={handleDeleteClick}>
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
							/>
						</svg>
						Permanently Delete Account
					</button>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Delete Confirmation Modal -->
{#if showDeleteModal}
	<div class="modal-open modal">
		<div class="modal-box">
			<h3 class="mb-4 text-lg font-bold text-error">Delete Account</h3>

			<div class="py-4">
				<p class="mb-4 text-base-content">
					This action cannot be undone. This will permanently delete your account and remove all
					your data from our servers.
				</p>

				<div class="mb-4 alert alert-warning">
					<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
						/>
					</svg>
					<span>All your conversations, progress, and settings will be lost forever.</span>
				</div>

				{#if deleteError}
					<div class="mb-4 alert alert-error">
						<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
						<span>{deleteError}</span>
					</div>
				{/if}

				<div class="form-control">
					<label for="delete-confirmation" class="label">
						<span class="label-text font-medium">
							Type <span class="font-mono font-bold text-error">{requiredText}</span> to confirm:
						</span>
					</label>
					<input
						id="delete-confirmation"
						type="text"
						class="input-bordered input"
						placeholder={requiredText}
						bind:value={deleteConfirmation}
						disabled={isDeleting}
					/>
				</div>
			</div>

			<div class="modal-action">
				<button
					type="button"
					class="btn btn-ghost"
					onclick={handleCloseModal}
					disabled={isDeleting}
				>
					Cancel
				</button>
				<button
					type="button"
					class="btn btn-error"
					onclick={handleDeleteSubmit}
					disabled={isDeleting || deleteConfirmation !== requiredText}
				>
					{#if isDeleting}
						<span class="loading loading-sm loading-spinner"></span>
						Deleting...
					{:else}
						Delete Account
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}
