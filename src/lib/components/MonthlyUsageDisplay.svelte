<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { onMount } from 'svelte';

	// Props - all data passed in from parent
	interface Props {
		remainingSeconds: number;
		monthlySeconds: number;
		usedSeconds: number;
		bankedSeconds?: number;
		tierName: string;
		showUpgradeOption: boolean;
		isLoading?: boolean;
		conversationsUsed?: number;
		realtimeSessionsUsed?: number;
		analysesUsed?: number;
		overageSeconds?: number;
	}

	let {
		remainingSeconds,
		monthlySeconds,
		usedSeconds,
		bankedSeconds = 0,
		tierName,
		showUpgradeOption,
		isLoading = false,
		conversationsUsed = 0,
		realtimeSessionsUsed = 0,
		analysesUsed = 0,
		overageSeconds = 0
	}: Props = $props();

	// Derived calculations (pure presentation logic)
	const remainingMinutes = $derived(Math.floor(remainingSeconds / 60));
	const remainingSecondsDisplay = $derived(remainingSeconds % 60);
	const remainingHours = $derived(Math.floor(remainingMinutes / 60));
	const remainingMinutesDisplay = $derived(remainingMinutes % 60);
	
	const monthlyMinutes = $derived(Math.floor(monthlySeconds / 60));
	const usedMinutes = $derived(Math.floor(usedSeconds / 60));
	const bankedMinutes = $derived(Math.floor(bankedSeconds / 60));
	
	const totalAvailableSeconds = $derived(monthlySeconds + bankedSeconds);
	const percentageUsed = $derived(
		totalAvailableSeconds > 0 ? ((usedSeconds / totalAvailableSeconds) * 100) : 0
	);
	const percentageRemaining = $derived(Math.max(0, 100 - percentageUsed));
	
	// Display state
	const isLowTime = $derived(percentageRemaining < 15 && remainingMinutes > 0);
	const isCriticalTime = $derived(percentageRemaining < 5 && remainingMinutes > 0);
	const isOutOfTime = $derived(remainingMinutes <= 0);

	// Dropdown state
	let isDropdownOpen = $state(false);
	let showAdvanced = $state(false);

	// Format time in the most appropriate unit
	function formatTimeDisplay(): { value: string; unit: string; subtext: string } {
		if (isOutOfTime) {
			return { value: '0', unit: 'min', subtext: 'out of time' };
		}

		// Show hours with decimal if >= 60 minutes
		if (remainingMinutes >= 60) {
			const hoursDecimal = (remainingMinutes / 60).toFixed(1);
			return {
				value: hoursDecimal,
				unit: 'h',
				subtext: 'remaining'
			};
		}

		// Show minutes if >= 1 minute
		if (remainingMinutes >= 1) {
			return {
				value: remainingMinutes.toString(),
				unit: remainingMinutes === 1 ? 'min' : 'mins',
				subtext: 'remaining'
			};
		}

		// Show seconds if < 1 minute
		return {
			value: remainingSecondsDisplay.toString(),
			unit: remainingSecondsDisplay === 1 ? 'sec' : 'secs',
			subtext: 'remaining'
		};
	}

	const timeDisplay = $derived(formatTimeDisplay());

	// SVG circle calculations for progress ring
	const circleRadius = 58;
	const circleCircumference = 2 * Math.PI * circleRadius;
	const strokeDashoffset = $derived(
		circleCircumference - (percentageRemaining / 100) * circleCircumference
	);

	// Determine color based on state
	const ringColor = $derived(
		isOutOfTime ? '#ef4444' : isCriticalTime ? '#f97316' : isLowTime ? '#f59e0b' : '#3b82f6'
	);

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
		
		return () => {
			document.removeEventListener('click', handleClickOutside);
		};
	});
</script>

