<script lang="ts">
  export let source: string = 'inline';
  let email = $state('');
  let name = $state('');
  let status: 'idle' | 'loading' | 'success' | 'error' = $state('idle');
  let message = $state('');

  async function subscribe() {
    if (!email) return;
    status = 'loading';
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, source })
      });
      const data = await res.json();
      if (data.ok) {
        status = 'success';
        message = 'Thanks! You are subscribed.';
        email = '';
        name = '';
      } else {
        status = 'error';
        message = data.error || 'Subscription failed';
      }
    } catch (e) {
      status = 'error';
      message = 'Network error';
    }
  }
</script>

<div class="rounded-xl bg-base-200 p-4">
  <div class="mb-2 text-sm tracking-wide text-base-content/60 uppercase">Subscribe</div>
  <div class="mb-2 text-sm">Get weekly scenario tips and new features.</div>
  <div class="flex flex-col gap-2 sm:flex-row">
    <input class="input input-bordered input-sm flex-1" placeholder="Your email" bind:value={email} type="email" />
    <input class="input input-bordered input-sm flex-1" placeholder="Name (optional)" bind:value={name} />
    <button class="btn btn-sm btn-primary" onclick={subscribe} disabled={status==='loading'}>
      {status==='loading' ? 'Subscribing…' : 'Subscribe'}
    </button>
  </div>
  {#if status !== 'idle'}
    <div class="mt-2 text-sm {status==='success' ? 'text-success' : status==='error' ? 'text-error' : ''}">{message}</div>
  {/if}
  <div class="mt-2 text-xs opacity-60">No spam. Unsubscribe anytime.</div>
  <slot />
  
</div>

