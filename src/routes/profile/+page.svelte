<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import UserPreferencesEditor from '$lib/components/UserPreferencesEditor.svelte';
	import EmailPreferences from '$lib/components/EmailPreferences.svelte';
	import SpeechSpeedSelector from '$lib/components/SpeechSpeedSelector.svelte';
	import type { Subscription, User, UserPreferences } from '$lib/server/db/types';
	import type { MemorySummary } from '$lib/services/user-memory.service';
	import type { UsageStatus } from '$lib/server/tier.service';
	import { SvelteDate } from 'svelte/reactivity';
	import { onMount } from 'svelte';
	import PaymentManagement from '$lib/components/PaymentManagement.svelte';

	const { data } = $props();

	// Create a local user object to handle form inputs
	let localUser = $state<Partial<User>>({ ...data.user });

	// Client-side data loading
	let userPreferences = $state<UserPreferences | null>(null);
	let subscription = $state<Subscription | null>(null);
	let usageLimits = $state<any>(null);
	let memorySummary = $state<MemorySummary | null>(null);

	let showDeleteModal = $state(false);
	let deleteConfirmation = $state('');
	let isDeleting = $state(false);
	let deleteError = $state('');

	const requiredText = 'DELETE PROFILE';

	// Tab navigation
	let activeTab = $state('account');
	const tabs = [
		{ id: 'account', label: 'Account', icon: 'user' },
		{ id: 'billing', label: 'Billing & Payments', icon: 'credit-card' },
		{ id: 'preferences', label: 'Learning Preferences', icon: 'settings' },
		{ id: 'email', label: 'Email Preferences', icon: 'mail' },
		{ id: 'danger', label: 'Danger Zone', icon: 'warning' }
	];

	// Billing state
	let isManagingBilling = $state(false);
	let billingError = $state('');

	// Usage status state
	let usageStatus = $state<UsageStatus | null>(null);
	let isLoadingUsage = $state(false);

	// Data loading promises
	let userPreferencesPromise = $state<Promise<UserPreferences | null>>();
	let subscriptionPromise = $state<Promise<any>>();
	let usageLimitsPromise = $state<Promise<any>>();

	// Tier pricing for display
	const tierPricing: Record<string, string> = {
		free: '0',
		plus: '19',
		premium: '29'
	};

	let saveTimeout: NodeJS.Timeout | null = null;
	let isSaving = $state(false);
	let lastSaved = $state<Date | null>(null);

	const debouncedSave = (updates: Partial<User>) => {
		if (saveTimeout) {
			clearTimeout(saveTimeout);
		}

		saveTimeout = setTimeout(async () => {
			await saveUser(updates);
		}, 500); // 500ms delay
	};

	const saveUser = async (updates: Partial<User>) => {
		isSaving = true;
		try {
			const response = await fetch(`/api/users/${data.user.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify(updates)
			});

			if (!response.ok) {
				throw new Error('Failed to save user data');
			}
			lastSaved = new Date();
		} catch (error) {
			console.error('Error saving user data:', error);
		} finally {
			isSaving = false;
		}
	};

	const handleInputChange = (field: keyof User, value: any) => {
		(localUser as any)[field] = value;
		debouncedSave({ [field]: value });
	};

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
			const response = await fetch(`/api/users/${data.user.id}`, {
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
			goto(resolve('/'));
		} catch {
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

	const handlePreferencesSave = (
		updates: Partial<UserPreferences> & { memorySummary?: MemorySummary }
	) => {
		if (userPreferences) {
			userPreferences = { ...userPreferences, ...updates };
		}

		if (updates.memorySummary) {
			memorySummary = updates.memorySummary;
		} else if (updates.memories) {
			const maxCount = memorySummary?.maxCount ?? updates.memories.length;
			memorySummary = {
				memories: updates.memories,
				count: updates.memories.length,
				maxCount,
				withinLimit: updates.memories.length <= maxCount
			};
		}
	};

	// Billing functions
	const openBillingPortal = async () => {
		isManagingBilling = true;
		billingError = '';

		try {
			const response = await fetch('/api/billing/portal', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			if (!response.ok) {
				const result = await response.json();
				billingError = result.error || 'Failed to open billing portal';
				return;
			}

			const { url } = await response.json();
			window.location.href = url;
		} catch {
			billingError = 'Network error. Please try again.';
		} finally {
			isManagingBilling = false;
		}
	};

	// Load user preferences
	const loadUserPreferences = async (): Promise<UserPreferences | null> => {
		try {
			const response = await fetch(`/api/users/${data.user.id}/preferences`);
			if (!response.ok) {
				console.error('Failed to load user preferences:', response.statusText);
				return null;
			}

			const payload = await response.json();
			const payloadData = (payload?.success ?? false) ? payload?.data : payload;

			if (payloadData?.userId) {
				const { memorySummary: summary, ...rest } = payloadData as {
					memorySummary?: MemorySummary;
				} & UserPreferences;

				const fallbackMemories = Array.isArray(rest.memories) ? rest.memories : [];
				memorySummary =
					summary && Array.isArray(summary.memories)
						? {
								memories: summary.memories,
								count: summary.count ?? summary.memories.length,
								maxCount: summary.maxCount ?? summary.memories.length,
								withinLimit:
									summary.withinLimit ??
									summary.memories.length <= (summary.maxCount ?? summary.memories.length)
							}
						: {
								memories: fallbackMemories,
								count: fallbackMemories.length,
								maxCount: summary?.maxCount ?? fallbackMemories.length,
								withinLimit:
									fallbackMemories.length <= (summary?.maxCount ?? fallbackMemories.length)
							};

				return rest as UserPreferences;
			}

			console.warn('Unexpected user preferences response shape:', payload);
			return null;
		} catch (error) {
			console.error('Error loading user preferences:', error);
			return null;
		}
	};

	// Load subscription data
	const loadSubscription = async () => {
		try {
			const response = await fetch(`/api/users/${data.user.id}/subscription?simple=true`);
			if (!response.ok) {
				console.error('Failed to load subscription:', response.statusText);
				return null;
			}
			return await response.json();
		} catch (error) {
			console.error('Error loading subscription:', error);
			return null;
		}
	};

	// Load usage limits
	const loadUsageLimits = async () => {
		try {
			const response = await fetch(`/api/users/${data.user.id}/subscription`);
			if (response.ok) {
				return await response.json();
			}
			return null;
		} catch (error) {
			console.error('Error loading usage limits:', error);
			return null;
		}
	};

	// Load user's detailed usage status
	const loadUsageStatus = async () => {
		isLoadingUsage = true;
		try {
			const response = await fetch(`/api/users/${data.user.id}/usage?action=status`);
			if (response.ok) {
				const data = await response.json();
				// Convert date strings back to Date objects
				usageStatus = {
					...data,
					resetDate: new SvelteDate(data.resetDate),
					tier: {
						...data.tier,
						createdAt: new SvelteDate(data.tier.createdAt),
						updatedAt: new SvelteDate(data.tier.updatedAt)
					},
					usage: {
						...data.usage,
						createdAt: new SvelteDate(data.usage.createdAt),
						updatedAt: new SvelteDate(data.usage.updatedAt),
						lastConversationAt: data.usage.lastConversationAt
							? new SvelteDate(data.usage.lastConversationAt)
							: null,
						lastRealtimeAt: data.usage.lastRealtimeAt
							? new SvelteDate(data.usage.lastRealtimeAt)
							: null,
						firstActivityAt: data.usage.firstActivityAt
							? new SvelteDate(data.usage.firstActivityAt)
							: null
					}
				};
			} else {
				console.error('Failed to load usage status:', response.statusText);
			}
		} catch (error) {
			console.error('Error loading usage status:', error);
		} finally {
			isLoadingUsage = false;
		}
	};

	// Load all data when component mounts
	onMount(() => {
		// Initialize data loading promises
		userPreferencesPromise = loadUserPreferences();
		subscriptionPromise = loadSubscription();
		usageLimitsPromise = loadUsageLimits();

		// Load usage status
		loadUsageStatus();

		// Update reactive state when promises resolve
		userPreferencesPromise?.then((prefs) => {
			userPreferences = prefs;
		});
		subscriptionPromise?.then((sub) => {
			subscription = sub;
		});
		usageLimitsPromise?.then((limits) => {
			usageLimits = limits;
		});
	});
</script>

<svelte:head>
	<title>Profile - Kaiwa</title>
	<meta name="description" content="Manage your Kaiwa account settings" />
</svelte:head>

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto px-4 py-8">
		<div class="mx-auto max-w-4xl">
			<!-- Header -->
			<div class="mb-8">
				<h1 class="text-3xl font-bold text-base-content">Profile Settings</h1>
				<p class="mt-2 text-base-content/70">Manage your account and preferences</p>
			</div>

			<!-- Tab Navigation -->
			<div class="tabs-boxed mb-6 tabs bg-base-100 shadow-xl">
				{#each tabs as tab (tab.id)}
					<button
						class="tab-lg tab {activeTab === tab.id ? 'tab-active' : ''}"
						onclick={() => (activeTab = tab.id)}
					>
						<span class="icon-[mdi--{tab.icon}] mr-2 h-5 w-5"></span>
						{tab.label}
					</button>
				{/each}
			</div>

			<!-- Tab Content -->
			<div class="rounded-box border-base-300 bg-base-100 p-6 shadow-xl">
				<!-- Account Tab -->
				{#if activeTab === 'account'}
					<div class="card mb-6 bg-base-100 shadow-xl">
						<div class="card-body">
							<h2 class="mb-4 card-title text-xl">
								<span class="mr-2 icon-[mdi--user] h-6 w-6"></span>
								Account Information
							</h2>

							<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
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
											? new SvelteDate(data.user.createdAt).toLocaleDateString()
											: 'Unknown'}
									</div>
								</div>

								<div class="form-control">
									<div class="label">
										<span class="label-text font-medium">Email Verified</span>
									</div>
									<div class="flex items-center gap-2">
										{#if data.user.emailVerified || data.user.googleId}
											<span class="badge badge-success">Verified</span>
											{#if data.user.emailVerified}
												<span class="text-sm text-base-content/70">
													{new SvelteDate(data.user.emailVerified).toLocaleDateString()}
												</span>
											{:else if data.user.googleId}
												<span class="text-sm text-base-content/70">Verified via Google</span>
											{/if}
										{:else}
											<span class="badge badge-error">Not Verified</span>
										{/if}
									</div>
								</div>
							</div>
						</div>
					</div>
				{/if}

				<!-- Billing Tab -->
				{#if activeTab === 'billing'}
					<PaymentManagement
						{data}
						{usageStatus}
						{isLoadingUsage}
						{loadUsageStatus}
						{tierPricing}
						{billingError}
						{isManagingBilling}
						{openBillingPortal}
						{subscription}
						{usageLimits}
					/>
				{/if}

				<!-- Learning Preferences Tab -->
				{#if activeTab === 'preferences'}
					<div class="card mb-6 bg-base-100 shadow-xl">
						<div class="card-body">
							<h2 class="mb-4 card-title text-xl">
								<span class="mr-2 icon-[mdi--settings] h-6 w-6"></span>
								Learning Preferences
							</h2>
							{#await userPreferencesPromise}
								<!-- Skeleton Loading State -->
								<div class="space-y-6">
									<!-- Language preferences skeleton -->
									<div class="form-control">
										<div class="mb-2 h-4 w-32 skeleton"></div>
										<div class="h-12 w-full skeleton rounded-lg"></div>
									</div>

									<!-- Difficulty level skeleton -->
									<div class="form-control">
										<div class="mb-2 h-4 w-24 skeleton"></div>
										<div class="flex gap-2">
											{#each Array(3) as _, i (i)}
												<div class="h-10 w-20 skeleton rounded-lg"></div>
											{/each}
										</div>
									</div>

									<!-- Practice focus skeleton -->
									<div class="form-control">
										<div class="mb-2 h-4 w-28 skeleton"></div>
										<div class="grid grid-cols-2 gap-2 md:grid-cols-3">
											{#each Array(6) as _, i (i)}
												<div class="h-10 w-full skeleton rounded-lg"></div>
											{/each}
										</div>
									</div>

									<!-- Settings toggles skeleton -->
									<div class="space-y-4">
										{#each Array(4) as _, i (i)}
											<div class="flex items-center justify-between">
												<div class="flex-1">
													<div class="mb-1 h-4 w-40 skeleton"></div>
													<div class="h-3 w-60 skeleton"></div>
												</div>
												<div class="h-6 w-12 skeleton rounded-full"></div>
											</div>
										{/each}
									</div>
								</div>
							{:then userPrefs}
								{#if userPrefs}
									<UserPreferencesEditor
										userPreferences={userPrefs}
										{memorySummary}
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
							{:catch error}
								<div class="alert alert-error">
									<svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
									<span>Error loading preferences: {error.message}</span>
								</div>
							{/await}
						</div>
					</div>

					<!-- Speech Speed Settings -->
					<div class="card bg-base-100 shadow-xl">
						<div class="card-body">
							<h2 class="card-title">
								<span class="mr-2 icon-[mdi--speedometer] h-6 w-6"></span>
								Speech Speed
							</h2>
							<p class="mb-4 text-sm text-base-content/70">
								Control how fast the AI speaks during conversations. This helps you practice at a
								comfortable pace for your level.
							</p>
							<SpeechSpeedSelector />
						</div>
					</div>
				{/if}

				<!-- Email Preferences Tab -->
				{#if activeTab === 'email'}
					<div class="card mb-6 bg-base-100 shadow-xl">
						<div class="card-body">
							<h2 class="mb-4 card-title text-xl">
								<span class="mr-2 icon-[mdi--mail] h-6 w-6"></span>
								Email Preferences
							</h2>
							<p class="mb-6 text-base-content/70">
								Choose which types of emails you'd like to receive from Kaiwa. You can change these
								preferences at any time.
							</p>
							<EmailPreferences userId={data.user.id} />
						</div>
					</div>
				{/if}

				<!-- Danger Zone Tab -->
				{#if activeTab === 'danger'}
					<div class="card border-2 border-error/20 bg-base-100 shadow-xl">
						<div class="card-body">
							<h2 class="mb-4 card-title text-xl text-error">
								<span class="mr-2 icon-[mdi--warning] h-6 w-6"></span>
								Danger Zone
							</h2>
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
				{/if}
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
