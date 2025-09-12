<script lang="ts">
  export let variant: 'compact' | 'extended' = 'compact';

  const items = [
    {
      title: 'One‑Click Speak',
      desc: 'Click, say hello, and start a real conversation — no setup.',
      icon: '▶️'
    },
    {
      title: 'Emotional Fluency',
      desc: 'Practice apology, affection, conflict, humor — moments that matter.',
      icon: '❤️'
    },
    {
      title: 'Japanese / Korean / Chinese Comfort',
      desc: 'Furigana and romanization options help you speak without anxiety.',
      icon: '文'
    },
    {
      title: 'Conversation Memory',
      desc: 'Opt‑in memory weaves your facts and topics into future chats.',
      icon: '🧠'
    },
    {
      title: 'Voice‑First',
      desc: 'Realtime turn‑taking that sounds natural — not robotic.',
      icon: '🎙️'
    },
    {
      title: 'Insider Phrases',
      desc: 'Learn what locals actually say, with cultural nuance.',
      icon: '✨'
    }
  ];

  const compare = [
    { key: 'Realtime voice conversations', kaiwa: 'Yes', typical: 'Limited' },
    { key: 'Emotional/relationship scenarios', kaiwa: 'Core', typical: 'No' },
    { key: 'CJK script comfort', kaiwa: 'Yes', typical: 'No' },
    { key: 'Continuity memory (opt‑in)', kaiwa: 'Yes', typical: 'No' },
  ];
</script>

<section class="container mx-auto max-w-5xl py-12">
  <div class="mx-auto mb-6 max-w-3xl text-center">
    <h3 class="text-2xl font-bold">Why Kaiwa Is Different</h3>
    <p class="mt-2 text-base opacity-80">Built for real conversations and human connection — not drills.</p>
  </div>

  <div class="grid gap-4 md:grid-cols-3">
    {#each (variant === 'compact' ? items.slice(0,6) : items) as item}
      <div class="rounded-xl bg-base-100 p-4 shadow">
        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary text-lg">
            {item.icon}
          </div>
          <div class="text-base font-semibold">{item.title}</div>
        </div>
        <div class="mt-2 text-sm opacity-80">{item.desc}</div>
      </div>
    {/each}
  </div>

  <div class="mt-8 overflow-x-auto rounded-xl border border-base-300 bg-base-100 shadow">
    <div class="px-4 py-3 text-sm font-semibold">Kaiwa Free vs Typical Free</div>
    <table class="table">
      <thead>
        <tr class="text-sm">
          <th class="bg-base-200">Capability</th>
          <th class="text-primary">Kaiwa</th>
          <th>Typical</th>
        </tr>
      </thead>
      <tbody>
        {#each compare as row}
          <tr class="text-sm">
            <td class="font-medium">{row.key}</td>
            <td class="font-semibold text-primary">{row.kaiwa}</td>
            <td>{row.typical}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    <div class="p-3 text-xs opacity-70">Comparisons refer to commonly available free offerings; features vary by product. Built with advanced AI (OpenAI Realtime APIs). “OpenAI” is a trademark of OpenAI; no endorsement implied.</div>
  </div>
</section>
