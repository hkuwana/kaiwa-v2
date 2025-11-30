<script lang="ts">
	let activeTab = $state<'prompt' | 'repository' | 'queue'>('prompt');

	// Prompt Testing
	let promptInput = $state({
		userLevel: 'A2',
		userGoal: 'Connection',
		userContext: '',
		targetLanguage: 'ja',
		duration: 28,
		brief: ''
	});
	let generatedPrompt = $state('');
	let promptType = $state<'preferences' | 'creator'>('preferences');

	// Repository Testing
	let pathId = $state('');
	let userId = $state('');
	let pathResult = $state('');
	let queueResult = $state('');

	// Queue Stats
	let queueStats = $state({
		pending: 0,
		processing: 0,
		ready: 0,
		failed: 0,
		total: 0
	});

	async function generatePrompt() {
		const endpoint =
			promptType === 'preferences'
				? '/api/dev/learning-paths/prompt/preferences'
				: '/api/dev/learning-paths/prompt/creator';

		try {
			const response = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(promptInput)
			});

			const data = await response.json();
			generatedPrompt = JSON.stringify(data, null, 2);
		} catch (err: any) {
			generatedPrompt = `Error: ${err.message}`;
		}
	}

	async function createTestPath() {
		try {
			const response = await fetch('/api/dev/learning-paths/create', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					userId,
					title: 'Test Learning Path',
					targetLanguage: 'ja',
					duration: 7
				})
			});

			const data = await response.json();
			pathResult = JSON.stringify(data, null, 2);
			if (data.pathId) pathId = data.pathId;
		} catch (err: any) {
			pathResult = `Error: ${err.message}`;
		}
	}

	async function fetchPath() {
		if (!pathId) return;

		try {
			const response = await fetch(`/api/dev/learning-paths/${pathId}`);
			const data = await response.json();
			pathResult = JSON.stringify(data, null, 2);
		} catch (err: any) {
			pathResult = `Error: ${err.message}`;
		}
	}

	async function fetchQueueStats() {
		try {
			const response = await fetch('/api/dev/learning-paths/queue/stats');
			const data = await response.json();
			queueStats = data.stats;
			queueResult = JSON.stringify(data, null, 2);
		} catch (err: any) {
			queueResult = `Error: ${err.message}`;
		}
	}

	async function fetchQueueForPath() {
		if (!pathId) return;

		try {
			const response = await fetch(`/api/dev/learning-paths/queue/${pathId}`);
			const data = await response.json();
			queueResult = JSON.stringify(data, null, 2);
		} catch (err: any) {
			queueResult = `Error: ${err.message}`;
		}
	}
</script>

