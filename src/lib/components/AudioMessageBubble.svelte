<script lang="ts">
	import type { Message } from '$lib/server/db/types';
	import type { Speaker } from '$lib/types';
	import { settingsStore } from '$lib/stores/settings.store.svelte';
	import { getSpeakerById } from '$lib/data/speakers';
	import kitsune from '$lib/assets/kitsune.webp';
	import face from '$lib/assets/Face.webp';
	import { SvelteDate } from 'svelte/reactivity';

	interface Props {
		message: Message;
		speaker?: Speaker;
		conversationLanguage?: string;
		audioUrl?: string;
		isPlayingAudio?: boolean;
		currentTime?: number;
		totalDuration?: number;
		waveform?: number[];
		onPlayAudio?: (messageId: string) => void;
		onPauseAudio?: (messageId: string) => void;
		onSeekAudio?: (messageId: string, time: number) => void;
		showWaveform?: boolean;
	}

	const {
		message,
		speaker,
		conversationLanguage = 'en',
		audioUrl,
		isPlayingAudio = false,
		currentTime = 0,
		totalDuration = 0,
		waveform = [],
		onPlayAudio,
		onPauseAudio,
		onSeekAudio,
		showWaveform = true
	}: Props = $props();

	// State management using Svelte 5 runes
	let isHovered = $state(false);
	let waveformContainer: HTMLDivElement | undefined = $state();

	// Derived states
	const isFromUser = $derived(message.role === 'user');
	const hasAudio = $derived(!!audioUrl);
	const progress = $derived(totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0);

	// Format timestamp
	const formattedTime = $derived(
		new SvelteDate(message.timestamp).toLocaleTimeString([], {
			hour: '2-digit',
			minute: '2-digit'
		})
	);

	// Format audio duration
	const formatAudioTime = (seconds: number) => {
		const mins = Math.floor(seconds / 60);
		const secs = Math.floor(seconds % 60);
		return `${mins}:${secs.toString().padStart(2, '0')}`;
	};

	const formattedCurrentTime = $derived(formatAudioTime(currentTime));
	const formattedTotalTime = $derived(formatAudioTime(totalDuration));

	// Conditional values based on message type
	const chatClass = $derived(isFromUser ? 'chat-end' : 'chat-start');
	const avatarSrc = $derived(isFromUser ? kitsune : face);
	const avatarAlt = $derived(isFromUser ? 'User avatar' : 'AI avatar');
	const speakerName = $derived(
		isFromUser
			? 'You'
			: (() => {
					const currentSpeaker = speaker || getSpeakerById(settingsStore.selectedSpeaker);
					return currentSpeaker?.voiceName || 'AI';
				})()
	);
	const bubbleClass = $derived(isFromUser ? 'chat-bubble chat-bubble-primary' : 'chat-bubble');

	// Event handlers
	function handlePlayPause() {
		if (isPlayingAudio) {
			onPauseAudio?.(message.id);
		} else {
			onPlayAudio?.(message.id);
		}
	}

	function handleWaveformClick(event: MouseEvent) {
		if (!waveformContainer || !onSeekAudio || totalDuration === 0) return;

		const rect = waveformContainer.getBoundingClientRect();
		const clickX = event.clientX - rect.left;
		const percentage = clickX / rect.width;
		const seekTime = percentage * totalDuration;

		onSeekAudio(message.id, seekTime);
	}

	function handleMouseEnter() {
		isHovered = true;
	}

	function handleMouseLeave() {
		isHovered = false;
	}
</script>

<div
	class="audio-message-bubble chat {chatClass}"
	role="listitem"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
