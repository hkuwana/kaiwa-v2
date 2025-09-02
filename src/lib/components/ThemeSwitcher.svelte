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
	<div class="swap-on btn btn-circle text-xl btn-primary">🌞</div>

	<!-- moon icon (dark theme) -->
	<div class="swap-off btn btn-circle text-xl btn-primary">🌙</div>
</label>
