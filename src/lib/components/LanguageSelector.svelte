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

<div class="relative">
	<!-- Language selector button -->
	<button
		class="flex items-center space-x-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
		onclick={() => (isOpen = !isOpen)}
		aria-haspopup="listbox"
		aria-expanded={isOpen}
	>
		<span class="text-lg">{currentLanguage().flag}</span>
		<span>{currentLanguage().name}</span>
		<svg
			class="h-4 w-4 text-gray-400 transition-transform {isOpen ? 'rotate-180' : ''}"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<!-- Language dropdown -->
	{#if isOpen}
		<div
			class="absolute top-full left-0 z-50 mt-2 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
			role="listbox"
			onkeydown={handleKeydown}
		>
			{#each languages as language}
				<button
					class="flex w-full items-center space-x-3 px-4 py-2 text-left text-sm transition-colors hover:bg-blue-50 focus:bg-blue-50 focus:outline-none {language.code ===
					selectedLanguage
						? 'bg-blue-100 text-blue-900'
						: 'text-gray-700'} {!language.enabled ? 'cursor-not-allowed opacity-50' : ''}"
					onclick={() => language.enabled && selectLanguage(language.code)}
					disabled={!language.enabled}
					role="option"
					aria-selected={language.code === selectedLanguage}
				>
					<span class="text-lg">{language.flag}</span>
					<span class="flex-1">{language.name}</span>
					{#if language.code === selectedLanguage}
						<svg class="h-4 w-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					{/if}
				</button>
			{/each}
		</div>
	{/if}
</div>

<!-- Click outside to close -->
{#if isOpen}
	<!-- svelte-ignore a11y-click-events-have-key-events -->
	<!-- svelte-ignore a11y-no-static-element-interactions -->
	<div class="fixed inset-0 z-40" onclick={() => (isOpen = false)}></div>
{/if}
