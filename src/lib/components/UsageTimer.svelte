<!-- Simple usage timer component showing remaining time -->
<script lang="ts">
	interface Props {
		remainingSeconds: number;
		totalSeconds: number;
		showIcon?: boolean;
		size?: 'sm' | 'md' | 'lg';
		className?: string;
	}

	const {
		remainingSeconds,
		totalSeconds,
		showIcon = true,
		size = 'md',
		className = ''
	}: Props = $props();

	// Calculate percentage used
	const usedSeconds = totalSeconds - remainingSeconds;
	const percentageUsed = Math.max(0, Math.min(100, (usedSeconds / totalSeconds) * 100));
	const percentageRemaining = 100 - percentageUsed;

	// Convert to minutes for display
	const remainingMinutes = Math.ceil(remainingSeconds / 60);
	const totalMinutes = Math.ceil(totalSeconds / 60);

	// Size classes
	const sizeClasses = {
		sm: 'text-xs',
		md: 'text-sm',
		lg: 'text-base'
	};

	// Icon size
	const iconSizes = {
		sm: 'h-3 w-3',
		md: 'h-4 w-4',
		lg: 'h-5 w-5'
	};

	// Color coding based on remaining time
	const getColorClass = (remaining: number, total: number) => {
		const percentage = (remaining / total) * 100;
		if (percentage > 50) return 'text-success';
		if (percentage > 20) return 'text-warning';
		return 'text-error';
	};

	const colorClass = getColorClass(remainingMinutes, totalMinutes);
</script>

<div class="flex items-center gap-2 {className} {sizeClasses[size]}">
	{#if showIcon}
		<!-- Sand timer icon -->
		<div class="relative {iconSizes[size]} {colorClass}">
			<svg fill="currentColor" viewBox="0 0 24 24" class="h-full w-full">
				<path d="M6 2h12v2.4L12 10l6 5.6V18H6v-2.4L12 10 6 4.4V2zm2 2v1.6l4 3.2 4-3.2V4H8zm0 12h8v-1.6l-4-3.2-4 3.2V16z"/>
			</svg>
			<!-- Sand animation based on usage -->
			<div
				class="absolute bottom-0 left-0 w-full bg-current opacity-20 transition-all duration-300"
				style="height: {percentageUsed}%"
			></div>
		</div>
	{/if}

	<span class="{colorClass} font-medium">
		{remainingMinutes}min left
	</span>

	<!-- Optional progress bar -->
	<div class="flex-1 max-w-16">
		<div class="h-1.5 bg-base-300 rounded-full overflow-hidden">
			<div
				class="h-full transition-all duration-300 {colorClass.replace('text-', 'bg-')}"
				style="width: {percentageRemaining}%"
			></div>
		</div>
	</div>
</div>