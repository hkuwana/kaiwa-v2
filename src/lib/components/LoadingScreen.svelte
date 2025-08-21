<!-- src/lib/components/LoadingScreen.svelte -->
<script lang="ts">
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { languages } from '$lib/data/languages';

	// Get current settings
	const selectedLanguage = $derived(settingsStore.selectedLanguage);
	const selectedSpeaker = $derived(settingsStore.selectedSpeaker);

	// Get language info (now directly from the store)
	const languageInfo = $derived(selectedLanguage);

	// Tips that cycle through
	const tips = [
		'Find a quiet place to practice',
		'Speak clearly and at a natural pace',
		"Don't worry about making mistakes",
		'Take your time to think before speaking',
		'Practice regularly for best results'
	];

	let currentTipIndex = $state(0);

	// Cycle through tips every 4 seconds
	setInterval(() => {
		currentTipIndex = (currentTipIndex + 1) % tips.length;
	}, 4000);
</script>

<div class="loading-container">
	<div class="loading-content">
		<!-- Language and Speaker Info -->
		<div class="session-info">
			<div class="language-display">
				<span class="flag">🌍</span>
				<h2>Practicing {languageInfo?.name}</h2>
				<p>with {selectedSpeaker}</p>
			</div>
		</div>

		<!-- Loading Animation -->
		<div class="loading-animation">
			<div class="pulse-circle"></div>
			<div class="pulse-circle"></div>
			<div class="pulse-circle"></div>
		</div>

		<!-- Status Text -->
		<div class="status-text">
			<h3>Connecting to your AI tutor...</h3>
			<p>This may take a few moments</p>
		</div>

		<!-- Tips Section -->
		<div class="tips-section">
			<h4>💡 Pro Tip</h4>
			<p class="tip-text">{tips[currentTipIndex]}</p>
		</div>
	</div>
</div>

<style>
	.loading-container {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
	}

	.loading-content {
		text-align: center;
		max-width: 500px;
		padding: 2rem;
	}

	.session-info {
		margin-bottom: 3rem;
	}

	.language-display {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.5rem;
	}

	.flag {
		font-size: 4rem;
		margin-bottom: 0.5rem;
	}

	.language-display h2 {
		margin: 0;
		font-size: 2rem;
		font-weight: 600;
		color: #1e293b;
	}

	.language-display p {
		margin: 0;
		font-size: 1.125rem;
		color: #64748b;
		font-weight: 500;
	}

	.loading-animation {
		display: flex;
		justify-content: center;
		gap: 0.5rem;
		margin-bottom: 3rem;
	}

	.pulse-circle {
		width: 12px;
		height: 12px;
		border-radius: 50%;
		background: #3b82f6;
		animation: pulse 1.4s ease-in-out infinite both;
	}

	.pulse-circle:nth-child(1) {
		animation-delay: -0.32s;
	}

	.pulse-circle:nth-child(2) {
		animation-delay: -0.16s;
	}

	@keyframes pulse {
		0%,
		80%,
		100% {
			transform: scale(0.8);
			opacity: 0.5;
		}
		40% {
			transform: scale(1);
			opacity: 1;
		}
	}

	.status-text {
		margin-bottom: 3rem;
	}

	.status-text h3 {
		margin: 0 0 0.5rem 0;
		font-size: 1.5rem;
		font-weight: 600;
		color: #1e293b;
	}

	.status-text p {
		margin: 0;
		font-size: 1rem;
		color: #64748b;
	}

	.tips-section {
		background: white;
		padding: 1.5rem;
		border-radius: 16px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		border: 1px solid #e2e8f0;
	}

	.tips-section h4 {
		margin: 0 0 1rem 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: #1e293b;
	}

	.tip-text {
		margin: 0;
		font-size: 1rem;
		color: #475569;
		line-height: 1.5;
		min-height: 1.5em;
		transition: opacity 0.3s ease;
	}

	@media (max-width: 640px) {
		.loading-content {
			padding: 1rem;
		}

		.flag {
			font-size: 3rem;
		}

		.language-display h2 {
			font-size: 1.5rem;
		}

		.language-display p {
			font-size: 1rem;
		}
	}
</style>
