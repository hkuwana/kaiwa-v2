<script lang="ts">
	// 🌍 Language Card Component
	// Enhanced card for language selection with native names and metadata

	interface Language {
		id: string;
		code: string;
		name: string;
		nativeName: string;
		isRTL: boolean;
		hasRomanization: boolean;
		writingSystem: string;
		supportedScripts: string[];
		isSupported: boolean;
	}

	const { language, onSelect } = $props<{
		language: Language;
		onSelect: (languageCode: string) => void;
	}>();

	function handleSelect() {
		if (language.isSupported) {
			onSelect(language.code);
		}
	}

	// Get flag emoji based on language code
	function getFlagEmoji(code: string): string {
		const flagMap: Record<string, string> = {
			ja: '🇯🇵',
			en: '🇺🇸',
			es: '🇪🇸',
			fr: '🇫🇷',
			de: '🇩🇪',
			it: '🇮🇹',
			pt: '🇧🇷',
			ko: '🇰🇷',
			zh: '🇨🇳',
			ar: '🇸🇦',
			hi: '🇮🇳',
			ru: '🇷🇺',
			vi: '🇻🇳',
			nl: '🇳🇱',
			fil: '🇵🇭',
			id: '🇮🇩',
			tr: '🇹🇷'
		};
		return flagMap[code] || '🌍';
	}
</script>

<div
	class="card h-32 bg-base-100 shadow-xl transition-all duration-300 hover:shadow-2xl {!language.isSupported
		? 'opacity-50'
		: 'hover:scale-105'}"
>
	<button
		class="card-body h-full w-full items-center p-6 text-center {!language.isSupported
			? 'cursor-not-allowed'
			: 'hover:bg-base-200'}"
		onclick={handleSelect}
		disabled={!language.isSupported}
		aria-label="Practice {language.name}"
	>
		<div class="mb-2 text-4xl">{getFlagEmoji(language.code)}</div>
		<h3 class="card-title text-lg text-base-content">
			{language.name}
		</h3>
		<p class="text-sm opacity-70">
			{language.nativeName}
		</p>
		{#if language.writingSystem !== 'latin'}
			<div class="mt-1 badge badge-outline badge-sm">
				{language.writingSystem} script
			</div>
		{/if}

		{#if !language.isSupported}
			<div class="mt-2 badge badge-sm badge-warning">Coming Soon</div>
		{/if}
	</button>
</div>
