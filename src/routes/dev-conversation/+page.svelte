<script lang="ts">
  import { onMount } from 'svelte';
  import { userMemoryService } from '$lib/services';

  type Conversation = Awaited<ReturnType<typeof userMemoryService.getRecentConversations>>[number];

  let loading = true;
  let error: string | null = null;
  let conversations: Conversation[] = [];
  let limit = 10;
  let languageId = '';

  async function loadConversations() {
    loading = true;
    error = null;
    try {
      conversations = await userMemoryService.getRecentConversations(limit, languageId || undefined);
    } catch (e: any) {
      error = e?.message || 'Failed to load conversations';
    } finally {
      loading = false;
    }
  }

  onMount(loadConversations);
</script>

<section class="p-6 space-y-4">
  <h1 class="text-xl font-semibold">Dev: Recent Conversations</h1>

  <div class="flex gap-2 items-end">
    <div>
      <label class="text-sm text-gray-600">Limit</label>
      <input class="border rounded p-2 w-24" type="number" bind:value={limit} min="1" max="50" />
    </div>
    <div>
      <label class="text-sm text-gray-600">Language ID (optional)</label>
      <input class="border rounded p-2 w-48" placeholder="e.g., ja, es" bind:value={languageId} />
    </div>
    <button class="px-3 py-2 rounded bg-blue-600 text-white" on:click={loadConversations}>
      Refresh
    </button>
  </div>

  {#if loading}
    <p class="text-gray-600">Loading...</p>
  {:else if error}
    <p class="text-red-600">{error}</p>
  {:else if conversations.length === 0}
    <p class="text-gray-600">No conversations found.</p>
  {:else}
    <div class="overflow-auto border rounded">
      <table class="min-w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            <th class="text-left p-2">Started</th>
            <th class="text-left p-2">Title</th>
            <th class="text-left p-2">Language</th>
            <th class="text-left p-2">Scenario</th>
            <th class="text-left p-2">Msgs</th>
            <th class="text-left p-2">Duration (s)</th>
          </tr>
        </thead>
        <tbody>
          {#each conversations as c}
            <tr class="border-t">
              <td class="p-2 whitespace-nowrap">{c.startedAt}</td>
              <td class="p-2">{c.title || '—'}</td>
              <td class="p-2">{c.targetLanguageId}</td>
              <td class="p-2">{c.scenarioId || '—'}</td>
              <td class="p-2">{c.messageCount ?? '—'}</td>
              <td class="p-2">{c.durationSeconds ?? '—'}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>

<style>
  section { max-width: 900px; margin: 0 auto; }
  table { border-collapse: collapse; }
</style>

