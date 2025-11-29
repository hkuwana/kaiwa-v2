<script lang="ts">
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	let isDark = $state(false);

	function getStoredTheme(): string | null {
		if (!browser) return null;
		return localStorage.getItem('theme');
	}

	function setTheme(theme: string) {
		if (!browser) return;
		document.documentElement.setAttribute('data-theme', theme);
		localStorage.setItem('theme', theme);
	}

	function toggleTheme() {
		isDark = !isDark;
		setTheme(isDark ? 'night' : 'light');
	}

	onMount(() => {
		const storedTheme = getStoredTheme();
		if (storedTheme) {
			isDark = storedTheme === 'night';
			setTheme(storedTheme);
		} else {
			// Check system preference
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			isDark = prefersDark;
			setTheme(prefersDark ? 'night' : 'light');
		}
	});
</script>

<label class="flex cursor-pointer items-center gap-2" on:click|stopPropagation>
	<span class="icon-[mdi--weather-sunny] h-5 w-5 opacity-70"></span>
	<input type="checkbox" class="toggle toggle-sm" checked={isDark} onchange={toggleTheme} />
	<span class="icon-[mdi--weather-night] h-5 w-5 opacity-70"></span>
</label>
