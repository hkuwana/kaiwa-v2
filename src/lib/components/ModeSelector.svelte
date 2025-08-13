<script lang="ts">
	// 🔄 Mode Selector Component
	// Switch between traditional and realtime conversation modes

	interface Mode {
		id: 'traditional' | 'realtime';
		name: string;
		description: string;
		icon: string;
		badge?: string;
		enabled: boolean;
	}

	const { selectedMode = 'traditional', onModeChange } = $props<{
		selectedMode?: 'traditional' | 'realtime';
		onModeChange: (mode: 'traditional' | 'realtime') => void;
	}>();

	const modes: Mode[] = [
		{
			id: 'traditional',
			name: 'Traditional',
			description: 'Record → Process → Respond',
			icon: '🎤',
			enabled: true
		},
		{
			id: 'realtime',
			name: 'Real-time',
			description: 'Live conversation streaming',
			icon: '⚡',
			badge: 'NEW',
			enabled: true
		}
	];

	function selectMode(modeId: 'traditional' | 'realtime') {
		if (modes.find((m) => m.id === modeId)?.enabled) {
			onModeChange(modeId);
		}
	}
</script>

<div class="join">
	{#each modes as mode}
		<button
			class="btn join-item {selectedMode === mode.id ? 'btn-active' : ''} relative {!mode.enabled
				? 'btn-disabled'
				: ''}"
			onclick={() => selectMode(mode.id)}
			disabled={!mode.enabled}
			title={mode.description}
		>
			<span class="text-base">{mode.icon}</span>
			<span>{mode.name}</span>

			{#if mode.badge}
				<span class="absolute -top-1 -right-1 badge badge-sm badge-success">
					{mode.badge}
				</span>
			{/if}
		</button>
	{/each}
</div>

<!-- Mode descriptions -->
<div class="mt-2 text-center">
	{#each modes as mode}
		{#if selectedMode === mode.id}
			<p class="text-xs opacity-70 transition-opacity">
				{mode.description}
			</p>
		{/if}
	{/each}
</div>
