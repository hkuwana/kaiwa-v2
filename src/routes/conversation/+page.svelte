<script lang="ts">
	import { createConversationStore } from '$lib/orchestrator.svelte';
	import ConversationHistory from '$lib/components/ConversationHistory.svelte';
	import RecordButton from '$lib/components/RecordButton.svelte';
	import { trackConversion, trackFeature } from '$lib/analytics/posthog';
	import { getLanguageByCode } from '$lib/data/languages';

	// 🎯 Page data from server
	const { data } = $props<{
		data: {
			user: any;
			language: string;
			mode: 'traditional' | 'realtime';
			voice: string;
			seo: any;
		};
	}>();

	// 🎯 Single conversation store - the heart of the app
	const conversation = createConversationStore();

	// 🎨 UI state
	let showDebug = $state(false);

	// 🎯 Get language details for display
	const languageDetails = $derived(() => getLanguageByCode(data.language));

	// 🎯 Initialize conversation with URL parameters
	$effect(() => {
		if (data.language && data.mode && data.voice) {
			conversation.startConversation(data.mode, data.language, data.voice);
		}
	});

	// 🎯 Main interaction - toggle recording
	async function toggleRecording() {
		try {
			if (conversation.state.sessionId === '') {
				// Start new conversation with selected settings
				await conversation.startConversation(data.mode, data.language, data.voice);
			}
			await conversation.toggleRecording();
		} catch (error) {
			console.error('Recording toggle failed:', error);
		}
	}

	// 🎯 Start fresh conversation
	async function startFresh() {
		await conversation.endConversation();
		await conversation.startConversation(data.mode, data.language, data.voice);
	}

	// 🎨 Status text
	const statusText = $derived(() => {
		if (conversation.hasError) return conversation.state.error;
		if (conversation.state.status === 'realtime-connected') return 'Connected - Ready to stream';
		if (conversation.state.status === 'realtime-streaming')
			return 'Live conversation - Speak naturally';
		if (conversation.isRecording) return 'Recording... Speak now!';
		if (conversation.isProcessing) return 'Processing your speech...';
		if (conversation.isSpeaking) return 'AI is speaking...';
		if (conversation.messageCount > 0) return `${conversation.messageCount} exchanges`;
		return conversation.state.mode === 'realtime'
			? 'Click to connect for real-time chat'
			: 'Click to start speaking';
	});

	// 🧹 Cleanup on page unload
	if (typeof window !== 'undefined') {
		window.addEventListener('beforeunload', () => {
			conversation.cleanup();
		});
	}
</script>

<svelte:head>
	<!-- Page-specific SEO -->
	<title>{data.seo.title}</title>
	<meta name="description" content={data.seo.description} />
	<meta name="keywords" content={data.seo.keywords} />

	<!-- Open Graph -->
	<meta property="og:title" content={data.seo.title} />
	<meta property="og:description" content={data.seo.description} />
	<meta property="og:url" content={data.seo.canonical} />

	<!-- Twitter -->
	<meta name="twitter:title" content={data.seo.title} />
	<meta name="twitter:description" content={data.seo.description} />

	<!-- Canonical -->
	<link rel="canonical" href={data.seo.canonical} />

	<!-- Structured Data -->
	<script type="application/ld+json">
		{JSON.stringify(data.seo.structuredData)}
	</script>
</svelte:head>

<div class="min-h-screen bg-base-100">
	<!-- Header -->
	<header class="navbar bg-base-200/50 backdrop-blur-sm">
		<div class="navbar-start">
			<!-- Back to Home -->
			<a href="/" class="btn btn-ghost btn-sm">
				<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M15 19l-7-7 7-7"
					/>
				</svg>
				<span class="hidden sm:inline">Back</span>
			</a>
		</div>

		<div class="navbar-center">
			<div class="text-center">
				<h1 class="text-2xl font-bold text-primary">Kaiwa</h1>
				{#if languageDetails()}
					<p class="text-sm opacity-70">
						Practice {languageDetails()?.name} ({languageDetails()?.nativeName})
					</p>
					{#if languageDetails()?.writingSystem !== 'latin'}
						<div class="mt-1 badge badge-outline badge-xs">
							{languageDetails()?.writingSystem} script
						</div>
					{/if}
				{:else}
					<p class="text-sm opacity-70">Practice speaking with AI</p>
				{/if}
			</div>
		</div>

		<div class="navbar-end">
			{#if data.user}
				<div class="dropdown dropdown-end">
					<div tabindex="0" role="button" class="btn avatar btn-circle btn-ghost">
						<div class="w-8 rounded-full">
							{#if data.user.avatarUrl}
								<img src={data.user.avatarUrl} alt="Profile" />
							{:else}
								<div
									class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-content"
								>
									{data.user.displayName?.[0] || 'U'}
								</div>
							{/if}
						</div>
					</div>
					<ul
						tabindex="0"
						class="dropdown-content menu z-[1] mt-3 w-52 menu-sm rounded-box bg-base-100 p-2 shadow"
					>
						<li class="menu-title">
							<span class="text-sm opacity-70">{data.user.displayName || 'User'}</span>
						</li>
						<div class="divider my-1"></div>
						<li>
							<form action="/logout" method="post">
								<button type="submit" class="w-full text-left">Sign out</button>
							</form>
						</li>
					</ul>
				</div>
			{:else}
				<a href="/login" class="btn btn-sm btn-primary">Sign in</a>
			{/if}
		</div>
	</header>

	<!-- Main conversation area -->
	<main class="container mx-auto px-4 py-8">
		<!-- Conversation history -->
		<div class="mb-8">
			<ConversationHistory messages={conversation.state.messages} />
		</div>

		<!-- Main record button -->
		<div class="mb-8 flex flex-col items-center space-y-8">
			<RecordButton
				isRecording={conversation.isRecording}
				isProcessing={conversation.isProcessing}
				isSpeaking={conversation.isSpeaking}
				hasError={conversation.hasError}
				onclick={toggleRecording}
			/>

			<!-- Status text -->
			<div class="text-center">
				{#if conversation.hasError}
					<div class="alert max-w-md alert-error">
						<svg class="h-6 w-6 shrink-0 stroke-current" fill="none" viewBox="0 0 24 24">
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
							></path>
						</svg>
						<span>{statusText()}</span>
					</div>
				{:else}
					<p class="max-w-md text-lg font-medium">
						{statusText()}
					</p>
				{/if}
			</div>
		</div>

		<!-- Action buttons -->
		<div class="flex justify-center space-x-4">
			{#if conversation.state.messages.length > 0}
				<button class="btn btn-outline btn-secondary" onclick={startFresh}>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
						/>
					</svg>
					New Conversation
				</button>
			{/if}

			<button class="btn btn-ghost btn-sm" onclick={() => (showDebug = !showDebug)}>
				{showDebug ? '🙈 Hide Debug' : '🔍 Debug'}
			</button>
		</div>
	</main>

	<!-- Debug panel -->
	{#if showDebug}
		<div class="container mx-auto mb-8 px-4">
			<div class="card bg-base-200">
				<div class="card-body">
					<h3 class="card-title text-sm">🐛 Debug Info</h3>
					<div class="mockup-code max-h-48 overflow-y-auto">
						<pre data-prefix="$"><code>{JSON.stringify(conversation.state, null, 2)}</code></pre>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Footer -->
	<footer class="footer-center footer bg-base-200 p-6 text-base-content">
		<div>
			<p>Speak naturally • AI will respond • Keep practicing</p>
		</div>
	</footer>
</div>
