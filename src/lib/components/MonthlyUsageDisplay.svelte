<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { usageStore } from '$lib/stores/usage.store.svelte';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { defaultTierConfigs } from '$lib/data/tiers';
	import type { UserTier } from '$lib/data/tiers';
	import { onMount, onDestroy } from 'svelte';

	// Calculate display values
	const remainingSeconds = $derived(usageStore.secondsRemaining());
	const remainingMinutes = $derived(Math.floor(remainingSeconds / 60));
	const remainingSecondsDisplay = $derived(remainingSeconds % 60);
	const percentageUsed = $derived(usageStore.percentageUsed());
	const currentTier = $derived(userManager.effectiveTier);
	const tierConfig = $derived(
		currentTier ? defaultTierConfigs[currentTier as UserTier] : defaultTierConfigs.free
	);
	const monthlyMinutes = $derived(Math.floor((tierConfig?.monthlySeconds || 0) / 60));
	const usedMinutes = $derived(Math.floor((usageStore.usage?.secondsUsed || 0) / 60));
	const bankedMinutes = $derived(Math.floor((usageStore.usage?.bankedSeconds || 0) / 60));

	// Only show if we have usage data loaded
	const hasUsageData = $derived(usageStore.usage !== null && usageStore.tier !== null);

	// Determine display state
	const isLowTime = $derived(remainingMinutes <= 5 && remainingMinutes > 0);
	const isOutOfTime = $derived(remainingMinutes <= 0);
	const showUpgrade = $derived(currentTier === 'free');

	// Dropdown state
	let isDropdownOpen = $state(false);
	let showAdvanced = $state(false);

	function formatTimeRemaining(): string {
		if (isOutOfTime) {
			return '0 minutes remaining';
		}
		if (remainingMinutes === 0 && remainingSecondsDisplay === 0) {
			return '0 minutes remaining';
		}
		if (remainingMinutes === 0) {
			return `${remainingSecondsDisplay} second${remainingSecondsDisplay !== 1 ? 's' : ''} remaining`;
		}
		if (remainingSecondsDisplay === 0) {
			return `${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''} remaining`;
		}
		return `${remainingMinutes} minute${remainingMinutes !== 1 ? 's' : ''} remaining`;
	}

	function handleUpgrade() {
		isDropdownOpen = false;
		goto(resolve('/pricing'));
	}

	function handleViewBilling() {
		isDropdownOpen = false;
		goto(resolve('/profile') + '?tab=billing');
	}

	function toggleDropdown() {
		isDropdownOpen = !isDropdownOpen;
	}

	function toggleAdvanced() {
		showAdvanced = !showAdvanced;
	}

	// Close dropdown when clicking outside
	let dropdownElement: HTMLDivElement;
	function handleClickOutside(event: MouseEvent) {
		if (dropdownElement && !dropdownElement.contains(event.target as Node)) {
			isDropdownOpen = false;
		}
	}

	onMount(() => {
		document.addEventListener('click', handleClickOutside);
	});

	onDestroy(() => {
		document.removeEventListener('click', handleClickOutside);
	});
</script>

