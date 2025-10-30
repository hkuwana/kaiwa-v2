<script lang="ts">
	interface Props {
		currentStage?: 'selection' | 'chat' | 'review';
		showLabels?: boolean;
		compact?: boolean;
	}

	let { currentStage = 'selection', showLabels = true, compact = false }: Props = $props();

	const stages = [
		{
			id: 'selection',
			label: 'Selection',
			description: 'Choose language & scenario',
			icon: 'icon-[mdi--cog]'
		},
		{
			id: 'chat',
			label: 'Chat',
			description: 'Practice conversation',
			icon: 'icon-[mdi--chat]'
		},
		{
			id: 'review',
			label: 'Review',
			description: 'See your insights',
			icon: 'icon-[mdi--chart-line]'
		}
	];

	const currentStageIndex = stages.findIndex((stage) => stage.id === currentStage);
</script>

<div class="w-full" class:scale-90={compact}>
	<div class="flex items-center justify-center gap-2">
		{#each stages as stage, index (stage.id)}
			<div class="flex items-center">
				<!-- Stage Circle -->
				<div
					class="flex h-6 w-6 items-center justify-center rounded-full border-2 transition-all duration-300 sm:h-8 sm:w-8 {index <=
					currentStageIndex
						? index < currentStageIndex
							? 'border-success bg-success text-success-content'
							: 'border-primary bg-primary text-primary-content ring-2 ring-primary/30 ring-offset-2 ring-offset-base-100'
						: 'border-base-300 bg-base-100 text-base-content/50'}"
				>
					<span class="{stage.icon} h-3 w-3 sm:h-4 sm:w-4"></span>
				</div>

				<!-- Stage Label (if not compact) -->
				{#if showLabels && !compact}
					<div class="ml-2 text-sm">
						<div class="font-medium {index !== currentStageIndex ? 'opacity-70' : ''}">
							{stage.label}
						</div>
						{#if index === currentStageIndex}
							<div class="text-xs opacity-60">{stage.description}</div>
						{/if}
					</div>
				{/if}

				<!-- Connector Line -->
				{#if index < stages.length - 1}
					<div
						class="h-0.5 w-6 transition-colors duration-300 sm:w-8 {index < currentStageIndex
							? 'bg-primary'
							: 'bg-base-300'}"
					></div>
				{/if}
			</div>
		{/each}
	</div>
</div>
