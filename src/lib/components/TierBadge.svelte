<script lang="ts">
	// 🏆 Tier Badge Component
	// Shows user's current tier and usage status

	import type { UsageStatus } from '$lib/server/tierService.js';

	const { tierStatus, showDetails = false } = $props<{
		tierStatus?: UsageStatus | null;
		showDetails?: boolean;
	}>();

	// Tier styling
	const tierStyles = {
		free: 'badge-neutral',
		pro: 'badge-primary',
		premium: 'badge-secondary'
	};

	const tierIcons = {
		free: '🆓',
		pro: '⭐',
		premium: '👑'
	};

	function formatUsage(used: number, limit: number | null): string {
		if (limit === null) return `${used}`;
		return `${used}/${limit}`;
	}

	function getUsagePercentage(used: number, limit: number | null): number {
		if (limit === null) return 0;
		return Math.min((used / limit) * 100, 100);
	}

	function getProgressBarColor(percentage: number): string {
		if (percentage >= 90) return 'progress-error';
		if (percentage >= 75) return 'progress-warning';
		return 'progress-success';
	}
</script>

{#if tierStatus}
	<div class="space-y-3">
		<!-- Tier Badge -->
		<div
			class="badge {tierStyles[tierStatus.tier as keyof typeof tierStyles] ||
				tierStyles.free} gap-2"
		>
			<span class="text-base"
				>{tierIcons[tierStatus.tier as keyof typeof tierIcons] || tierIcons.free}</span
			>
			<span class="capitalize">{tierStatus.tier}</span>
		</div>

		{#if showDetails}
			<!-- Usage Details -->
			<div class="space-y-2 text-sm">
				<!-- Conversations -->
				<div class="flex items-center justify-between">
					<span class="opacity-70">Conversations:</span>
					<div class="flex items-center space-x-2">
						<span class="font-medium">
							{formatUsage(
								tierStatus.usage.conversationsUsed,
								tierStatus.limits.monthlyConversations
							)}
						</span>
						{#if tierStatus.limits.monthlyConversations !== null}
							<progress
								class="progress {getProgressBarColor(
									getUsagePercentage(
										tierStatus.usage.conversationsUsed,
										tierStatus.limits.monthlyConversations
									)
								)} h-2 w-16"
								value={getUsagePercentage(
									tierStatus.usage.conversationsUsed,
									tierStatus.limits.monthlyConversations
								)}
								max="100"
							></progress>
						{/if}
					</div>
				</div>

				<!-- Minutes -->
				<div class="flex items-center justify-between">
					<span class="opacity-70">Minutes:</span>
					<div class="flex items-center space-x-2">
						<span class="font-medium">
							{formatUsage(tierStatus.usage.minutesUsed, tierStatus.limits.monthlyMinutes)}
						</span>
						{#if tierStatus.limits.monthlyMinutes !== null}
							<progress
								class="progress {getProgressBarColor(
									getUsagePercentage(tierStatus.usage.minutesUsed, tierStatus.limits.monthlyMinutes)
								)} h-2 w-16"
								value={getUsagePercentage(
									tierStatus.usage.minutesUsed,
									tierStatus.limits.monthlyMinutes
								)}
								max="100"
							></progress>
						{/if}
					</div>
				</div>

				<!-- Realtime Sessions -->
				<div class="flex items-center justify-between">
					<span class="opacity-70">Realtime:</span>
					<div class="flex items-center space-x-2">
						<span class="font-medium">
							{formatUsage(
								tierStatus.usage.realtimeSessionsUsed,
								tierStatus.limits.monthlyRealtimeSessions
							)}
						</span>
						{#if tierStatus.limits.monthlyRealtimeSessions !== null}
							<progress
								class="progress {getProgressBarColor(
									getUsagePercentage(
										tierStatus.usage.realtimeSessionsUsed,
										tierStatus.limits.monthlyRealtimeSessions
									)
								)} h-2 w-16"
								value={getUsagePercentage(
									tierStatus.usage.realtimeSessionsUsed,
									tierStatus.limits.monthlyRealtimeSessions
								)}
								max="100"
							></progress>
						{/if}
					</div>
				</div>

				<!-- Reset Date -->
				<div class="divider my-1"></div>
				<div class="text-xs opacity-50">
					Resets: {tierStatus.resetDate.toLocaleDateString()}
				</div>
			</div>

			<!-- Warnings -->
			{#if !tierStatus.canStartConversation}
				<div class="alert alert-error">
					<span>⚠️</span>
					<span>Monthly conversation limit reached. Upgrade to continue.</span>
				</div>
			{:else if !tierStatus.canUseRealtime}
				<div class="alert alert-warning">
					<span>⚡</span>
					<span>Realtime limit reached. Switch to traditional mode or upgrade.</span>
				</div>
			{/if}
		{/if}
	</div>
{:else}
	<!-- Loading state -->
	<div class="badge gap-2 badge-neutral">
		<span>⏳</span>
		<span>Loading...</span>
	</div>
{/if}
