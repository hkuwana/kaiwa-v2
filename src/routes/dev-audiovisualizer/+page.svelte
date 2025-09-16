<script lang="ts">
	import AudioVisualizer from '$lib/components/AudioVisualizer.svelte';
	import { userPreferencesStore } from '$lib/stores/userPreferences.store.svelte';

	// Mock data for testing
	let audioLevel = $state(0.3);
	let timeRemaining = $state(45);
	let maxSessionLengthSeconds = $state(180);
	let isTimerActive = $state(true);

	// Timer display logic (copied from ConversationActiveState)
	const progressPercentage = $derived(Math.round((timeRemaining / maxSessionLengthSeconds) * 100));
	const showTimeLeft = $derived(timeRemaining <= 30);

	function formatTime(seconds: number): string {
		const mins = Math.floor(seconds / 60);
		const secs = seconds % 60;
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	}

	// Test controls
	function updateTimer() {
		if (timeRemaining > 0) {
			timeRemaining--;
		} else {
			timeRemaining = 180; // Reset
		}
	}

	// Auto-update timer for demo
	let interval: NodeJS.Timeout;
	$effect(() => {
		interval = setInterval(updateTimer, 1000);
		return () => clearInterval(interval);
	});
</script>

<svelte:head>
	<title>Dev: AudioVisualizer Experiments - Kaiwa</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-base-100 to-base-200 p-6">
	<div class="container mx-auto max-w-6xl">
		<!-- Header -->
		<div class="mb-8">
			<h1 class="text-3xl font-bold text-base-content">🎛️ AudioVisualizer Experiments</h1>
			<p class="mt-2 text-base-content/70">Test different designs for the AudioVisualizer component</p>
		</div>

		<div class="grid gap-8 lg:grid-cols-2">
			<!-- Current Design -->
			<div class="space-y-6">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title text-lg">🔴 Current Design (With Inner Circle)</h2>
						<p class="text-sm opacity-70 mb-4">Current implementation with inner circle + children</p>

						<div class="flex justify-center py-8">
							<AudioVisualizer
								{audioLevel}
								controlMode="external"
								pressBehavior={userPreferencesStore.getPressBehavior()}
								onRecordStart={() => console.log('Record start')}
								onRecordStop={() => console.log('Record stop')}
							>
								{#if isTimerActive && timeRemaining > 0}
									<div class="flex items-center gap-1">
										{#if showTimeLeft}
											<div class="text-xs font-bold text-error bg-base-100/90 px-2 py-1 rounded-full shadow-sm">
												{formatTime(timeRemaining)}
											</div>
										{:else}
											<div
												class="radial-progress text-primary/60"
												style="--value:{progressPercentage}; --size:1.5rem; --thickness:2px;"
												role="progressbar"
												title="Session progress"
											>
												<svg class="w-3 h-3 opacity-70" fill="currentColor" viewBox="0 0 24 24">
													<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
													<path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
												</svg>
											</div>
										{/if}
									</div>
								{/if}
							</AudioVisualizer>
						</div>

						<div class="text-xs opacity-60">
							<strong>Pros:</strong> Clear button structure, defined interaction area<br>
							<strong>Cons:</strong> Visual complexity, competing elements
						</div>
					</div>
				</div>

				<!-- Controls -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h3 class="card-title text-base">🎮 Test Controls</h3>
						<div class="space-y-3">
							<div class="flex items-center gap-3">
								<label class="label cursor-pointer">
									<span class="label-text mr-3">Audio Level:</span>
									<input
										type="range"
										min="0"
										max="1"
										step="0.1"
										bind:value={audioLevel}
										class="range range-sm range-primary"
									>
									<span class="label-text ml-3">{Math.round(audioLevel * 100)}%</span>
								</label>
							</div>

							<div class="flex items-center gap-3">
								<span class="text-sm">Time Remaining:</span>
								<span class="badge badge-outline">{formatTime(timeRemaining)}</span>
								<button
									class="btn btn-xs btn-outline"
									onclick={() => timeRemaining = timeRemaining <= 30 ? 180 : 15}
								>
									Toggle Phase
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Experimental Design -->
			<div class="space-y-6">
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h2 class="card-title text-lg">✨ Ring Timer Design</h2>
						<p class="text-sm opacity-70 mb-4">Ring IS the timer progress + audio pulse feedback</p>

						<div class="flex justify-center py-8">
							<!-- Ring Timer Design -->
							<div
								class="relative flex h-24 w-24 items-center justify-center cursor-pointer select-none transition-all duration-200 hover:scale-105 active:scale-95"
								role="button"
								tabindex="0"
								onpointerdown={(e) => {
									e.currentTarget.style.transform = 'scale(0.95)';
									console.log('Record start - Ring Timer');
								}}
								onpointerup={(e) => {
									e.currentTarget.style.transform = 'scale(1.05)';
									console.log('Record stop - Ring Timer');
								}}
								onpointerleave={(e) => e.currentTarget.style.transform = 'scale(1)'}
								onkeydown={(e) => {
									if (e.key === ' ' || e.key === 'Enter') {
										e.preventDefault();
										e.currentTarget.style.transform = 'scale(0.95)';
									}
								}}
								onkeyup={(e) => {
									if (e.key === ' ' || e.key === 'Enter') {
										e.preventDefault();
										e.currentTarget.style.transform = 'scale(1)';
									}
								}}
							>
								<!-- Timer Ring (Custom SVG for better control) -->
								<svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
									<!-- Background circle -->
									<circle
										cx="50"
										cy="50"
										r="46"
										fill="none"
										stroke="currentColor"
										stroke-width="4"
										class="text-base-300 opacity-30"
									/>
									<!-- Progress circle -->
									<circle
										cx="50"
										cy="50"
										r="46"
										fill="none"
										stroke="currentColor"
										stroke-width="4"
										stroke-linecap="round"
										class="{timeRemaining <= 30 ? 'text-error' : timeRemaining <= 60 ? 'text-warning' : 'text-primary'}"
										style="stroke-dasharray: {2 * Math.PI * 46}; stroke-dashoffset: {2 * Math.PI * 46 * (1 - progressPercentage / 100)}; transition: stroke-dashoffset 0.3s ease;"
									/>
								</svg>

								<!-- Audio Activity Pulse -->
								<div
									class="absolute inset-4 rounded-full bg-primary/10 transition-all duration-300"
									style="opacity: {audioLevel * 0.8}; transform: scale({1 + audioLevel * 0.2}); background: radial-gradient(circle, currentColor 0%, transparent 70%);"
								></div>

								<!-- Center Microphone Icon (Larger) -->
								<div class="relative z-10 flex items-center justify-center pointer-events-none">
									<svg class="w-10 h-10 {timeRemaining <= 30 ? 'text-error' : timeRemaining <= 60 ? 'text-warning' : 'text-primary'}" fill="currentColor" viewBox="0 0 24 24">
										<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
										<path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
									</svg>
								</div>

								<!-- Recording State Indicator -->
								<div class="absolute inset-0 animate-ping rounded-full border-2 border-error opacity-0 transition-opacity duration-200" style="display: none;"></div>
							</div>
						</div>

						<div class="text-xs opacity-60">
							<strong>Pros:</strong> Ring = timer (genius!), clear feedback, minimal design<br>
							<strong>Cons:</strong> Different from current design, may need user education
						</div>
					</div>
				</div>

				<!-- Variant Options -->
				<div class="card bg-base-100 shadow-lg">
					<div class="card-body">
						<h3 class="card-title text-base">🔬 Design Variants</h3>
						<div class="space-y-4">

							<!-- Variant 1: Ring Timer with Click Feedback -->
							<div class="border rounded-lg p-4">
								<h4 class="font-medium mb-2">Ring Timer with Click Feedback</h4>
								<div class="flex justify-center mb-2">
									<div
										class="relative flex h-20 w-20 items-center justify-center cursor-pointer select-none transition-all duration-200 hover:scale-105"
										role="button"
										tabindex="0"
										onpointerdown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
										onpointerup={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
										onpointerleave={(e) => e.currentTarget.style.transform = 'scale(1)'}
									>
										<!-- Timer Ring (Custom SVG) -->
										<svg class="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
											<!-- Background circle -->
											<circle
												cx="50"
												cy="50"
												r="44"
												fill="none"
												stroke="currentColor"
												stroke-width="6"
												class="text-base-300 opacity-30"
											/>
											<!-- Progress circle -->
											<circle
												cx="50"
												cy="50"
												r="44"
												fill="none"
												stroke="currentColor"
												stroke-width="6"
												stroke-linecap="round"
												class="{timeRemaining <= 30 ? 'text-error' : timeRemaining <= 60 ? 'text-warning' : 'text-primary'}"
												style="stroke-dasharray: {2 * Math.PI * 44}; stroke-dashoffset: {2 * Math.PI * 44 * (1 - progressPercentage / 100)}; transition: stroke-dashoffset 0.3s ease;"
											/>
										</svg>

										<!-- Audio Activity Pulse -->
										<div
											class="absolute inset-3 rounded-full bg-primary/10 transition-all duration-300"
											style="opacity: {audioLevel * 0.8}; transform: scale({1 + audioLevel * 0.15});"
										></div>

										<!-- Center Microphone Icon -->
										<div class="relative z-10 flex items-center justify-center">
											<svg class="w-7 h-7 {timeRemaining <= 30 ? 'text-error' : timeRemaining <= 60 ? 'text-warning' : 'text-primary'}" fill="currentColor" viewBox="0 0 24 24">
												<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
												<path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
											</svg>
										</div>
									</div>
								</div>
								<p class="text-xs opacity-60">Ring IS the timer + audio pulse feedback</p>
							</div>

							<!-- Variant 2: Glass Effect -->
							<div class="border rounded-lg p-4">
								<h4 class="font-medium mb-2">Glassmorphism Design</h4>
								<div class="flex justify-center mb-2">
									<div class="relative flex h-20 w-20 items-center justify-center cursor-pointer">
										<div class="absolute inset-0 rounded-full bg-primary/20 backdrop-blur-sm border border-primary/30 transition-all duration-300"></div>
										<div class="radial-progress text-primary/80" style="--value:{progressPercentage}; --size:1.8rem;">
											<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
												<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
											</svg>
										</div>
									</div>
								</div>
								<p class="text-xs opacity-60">Glass effect with subtle backdrop</p>
							</div>

						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Back to Dev -->
		<div class="mt-8 text-center">
			<a href="/dev" class="btn btn-outline">← Back to Dev Tools</a>
		</div>
	</div>
</div>