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
	const currentVoice = $derived(voices.find((voice) => voice.id === selectedVoice) || voices[0]);

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

<div class="dropdown">
	<!-- Voice selector button -->
	<button
		class="btn btn-outline"
		onclick={() => (isOpen = !isOpen)}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
	>
		<span class="text-lg">{getGenderIcon(currentVoice.gender)}</span>
		<span>{currentVoice.name}</span>
		<svg
			class="h-4 w-4 transition-transform {isOpen ? 'rotate-180' : ''}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<!-- Voice dropdown -->
	<ul class="dropdown-content menu z-[1] w-80 rounded-box bg-base-100 p-2 shadow" role="listbox">
		{#each voices as voice (voice.id)}
			<li>
				<div
					class="flex w-full items-center justify-between {voice.id === selectedVoice
						? 'active'
						: ''}"
					onclick={() => voice.enabled && selectVoice(voice.id)}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') {
							e.preventDefault();
							if (voice.enabled) selectVoice(voice.id);
						}
					}}
					role="option"
					aria-selected={voice.id === selectedVoice}
					tabindex="0"
				>
					<div class="flex flex-1 items-start space-x-3 text-left">
						<span class="text-lg">{getGenderIcon(voice.gender)}</span>
						<div class="min-w-0 flex-1">
							<div class="flex items-center space-x-2">
								<span class="font-medium">{voice.name}</span>
								{#if voice.id === selectedVoice}
									<svg class="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
										<path
											fill-rule="evenodd"
											d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
											clip-rule="evenodd"
										/>
									</svg>
								{/if}
							</div>
							<p class="text-xs opacity-70">{voice.description}</p>
							<p class="text-xs opacity-50">{voice.accent} • {voice.gender}</p>
						</div>
					</div>

					<!-- Preview button -->
					<button
						class="btn ml-2 btn-circle btn-ghost btn-sm"
						onclick={(e) => {
							e.stopPropagation();
							isPlaying === voice.id ? stopPreview() : previewVoice(voice);
						}}
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
			</li>
		{/each}
	</ul>
</div>
