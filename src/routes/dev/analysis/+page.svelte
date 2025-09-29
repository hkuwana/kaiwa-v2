<script lang="ts">
	import { onMount } from 'svelte';
	import MessageBubble from '$lib/features/conversation/components/MessageBubble.svelte';
	import { scenariosData } from '$lib/data/scenarios';

	type ModuleMeta = {
		id: string;
		label: string;
		description: string;
		modality: 'text' | 'audio';
		tier?: 'free' | 'pro' | 'premium';
		requiresAudio: boolean;
	};

	type MessageWithErrors = {
		id: string;
		role: 'user' | 'assistant';
		content: string;
		timestamp: Date;
		errors?: string[];
		expected?: string;
	};

	type ConversationSample = {
		title: string;
		messages: MessageWithErrors[];
	};

	let modules = $state<ModuleMeta[]>([]);
	let selectedModuleIds = $state<Set<string>>(new Set());
	let conversationId = $state('dev-conversation');
	let languageCode = $state('en');
	let selectedScenario = $state('wednesday-food');
	let showComparison = $state(false);
	let showModulesJson = $state(false);
	let showRawAnalysis = $state(false);
	let usageInfo = $state<any>(null);
	let showUsageDetails = $state(false);
	let showDebugInput = $state(false);

	// Mock conversation samples with errors and expected corrections
	const conversationSamples: Record<string, ConversationSample> = {
		'wednesday-food': {
			title: 'Barcelona Tapas Bar - Grammar Errors',
			messages: [
				{
					id: 'msg-1',
					role: 'assistant' as const,
					content: '¡Hola! Welcome to our tapas bar. What can I bring for you today?',
					timestamp: new Date('2024-01-15T19:30:00')
				},
				{
					id: 'msg-2',
					role: 'user' as const,
					content: 'Hi! I want to try some typical Spanish food. Can you recommend me something?',
					timestamp: new Date('2024-01-15T19:30:15'),
					errors: ['want to try → would like to try', 'recommend me → recommend to me'],
					expected:
						'Hi! I would like to try some typical Spanish food. Can you recommend something to me?'
				},
				{
					id: 'msg-3',
					role: 'assistant' as const,
					content:
						'Of course! I recommend the jamón ibérico, patatas bravas, and gambas al ajillo. They are our most popular dishes.',
					timestamp: new Date('2024-01-15T19:30:30')
				},
				{
					id: 'msg-4',
					role: 'user' as const,
					content: 'Sounds great! I will take the jamón and the gambas. How much time it takes?',
					timestamp: new Date('2024-01-15T19:30:45'),
					errors: ['How much time it takes? → How long does it take?'],
					expected: 'Sounds great! I will take the jamón and the gambas. How long does it take?'
				},
				{
					id: 'msg-5',
					role: 'assistant' as const,
					content: 'About 10-15 minutes. Would you like something to drink while you wait?',
					timestamp: new Date('2024-01-15T19:31:00')
				},
				{
					id: 'msg-6',
					role: 'user' as const,
					content: 'Yes, I would like a beer please. Do you have any local beers?',
					timestamp: new Date('2024-01-15T19:31:15')
				}
			]
		},
		'market-haggling': {
			title: 'Street Market - Complex Errors',
			messages: [
				{
					id: 'msg-1',
					role: 'assistant' as const,
					content: 'Buenos días! These oranges are very fresh, just arrived this morning.',
					timestamp: new Date('2024-01-15T10:00:00')
				},
				{
					id: 'msg-2',
					role: 'user' as const,
					content: 'Hello! How much costs one kilo of oranges?',
					timestamp: new Date('2024-01-15T10:00:10'),
					errors: ['How much costs → How much does... cost'],
					expected: 'Hello! How much does one kilo of oranges cost?'
				},
				{
					id: 'msg-3',
					role: 'assistant' as const,
					content: 'They are 3 euros per kilo. But for you, special price - 2.50 euros!',
					timestamp: new Date('2024-01-15T10:00:20')
				},
				{
					id: 'msg-4',
					role: 'user' as const,
					content: 'Hmm, that seems still expensive to me. In the other shop was more cheaper.',
					timestamp: new Date('2024-01-15T10:00:35'),
					errors: ['more cheaper → cheaper', 'In the other shop was → At the other shop it was'],
					expected: 'Hmm, that still seems expensive to me. At the other shop it was cheaper.'
				},
				{
					id: 'msg-5',
					role: 'assistant' as const,
					content: 'Okay, okay! For a good customer like you - 2 euros. Final price!',
					timestamp: new Date('2024-01-15T10:00:50')
				}
			]
		},
		'job-interview': {
			title: 'Job Interview - Advanced Grammar',
			messages: [
				{
					id: 'msg-1',
					role: 'assistant' as const,
					content:
						'Thank you for coming today. Can you tell me about a challenging project you have worked on?',
					timestamp: new Date('2024-01-15T14:00:00')
				},
				{
					id: 'msg-2',
					role: 'user' as const,
					content:
						'Yes, of course. Last year I was working in a project where we had to migrate the entire database to a new system.',
					timestamp: new Date('2024-01-15T14:00:15'),
					errors: ['working in a project → working on a project'],
					expected:
						'Yes, of course. Last year I was working on a project where we had to migrate the entire database to a new system.'
				},
				{
					id: 'msg-3',
					role: 'assistant' as const,
					content: 'That sounds complex. What was the biggest challenge you faced?',
					timestamp: new Date('2024-01-15T14:00:30')
				},
				{
					id: 'msg-4',
					role: 'user' as const,
					content:
						'The most difficult part was to ensure that no data would be lost during the migration. We have to test everything multiple times.',
					timestamp: new Date('2024-01-15T14:00:45'),
					errors: ['We have to test → We had to test (past tense consistency)'],
					expected:
						'The most difficult part was to ensure that no data would be lost during the migration. We had to test everything multiple times.'
				}
			]
		}
	};

	let messages = $derived(conversationSamples[selectedScenario]?.messages || []);

	let isLoading = $state(false);
	let lastRun: any = $state(null);
	let errorMessage = $state<string | null>(null);

	onMount(async () => {
		await loadModules();
	});

	async function loadModules() {
		try {
			const response = await fetch('/api/analysis/modules');
			if (!response.ok) throw new Error('Failed to load modules');

			const data = await response.json();
			modules = data.modules;

			selectedModuleIds = new Set(
				modules
					.filter((module: ModuleMeta) => module.modality === 'text')
					.map((module) => module.id)
			);
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Failed to load modules';
		}
	}

	async function runAnalysis() {
		isLoading = true;
		errorMessage = null;
		lastRun = null;
		usageInfo = null;

		try {
			const response = await fetch('/api/analysis/run', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					conversationId,
					languageCode,
					moduleIds: Array.from(selectedModuleIds),
					messages
				})
			});

			const data = await response.json();

			if (!response.ok || !data.success) {
				throw new Error(data?.error || 'Analysis failed');
			}

			lastRun = data.run;

			// Fetch updated usage info after running analysis
			try {
				const usageResponse = await fetch('/api/dev/usage-debug?action=current');
				if (usageResponse.ok) {
					const usageData = await usageResponse.json();
					usageInfo = usageData;
				}
			} catch (usageError) {
				console.warn('Could not fetch usage info:', usageError);
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Analysis failed';
		} finally {
			isLoading = false;
		}
	}

	function toggleModule(id: string) {
		const next = new Set(selectedModuleIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		selectedModuleIds = next;
	}
</script>

<div class="min-h-screen bg-base-200 py-10">
	<div class="mx-auto max-w-5xl space-y-8 px-4">
		<header class="rounded-lg bg-base-100 p-6 shadow">
			<h1 class="text-2xl font-semibold">Analysis Pipeline Sandbox</h1>
			<p class="mt-2 text-base-content">
				Run the new server-side analysis pipeline with synthetic conversation data. Select modules
				and see the raw output that would feed the UI.
			</p>
		</header>

		<section class="rounded-lg bg-base-100 p-6 shadow">
			<h2 class="text-xl font-semibold">Conversation Samples</h2>
			<div class="mt-4 space-y-6">
				<div class="flex flex-wrap gap-4">
					<label class="form-control">
						<div class="label">Conversation ID</div>
						<input class="input-bordered input" bind:value={conversationId} />
					</label>
					<label class="form-control">
						<div class="label">Language Code</div>
						<input class="input-bordered input" bind:value={languageCode} />
					</label>
					<label class="form-control">
						<div class="label">Scenario</div>
						<select class="select-bordered select" bind:value={selectedScenario}>
							<option value="wednesday-food">Barcelona Tapas Bar</option>
							<option value="market-haggling">Street Market Haggling</option>
							<option value="job-interview">Job Interview</option>
						</select>
					</label>
				</div>

				<div class="flex items-center gap-4">
					<label class="flex cursor-pointer items-center gap-2">
						<input type="checkbox" class="toggle toggle-primary" bind:checked={showComparison} />
						<span>Show Error Analysis</span>
					</label>
				</div>

				<!-- Scenario Info -->
				{#if conversationSamples[selectedScenario]}
					{@const scenario = scenariosData.find((s) => s.id === selectedScenario)}
					<div class="rounded-lg bg-base-200 p-4">
						<h3 class="font-semibold text-base-content">
							{conversationSamples[selectedScenario].title}
						</h3>
						{#if scenario}
							<p class="mt-2 text-sm text-base-content">
								{scenario.description} - {scenario.context}
							</p>
							<div class="mt-3 flex flex-wrap gap-2">
								<span class="badge badge-outline">{scenario.category}</span>
								<span class="badge badge-outline">{scenario.difficulty}</span>
							</div>
						{/if}
					</div>
				{/if}

				<!-- Messages Display -->
				<div class="space-y-4">
					{#each messages as message}
						<div class="space-y-2">
							<!-- Original message -->
							<MessageBubble
								message={{
									...message,
									conversationId: conversationId,
									sequenceId: null,
									translatedContent: null,
									sourceLanguage: null,
									targetLanguage: null,
									romanization: null,
									hiragana: null,
									otherScripts: null,
									audioUrl: null,
									isStreaming: null,
									hasCompleted: null,
									finishReason: null,
									toolCalls: null,
									toolCallResults: null,
									tokens: null,
									promptTokens: null,
									completionTokens: null,
									messageIntent: null
								} as any}
								conversationLanguage={languageCode}
								clickToToggle={false}
							/>

							<!-- Error analysis -->
							{#if showComparison && message.role === 'user' && (message.errors || message.expected)}
								<div class="bg-base ml-14 rounded-lg border border-warning/20 p-4">
									<div
										class="mb-2 flex items-center gap-2 text-sm font-semibold text-warning-content"
									>
										<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
											<path
												fill-rule="evenodd"
												d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
												clip-rule="evenodd"
											></path>
										</svg>
										Grammar Analysis
									</div>

									{#if message.errors}
										<div class="mb-3">
											<div class="mb-1 text-sm font-medium text-base-content/80">Errors Found:</div>
											<ul class="list-inside list-disc space-y-1 text-sm text-base-content">
												{#each message.errors as error}
													<li>{error}</li>
												{/each}
											</ul>
										</div>
									{/if}

									{#if message.expected}
										<div class="rounded border border-success/20 bg-success p-3">
											<div
												class="mb-1 flex items-center gap-2 text-sm font-medium text-success-content"
											>
												<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
													<path
														fill-rule="evenodd"
														d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
														clip-rule="evenodd"
													></path>
												</svg>
												Corrected Version:
											</div>
											<div class="text-sm text-base-content italic">"{message.expected}"</div>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		</section>

		<section class="rounded-lg bg-base-100 p-6 shadow">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold">Modules</h2>
				<label class="flex cursor-pointer items-center gap-2">
					<input type="checkbox" class="toggle toggle-sm" bind:checked={showModulesJson} />
					<span class="text-sm">Show JSON</span>
				</label>
			</div>

			{#if modules.length === 0}
				<p class="mt-2 text-base-content">Loading modules…</p>
			{:else}
				{#if showModulesJson}
					<!-- JSON Display -->
					<div class="mb-4 rounded-lg bg-base-200 p-4">
						<div class="mb-2 flex items-center gap-2">
							<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8zm0 4a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1v-2z"
									clip-rule="evenodd"
								></path>
							</svg>
							<h4 class="font-medium">Modules JSON Data</h4>
						</div>
						<pre
							class="max-h-96 overflow-auto rounded bg-base-300 p-4 text-xs text-base-content/80">{JSON.stringify(
								modules,
								null,
								2
							)}</pre>
					</div>
				{/if}

				<div class="grid gap-4 md:grid-cols-2">
					{#each modules as module}
						<label class="flex cursor-pointer flex-col gap-2 rounded border border-base-300 p-4">
							<div class="flex items-center justify-between gap-3">
								<span class="font-medium">{module.label}</span>
								<input
									type="checkbox"
									class="toggle"
									checked={selectedModuleIds.has(module.id)}
									onchange={() => toggleModule(module.id)}
								/>
							</div>
							<p class="text-sm text-base-content">{module.description}</p>
							<div class="text-xs text-base-content/50">
								Modality: {module.modality}
								{module.tier ? `• Tier: ${module.tier}` : ''}
							</div>
						</label>
					{/each}
				</div>

				<!-- Selected Modules Summary -->
				{#if selectedModuleIds.size > 0}
					<div class="mt-4 rounded-lg border border-info/20 bg-info p-4">
						<div class="mb-2 flex items-center gap-2">
							<svg class="h-4 w-4 text-info" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
									clip-rule="evenodd"
								></path>
							</svg>
							<span class="font-medium text-info-content"
								>Selected Modules ({selectedModuleIds.size})</span
							>
						</div>
						<div class="flex flex-wrap gap-2">
							{#each Array.from(selectedModuleIds) as moduleId}
								{@const module = modules.find((m) => m.id === moduleId)}
								{#if module}
									<span class="badge badge-sm badge-info">{module.label}</span>
								{/if}
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</section>

		<section class="rounded-lg bg-base-100 p-6 shadow">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-xl font-semibold">Analysis Results</h2>
				<div class="flex gap-4">
					<label class="flex cursor-pointer items-center gap-2">
						<input type="checkbox" class="toggle toggle-sm" bind:checked={showDebugInput} />
						<span class="text-sm">Show Debug Input</span>
					</label>
					{#if lastRun}
						<label class="flex cursor-pointer items-center gap-2">
							<input type="checkbox" class="toggle toggle-sm" bind:checked={showRawAnalysis} />
							<span class="text-sm">Show Raw JSON</span>
						</label>
					{/if}
				</div>
			</div>

			<div class="flex flex-wrap items-center gap-4">
				<button class="btn btn-primary" onclick={runAnalysis} disabled={isLoading}>
					{isLoading ? 'Running analysis…' : 'Run Analysis'}
				</button>
			</div>

			{#if errorMessage}
				<p class="mt-4 rounded bg-error/20 p-3 text-error">{errorMessage}</p>
			{/if}

			{#if showDebugInput}
				<!-- Debug Input Display -->
				<div class="mt-6 rounded-lg bg-base-200 p-4">
					<div class="mb-4 flex items-center gap-2">
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
								clip-rule="evenodd"
							></path>
						</svg>
						<h4 class="font-semibold">Analysis Input Data</h4>
						<button
							class="btn ml-auto btn-outline btn-xs"
							onclick={() =>
								navigator.clipboard.writeText(
									JSON.stringify(
										{
											conversationId,
											languageCode,
											moduleIds: Array.from(selectedModuleIds),
											messages: messages.map((m) => ({
												id: m.id,
												role: m.role,
												content: m.content,
												timestamp: m.timestamp
											}))
										},
										null,
										2
									)
								)}>Copy Input JSON</button
						>
					</div>
					<div class="grid gap-4 md:grid-cols-2">
						<div>
							<h5 class="mb-2 font-medium text-base-content/80">Request Metadata</h5>
							<div class="rounded bg-base-300 p-3 text-xs">
								<div><strong>Conversation ID:</strong> {conversationId}</div>
								<div><strong>Language Code:</strong> {languageCode}</div>
								<div><strong>Selected Modules:</strong> {Array.from(selectedModuleIds).length}</div>
								<div><strong>Messages Count:</strong> {messages.length}</div>
								<div>
									<strong>User Messages:</strong>
									{messages.filter((m) => m.role === 'user').length}
								</div>
							</div>
						</div>
						<div>
							<h5 class="mb-2 font-medium text-base-content/80">Selected Module IDs</h5>
							<div class="rounded bg-base-300 p-3 text-xs">
								<pre>{JSON.stringify(Array.from(selectedModuleIds), null, 2)}</pre>
							</div>
						</div>
					</div>
					<div class="mt-4">
						<h5 class="mb-2 font-medium text-base-content/80">Messages for Analysis</h5>
						<pre
							class="max-h-64 overflow-auto rounded bg-base-300 p-3 text-xs text-base-content/80">{JSON.stringify(
								messages.map((m) => ({
									id: m.id,
									role: m.role,
									content: m.content,
									timestamp: m.timestamp
								})),
								null,
								2
							)}</pre>
					</div>
				</div>
			{/if}

			{#if lastRun}
				<div class="mt-6 space-y-6">
					<!-- Usage Impact Info -->
					<div class="rounded-lg border border-success/20 bg-success p-4">
						<div class="mb-2 flex items-center gap-2">
							<svg class="h-5 w-5 text-success" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
									clip-rule="evenodd"
								></path>
							</svg>
							<h3 class="font-semibold text-success-content">Analysis Complete</h3>
						</div>
						<div class="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
							<div>
								<span class="text-success-content">Conversation ID:</span>
								<span class="font-mono text-success-content">{lastRun.conversationId}</span>
							</div>
							<div>
								<span class="text-success-content">Modules Run:</span>
								<span class="font-medium text-success-content"
									>{lastRun.moduleResults?.length || 0}</span
								>
							</div>
							<div>
								<span class="text-success-content">Messages Analyzed:</span>
								<span class="font-medium text-success-content">{messages.length}</span>
							</div>
						</div>
					</div>

					<!-- Usage Counter Display -->
					{#if usageInfo}
						<div class="rounded-lg border border-info/20 bg-info p-4">
							<div class="mb-3 flex items-center justify-between">
								<div class="flex items-center gap-2">
									<svg class="h-5 w-5 text-info" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 6a1 1 0 100-2 1 1 0 000 2z"
											clip-rule="evenodd"
										></path>
									</svg>
									<h3 class="font-semibold text-info-content">Usage Impact</h3>
								</div>
								<label class="flex cursor-pointer items-center gap-2">
									<input type="checkbox" class="toggle toggle-sm" bind:checked={showUsageDetails} />
									<span class="text-xs text-info-content">Details</span>
								</label>
							</div>

							<div class="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
								<div class="rounded border border-info/10 bg-info/5 p-3 text-center">
									<div class="text-lg font-bold text-info-content">
										{usageInfo.current?.analysesUsed || 0}
									</div>
									<div class="text-xs text-info-content/80">Total Analyses</div>
								</div>
								<div class="rounded border border-info/10 bg-info/5 p-3 text-center">
									<div class="text-lg font-bold text-info-content">
										{usageInfo.current?.basicAnalysesUsed || 0}
									</div>
									<div class="text-xs text-info-content/80">Basic Analyses</div>
								</div>
								<div class="rounded border border-info/10 bg-info/5 p-3 text-center">
									<div class="text-lg font-bold text-info-content">
										{usageInfo.current?.advancedGrammarUsed || 0}
									</div>
									<div class="text-xs text-info-content/80">Advanced Grammar</div>
								</div>
								<div class="rounded border border-info/10 bg-info/5 p-3 text-center">
									<div class="text-lg font-bold text-info-content">
										{usageInfo.current?.fluencyAnalysisUsed || 0}
									</div>
									<div class="text-xs text-info-content/80">Fluency Analysis</div>
								</div>
							</div>

							{#if showUsageDetails && usageInfo.current}
								<div class="mt-4 border-t border-info/20 pt-4">
									<h4 class="mb-2 font-medium text-info-content">Detailed Usage Breakdown</h4>
									<div class="grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
										<div class="space-y-1">
											<div class="flex justify-between">
												<span>Quick Stats Used:</span><span class="font-mono"
													>{usageInfo.current.quickStatsUsed || 0}</span
												>
											</div>
											<div class="flex justify-between">
												<span>Grammar Suggestions:</span><span class="font-mono"
													>{usageInfo.current.grammarSuggestionsUsed || 0}</span
												>
											</div>
											<div class="flex justify-between">
												<span>Phrase Suggestions:</span><span class="font-mono"
													>{usageInfo.current.phraseSuggestionsUsed || 0}</span
												>
											</div>
											<div class="flex justify-between">
												<span>Pronunciation Analysis:</span><span class="font-mono"
													>{usageInfo.current.pronunciationAnalysisUsed || 0}</span
												>
											</div>
										</div>
										<div class="space-y-1">
											<div class="flex justify-between">
												<span>Speech Rhythm:</span><span class="font-mono"
													>{usageInfo.current.speechRhythmUsed || 0}</span
												>
											</div>
											<div class="flex justify-between">
												<span>Audio Suggestions:</span><span class="font-mono"
													>{usageInfo.current.audioSuggestionUsed || 0}</span
												>
											</div>
											<div class="flex justify-between">
												<span>Onboarding Profile:</span><span class="font-mono"
													>{usageInfo.current.onboardingProfileUsed || 0}</span
												>
											</div>
											<div class="flex justify-between text-info-content/60">
												<span>Period:</span><span class="font-mono"
													>{usageInfo.current.period || 'N/A'}</span
												>
											</div>
										</div>
									</div>
								</div>
							{/if}
						</div>
					{/if}

					{#if showRawAnalysis}
						<!-- Raw JSON Display -->
						<div class="rounded-lg bg-base-200 p-4">
							<div class="mb-4 flex items-center gap-2">
								<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
									<path
										fill-rule="evenodd"
										d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z"
										clip-rule="evenodd"
									></path>
								</svg>
								<h4 class="font-semibold">Raw Analysis JSON</h4>
								<button
									class="btn ml-auto btn-outline btn-xs"
									onclick={() => navigator.clipboard.writeText(JSON.stringify(lastRun, null, 2))}
									>Copy JSON</button
								>
							</div>
							<pre
								class="max-h-96 overflow-auto rounded bg-base-300 p-4 text-xs text-base-content/80">{JSON.stringify(
									lastRun,
									null,
									2
								)}</pre>
						</div>
					{/if}

					<!-- Formatted Results -->
					<div class="space-y-4">
						<h3 class="flex items-center gap-2 font-semibold">
							<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
								<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
							</svg>
							Module Results
						</h3>
						{#each lastRun.moduleResults as moduleResult, index}
							<div class="bg-base-50 rounded-lg border border-base-300 p-4">
								<div class="mb-3 flex items-center justify-between">
									<div class="flex items-center gap-2">
										<span class="badge badge-sm badge-primary">{index + 1}</span>
										<span class="font-semibold text-base-content">{moduleResult.moduleId}</span>
									</div>
									{#if modules.find((m) => m.id === moduleResult.moduleId)}
										{@const module = modules.find((m) => m.id === moduleResult.moduleId)}
										{#if module}
											<div class="flex gap-1">
												<span class="badge badge-outline badge-xs">{module.modality}</span>
												{#if module.tier}
													<span class="badge badge-outline badge-xs">{module.tier}</span>
												{/if}
											</div>
										{/if}
									{/if}
								</div>

								{#if moduleResult.summary}
									<div class="mb-3">
										<h4 class="mb-1 text-sm font-medium text-base-content/80">Summary:</h4>
										<p class="rounded border-l-4 border-primary bg-base-100 p-3 text-base-content">
											{moduleResult.summary}
										</p>
									</div>
								{/if}

								{#if moduleResult.recommendations?.length}
									<div>
										<h4
											class="mb-2 flex items-center gap-1 text-sm font-medium text-base-content/80"
										>
											<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
												<path
													fill-rule="evenodd"
													d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1z"
													clip-rule="evenodd"
												></path>
											</svg>
											Recommendations ({moduleResult.recommendations.length}):
										</h4>
										<ul class="space-y-2">
											{#each moduleResult.recommendations as recommendation, recIndex}
												<li class="flex items-start gap-2 text-sm text-base-content/80">
													<span class="mt-0.5 badge badge-xs badge-info">{recIndex + 1}</span>
													<span>{recommendation}</span>
												</li>
											{/each}
										</ul>
									</div>
								{/if}

								{#if moduleResult.data && Object.keys(moduleResult.data).length > 0}
									<details class="mt-3">
										<summary
											class="flex cursor-pointer items-center gap-1 text-sm font-medium text-base-content/60 hover:text-base-content"
										>
											<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
												<path
													fill-rule="evenodd"
													d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm0 4a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8zm8 0a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1h-4a1 1 0 01-1-1V8z"
													clip-rule="evenodd"
												></path>
											</svg>
											Module Data (Click to expand)
										</summary>
										<pre
											class="mt-2 max-h-48 overflow-auto rounded bg-base-200 p-3 text-xs text-base-content">{JSON.stringify(
												moduleResult.data,
												null,
												2
											)}</pre>
									</details>
								{/if}
							</div>
						{/each}
					</div>
				</div>
			{/if}
		</section>

		<!-- Language Level Assessment Demo -->
		<section class="rounded-lg bg-base-100 p-6 shadow">
			<h2 class="mb-4 text-xl font-semibold">🎯 Language Level Assessment (New!)</h2>
			<div class="grid gap-6 md:grid-cols-2">
				<div class="space-y-4">
					<h3 class="flex items-center gap-2 text-lg font-medium">
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
						</svg>
						CEFR-to-Practical Mapping
					</h3>
					<div class="space-y-2 text-sm">
						<div class="rounded border border-blue-200 bg-blue-50 p-3">
							<div class="font-medium text-blue-900">A1.1-A1.2: Basic Talk</div>
							<div class="text-blue-700">Greetings, simple phrases, everyday conversations</div>
						</div>
						<div class="rounded border border-green-200 bg-green-50 p-3">
							<div class="font-medium text-green-900">B1.1: Converse with Strangers</div>
							<div class="text-green-700">Comfortable conversations with new people</div>
						</div>
						<div class="rounded border border-purple-200 bg-purple-50 p-3">
							<div class="font-medium text-purple-900">B2.1: University Level</div>
							<div class="text-purple-700">Academic discussions, complex topics</div>
						</div>
						<div class="rounded border border-orange-200 bg-orange-50 p-3">
							<div class="font-medium text-orange-900">B2.2: Work Conversations</div>
							<div class="text-orange-700">Professional settings, meetings, presentations</div>
						</div>
					</div>
				</div>

				<div class="space-y-4">
					<h3 class="flex items-center gap-2 text-lg font-medium">
						<svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
							<path
								d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
							></path>
						</svg>
						Confidence-First Approach
					</h3>
					<div class="space-y-3 text-sm">
						<div class="rounded border border-success/20 bg-success p-3">
							<div class="font-medium text-success-content">🌟 High Confidence</div>
							<div class="text-success-content/80">
								Initiates conversations, recovers from mistakes gracefully
							</div>
						</div>
						<div class="rounded border border-warning/20 bg-warning p-3">
							<div class="font-medium text-warning-content">💪 Building Confidence</div>
							<div class="text-warning-content/80">
								Uses complex structures, self-corrects occasionally
							</div>
						</div>
						<div class="rounded border border-info/20 bg-info p-3">
							<div class="font-medium text-info-content">🌱 Growing Confidence</div>
							<div class="text-info-content/80">Taking brave first steps, building foundation</div>
						</div>
					</div>

					<div class="mt-4 rounded border border-primary/20 bg-primary p-4">
						<h4 class="mb-2 font-medium text-primary-content">💡 Why Confidence Matters</h4>
						<p class="text-sm text-primary-content/80">
							Research shows that confident learners progress faster, retain more, and are more
							likely to continue learning. Unlike Duolingo's focus on streaks, we measure real
							conversational confidence.
						</p>
					</div>
				</div>
			</div>

			<!-- Test Assessment Button -->
			<div class="mt-6 rounded-lg bg-base-200 p-4">
				<h4 class="mb-3 font-medium">🧪 Test the Assessment API</h4>
				<p class="mb-3 text-sm text-base-content">
					Click below to test the language level assessment with the current scenario messages:
				</p>
				<button
					class="btn btn-primary"
					onclick={async () => {
						try {
							const response = await fetch('/api/analysis/assess-level', {
								method: 'POST',
								headers: { 'Content-Type': 'application/json' },
								body: JSON.stringify({
									languageCode,
									messages: messages
										.filter((m) => m.role === 'user')
										.map((m) => ({
											id: m.id,
											role: m.role,
											content: m.content,
											timestamp: m.timestamp?.toISOString()
										})),
									includeRecommendations: true
								})
							});
							const data = await response.json();
							console.log('Assessment Result:', data);
							alert(
								`Level: ${data.assessment?.currentLevel?.practicalLevel || 'Unknown'} (${data.assessment?.currentLevel?.cefrLevel || 'N/A'})\nConfidence: ${data.assessment?.confidenceLevel || 'Unknown'}`
							);
						} catch (error) {
							console.error('Assessment failed:', error);
							alert('Assessment failed - check console for details');
						}
					}}
				>
					🎯 Run Language Assessment
				</button>
				<div class="mt-2 text-xs text-base-content/60">
					Check browser console for detailed results
				</div>
			</div>
		</section>

		<!-- Server Console Logging -->
		<section class="rounded-lg bg-base-100 p-6 shadow">
			<h2 class="mb-4 text-xl font-semibold">🔍 Server Debug Console</h2>
			<div class="rounded-lg border border-info/20 bg-info p-4">
				<h3 class="mb-3 font-medium text-info-content">Real-time OpenAI Debugging</h3>
				<p class="text-sm text-info-content/80">
					The analysis modules now use real OpenAI processing. Check your server console to see:
				</p>
				<ul class="mt-2 list-inside list-disc space-y-1 text-sm text-info-content/80">
					<li>
						<strong>🤖 Raw Request to OpenAI:</strong> Full request payload with prompts and settings
					</li>
					<li><strong>🤖 Raw Response from OpenAI:</strong> Complete API response with metadata</li>
					<li><strong>🚨 API Errors:</strong> Detailed error logging with request context</li>
				</ul>
				<div class="mt-4 rounded border border-info/10 bg-info/5 p-3">
					<div class="font-mono text-xs text-info-content">
						<div>📊 Request tracking includes:</div>
						<div class="ml-2">• Timestamp and payload</div>
						<div class="ml-2">• Message count and character counts</div>
						<div class="ml-2">• Model and parameters used</div>
						<br />
						<div>📈 Response tracking includes:</div>
						<div class="ml-2">• Full OpenAI response object</div>
						<div class="ml-2">• Token usage statistics</div>
						<div class="ml-2">• Finish reason and response length</div>
					</div>
				</div>
			</div>
		</section>
	</div>
</div>
