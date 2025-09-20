<script lang="ts">
	// 🏆 Tier Badge Component
	// Shows user's current tier and usage status

	import type { UsageStatus } from '$lib/server/tierService';

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
		free: 'icon-[mdi--account-outline]',
		pro: 'icon-[mdi--star]',
		premium: 'icon-[mdi--crown]'
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
			class="badge {tierStyles[tierStatus.tier.id as keyof typeof tierStyles] ||
				tierStyles.free} gap-2"
		>
			<span
				class="{tierIcons[tierStatus.tier.id as keyof typeof tierIcons] ||
					tierIcons.free} h-4 w-4"
			></span>
			<span class="capitalize">{tierStatus.tier.name}</span>
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
								tierStatus.usage.conversationsUsed || 0,
								tierStatus.tier.monthlyConversations
							)}
						</span>
						{#if tierStatus.tier.monthlyConversations !== null}
							<progress
								class="progress {getProgressBarColor(
									getUsagePercentage(
										tierStatus.usage.conversationsUsed || 0,
										tierStatus.tier.monthlyConversations
									)
								)} h-2 w-16"
								value={getUsagePercentage(
									tierStatus.usage.conversationsUsed || 0,
									tierStatus.tier.monthlyConversations
								)}
								max="100"
							></progress>
						{/if}
					</div>
				</div>

				<!-- Seconds -->
				<div class="flex items-center justify-between">
					<span class="opacity-70">Seconds:</span>
					<div class="flex items-center space-x-2">
						<span class="font-medium">
							{formatUsage(tierStatus.usage.secondsUsed || 0, tierStatus.tier.monthlySeconds)}
						</span>
						{#if tierStatus.tier.monthlySeconds !== null}
							<progress
								class="progress {getProgressBarColor(
									getUsagePercentage(
										tierStatus.usage.secondsUsed || 0,
										tierStatus.tier.monthlySeconds
									)
								)} h-2 w-16"
								value={getUsagePercentage(
									tierStatus.usage.secondsUsed || 0,
									tierStatus.tier.monthlySeconds
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
								tierStatus.usage.realtimeSessionsUsed || 0,
								tierStatus.tier.monthlyRealtimeSessions
							)}
						</span>
						{#if tierStatus.tier.monthlyRealtimeSessions !== null}
							<progress
								class="progress {getProgressBarColor(
									getUsagePercentage(
										tierStatus.usage.realtimeSessionsUsed || 0,
										tierStatus.tier.monthlyRealtimeSessions
									)
								)} h-2 w-16"
								value={getUsagePercentage(
									tierStatus.usage.realtimeSessionsUsed || 0,
									tierStatus.tier.monthlyRealtimeSessions
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
					<span class="icon-[mdi--alert-circle] h-5 w-5"></span>
					<span>Monthly conversation limit reached. Upgrade to continue.</span>
				</div>
			{:else if !tierStatus.canUseRealtime}
				<div class="alert alert-warning">
					<span class="icon-[mdi--flash] h-5 w-5"></span>
					<span>Realtime limit reached. Switch to traditional mode or upgrade.</span>
				</div>
			{/if}
		{/if}
	</div>
{:else}
	<!-- Loading state -->
	<div class="badge gap-2 badge-neutral">
		<span class="icon-[mdi--loading] h-4 w-4 animate-spin"></span>
		<span>Loading...</span>
	</div>
{/if}
