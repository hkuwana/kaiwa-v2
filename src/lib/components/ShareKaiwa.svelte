<script lang="ts">
  import { userManager } from '$lib/stores/user.store.svelte';
  import { onMount } from 'svelte';
  import { track } from '$lib/analytics/posthog';

  interface Props { source?: string }
  const { source = 'unknown' }: Props = $props();

  const user = userManager.user;
  let shareUrl = '';
  let canNativeShare = false;
  let showThanks = false;

  onMount(() => {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin || 'https://kaiwa.app';
      shareUrl = user && user.id !== 'guest' ? `${origin}/?shareId=${encodeURIComponent(user.id)}` : origin;
      canNativeShare = !!(navigator as any).share;
    }
  });

  async function handleNativeShare() {
    try {
      await (navigator as any).share({
        title: 'Kaiwa — relationship-first language practice',
        text: 'Practice real conversations for relationships and family. Join me on Kaiwa.',
        url: shareUrl
      });
      track('share_native_share', { source });
      bumpShareCount();
      thank();
    } catch (e) {
      // user cancelled
    }
  }

  async function copyLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    track('share_link_copied', { source });
    bumpShareCount();
    thank();
  }

  function whatsappLink() {
    const msg = `Practice real conversations for relationships and family — join me on Kaiwa: ${shareUrl}`;
    return `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
  }

  function smsLink() {
    const body = `Join me on Kaiwa for relationship-first language practice: ${shareUrl}`;
    return `sms:?&body=${encodeURIComponent(body)}`;
  }

  function bumpShareCount() {
    try {
      const k = 'kaiwa_share_events';
      const n = parseInt(localStorage.getItem(k) || '0', 10) + 1;
      localStorage.setItem(k, String(n));
    } catch {}
  }

  function thank() {
    showThanks = true;
    setTimeout(() => (showThanks = false), 1400);
  }
</script>

<div class="relative rounded-2xl border border-base-300/60 bg-base-100/70 p-6 shadow-sm">
  <div class="mb-3 text-center text-xl font-semibold">Share Kaiwa</div>
  <p class="mx-auto mb-5 max-w-xl text-center text-base-content/70">
    If this helped you, pass it forward. A quiet share can make a big difference.
  </p>

  <div class="flex flex-wrap items-center justify-center gap-3">
    {#if canNativeShare}
      <button class="btn btn-primary" onclick={handleNativeShare}>Share</button>
    {/if}
    <a class="btn btn-outline" href={whatsappLink()} target="_blank" rel="noopener" on:click={() => { track('share_whatsapp_click', { source }); bumpShareCount(); thank(); }}>
      WhatsApp
    </a>
    <a class="btn btn-outline" href={smsLink()} on:click={() => { track('share_sms_click', { source }); bumpShareCount(); thank(); }}>
      Text
    </a>
    <button class="btn btn-ghost" onclick={copyLink}>Copy Link</button>
  </div>

  {#if showThanks}
    <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div class="scale-in rounded-full bg-success/10 px-6 py-3 text-success shadow">
        <span class="mr-1">✨</span> Thanks for sharing
      </div>
    </div>
  {/if}
</div>

<style>
  :global(.btn) { border-radius: 9999px; }
  .scale-in { animation: scaleIn 320ms ease-out; }
  @keyframes scaleIn {
    from { transform: scale(0.92); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }
</style>
