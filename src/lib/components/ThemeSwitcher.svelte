<script lang="ts">
	import { onMount } from 'svelte';
	import { themeChange } from 'theme-change';

	onMount(() => {
		// Initialize theme-change for Svelte
		themeChange(false);
	});
</script>

<label class="swap ml-2 swap-rotate">
	<input type="checkbox" data-toggle-theme="night,retro" data-act-class="active" />

	<!-- sun icon (light theme) -->
	<div class="swap-on btn btn-circle btn-primary">
		<span class="icon-[mdi--weather-sunny] h-6 w-6"></span>
	</div>

	<!-- moon icon (dark theme) -->
	<div class="swap-off btn btn-circle btn-primary">
		<span class="icon-[mdi--weather-night] h-6 w-6"></span>
	</div>
</label>
