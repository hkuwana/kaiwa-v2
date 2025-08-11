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

<div class="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
	{#each modes as mode}
		<button
			class="relative flex flex-1 items-center justify-center space-x-2 rounded-md px-4 py-2 text-sm font-medium transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none {selectedMode ===
			mode.id
				? 'bg-white text-blue-700 shadow-sm'
				: 'text-gray-600 hover:text-gray-900'} {!mode.enabled
				? 'cursor-not-allowed opacity-50'
				: ''}"
			onclick={() => selectMode(mode.id)}
			disabled={!mode.enabled}
			title={mode.description}
		>
			<span class="text-base">{mode.icon}</span>
			<span>{mode.name}</span>

			{#if mode.badge}
				<span
					class="absolute -top-1 -right-1 rounded-full bg-green-500 px-1.5 py-0.5 text-xs font-bold text-white"
				>
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
			<p class="text-xs text-gray-500 transition-opacity">
				{mode.description}
			</p>
		{/if}
	{/each}
</div>
