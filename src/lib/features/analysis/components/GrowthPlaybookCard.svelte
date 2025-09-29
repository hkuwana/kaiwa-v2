<script lang="ts">
	import type { GrowthPlaybook } from '../types/analysis-playbook.types';

	interface Props {
		playbook?: GrowthPlaybook | null;
	}

	let { playbook = null }: Props = $props();
</script>

{#if playbook}
	<div class="card bg-base-100 shadow-xl">
		<div class="card-body space-y-4">
			<div>
				<h3 class="card-title text-primary">{playbook.celebration.headline}</h3>
				<p class="text-sm text-base-content/70">{playbook.celebration.supporting}</p>
			</div>

			{#if playbook.recommendation}
				<div class="rounded-lg border border-base-200 bg-base-200/40 p-4">
					<p class="text-xs tracking-wide text-base-content/60 uppercase">Next conversation</p>
					<h4 class="font-semibold">{playbook.recommendation.title}</h4>
					<p class="text-sm text-base-content/70">{playbook.recommendation.reason}</p>
					<button class="btn mt-3 btn-sm btn-primary" type="button">
						{playbook.recommendation.ctaLabel}
					</button>
				</div>
			{/if}

			{#if playbook.sharePrompt}
				<div class="rounded-lg border border-dashed border-primary/40 p-4">
					<p class="text-xs tracking-wide text-primary uppercase">
						{playbook.sharePrompt.label}
					</p>
					<h4 class="font-semibold">{playbook.sharePrompt.subject}</h4>
					<p class="text-sm text-base-content/70">{playbook.sharePrompt.body}</p>
					{#if playbook.sharePrompt.cta}
						<button class="btn mt-2 btn-outline btn-xs btn-primary" type="button">
							{playbook.sharePrompt.cta.label}
						</button>
					{/if}
				</div>
			{/if}
		</div>
	</div>
{:else}
	<div class="card bg-base-100 shadow">
		<div class="card-body">
			<p class="text-sm text-base-content/70">
				Run an analysis to see your Growth Playbook surfaced here.
			</p>
		</div>
	</div>
{/if}