{#if userManager.isLoggedIn && hasUsageData}
	<div class="dropdown dropdown-end mb-6" bind:this={dropdownElement}>
		<button
			class="btn {isOutOfTime
				? 'btn-error'
				: isLowTime
					? 'btn-warning'
					: 'btn-outline'} w-full sm:w-auto"
			onclick={toggleDropdown}
			aria-expanded={isDropdownOpen}
			aria-haspopup="true"
		>
			<span class="icon-[mdi--clock-outline] h-5 w-5"></span>
			{formatTimeRemaining()}
			<span class="icon-[mdi--chevron-down] h-4 w-4 transition-transform {isDropdownOpen
				? 'rotate-180'
				: ''}"></span>
		</button>

		{#if isDropdownOpen}
			<ul
				class="dropdown-content menu z-[1] mt-2 w-80 rounded-box bg-base-100 p-2 shadow-lg"
				role="menu"
			>
				<!-- Summary Section -->
				<li class="menu-title">
					<span>Monthly Practice Time</span>
				</li>
				<li>
					<div class="p-3">
						{#if isOutOfTime}
							<div class="text-base font-bold text-error">
								You've used all {monthlyMinutes} minutes this month
							</div>
							<div class="mt-1 text-xs text-base-content/60">
								Time resets at the start of next month
							</div>
						{:else}
							<div class="text-base font-bold text-base-content">
								{remainingMinutes} minute{remainingMinutes !== 1 ? 's' : ''} {remainingSecondsDisplay > 0
									? `and ${remainingSecondsDisplay} second${remainingSecondsDisplay !== 1 ? 's' : ''}`
									: ''} remaining
							</div>
							<div class="mt-1 text-xs text-base-content/60">
								{percentageUsed.toFixed(0)}% of {monthlyMinutes} minutes used this month
							</div>
						{/if}
						<!-- Progress bar -->
						<div class="mt-3 h-2 w-full overflow-hidden rounded-full bg-base-200">
							<div
								class="h-full transition-all duration-300 {isOutOfTime
									? 'bg-error'
									: isLowTime
										? 'bg-warning'
										: 'bg-primary'}"
								style="width: {Math.min(100, percentageUsed)}%"
							></div>
						</div>
					</div>
				</li>

				<!-- Action buttons -->
				<li>
					<div class="flex gap-2 p-2">
						{#if showUpgrade}
							<button class="btn btn-sm btn-primary flex-1" onclick={handleUpgrade}>
								<span class="icon-[mdi--arrow-up-circle] h-4 w-4"></span>
								Upgrade
							</button>
						{/if}
						<button class="btn btn-sm btn-outline flex-1" onclick={handleViewBilling}>
							<span class="icon-[mdi--credit-card] h-4 w-4"></span>
							Manage
						</button>
					</div>
				</li>

				{#if isOutOfTime && showUpgrade}
					<li>
						<div class="rounded bg-base-200 p-2 text-xs text-base-content/70">
							<span class="icon-[mdi--information] h-4 w-4 inline-block mr-1"></span>
							Upgrade to Plus for 300 minutes/month or Premium for 600 minutes/month
						</div>
					</li>
				{/if}

				<!-- Advanced Details Toggle -->
				<li>
					<button
						class="flex w-full items-center justify-between"
						onclick={toggleAdvanced}
					>
						<span>Advanced</span>
						{#if showAdvanced}
							<span class="icon-[mdi--chevron-up] h-4 w-4"></span>
						{:else}
							<span class="icon-[mdi--chevron-down] h-4 w-4"></span>
						{/if}
					</button>
				</li>

				{#if showAdvanced}
					<li>
						<div class="space-y-2 p-3 text-xs">
							<div class="flex justify-between">
								<span class="text-base-content/70">Plan:</span>
								<span class="font-medium">{tierConfig?.name || 'Free'}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-base-content/70">Total monthly allowance:</span>
								<span class="font-medium">{monthlyMinutes} minutes</span>
							</div>
							<div class="flex justify-between">
								<span class="text-base-content/70">Used this month:</span>
								<span class="font-medium">{usedMinutes} minutes</span>
							</div>
							{#if bankedMinutes > 0}
								<div class="flex justify-between">
									<span class="text-base-content/70">Banked time:</span>
									<span class="font-medium text-success">{bankedMinutes} minutes</span>
								</div>
							{/if}
							<div class="flex justify-between">
								<span class="text-base-content/70">Remaining:</span>
								<span class="font-medium {isOutOfTime ? 'text-error' : isLowTime ? 'text-warning' : 'text-success'}">
									{remainingMinutes} minutes
								</span>
							</div>
							<div class="mt-2 border-t border-base-300 pt-2">
								<div class="flex justify-between">
									<span class="text-base-content/70">Usage percentage:</span>
									<span class="font-medium">{percentageUsed.toFixed(1)}%</span>
								</div>
							</div>
						</div>
					</li>
				{/if}
			</ul>
		{/if}
	</div>
{/if}

