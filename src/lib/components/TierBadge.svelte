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
		free: 'bg-gray-100 text-gray-800 border-gray-300',
		pro: 'bg-blue-100 text-blue-800 border-blue-300',
		premium: 'bg-purple-100 text-purple-800 border-purple-300'
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
		if (percentage >= 90) return 'bg-red-500';
		if (percentage >= 75) return 'bg-yellow-500';
		return 'bg-green-500';
	}
</script>

{#if tierStatus}
	<div class="space-y-3">
		<!-- Tier Badge -->
		<div
			class="inline-flex items-center space-x-2 rounded-full border px-3 py-1 text-sm font-medium {tierStyles[
				tierStatus.tier as keyof typeof tierStyles
			] || tierStyles.free}"
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
					<span class="text-gray-600">Conversations:</span>
					<div class="flex items-center space-x-2">
						<span class="font-medium">
							{formatUsage(
								tierStatus.usage.conversationsUsed,
								tierStatus.limits.monthlyConversations
							)}
						</span>
						{#if tierStatus.limits.monthlyConversations !== null}
							<div class="h-2 w-16 rounded-full bg-gray-200">
								<div
									class="h-2 rounded-full transition-all {getProgressBarColor(
										getUsagePercentage(
											tierStatus.usage.conversationsUsed,
											tierStatus.limits.monthlyConversations
										)
									)}"
									style="width: {getUsagePercentage(
										tierStatus.usage.conversationsUsed,
										tierStatus.limits.monthlyConversations
									)}%"
								></div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Minutes -->
				<div class="flex items-center justify-between">
					<span class="text-gray-600">Minutes:</span>
					<div class="flex items-center space-x-2">
						<span class="font-medium">
							{formatUsage(tierStatus.usage.minutesUsed, tierStatus.limits.monthlyMinutes)}
						</span>
						{#if tierStatus.limits.monthlyMinutes !== null}
							<div class="h-2 w-16 rounded-full bg-gray-200">
								<div
									class="h-2 rounded-full transition-all {getProgressBarColor(
										getUsagePercentage(
											tierStatus.usage.minutesUsed,
											tierStatus.limits.monthlyMinutes
										)
									)}"
									style="width: {getUsagePercentage(
										tierStatus.usage.minutesUsed,
										tierStatus.limits.monthlyMinutes
									)}%"
								></div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Realtime Sessions -->
				<div class="flex items-center justify-between">
					<span class="text-gray-600">Realtime:</span>
					<div class="flex items-center space-x-2">
						<span class="font-medium">
							{formatUsage(
								tierStatus.usage.realtimeSessionsUsed,
								tierStatus.limits.monthlyRealtimeSessions
							)}
						</span>
						{#if tierStatus.limits.monthlyRealtimeSessions !== null}
							<div class="h-2 w-16 rounded-full bg-gray-200">
								<div
									class="h-2 rounded-full transition-all {getProgressBarColor(
										getUsagePercentage(
											tierStatus.usage.realtimeSessionsUsed,
											tierStatus.limits.monthlyRealtimeSessions
										)
									)}"
									style="width: {getUsagePercentage(
										tierStatus.usage.realtimeSessionsUsed,
										tierStatus.limits.monthlyRealtimeSessions
									)}%"
								></div>
							</div>
						{/if}
					</div>
				</div>

				<!-- Reset Date -->
				<div class="border-t pt-1 text-xs text-gray-500">
					Resets: {tierStatus.resetDate.toLocaleDateString()}
				</div>
			</div>

			<!-- Warnings -->
			{#if !tierStatus.canStartConversation}
				<div class="flex items-center space-x-2 rounded-lg bg-red-50 p-3 text-sm text-red-800">
					<span>⚠️</span>
					<span>Monthly conversation limit reached. Upgrade to continue.</span>
				</div>
			{:else if !tierStatus.canUseRealtime}
				<div
					class="flex items-center space-x-2 rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800"
				>
					<span>⚡</span>
					<span>Realtime limit reached. Switch to traditional mode or upgrade.</span>
				</div>
			{/if}
		{/if}
	</div>
{:else}
	<!-- Loading state -->
	<div
		class="inline-flex items-center space-x-2 rounded-full border border-gray-300 bg-gray-100 px-3 py-1 text-sm font-medium text-gray-500"
	>
		<span>⏳</span>
		<span>Loading...</span>
	</div>
{/if}