>
	<!-- Avatar -->
	<div class="avatar chat-image">
		<div class="w-10 rounded-full">
			<img alt={avatarSrc} src={avatarSrc} />
		</div>
	</div>

	<!-- Header -->
	<div class="chat-header">
		{speakerName}
		<time class="text-xs opacity-50">{formattedTime}</time>
		{#if hasAudio}
			<span class="ml-2 icon-[mdi--volume-high] h-3 w-3 opacity-50"></span>
		{/if}
	</div>

	<!-- Audio Bubble -->
	<div class={bubbleClass}>
		<div class="audio-content space-y-3">
			<!-- Text Content (if available) -->
			{#if message.content}
				<div class="text-content">
					<p class="mb-2 text-sm">{message.content}</p>
				</div>
			{/if}

			<!-- Audio Player Controls -->
			{#if hasAudio}
				<div class="audio-player rounded-lg bg-base-200/50 p-3">
					<div class="flex items-center gap-3">
						<!-- Play/Pause Button -->
						<button
							type="button"
							class="btn btn-circle btn-sm {isPlayingAudio
								? 'btn-primary'
								: 'btn-ghost'} transition-all duration-200"
							onclick={handlePlayPause}
							title={isPlayingAudio ? 'Pause' : 'Play'}
						>
							{#if isPlayingAudio}
								<span class="icon-[mdi--pause] h-5 w-5"></span>
							{:else}
								<span class="icon-[mdi--play] h-5 w-5"></span>
							{/if}
						</button>

						<!-- Waveform or Progress Bar -->
						<div class="flex-1">
							{#if showWaveform && waveform.length > 0}
								<!-- Waveform Visualization -->
								<div
									bind:this={waveformContainer}
									class="waveform-container relative h-8 cursor-pointer overflow-hidden rounded bg-base-300/30"
									onclick={handleWaveformClick}
									role="button"
									tabindex="0"
									title="Click to seek"
								>
									<!-- Waveform Bars -->
									<div class="absolute inset-0 flex items-end justify-around px-1">
										{#each waveform as amplitude, index}
											{@const barProgress = (index / waveform.length) * 100}
											{@const isActive = barProgress <= progress}
											<div
												class="waveform-bar transition-colors duration-150 {isActive
													? 'bg-primary'
													: 'bg-base-content/20'}"
												style="height: {Math.max(2, amplitude * 100)}%; width: {100 /
													waveform.length -
													1}%;"
											></div>
										{/each}
									</div>

									<!-- Progress Indicator -->
									<div
										class="absolute top-0 left-0 h-full bg-primary/20 transition-all duration-150"
										style="width: {progress}%;"
									></div>
								</div>
							{:else}
								<!-- Simple Progress Bar -->
								<div
									class="progress-bar-container relative h-2 cursor-pointer overflow-hidden rounded-full bg-base-content/20"
									onclick={handleWaveformClick}
									role="button"
									tabindex="0"
									title="Click to seek"
								>
									<div
										class="absolute top-0 left-0 h-full bg-primary transition-all duration-150"
										style="width: {progress}%;"
									></div>
									{#if isHovered}
										<div class="absolute inset-0 bg-primary/10"></div>
									{/if}
								</div>
							{/if}
						</div>

						<!-- Time Display -->
						<div
							class="time-display min-w-[4rem] text-right font-mono text-xs text-base-content/70"
						>
							{#if totalDuration > 0}
								{formattedCurrentTime} / {formattedTotalTime}
							{:else}
								--:-- / --:--
							{/if}
						</div>
					</div>

					<!-- Audio Status Indicators -->
					{#if isPlayingAudio}
						<div class="mt-2 flex items-center justify-center">
							<div class="audio-visualizer flex gap-1">
								<div class="bar animate-pulse bg-primary"></div>
								<div class="bar animate-pulse bg-primary" style="animation-delay: 0.1s;"></div>
								<div class="bar animate-pulse bg-primary" style="animation-delay: 0.2s;"></div>
							</div>
							<span class="ml-2 text-xs text-primary">Playing...</span>
						</div>
					{/if}
				</div>
			{:else}
				<!-- No Audio Available -->
				<div class="no-audio-placeholder rounded-lg bg-base-300/20 p-3 text-center">
					<span class="mx-auto mb-2 icon-[mdi--volume-off] h-6 w-6 opacity-50"></span>
					<p class="text-xs text-base-content/50">Audio not available</p>
				</div>
			{/if}
		</div>
	</div>

	<!-- Footer -->
	<div class="chat-footer opacity-50">
		{#if hasAudio}
			<span class="text-xs">Audio message</span>
		{/if}
	</div>
</div>

<style>
	.audio-message-bubble {
		position: relative;
		transition: all 0.2s ease;
	}

	.audio-message-bubble:hover {
		transform: translateY(-1px);
	}

	.audio-content {
		min-width: 280px;
	}

	.waveform-container {
		transition: background-color 0.2s ease;
	}

	.waveform-container:hover {
		background-color: var(--fallback-b3, oklch(var(--b3) / 0.5));
	}

	.waveform-bar {
		min-height: 2px;
		border-radius: 1px;
	}

	.progress-bar-container:hover {
		background-color: var(--fallback-bc, oklch(var(--bc) / 0.3));
	}

	.audio-visualizer .bar {
		width: 3px;
		height: 12px;
		border-radius: 2px;
		animation: visualizer 1s ease-in-out infinite;
	}

	@keyframes visualizer {
		0%,
		100% {
			height: 4px;
		}
		50% {
			height: 12px;
		}
	}
</style>
