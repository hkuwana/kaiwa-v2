<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';

	type Platform = 'reddit' | 'instagram' | 'twitter' | 'linkedin' | 'tiktok';
	type ContentType = string;

	interface MarketingContent {
		platform: Platform;
		content: string;
		hashtags: string[];
		imagePrompt?: string;
		scheduledFor?: Date;
	}

	interface JapanesePhrase {
		english: string;
		japanese: string;
		romaji: string;
		context: string;
		formality: 'casual' | 'polite' | 'formal';
	}

	let selectedPlatform: Platform = $state('reddit');
	let selectedType: ContentType = $state('');
	let availableTypes: ContentType[] = $state([]);
	let generatedContent: MarketingContent | null = $state(null);
	let japanesePhrases: JapanesePhrase[] = $state([]);
	let isLoading = $state(false);
	let error = $state('');

	const platforms: { value: Platform; label: string; icon: string }[] = [
		{ value: 'reddit', label: 'Reddit', icon: '🔴' },
		{ value: 'instagram', label: 'Instagram', icon: '📸' },
		{ value: 'twitter', label: 'Twitter/X', icon: '🐦' },
		{ value: 'linkedin', label: 'LinkedIn', icon: '💼' },
		{ value: 'tiktok', label: 'TikTok', icon: '🎵' }
	];

	onMount(async () => {
		await loadContentTypes();
		await loadJapanesePhrases();
	});

	async function loadContentTypes() {
		try {
			const response = await fetch(`/api/marketing/content?platform=${selectedPlatform}`);
			const data = await response.json();

			if (data.success) {
				availableTypes = data.contentTypes;
				selectedType = availableTypes[0] || '';
			} else {
				error = data.error || 'Failed to load content types';
			}
		} catch {
			error = 'Failed to load content types';
		}
	}

	async function loadJapanesePhrases() {
		try {
			const response = await fetch('/api/marketing/japanese-phrases');
			const data = await response.json();

			if (data.success) {
				japanesePhrases = data.phrases;
			} else {
				error = data.error || 'Failed to load Japanese phrases';
			}
		} catch {
			error = 'Failed to load Japanese phrases';
		}
	}

	async function generateContent() {
		if (!selectedPlatform || !selectedType) return;

		isLoading = true;
		error = '';

		try {
			const response = await fetch('/api/marketing/content', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					platform: selectedPlatform,
					type: selectedType
				})
			});

			const data = await response.json();

			if (data.success) {
				generatedContent = data.content;
			} else {
				error = data.error || 'Failed to generate content';
			}
		} catch {
			error = 'Failed to generate content';
		} finally {
			isLoading = false;
		}
	}

	async function onPlatformChange() {
		selectedType = '';
		await loadContentTypes();
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}

	function goBack() {
		goto(resolve('/dev/marketing'));
	}

	function formatHashtags(hashtags: string[]): string {
		return hashtags.map((tag) => `#${tag}`).join(' ');
	}
</script>

<svelte:head>
	<title>Dev — Marketing Automation</title>
	<meta name="robots" content="noindex,nofollow" />
</svelte:head>