<div class="relative mb-6" bind:this={dropdownElement}>
	{#if isLoading}
		<!-- Loading state -->
		<div class="relative mx-auto flex flex-col items-center">
			<div class="relative h-36 w-36">
				<!-- Outer ring skeleton -->
				<div class="absolute inset-0 rounded-full border-8 border-base-200"></div>
				
				<!-- Spinning gradient indicator -->
				<div class="absolute inset-0 flex items-center justify-center">
					<span class="loading loading-spinner loading-lg text-primary"></span>
				</div>
			</div>
			<div class="mt-2 flex flex-col items-center gap-1">
				<div class="skeleton h-4 w-20"></div>
				<div class="skeleton h-3 w-16"></div>
			</div>
		</div>
	{:else}
		<!-- Main circular display -->
		<button
			onclick={toggleDropdown}
			class="group relative mx-auto flex flex-col items-center transition-transform hover:scale-[1.02] active:scale-[0.98]"
			aria-expanded={isDropdownOpen}
			aria-haspopup="true"
			aria-label="View usage details"
		>
			<!-- Circular progress ring -->
			<div class="relative h-36 w-36">
				<!-- Background circle -->
				<svg class="absolute inset-0 h-full w-full -rotate-90 transform">
					<circle
						cx="72"
						cy="72"
						r={circleRadius}
						stroke="currentColor"
						stroke-width="8"
						fill="none"
						class="text-base-200"
					/>
					<!-- Progress circle -->
					<circle
						cx="72"
						cy="72"
						r={circleRadius}
						stroke={ringColor}
						stroke-width="8"
						fill="none"
						stroke-linecap="round"
						stroke-dasharray={circleCircumference}
						stroke-dashoffset={strokeDashoffset}
						class="transition-all duration-700 ease-in-out"
						style="filter: drop-shadow(0 0 6px {ringColor}40)"
					/>
				</svg>

				<!-- Center content -->
				<div class="absolute inset-0 flex flex-col items-center justify-center">
					<div class="text-5xl font-extralight tracking-tight" style="color: {ringColor}">
						{timeDisplay.value}
					</div>
					<div class="text-sm font-medium tracking-wide opacity-60">
						{timeDisplay.unit}
					</div>
				</div>
			</div>

			<!-- Subtext -->
			<div class="mt-2 text-sm font-medium opacity-50 transition-opacity group-hover:opacity-70">
				{timeDisplay.subtext}
			</div>

			<!-- Subtle indicator -->
			<div class="mt-1 flex items-center gap-1 text-xs opacity-40">
				<span>details</span>
				<span class="icon-[mdi--chevron-down] h-3 w-3 transition-transform {isDropdownOpen ? 'rotate-180' : ''}"></span>
			</div>
		</button>

		<!-- Dropdown details panel -->
		{#if isDropdownOpen}
			<div
				class="absolute left-1/2 z-[100] mt-2 w-80 -translate-x-1/2 rounded-2xl bg-base-100 shadow-2xl ring-1 ring-base-300"
				role="menu"
			>
				<div class="p-6">
					<!-- Summary -->
					<div class="mb-4">
						<div class="text-xs font-semibold uppercase tracking-wider opacity-50">
							Monthly Practice
						</div>
						<div class="mt-2 text-base-content/80">
							{#if isOutOfTime}
								<div class="text-sm leading-relaxed">
									You've used all <span class="font-semibold">{monthlyMinutes} minutes</span> this month.
									Time resets at the start of next month.
								</div>
							{:else}
								<div class="text-sm leading-relaxed">
									<span class="font-semibold">{usedMinutes}</span> of <span class="font-semibold">{monthlyMinutes} minutes</span> used
									{#if bankedMinutes > 0}
										<span class="text-success"> (+{bankedMinutes} banked)</span>
									{/if}
								</div>
							{/if}
						</div>
					</div>

					<!-- Action buttons -->
					<div class="flex gap-2">
					{#if showUpgradeOption}
						<button 
							class="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-content transition-all hover:brightness-110 active:scale-95" 
							onclick={handleUpgrade}
						>
							Upgrade
						</button>
					{/if}
						<button 
							class="flex-1 rounded-xl border border-base-300 px-4 py-2.5 text-sm font-medium transition-all hover:bg-base-200 active:scale-95" 
							onclick={handleViewBilling}
						>
							Manage
						</button>
					</div>

					{#if isOutOfTime && showUpgradeOption}
						<div class="mt-4 rounded-lg bg-base-200/50 p-3 text-xs leading-relaxed text-base-content/70">
							Upgrade for more time: <span class="font-medium">Plus 300 min/mo</span> or <span class="font-medium">Premium 600 min/mo</span>
						</div>
					{/if}

					<!-- Advanced toggle -->
					<button
						class="mt-4 flex w-full items-center justify-between rounded-lg px-2 py-2 text-sm font-medium transition-colors hover:bg-base-200"
						onclick={toggleAdvanced}
					>
						<span class="opacity-60">Details</span>
						<span class="icon-[mdi--chevron-{showAdvanced ? 'up' : 'down'}] h-4 w-4 opacity-40"></span>
					</button>

					{#if showAdvanced}
						<div class="mt-3 space-y-3 border-t border-base-300 pt-4 text-xs">
							<!-- Plan info -->
							<div class="space-y-1.5">
								<div class="flex justify-between">
									<span class="opacity-60">Plan</span>
									<span class="font-medium capitalize">{tierName}</span>
								</div>
								<div class="flex justify-between">
									<span class="opacity-60">Monthly allowance</span>
									<span class="font-medium">{monthlyMinutes} min</span>
								</div>
								<div class="flex justify-between">
									<span class="opacity-60">Used this month</span>
									<span class="font-medium">{usedMinutes} min</span>
								</div>
								{#if bankedMinutes > 0}
									<div class="flex justify-between">
										<span class="opacity-60">Banked time</span>
										<span class="font-medium text-success">{bankedMinutes} min</span>
									</div>
								{/if}
								<div class="flex justify-between">
									<span class="opacity-60">Remaining</span>
									<span class="font-medium" style="color: {ringColor}">{remainingMinutes} min</span>
								</div>
							</div>

							<!-- Usage stats -->
							{#if conversationsUsed > 0 || realtimeSessionsUsed > 0 || analysesUsed > 0}
								<div class="space-y-1.5 border-t border-base-300 pt-3">
									<div class="mb-2 text-xs font-medium uppercase tracking-wider opacity-50">Usage Stats</div>
									{#if realtimeSessionsUsed > 0}
										<div class="flex justify-between">
											<span class="opacity-60">Sessions</span>
											<span class="font-medium">{realtimeSessionsUsed}</span>
										</div>
									{/if}
									{#if conversationsUsed > 0}
										<div class="flex justify-between">
											<span class="opacity-60">Conversations</span>
											<span class="font-medium">{conversationsUsed}</span>
										</div>
									{/if}
									{#if analysesUsed > 0}
										<div class="flex justify-between">
											<span class="opacity-60">Analyses</span>
											<span class="font-medium">{analysesUsed}</span>
										</div>
									{/if}
									{#if overageSeconds > 0}
										<div class="flex justify-between">
											<span class="opacity-60">Overage</span>
											<span class="font-medium text-warning">{Math.floor(overageSeconds / 60)} min</span>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		{/if}
	{/if}
</div>
