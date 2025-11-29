<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { fade, slide } from 'svelte/transition';
	import { dev } from '$app/environment';
	import type { Message } from '$lib/server/db/types';
	import VirtualizedMessageList from '$lib/features/conversation/components/VirtualizedMessageList.svelte';
	import { SvelteDate, SvelteMap, SvelteSet, SvelteURLSearchParams } from 'svelte/reactivity';
	import { trackEngagement } from '$lib/analytics/posthog';

	interface ConversationPreview {
		id: string;
		title: string;
		targetLanguageId: string;
		scenarioId: string | null;
		isOnboarding: boolean;
		startedAt: string;
		endedAt: string | null;
		durationSeconds: number;
		messageCount: number;
		preview?: {
			firstUserMessage: string | null;
			lastMessage: string | null;
			messageCount: number;
		} | null;
	}

	interface ConversationDetails {
		id: string;
		title: string;
		targetLanguageId: string;
		scenarioId: string | null;
		isOnboarding: boolean;
		startedAt: string;
		endedAt: string | null;
		durationSeconds: number;
		messageCount: number;
		mode: string;
		voice: string | null;
		comfortRating: number | null;
		engagementLevel: number | null;
		stats: {
			totalMessages: number;
			userMessages: number;
			assistantMessages: number;
			averageWordsPerMessage: number;
			conversationDuration: number;
			languageMix: {
				userLanguage: number;
				targetLanguage: number;
			};
		};
	}

	let conversations = $state<ConversationPreview[]>([]);
	let conversationDetails = new SvelteMap<
		string,
		{ details: ConversationDetails; messages: Message[] }
	>();
	let expandedConversations = new SvelteSet<string>();
	let loading = $state(true);
	let error = $state<string | null>(null);
	let searchQuery = $state('');
	let selectedLanguage = $state('');
	let currentPage = $state(0);
	let totalConversations = $state(0);
	let hasMore = $state(false);
	let loadingDetails = new SvelteSet<string>();
	let showDevMode = $state(false);
	let selectedConversations = new SvelteSet<string>();
	let deleting = $state(false);
	let actionMessage = $state<string | null>(null);
	let actionError = $state<string | null>(null);

	const limit = 10;
	const languages = $derived(() => {
		const langs = new SvelteSet(conversations.map((c) => c.targetLanguageId));
		return Array.from(langs).sort();
	});
	const selectedCount = $derived(() => selectedConversations.size);
	const hasSelection = $derived(() => selectedConversations.size > 0);
	const hasVisibleSelection = $derived(() =>
		conversations.some((conversation) => selectedConversations.has(conversation.id))
	);
	const allVisibleSelected = $derived(
		() =>
			conversations.length > 0 &&
			conversations.every((conversation) => selectedConversations.has(conversation.id))
	);

	onMount(() => {
		loadConversations();
	});

	async function loadConversations(reset = false): Promise<void> {
		if (reset) {
			currentPage = 0;
			conversations = [];
		}

		loading = true;
		error = null;

		try {
			const params = new SvelteURLSearchParams({
				limit: limit.toString(),
				offset: (currentPage * limit).toString()
			});

			if (searchQuery.trim()) {
				params.set('search', searchQuery.trim());
			}

			if (selectedLanguage) {
				params.set('languageId', selectedLanguage);
			}

			const response = await fetch(`/api/conversations?${params}`);
			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Failed to load conversations');
			}

			const responseData = data.data ?? {};
			const conversationBatch = Array.isArray(responseData)
				? responseData
				: Array.isArray(responseData?.conversations)
					? responseData.conversations
					: [];

			if (reset) {
				conversations = conversationBatch;
			} else {
				conversations = [...conversations, ...conversationBatch];
			}

			syncStateWithConversations();

			const pagination =
				data.pagination ??
				(!Array.isArray(responseData) && responseData?.pagination
					? responseData.pagination
					: undefined);

			const totalFromPagination =
				typeof pagination?.total === 'number' ? pagination.total : undefined;
			const totalFromResponse =
				!Array.isArray(responseData) && typeof responseData?.total === 'number'
					? responseData.total
					: undefined;

			totalConversations = totalFromPagination ?? totalFromResponse ?? conversations.length;

			if (typeof pagination?.hasMore === 'boolean') {
				hasMore = pagination.hasMore;
			} else if (typeof pagination?.hasNext === 'boolean') {
				hasMore = pagination.hasNext;
			} else if (!Array.isArray(responseData) && typeof responseData?.hasMore === 'boolean') {
				hasMore = responseData.hasMore;
			} else {
				const fetchedCount = conversationBatch.length;
				const offset = currentPage * limit;
				hasMore = offset + fetchedCount < totalConversations;
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
			console.error('Error loading conversations:', err);
		} finally {
			loading = false;
		}
	}

	async function loadConversationDetails(conversationId: string): Promise<void> {
		// Don't reload if already loaded
		if (conversationDetails.has(conversationId)) {
			return;
		}

		loadingDetails.add(conversationId);
		loadingDetails = new SvelteSet(loadingDetails);

		try {
			const response = await fetch(`/api/conversations/${conversationId}`);
			const data = await response.json();

			if (!data.success) {
				throw new Error(data.error || 'Failed to load conversation details');
			}

			conversationDetails.set(conversationId, {
				details: data.data.conversation,
				messages: data.data.messages
			});
			conversationDetails = new SvelteMap(conversationDetails);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load conversation details';
			console.error('Error loading conversation details:', err);
		} finally {
			loadingDetails.delete(conversationId);
			loadingDetails = new SvelteSet(loadingDetails);
		}
	}

	async function toggleConversation(conversationId: string): Promise<void> {
		console.log('🔄 Toggling conversation:', conversationId);
		console.log('📋 Current expanded:', Array.from(expandedConversations));

		if (expandedConversations.has(conversationId)) {
			// Collapse
			console.log('📉 Collapsing conversation:', conversationId);
			expandedConversations.delete(conversationId);
			expandedConversations = new SvelteSet(expandedConversations);
		} else {
			// Expand - load details if not already loaded
			console.log('📈 Expanding conversation:', conversationId);
			if (!conversationDetails.has(conversationId)) {
				console.log('🔄 Loading conversation details for:', conversationId);
				await loadConversationDetails(conversationId);
			}
			expandedConversations.add(conversationId);
			expandedConversations = new SvelteSet(expandedConversations);
		}

		console.log('✅ New expanded state:', Array.from(expandedConversations));
	}

	function handleConversationCheckbox(conversationId: string, checked: boolean): void {
		if (checked) {
			selectedConversations.add(conversationId);
		} else {
			selectedConversations.delete(conversationId);
		}
		selectedConversations = new SvelteSet(selectedConversations);
	}

	function handleSelectAllVisible(checked: boolean): void {
		if (checked) {
			conversations.forEach((conversation) => selectedConversations.add(conversation.id));
		} else {
			conversations.forEach((conversation) => selectedConversations.delete(conversation.id));
		}
		selectedConversations = new SvelteSet(selectedConversations);
	}

	function clearSelection(): void {
		selectedConversations = new SvelteSet();
	}

	async function deleteSelectedConversations(): Promise<void> {
		if (selectedConversations.size === 0 || deleting) {
			return;
		}

		deleting = true;
		actionError = null;
		actionMessage = null;

		const idsToDelete = Array.from(selectedConversations);

		try {
			const response = await fetch('/api/conversations', {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({ conversationIds: idsToDelete })
			});

			const data = await response.json();

			if (!response.ok || !data.success) {
				throw new Error(data.error || 'Failed to delete conversations');
			}

			const deletedIds: string[] = Array.isArray(data.data?.deletedIds) ? data.data.deletedIds : [];
			const skippedIds: string[] = Array.isArray(data.data?.skippedIds) ? data.data.skippedIds : [];

			selectedConversations = new SvelteSet();

			await loadConversations(true);

			if (deletedIds.length > 0) {
				actionMessage = `Deleted ${deletedIds.length} conversation${deletedIds.length === 1 ? '' : 's'}.`;
			}

			if (skippedIds.length > 0) {
				actionError = `Skipped ${skippedIds.length} conversation${skippedIds.length === 1 ? '' : 's'} you do not have access to.`;
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to delete conversations';
			actionError = message;
			console.error('Delete conversations error:', err);
		} finally {
			deleting = false;
		}
	}

	function handleSearch(): void {
		loadConversations(true);
	}

	function handleLanguageFilter(): void {
		loadConversations(true);
	}

	function loadMore(): void {
		currentPage++;
		loadConversations();
	}

	function formatDate(dateString: string): string {
		return new SvelteDate(dateString).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatDuration(seconds: number): string {
		if (seconds < 60) return `${seconds}s`;
		const minutes = Math.floor(seconds / 60);
		if (minutes < 60) return `${minutes}m`;
		const hours = Math.floor(minutes / 60);
		return `${hours}h ${minutes % 60}m`;
	}

	function goToAnalysis(conversationId: string): void {
		goto(`/analysis?sessionId=${conversationId}`);
	}

	function startNewConversation(): void {
		trackEngagement.conversationStartClicked('history_empty_state', {
			has_existing_conversations: conversations.length > 0
		});
		goto(resolve('/conversation'));
	}

	function syncStateWithConversations(): void {
		const validIds = new Set(conversations.map((conversation) => conversation.id));

		const prunedSelection = Array.from(selectedConversations).filter((id) => validIds.has(id));
		selectedConversations = new SvelteSet<string>(prunedSelection);

		const prunedExpanded = Array.from(expandedConversations).filter((id) => validIds.has(id));
		expandedConversations = new SvelteSet<string>(prunedExpanded);

		const prunedDetails = Array.from(conversationDetails.entries()).filter(([id]) =>
			validIds.has(id)
		);
		conversationDetails = new SvelteMap(new Map(prunedDetails));

		const prunedLoadingDetails = Array.from(loadingDetails).filter((id) => validIds.has(id));
		loadingDetails = new SvelteSet<string>(prunedLoadingDetails);
	}

	function setIndeterminate(
		node: HTMLInputElement,
		value: boolean
	): { update: (next: boolean) => void } {
		node.indeterminate = value;
		return {
			update(next: boolean) {
				node.indeterminate = next;
			}
		};
	}
</script>

<svelte:head>
	<title>Conversation History - Kaiwa</title>
</svelte:head>

<div class="min-h-screen bg-linear-to-b from-base-100 to-base-200">
	<div class="container mx-auto max-w-6xl px-4 py-6">
		<!-- Header -->
		<div class="mb-6" transition:fade={{ duration: 300 }}>
			<div class="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 class="mb-2 text-3xl font-bold">Conversation History</h1>
					<p class="text-base-content/70">Review your past conversations and track your progress</p>
				</div>
				<div class="flex gap-2">
					{#if dev}
						<button class="btn btn-outline btn-sm" onclick={() => (showDevMode = !showDevMode)}>
							{showDevMode ? 'Hide' : 'Show'} Debug
						</button>
					{/if}
					<button class="btn btn-primary" onclick={startNewConversation}>
						<span class="mr-2 icon-[mdi--plus] h-5 w-5"></span>
						New Conversation
					</button>
				</div>
			</div>

			<!-- Search and Filters -->
			<div
				class="rounded-xl bg-base-100 p-4 shadow-lg"
				transition:slide={{ duration: 400, delay: 100 }}
			>
				<div class="flex flex-col gap-4 md:flex-row">
					<div class="flex-1">
						<div class="form-control">
							<div class="input-group">
								<input
									type="text"
									placeholder="Search conversations..."
									class="input-bordered input flex-1"
									bind:value={searchQuery}
									onkeydown={(e) => e.key === 'Enter' && handleSearch()}
								/>
								<button
									class="btn btn-square btn-primary"
									onclick={handleSearch}
									aria-label="Search conversations"
								>
									<span class="icon-[mdi--magnify] h-5 w-5"></span>
								</button>
							</div>
						</div>
					</div>
					<div class="form-control min-w-48">
						<select
							class="select-bordered select"
							bind:value={selectedLanguage}
							onchange={handleLanguageFilter}
						>
							<option value="">All Languages</option>
							{#each languages() as language (language)}
								<option value={language}>{language.toUpperCase()}</option>
							{/each}
						</select>
					</div>
				</div>

				{#if totalConversations > 0}
					<div class="mt-4 text-sm text-base-content/60">
						Showing {conversations.length} of {totalConversations} conversation{totalConversations ===
						1
							? ''
							: 's'}
					</div>
				{/if}
			</div>
		</div>

		<!-- Debug Panel -->
		{#if showDevMode && dev}
			<div
				class="mb-6 rounded-xl border border-warning/30 bg-warning/10 p-4"
				transition:slide={{ duration: 300 }}
			>
				<h3 class="mb-3 text-lg font-semibold text-warning">🐛 Debug Information</h3>
				<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
					<div class="rounded-lg bg-base-100 p-3">
						<h4 class="mb-2 text-sm font-medium">📊 State</h4>
						<div class="space-y-1 text-xs">
							<div>
								Conversations: <span class="badge badge-xs badge-primary"
									>{conversations.length}</span
								>
							</div>
							<div>
								Total: <span class="badge badge-xs badge-secondary">{totalConversations}</span>
							</div>
							<div>
								Expanded: <span class="badge badge-xs badge-accent"
									>{expandedConversations.size}</span
								>
							</div>
							<div>
								Loading Details: <span class="badge badge-xs badge-info">{loadingDetails.size}</span
								>
							</div>
							<div>
								Has More: <span class="badge badge-ghost badge-xs">{hasMore ? 'Yes' : 'No'}</span>
							</div>
						</div>
					</div>
					<div class="rounded-lg bg-base-100 p-3">
						<h4 class="mb-2 text-sm font-medium">🔍 Filters</h4>
						<div class="space-y-1 text-xs">
							<div>
								Search: <span class="badge badge-outline badge-xs">{searchQuery || 'None'}</span>
							</div>
							<div>
								Language: <span class="badge badge-outline badge-xs"
									>{selectedLanguage || 'All'}</span
								>
							</div>
							<div>Page: <span class="badge badge-outline badge-xs">{currentPage}</span></div>
						</div>
					</div>
					<div class="rounded-lg bg-base-100 p-3">
						<h4 class="mb-2 text-sm font-medium">💾 Cached Details</h4>
						<div class="space-y-1 text-xs">
							{#each Array.from(conversationDetails.keys()) as id (id)}
								<div class="badge badge-xs badge-success">{id.slice(0, 8)}...</div>
							{/each}
							{#if conversationDetails.size === 0}
								<div class="text-base-content/50">No cached details</div>
							{/if}
						</div>
					</div>
				</div>

				<!-- Force Expand All for Testing -->
				<div class="mt-4 flex gap-2">
					<button
						class="btn btn-outline btn-xs btn-warning"
						onclick={() => {
							console.log('🚀 Force expanding all conversations');
							conversations.forEach((c) => {
								expandedConversations.add(c.id);
								if (!conversationDetails.has(c.id)) {
									loadConversationDetails(c.id);
								}
							});
							expandedConversations = new SvelteSet(expandedConversations);
						}}
					>
						Expand All (Test)
					</button>
					<button
						class="btn btn-outline btn-xs"
						onclick={() => {
							console.log('📤 Collapsing all conversations');
							expandedConversations.clear();
							expandedConversations = new SvelteSet(expandedConversations);
						}}
					>
						Collapse All
					</button>
				</div>
			</div>
		{/if}

		<!-- Conversations List -->
		{#if loading && conversations.length === 0}
			<div class="flex items-center justify-center py-12">
				<span class="loading loading-lg loading-spinner"></span>
			</div>
		{:else if error}
			<div class="alert alert-error" transition:slide={{ duration: 300 }}>
				<span class="icon-[mdi--alert-circle-outline] h-6 w-6 shrink-0"></span>
				<span>{error}</span>
			</div>
		{:else if conversations.length === 0}
			<div class="py-12 text-center" transition:fade={{ duration: 400 }}>
				<div class="mx-auto max-w-md rounded-xl bg-base-100 p-8 shadow-lg">
					<span class="mx-auto mb-4 icon-[mdi--message-text-outline] h-16 w-16 text-base-content/30"
					></span>
					<h3 class="mb-2 text-xl font-semibold">No conversations yet</h3>
					<p class="mb-4 text-base-content/70">
						Start your first conversation to see your history here
					</p>
					<button class="btn btn-primary" onclick={startNewConversation}>
						Start Conversation
					</button>
				</div>
			</div>
		{:else}
			<div
				class="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-base-100/80 p-3 shadow-sm"
			>
				<div class="flex items-center gap-2 text-sm">
					<input
						type="checkbox"
						class="checkbox checkbox-sm"
						checked={allVisibleSelected()}
						onchange={(event) => handleSelectAllVisible(event.currentTarget.checked)}
						use:setIndeterminate={hasVisibleSelection() && !allVisibleSelected()}
						aria-label="Select all conversations on this page"
					/>
					<span>
						{hasSelection() ? `${selectedCount()} selected` : 'Select conversations'}
					</span>
					{#if hasSelection()}
						<button class="btn btn-ghost btn-xs" onclick={clearSelection}>Clear</button>
					{/if}
				</div>
				<div class="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
					{#if actionMessage}
						<span class="text-success">{actionMessage}</span>
					{/if}
					{#if actionError}
						<span class="text-error">{actionError}</span>
					{/if}
					<button
						class="btn btn-sm btn-error"
						disabled={!hasSelection() || deleting}
						onclick={deleteSelectedConversations}
						aria-label="Delete selected conversations"
					>
						{#if deleting}
							<span class="loading loading-xs loading-spinner"></span>
						{:else}
							<span class="icon-[mdi--trash-can-outline] h-4 w-4 sm:mr-1"></span>
						{/if}
						<span class="hidden sm:inline">Delete</span>
					</button>
				</div>
			</div>
			<ul
				class="list rounded-box bg-base-100 shadow-md"
				transition:fade={{ duration: 400, delay: 200 }}
			>
				<li class="p-4 pb-2 text-xs tracking-wide opacity-60">
					Your Conversation History ({totalConversations} conversation{totalConversations === 1
						? ''
						: 's'})
				</li>

				{#each conversations as conversation, i (i)}
					<li
						class="list-row flex flex-wrap items-start gap-4"
						transition:slide={{ duration: 300, delay: i * 50 }}
					>
						<!-- Selection Checkbox -->
						<label class="mt-1 flex items-start">
							<input
								type="checkbox"
								class="checkbox checkbox-sm"
								checked={selectedConversations.has(conversation.id)}
								onchange={(event) =>
									handleConversationCheckbox(conversation.id, event.currentTarget.checked)}
								aria-label={`Select conversation ${conversation.title}`}
							/>
						</label>

						<!-- Language Icon/Avatar -->
						<div class="placeholder avatar">
							<div class="h-10 w-10 rounded-full bg-primary text-primary-content">
								<span class="text-xs font-bold">{conversation.targetLanguageId.toUpperCase()}</span>
							</div>
						</div>

						<!-- Conversation Info -->
						<div>
							<div class="mb-1 flex items-center gap-2">
								<span class="font-medium">{conversation.title}</span>
								{#if conversation.isOnboarding}
									<div class="badge badge-xs badge-info">Onboarding</div>
								{/if}
								{#if conversation.scenarioId}
									<div class="badge badge-xs badge-accent">Scenario</div>
								{/if}
								{#if dev && showDevMode}
									<div class="badge badge-xs font-mono badge-warning" title="Conversation ID">
										{conversation.id}
									</div>
								{/if}
							</div>
							<div class="text-xs font-semibold uppercase opacity-60">
								{formatDate(conversation.startedAt)}
								{#if conversation.endedAt}
									• {formatDuration(conversation.durationSeconds)}
								{/if}
								• {conversation.messageCount} message{conversation.messageCount === 1 ? '' : 's'}
							</div>
						</div>

						<!-- Conversation Preview -->
						<p class="list-col-wrap text-xs">
							{#if conversation.preview?.firstUserMessage}
								"{conversation.preview.firstUserMessage}"
							{:else if conversation.preview?.lastMessage}
								"{conversation.preview.lastMessage}"
							{:else}
								No preview available
							{/if}
						</p>

						<!-- Actions -->
						<button
							class="btn btn-square btn-ghost"
							onclick={() => goToAnalysis(conversation.id)}
							title="Analyze conversation"
							aria-label="Analyze conversation"
						>
							<span class="icon-[mdi--chart-bar] size-[1.2em]"></span>
						</button>

						<button
							class="btn btn-square btn-ghost"
							onclick={() => toggleConversation(conversation.id)}
							title={expandedConversations.has(conversation.id)
								? 'Hide conversation'
								: 'Show conversation'}
							disabled={loadingDetails.has(conversation.id)}
						>
							{#if loadingDetails.has(conversation.id)}
								<span class="loading loading-xs loading-spinner"></span>
							{:else if expandedConversations.has(conversation.id)}
								<span class="icon-[mdi--chevron-up] size-[1.2em]"></span>
							{:else}
								<span class="icon-[mdi--chevron-down] size-[1.2em]"></span>
							{/if}
						</button>
					</li>

					<!-- Expanded Conversation Content -->
					{#if expandedConversations.has(conversation.id) && conversationDetails.has(conversation.id)}
						{@const data = conversationDetails.get(conversation.id)}
						{#if data}
							<li
								class="bg-base-50 ml-6 border-l-4 border-primary/20"
								transition:slide={{ duration: 400 }}
							>
								<div class="p-4">
									<!-- Stats Row -->
									<div class="mb-4 grid grid-cols-2 gap-4 md:grid-cols-4">
										<div class="stat rounded-lg bg-base-200 p-2">
											<div class="stat-title text-xs">Total Messages</div>
											<div class="stat-value text-sm text-primary">
												{data.details.stats.totalMessages}
											</div>
										</div>
										<div class="stat rounded-lg bg-base-200 p-2">
											<div class="stat-title text-xs">Your Messages</div>
											<div class="stat-value text-sm text-secondary">
												{data.details.stats.userMessages}
											</div>
										</div>
										<div class="stat rounded-lg bg-base-200 p-2">
											<div class="stat-title text-xs">Avg Words</div>
											<div class="stat-value text-sm text-accent">
												{data.details.stats.averageWordsPerMessage}
											</div>
										</div>
										<div class="stat rounded-lg bg-base-200 p-2">
											<div class="stat-title text-xs">Duration</div>
											<div class="stat-value text-sm text-info">
												{formatDuration(data.details.stats.conversationDuration)}
											</div>
										</div>
									</div>

									<!-- Messages -->
									<div class="mb-4">
										<h4 class="mb-2 flex items-center text-sm font-medium">
											<span class="mr-2 icon-[mdi--message-text-outline] h-4 w-4"></span>
											Conversation Messages
										</h4>
										<VirtualizedMessageList
											messages={data.messages}
											maxHeight="30vh"
											autoScroll={false}
										/>
									</div>

									<!-- Summary Placeholder -->
									<div class="rounded-lg bg-base-200 p-3">
										<h5 class="mb-1 flex items-center text-sm font-medium">
											<span class="mr-2 icon-[mdi--file-document-outline] h-4 w-4"></span>
											AI Summary
										</h5>
										<p class="text-xs text-base-content/70">
											Coming soon: AI-generated conversation summary and insights
										</p>
									</div>
								</div>
							</li>
						{/if}
					{/if}
				{/each}
			</ul>

			<!-- Load More Button -->
			{#if hasMore}
				<div class="mt-6 text-center">
					<button class="btn btn-outline" onclick={loadMore} disabled={loading}>
						{#if loading}
							<span class="loading mr-2 loading-sm loading-spinner"></span>
						{/if}
						Load More Conversations
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>