<div class="min-h-screen bg-base-200">
	<div class="container mx-auto max-w-6xl px-4 py-10">
		<div class="mb-6 flex items-center justify-between">
			<h1 class="text-2xl font-bold">AI Marketing Automation</h1>
			<div class="flex gap-2">
				<button class="btn btn-sm" onclick={goBack}>← Back to Marketing</button>
			</div>
		</div>

		{#if error}
			<div class="mb-6 alert alert-error">
				<span>{error}</span>
			</div>
		{/if}

		<!-- Automated Posting Section -->
		<div class="card mb-6 border border-primary/20 bg-primary/10">
			<div class="card-body">
				<h2 class="card-title text-primary">🚀 Automated Posting System</h2>
				<p class="mb-4 text-base-content/70">
					Schedule and automatically post AI-generated content across multiple platforms
				</p>
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					<div class="card bg-base-100 shadow">
						<div class="card-body p-4">
							<h3 class="font-semibold text-green-600">✅ Reddit Automation</h3>
							<p class="mb-2 text-sm text-base-content/70">Auto-post to relevant subreddits</p>
							<div class="text-xs text-base-content/60">
								Last post: 2 hours ago<br />
								Next post: In 4 hours
							</div>
						</div>
					</div>
					<div class="card bg-base-100 shadow">
						<div class="card-body p-4">
							<h3 class="font-semibold text-blue-600">📸 Instagram Ready</h3>
							<p class="mb-2 text-sm text-base-content/70">Visual content with captions</p>
							<div class="text-xs text-base-content/60">
								Last post: 1 day ago<br />
								Next post: Tomorrow 9 AM
							</div>
						</div>
					</div>
					<div class="card bg-base-100 shadow">
						<div class="card-body p-4">
							<h3 class="font-semibold text-sky-600">🐦 Twitter Active</h3>
							<p class="mb-2 text-sm text-base-content/70">Threads and quick tips</p>
							<div class="text-xs text-base-content/60">
								Last post: 3 hours ago<br />
								Next post: In 2 hours
							</div>
						</div>
					</div>
				</div>
				<div class="mt-4 flex gap-2">
					<button class="btn btn-primary">Schedule New Post</button>
					<button class="btn btn-outline">View Posting Calendar</button>
					<button class="btn btn-outline">Analytics Dashboard</button>
				</div>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
			<!-- Content Generator -->
			<div class="card bg-base-100 shadow-lg">
				<div class="card-body">
					<h2 class="card-title">Content Generator</h2>

					<div class="form-control w-full">
						<label class="label" for="platform-select">
							<span class="label-text">Platform</span>
						</label>
						<select
							id="platform-select"
							class="select-bordered select"
							bind:value={selectedPlatform}
							onchange={onPlatformChange}
						>
							{#each platforms as platform (platform.value)}
								<option value={platform.value}>
									{platform.icon}
									{platform.label}
								</option>
							{/each}
						</select>
					</div>

					<div class="form-control w-full">
						<label class="label" for="type-select">
							<span class="label-text">Content Type</span>
						</label>
						<select id="type-select" class="select-bordered select" bind:value={selectedType}>
							{#each availableTypes as type (type)}
								<option value={type}>
									{type.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
								</option>
							{/each}
						</select>
					</div>

					<button
						class="btn btn-primary"
						onclick={generateContent}
						disabled={isLoading || !selectedType}
					>
						{isLoading ? 'Generating...' : 'Generate Content'}
					</button>
				</div>
			</div>

			<!-- Generated Content -->
			{#if generatedContent}
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title">Generated Content</h2>

						<div class="mb-4">
							<div class="mb-2 badge badge-primary">
								{generatedContent.platform.toUpperCase()}
							</div>
							{#if generatedContent.imagePrompt}
								<div class="mb-2 badge badge-secondary">
									Image: {generatedContent.imagePrompt}
								</div>
							{/if}
						</div>

						<div class="mb-4">
							<h3 class="mb-2 font-semibold">Content:</h3>
							<div class="rounded-lg bg-base-200 p-4">
								<pre class="text-sm whitespace-pre-wrap">{generatedContent?.content || ''}</pre>
							</div>
							<button
								class="btn mt-2 btn-outline btn-sm"
								onclick={() => copyToClipboard(generatedContent?.content || '')}
							>
								Copy Content
							</button>
						</div>

						<div class="mb-4">
							<h3 class="mb-2 font-semibold">Hashtags:</h3>
							<div class="rounded-lg bg-base-200 p-4">
								<p class="text-sm">{formatHashtags(generatedContent?.hashtags || [])}</p>
							</div>
							<button
								class="btn mt-2 btn-outline btn-sm"
								onclick={() => copyToClipboard(formatHashtags(generatedContent?.hashtags || []))}
							>
								Copy Hashtags
							</button>
						</div>

						{#if generatedContent.imagePrompt}
							<div class="mb-4">
								<h3 class="mb-2 font-semibold">Image Prompt:</h3>
								<div class="rounded-lg bg-base-200 p-4">
									<p class="text-sm">{generatedContent?.imagePrompt || ''}</p>
								</div>
								<button
									class="btn mt-2 btn-outline btn-sm"
									onclick={() => copyToClipboard(generatedContent?.imagePrompt || '')}
								>
									Copy Prompt
								</button>
							</div>
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Japanese Phrases Helper -->
		<div class="card mt-8 bg-base-100 shadow-lg">
			<div class="card-body">
				<h2 class="card-title">Japanese Phrases Helper</h2>
				<p class="mb-4 text-sm text-base-content/70">
					Useful Japanese phrases for marketing content and real conversations
				</p>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					{#each japanesePhrases as phrase (phrase.english)}
						<div class="card bg-base-200 shadow">
							<div class="card-body p-4">
								<div class="mb-2 flex items-start justify-between">
									<h3 class="text-sm font-semibold">{phrase.english}</h3>
									<div class="badge badge-outline badge-sm">
										{phrase.formality}
									</div>
								</div>

								<div class="mb-2">
									<p class="text-lg font-medium">{phrase.japanese}</p>
									<p class="text-sm text-base-content/70">{phrase.romaji}</p>
								</div>

								<p class="text-xs text-base-content/60">{phrase.context}</p>

								<button
									class="btn mt-2 btn-outline btn-xs"
									onclick={() =>
										copyToClipboard(`${phrase.english}\n${phrase.japanese}\n${phrase.romaji}`)}
								>
									Copy
								</button>
							</div>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<!-- Marketing Strategy Tips -->
		<div class="card mt-8 bg-base-100 shadow-lg">
			<div class="card-body">
				<h2 class="card-title">Marketing Strategy Tips</h2>

				<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
					<div>
						<h3 class="mb-2 font-semibold">Platform-Specific Tips</h3>
						<ul class="space-y-2 text-sm">
							<li>
								<strong>Reddit:</strong> Focus on value-first content, disclose self-promo, engage genuinely
							</li>
							<li>
								<strong>Instagram:</strong> Use stories for behind-the-scenes, reels for quick tips
							</li>
							<li><strong>Twitter:</strong> Thread longer content, engage with replies quickly</li>
							<li>
								<strong>LinkedIn:</strong> Professional insights, personal stories, industry discussions
							</li>
							<li><strong>TikTok:</strong> Quick hooks, authentic moments, trending sounds</li>
						</ul>
					</div>

					<div>
						<h3 class="mb-2 font-semibold">Content Best Practices</h3>
						<ul class="space-y-2 text-sm">
							<li>Share personal stories and struggles</li>
							<li>Focus on emotional conversations, not just vocabulary</li>
							<li>Use authentic Japanese phrases in context</li>
							<li>Engage with comments and build community</li>
							<li>Track what content performs best</li>
							<li>Be consistent with posting schedule</li>
						</ul>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>