<div class="container mx-auto max-w-6xl p-8">
	<div class="mb-8">
		<h1 class="mb-2 text-4xl font-bold">Learning Paths Playground 🎓</h1>
		<p class="text-base-content/70">
			Test and explore learning path features: prompts, repositories, and queue management
		</p>
	</div>

	<!-- Tab Navigation -->
	<div class="tabs-boxed mb-6 tabs">
		<button
			class="tab {activeTab === 'prompt' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'prompt')}
		>
			🎯 Prompt Generation
		</button>
		<button
			class="tab {activeTab === 'repository' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'repository')}
		>
			💾 Repository Testing
		</button>
		<button
			class="tab {activeTab === 'queue' ? 'tab-active' : ''}"
			onclick={() => (activeTab = 'queue')}
		>
			⚙️ Queue Management
		</button>
	</div>

	<!-- Prompt Generation Tab -->
	{#if activeTab === 'prompt'}
		<div class="card bg-base-200 shadow-xl">
			<div class="card-body">
				<h2 class="card-title">Prompt Engineering Service</h2>
				<p class="mb-4 text-sm text-base-content/70">
					Generate prompts for LLM syllabus creation based on user preferences or creator briefs.
				</p>

				<!-- Prompt Type Selector -->
				<div class="form-control mb-4">
					<label class="label">
						<span class="label-text">Prompt Type</span>
					</label>
					<select class="select-bordered select" bind:value={promptType}>
						<option value="preferences">From User Preferences</option>
						<option value="creator">From Creator Brief</option>
					</select>
				</div>

				<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
					<!-- Input Section -->
					<div>
						<h3 class="mb-3 font-semibold">Input Parameters</h3>

						{#if promptType === 'preferences'}
							<div class="space-y-3">
								<div class="form-control">
									<label class="label"><span class="label-text">User Level (CEFR)</span></label>
									<input
										type="text"
										class="input-bordered input"
										bind:value={promptInput.userLevel}
										placeholder="A1, A2, B1, etc."
									/>
								</div>

								<div class="form-control">
									<label class="label"><span class="label-text">Primary Goal</span></label>
									<select class="select-bordered select" bind:value={promptInput.userGoal}>
										<option value="Connection">Connection</option>
										<option value="Career">Career</option>
										<option value="Travel">Travel</option>
										<option value="Academic">Academic</option>
										<option value="Culture">Culture</option>
										<option value="Growth">Growth</option>
									</select>
								</div>

								<div class="form-control">
									<label class="label">
										<span class="label-text">User Context & Notes</span>
									</label>
									<textarea
										class="textarea-bordered textarea h-32"
										bind:value={promptInput.userContext}
										placeholder="E.g., Part time living in Japan, town: Taiji-cho in Wakayama. Lived in Nagoya for 4 months. Can pick up combos but can't express herself. Uses Memrise. Wants to speak and respond naturally..."
									></textarea>
									<label class="label">
										<span class="label-text-alt text-base-content/50"
											>Include: location, background, current abilities, specific situations, tools
											they use</span
										>
									</label>
								</div>

								<div class="form-control">
									<label class="label"><span class="label-text">Target Language</span></label>
									<input
										type="text"
										class="input-bordered input"
										bind:value={promptInput.targetLanguage}
										placeholder="ja, es, fr, etc."
									/>
								</div>

								<div class="form-control">
									<label class="label"><span class="label-text">Duration (days)</span></label>
									<input
										type="number"
										class="input-bordered input"
										bind:value={promptInput.duration}
										placeholder="28"
									/>
								</div>
							</div>
						{:else}
							<div class="space-y-3">
								<div class="form-control">
									<label class="label"><span class="label-text">Creator Brief</span></label>
									<textarea
										class="textarea-bordered textarea h-32"
										bind:value={promptInput.brief}
										placeholder="Describe the learning path in detail..."
									></textarea>
								</div>

								<div class="form-control">
									<label class="label"><span class="label-text">Target Language</span></label>
									<input
										type="text"
										class="input-bordered input"
										bind:value={promptInput.targetLanguage}
										placeholder="ja, es, fr, etc."
									/>
								</div>

								<div class="form-control">
									<label class="label"><span class="label-text">Duration (days)</span></label>
									<input
										type="number"
										class="input-bordered input"
										bind:value={promptInput.duration}
										placeholder="30"
									/>
								</div>
							</div>
						{/if}

						<button class="btn mt-4 w-full btn-primary" onclick={generatePrompt}>
							Generate Prompt
						</button>
					</div>

					<!-- Output Section -->
					<div>
						<h3 class="mb-3 font-semibold">Generated Prompt</h3>
						<div class="mockup-code h-[400px] overflow-auto">
							<pre><code>{generatedPrompt || 'Click "Generate Prompt" to see output...'}</code
								></pre>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Repository Testing Tab -->
	{#if activeTab === 'repository'}
		<div class="space-y-6">
			<!-- Create Path -->
			<div class="card bg-base-200 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Create Test Path</h2>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<div class="form-control mb-3">
								<label class="label" for="test-user-id">
									<span class="label-text">User ID</span>
								</label>
								<input
									type="text"
									id="test-user-id"
									class="input-bordered input"
									bind:value={userId}
									placeholder="Enter user UUID"
								/>
							</div>

							<button class="btn w-full btn-primary" onclick={createTestPath}>
								Create Test Path
							</button>
						</div>

						<div>
							<h3 class="mb-2 font-semibold">Result</h3>
							<div class="mockup-code h-32 overflow-auto text-xs">
								<pre><code>{pathResult || 'No result yet...'}</code></pre>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Fetch Path -->
			<div class="card bg-base-200 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Fetch Path by ID</h2>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<div class="form-control mb-3">
								<label class="label" for="fetch-path-id">
									<span class="label-text">Path ID</span>
								</label>
								<input
									type="text"
									id="fetch-path-id"
									class="input-bordered input"
									bind:value={pathId}
									placeholder="Enter path ID"
								/>
							</div>

							<button class="btn w-full btn-secondary" onclick={fetchPath}>Fetch Path</button>
						</div>

						<div>
							<h3 class="mb-2 font-semibold">Result</h3>
							<div class="mockup-code h-32 overflow-auto text-xs">
								<pre><code>{pathResult || 'No result yet...'}</code></pre>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}

	<!-- Queue Management Tab -->
	{#if activeTab === 'queue'}
		<div class="space-y-6">
			<!-- Queue Stats -->
			<div class="card bg-base-200 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Queue Statistics</h2>

					<div class="mt-4 grid grid-cols-2 gap-4 md:grid-cols-5">
						<div class="stat rounded-lg bg-base-300 p-4">
							<div class="stat-title">Pending</div>
							<div class="stat-value text-2xl text-warning">{queueStats.pending}</div>
						</div>
						<div class="stat rounded-lg bg-base-300 p-4">
							<div class="stat-title">Processing</div>
							<div class="stat-value text-2xl text-info">{queueStats.processing}</div>
						</div>
						<div class="stat rounded-lg bg-base-300 p-4">
							<div class="stat-title">Ready</div>
							<div class="stat-value text-2xl text-success">{queueStats.ready}</div>
						</div>
						<div class="stat rounded-lg bg-base-300 p-4">
							<div class="stat-title">Failed</div>
							<div class="stat-value text-2xl text-error">{queueStats.failed}</div>
						</div>
						<div class="stat rounded-lg bg-base-300 p-4">
							<div class="stat-title">Total</div>
							<div class="stat-value text-2xl">{queueStats.total}</div>
						</div>
					</div>

					<button class="btn mt-4 btn-primary" onclick={fetchQueueStats}>Refresh Stats</button>
				</div>
			</div>

			<!-- Queue for Path -->
			<div class="card bg-base-200 shadow-xl">
				<div class="card-body">
					<h2 class="card-title">Queue Jobs for Path</h2>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<div class="form-control mb-3">
								<label class="label" for="queue-path-id">
									<span class="label-text">Path ID</span>
								</label>
								<input
									type="text"
									id="queue-path-id"
									class="input-bordered input"
									bind:value={pathId}
									placeholder="Enter path ID"
								/>
							</div>

							<button class="btn w-full btn-secondary" onclick={fetchQueueForPath}>
								Fetch Queue Jobs
							</button>
						</div>

						<div>
							<h3 class="mb-2 font-semibold">Result</h3>
							<div class="mockup-code h-48 overflow-auto text-xs">
								<pre><code>{queueResult || 'No result yet...'}</code></pre>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	{/if}
</div>
