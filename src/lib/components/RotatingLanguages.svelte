<script lang="ts">
  import { onMount } from 'svelte';

  interface Props {
    items: string[];
    intervalMs?: number;
    rotationMs?: number;
  }

  const { items, intervalMs = 2200, rotationMs = 500 }: Props = $props();

  let current = 0;
  let rotation = 0; // degrees of rotation
  let transitioning = false;
  let spinnerEl: HTMLDivElement | null = null;
  let timer: any;

  function tick() {
    if (transitioning || items.length < 2) return;
    transitioning = true;
    
    // Rotate 360 degrees to show next item
    rotation += 360;
    
    setTimeout(() => {
      // Update to next item and reset rotation to prevent infinite accumulation
      current = (current + 1) % items.length;
      rotation = 0;
      
      // Disable transition for the reset
      if (spinnerEl) spinnerEl.style.transition = 'none';
      
      // Re-enable transition in next frame
      requestAnimationFrame(() => {
        if (spinnerEl) spinnerEl.style.transition = `transform ${rotationMs}ms ease-in-out`;
        transitioning = false;
      });
    }, rotationMs);
  }

  onMount(() => {
    if (spinnerEl) spinnerEl.style.transition = `transform ${rotationMs}ms ease-in-out`;
    timer = setInterval(tick, intervalMs);
    return () => clearInterval(timer);
  });
</script>

<div class="viewport">
  <div class="spinner" bind:this={spinnerEl} style={`transform: rotate(${rotation}deg);`}>
    <div class="item">{items[current]}</div>
  </div>
  <div aria-hidden="true" class="sr-only">{items[current]}</div>
  <!-- screen-reader fallback -->
</div>

<style>
  .viewport {
    position: relative;
    display: inline-block;
    height: 1.5em; /* single line */
    overflow: hidden;
    vertical-align: bottom;
  }
  .spinner {
    will-change: transform;
    transform-origin: center;
  }
  .item {
    line-height: 1.5em;
    height: 1.5em;
  }
</style>

