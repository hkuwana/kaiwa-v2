<script lang="ts">
	import type { UsageStatus } from '$lib/server/tier.service';

	interface Props {
		usageStatus: UsageStatus | null;
	}

	const { usageStatus }: Props = $props();

	const formatDuration = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		return `${minutes}m`;
	};

	const calculatePercentage = (current: number, limit: number) => {
		if (limit === 0) return 0;
		return Math.min((current / limit) * 100, 100);
	};
</script>

<div class="usage-stats mt-6">
	<h3 class="mb-4 text-lg font-semibold text-base-content">Usage Statistics</h3>
	{#if usageStatus}
		<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
			<!-- Conversation Limit -->
			<div class="stat-item">
				<div class="mb-1 flex items-center justify-between">
					<span class="font-medium">Conversations</span>
					<span class="text-sm text-base-content/70"
						>{usageStatus.usage.conversations} / {usageStatus.tier.conversationLimit}</span
					>
				</div>
				<progress
					class="progress w-full progress-primary"
					value={calculatePercentage(
						usageStatus.usage.conversations,
						usageStatus.tier.conversationLimit
					)}
					max="100"
				></progress>
			</div>

			<!-- Real-time Limit -->
			<div class="stat-item">
				<div class="mb-1 flex items-center justify-between">
					<span class="font-medium">Real-time Minutes</span>
					<span class="text-sm text-base-content/70"
						>{formatDuration(usageStatus.usage.realtimeSeconds)} /
						{formatDuration(usageStatus.tier.realtimeSecondsLimit)}</span
					>
				</div>
				<progress
					class="progress w-full progress-accent"
					value={calculatePercentage(
						usageStatus.usage.realtimeSeconds,
						usageStatus.tier.realtimeSecondsLimit
					)}
					max="100"
				></progress>
			</div>
		</div>
	{:else}
		<div class="rounded-lg border border-dashed p-4 text-center">
			<p class="text-base-content/70">Usage statistics are not available at the moment.</p>
		</div>
	{/if}
</div>
