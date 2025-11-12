<script lang="ts">
	import { notificationStore } from '$lib/stores/notification.store.svelte';

	let isOpen = $state(false);
	let feedbackType = $state<'bug' | 'suggestion' | 'debug'>('bug');
	let message = $state('');
	let isSubmitting = $state(false);

	const feedbackTypes = [
		{ value: 'bug', label: '🐛 Bug Report', description: 'Something is broken' },
		{ value: 'suggestion', label: '💡 Suggestion', description: 'Feature idea' },
		{ value: 'debug', label: '🔧 Debug Request', description: 'Need to investigate' }
	] as const;

	async function handleSubmit() {
		if (!message.trim()) {
			notificationStore.warning('Please enter your feedback');
			return;
		}

		isSubmitting = true;

		try {
			const response = await fetch('/api/feedback', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					type: feedbackType,
					message: message.trim(),
					timestamp: new Date().toISOString(),
					url: typeof window !== 'undefined' ? window.location.href : '',
					userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : ''
				})
			});

			if (!response.ok) throw new Error('Failed to submit feedback');

			notificationStore.success('Thanks for the feedback! 🙏');
			isOpen = false;
			message = '';
			feedbackType = 'bug';
		} catch (error) {
			console.error('Feedback submission error:', error);
			notificationStore.error('Failed to submit feedback. Try again?');
		} finally {
			isSubmitting = false;
		}
	}

	function handleClose() {
		isOpen = false;
		message = '';
		feedbackType = 'bug';
	}
</script>

<!-- Floating Feedback Button (left side, responsive size) -->
<button
	class="btn btn-circle btn-primary shadow-lg fixed left-4 bottom-6 z-40 md:left-8 md:bottom-8 btn-sm md:btn-lg transition-all hover:scale-110"
	title="Send feedback or ask for help"
	onclick={() => (isOpen = true)}
	aria-label="Open feedback form"
>
	<span class="icon-[mdi--help-circle] h-5 w-5 md:h-6 md:w-6"></span>
</button>

<!-- Feedback Modal -->
{#if isOpen}
	<dialog class="modal modal-open">
		<div class="modal-box w-full max-w-md">
			<!-- Header -->
			<div class="flex items-center justify-between mb-4">
				<h2 class="text-2xl font-bold">Send Feedback</h2>
				<button
					class="btn btn-circle btn-ghost btn-sm"
					onclick={handleClose}
					aria-label="Close feedback form"
				>
					✕
				</button>
			</div>

			<!-- Description -->
			<p class="text-sm opacity-70 mb-4">
				Help us improve. Early stage feedback is super valuable! 🌱
			</p>

			<!-- Form -->
			<form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
				<!-- Feedback Type Selector -->
				<div class="form-control mb-4">
					<label class="label">
						<span class="label-text font-semibold">What's on your mind?</span>
					</label>
					<div class="space-y-2">
						{#each feedbackTypes as type (type.value)}
							<label class="label cursor-pointer rounded-lg border border-base-300 p-3 hover:border-primary">
								<span class="label-text">
									<span class="font-medium">{type.label}</span>
									<span class="block text-xs opacity-60">{type.description}</span>
								</span>
								<input
									type="radio"
									name="feedback-type"
									class="radio"
									bind:group={feedbackType}
									value={type.value}
								/>
							</label>
						{/each}
					</div>
				</div>

				<!-- Message Input -->
				<div class="form-control mb-4">
					<label class="label">
						<span class="label-text font-semibold">Your feedback</span>
					</label>
					<textarea
						class="textarea textarea-bordered h-32 resize-none"
						placeholder="Tell us what you're thinking..."
						bind:value={message}
						disabled={isSubmitting}
					></textarea>
					<label class="label">
						<span class="label-text-alt text-xs opacity-50">
							{message.length} / 500
						</span>
					</label>
				</div>

				<!-- Actions -->
				<div class="flex gap-2">
					<button
						type="button"
						class="btn btn-ghost flex-1"
						onclick={handleClose}
						disabled={isSubmitting}
					>
						Cancel
					</button>
					<button
						type="submit"
						class="btn btn-primary flex-1"
						disabled={isSubmitting || !message.trim()}
					>
						{#if isSubmitting}
							<span class="loading loading-spinner loading-sm"></span>
						{:else}
							Send
						{/if}
					</button>
				</div>
			</form>
		</div>

		<!-- Backdrop - closes on click -->
		<form method="dialog" class="modal-backdrop" onsubmit={handleClose}>
			<button type="submit"></button>
		</form>
	</dialog>
{/if}
