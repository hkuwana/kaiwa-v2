<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { fade, slide } from 'svelte/transition';
	import { dev } from '$app/environment';
	import type { Message } from '$lib/server/db/types';
	import VirtualizedMessageList from '$lib/features/conversation/components/VirtualizedMessageList.svelte';
	import { SvelteDate, SvelteMap, SvelteSet, SvelteURLSearchParams } from 'svelte/reactivity';

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
		preview: {
			firstUserMessage: string | null;
			lastMessage: string | null;
			messageCount: number;
		};
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
	let conversationDetails = $state<
		Map<string, { details: ConversationDetails; messages: Message[] }>
	>(new SvelteMap());
	let expandedConversations = $state<Set<string>>(new SvelteSet());
	let loading = $state(true);
	let error = $state<string | null>(null);
	let searchQuery = $state('');
	let selectedLanguage = $state('');
	let currentPage = $state(0);
	let totalConversations = $state(0);
	let hasMore = $state(false);
	let loadingDetails = $state<Set<string>>(new SvelteSet());
	let showDevMode = $state(false);

	const limit = 10;
	const languages = $derived(() => {
		const langs = new SvelteSet(conversations.map((c) => c.targetLanguageId));
		return Array.from(langs).sort();
	});

	onMount(() => {
		loadConversations();
	});

	async function loadConversations(reset = false) {
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

			if (reset) {
				conversations = data.data.conversations;
			} else {
				conversations = [...conversations, ...data.data.conversations];
			}

			totalConversations = data.data.pagination.total;
			hasMore = data.data.pagination.hasMore;
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
			console.error('Error loading conversations:', err);
		} finally {
			loading = false;
		}
	}

	async function loadConversationDetails(conversationId: string) {
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

	async function toggleConversation(conversationId: string) {
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

	function handleSearch() {
		loadConversations(true);
	}

	function handleLanguageFilter() {
		loadConversations(true);
	}

	function loadMore() {
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

	function goToAnalysis(conversationId: string) {
		goto(`/analysis?sessionId=${conversationId}`);
	}

	function startNewConversation() {
		goto(resolve('/conversation'));
	}
</script>

<svelte:head>
	<title>Conversation History - Kaiwa</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200">
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
						<svg class="mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 6v6m0 0v6m0-6h6m-6 0H6"
							/>
						</svg>
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
									<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
										/>
									</svg>
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
							{#each languages() as language}
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
							{#each Array.from(conversationDetails.keys()) as id}
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
				<svg class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
					/>
				</svg>
				<span>{error}</span>
			</div>
		{:else if conversations.length === 0}
			<div class="py-12 text-center" transition:fade={{ duration: 400 }}>
				<div class="mx-auto max-w-md rounded-xl bg-base-100 p-8 shadow-lg">
					<svg
						class="mx-auto mb-4 h-16 w-16 text-base-content/30"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
						/>
					</svg>
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
			<ul
				class="list rounded-box bg-base-100 shadow-md"
				transition:fade={{ duration: 400, delay: 200 }}
			>
				<li class="p-4 pb-2 text-xs tracking-wide opacity-60">
					Your Conversation History ({totalConversations} conversation{totalConversations === 1
						? ''
						: 's'})
				</li>

				{#each conversations as conversation, i}
					<li class="list-row" transition:slide={{ duration: 300, delay: i * 50 }}>
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
							{#if conversation.preview.firstUserMessage}
								"{conversation.preview.firstUserMessage}"
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
							<svg class="size-[1.2em]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
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
								<svg class="size-[1.2em]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M5 15l7-7 7 7"
									/>
								</svg>
							{:else}
								<svg class="size-[1.2em]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 9l-7 7-7-7"
									/>
								</svg>
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
											<svg
												class="mr-2 h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
												/>
											</svg>
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
											<svg
												class="mr-2 h-4 w-4"
												fill="none"
												viewBox="0 0 24 24"
												stroke="currentColor"
											>
												<path
													stroke-linecap="round"
													stroke-linejoin="round"
													stroke-width="2"
													d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
												/>
											</svg>
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
