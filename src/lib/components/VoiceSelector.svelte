<script lang="ts">
	// 🎤 Voice Selector Component
	// Clean UI component for selecting AI voice/speaker

	interface Voice {
		id: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
		name: string;
		description: string;
		gender: 'male' | 'female' | 'neutral';
		accent: string;
		enabled: boolean;
	}

	const { selectedVoice = 'alloy', onVoiceChange } = $props<{
		selectedVoice?: string;
		onVoiceChange: (voice: string) => void;
	}>();

	// Available OpenAI TTS voices
	const voices: Voice[] = [
		{
			id: 'alloy',
			name: 'Alloy',
			description: 'Balanced and neutral',
			gender: 'neutral',
			accent: 'American',
			enabled: true
		},
		{
			id: 'echo',
			name: 'Echo',
			description: 'Warm and friendly',
			gender: 'male',
			accent: 'American',
			enabled: true
		},
		{
			id: 'fable',
			name: 'Fable',
			description: 'Expressive and engaging',
			gender: 'female',
			accent: 'British',
			enabled: true
		},
		{
			id: 'onyx',
			name: 'Onyx',
			description: 'Deep and authoritative',
			gender: 'male',
			accent: 'American',
			enabled: true
		},
		{
			id: 'nova',
			name: 'Nova',
			description: 'Clear and professional',
			gender: 'female',
			accent: 'American',
			enabled: true
		},
		{
			id: 'shimmer',
			name: 'Shimmer',
			description: 'Gentle and soothing',
			gender: 'female',
			accent: 'American',
			enabled: true
		}
	];

	// Get current voice info
	const currentVoice = $derived(
		() => voices.find((voice) => voice.id === selectedVoice) || voices[0]
	);

	let isOpen = $state(false);
	let isPlaying = $state<string | null>(null);

	function selectVoice(voiceId: string) {
		onVoiceChange(voiceId);
		isOpen = false;
	}

	async function previewVoice(voice: Voice) {
		if (isPlaying === voice.id) return;

		isPlaying = voice.id;

		try {
			// Use browser speech synthesis for preview
			const utterance = new SpeechSynthesisUtterance(
				`Hello! I'm ${voice.name}. I'll be your conversation partner.`
			);

			// Try to match voice characteristics with browser voices
			const browserVoices = speechSynthesis.getVoices();
			const matchedVoice =
				browserVoices.find(
					(bv) =>
						bv.lang.startsWith('en') &&
						(voice.gender === 'female'
							? bv.name.toLowerCase().includes('female')
							: voice.gender === 'male'
								? bv.name.toLowerCase().includes('male')
								: true)
				) || browserVoices.find((bv) => bv.lang.startsWith('en'));

			if (matchedVoice) {
				utterance.voice = matchedVoice;
			}

			utterance.rate = 0.9;
			utterance.pitch = voice.gender === 'male' ? 0.8 : 1.1;

			utterance.onend = () => {
				isPlaying = null;
			};

			utterance.onerror = () => {
				isPlaying = null;
			};

			speechSynthesis.speak(utterance);
		} catch (error) {
			console.warn('Voice preview failed:', error);
			isPlaying = null;
		}
	}

	function stopPreview() {
		speechSynthesis.cancel();
		isPlaying = null;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isOpen = false;
			stopPreview();
		}
	}

	// Gender icon helper
	function getGenderIcon(gender: string) {
		switch (gender) {
			case 'male':
				return '👨';
			case 'female':
				return '👩';
			default:
				return '🤖';
		}
	}
</script>

<div class="relative">
	<!-- Voice selector button -->
	<button
		class="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
		onclick={() => (isOpen = !isOpen)}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
	>
		<span class="text-lg">{getGenderIcon(currentVoice().gender)}</span>
		<span>{currentVoice().name}</span>
		<svg
			class="h-4 w-4 text-gray-400 transition-transform {isOpen ? 'rotate-180' : ''}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<!-- Voice dropdown -->
	{#if isOpen}
		<div
			class="absolute top-full left-0 z-50 mt-2 w-80 rounded-lg border border-gray-200 bg-white py-2 shadow-lg"
			role="listbox"
			onkeydown={handleKeydown}
		>
			{#each voices as voice}
				<div
					class="flex items-center justify-between px-4 py-3 transition-colors hover:bg-blue-50 {voice.id ===
					selectedVoice
						? 'bg-blue-100'
						: ''}"
				>
					<button
						class="flex flex-1 items-start space-x-3 text-left focus:outline-none"
						onclick={() => voice.enabled && selectVoice(voice.id)}
						disabled={!voice.enabled}
						role="option"
						aria-selected={voice.id === selectedVoice}
					>
						<span class="text-lg">{getGenderIcon(voice.gender)}</span>
						<div class="min-w-0 flex-1">
							<div class="flex items-center space-x-2">
								<span
									class="font-medium text-gray-900 {voice.id === selectedVoice
										? 'text-blue-900'
										: ''}">{voice.name}</span
								>
								{#if voice.id === selectedVoice}
									<svg class="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
								{/if}
							</div>
							<p class="text-xs text-gray-500">{voice.description}</p>
							<p class="text-xs text-gray-400">{voice.accent} • {voice.gender}</p>
						</div>
					</button>

					<!-- Preview button -->
					<button
						class="ml-2 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
						onclick={() => (isPlaying === voice.id ? stopPreview() : previewVoice(voice))}
						title={isPlaying === voice.id ? 'Stop preview' : 'Preview voice'}
					>
						{#if isPlaying === voice.id}
							<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z"
									clip-rule="evenodd"
								/>
							</svg>
						{:else}
							<svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
								<path
									fill-rule="evenodd"
									d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
									clip-rule="evenodd"
								/>
							</svg>
						{/if}
					</button>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Click outside to close -->
{#if isOpen}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div
		class="fixed inset-0 z-40"
		onclick={() => {
			isOpen = false;
			stopPreview();
		}}
	></div>
{/if}
