<script lang="ts">
	// 🌍 Language Selector Component
	// Clean UI component for selecting conversation language

	interface Language {
		code: string;
		name: string;
		flag: string;
		enabled: boolean;
	}

	const { selectedLanguage = 'en', onLanguageChange } = $props<{
		selectedLanguage?: string;
		onLanguageChange: (language: string) => void;
	}>();

	// Available languages for conversation practice
	const languages: Language[] = [
		{ code: 'en', name: 'English', flag: '🇺🇸', enabled: true },
		{ code: 'es', name: 'Spanish', flag: '🇪🇸', enabled: true },
		{ code: 'fr', name: 'French', flag: '🇫🇷', enabled: true },
		{ code: 'de', name: 'German', flag: '🇩🇪', enabled: true },
		{ code: 'it', name: 'Italian', flag: '🇮🇹', enabled: true },
		{ code: 'pt', name: 'Portuguese', flag: '🇧🇷', enabled: true },
		{ code: 'ja', name: 'Japanese', flag: '🇯🇵', enabled: true },
		{ code: 'ko', name: 'Korean', flag: '🇰🇷', enabled: true },
		{ code: 'zh', name: 'Chinese', flag: '🇨🇳', enabled: true },
		{ code: 'ar', name: 'Arabic', flag: '🇸🇦', enabled: true },
		{ code: 'hi', name: 'Hindi', flag: '🇮🇳', enabled: true },
		{ code: 'ru', name: 'Russian', flag: '🇷🇺', enabled: true }
	];

	// Get current language info
	const currentLanguage = $derived(
		() => languages.find((lang) => lang.code === selectedLanguage) || languages[0]
	);

	let isOpen = $state(false);

	function selectLanguage(languageCode: string) {
		onLanguageChange(languageCode);
		isOpen = false;
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			isOpen = false;
		}
	}
</script>

<div class="dropdown">
	<!-- Language selector button -->
	<button
		class="btn btn-outline"
		onclick={() => (isOpen = !isOpen)}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
	>
		<span class="text-lg">{currentLanguage().flag}</span>
		<span>{currentLanguage().name}</span>
		<svg
			class="h-4 w-4 transition-transform {isOpen ? 'rotate-180' : ''}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<!-- Language dropdown -->
	<ul tabindex="0" class="dropdown-content menu z-[1] w-56 rounded-box bg-base-100 p-2 shadow">
		{#each languages as language}
			<li>
				<button
					class="flex w-full items-center space-x-3 {language.code === selectedLanguage
						? 'active'
						: ''} {!language.enabled ? 'disabled' : ''}"
					onclick={() => language.enabled && selectLanguage(language.code)}
					disabled={!language.enabled}
					role="option"
					aria-selected={language.code === selectedLanguage}
				>
					<span class="text-lg">{language.flag}</span>
					<span class="flex-1">{language.name}</span>
					{#if language.code === selectedLanguage}
						<svg class="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					{/if}
				</button>
			</li>
		{/each}
	</ul>
</div>
