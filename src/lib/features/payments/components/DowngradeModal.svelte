<!-- 📉 Downgrade Modal Component -->
<!-- Collects feedback when users downgrade their subscription -->

<script lang="ts">
	import { posthogManager } from '$lib/client/posthog';

	// Props
	let {
		isOpen = $bindable(),
		currentTier = 'plus',
		onConfirm
	} = $props<{
		isOpen: boolean;
		currentTier: string;
		onConfirm: (reason: string, feedback: string) => Promise<void>;
	}>();

	// State
	let isLoading = $state(false);
	let selectedReason = $state('');
	let additionalFeedback = $state('');

	// Downgrade reasons
	const reasons = [
		{ value: 'too_expensive', label: 'Too expensive' },
		{ value: 'not_using_enough', label: 'Not using it enough' },
		{ value: 'missing_features', label: 'Missing features I need' },
		{ value: 'technical_issues', label: 'Experiencing technical issues' },
		{ value: 'trying_alternative', label: 'Trying a different service' },
		{ value: 'achieved_goals', label: 'Achieved my learning goals' },
		{ value: 'other', label: 'Other reason' }
	];

	// Close modal
	function closeModal() {
		isOpen = false;
		selectedReason = '';
		additionalFeedback = '';
	}

	// Handle confirmation
	async function handleConfirm() {
		if (!selectedReason) {
			alert('Please select a reason for downgrading');
			return;
		}

		isLoading = true;

		try {
			// Track downgrade attempt
			posthogManager.trackEvent('downgrade_attempted', {
				from_tier: currentTier,
				to_tier: 'free',
				reason: selectedReason,
				has_feedback: additionalFeedback.length > 0
			});

			await onConfirm(selectedReason, additionalFeedback);

			// Track successful downgrade
			posthogManager.trackEvent('downgrade_confirmed', {
				from_tier: currentTier,
				to_tier: 'free',
				reason: selectedReason
			});

			closeModal();
		} catch (error) {
			console.error('Downgrade error:', error);
			alert('Failed to downgrade. Please try again or contact support.');

			// Track downgrade failure
			posthogManager.trackEvent('downgrade_failed', {
				from_tier: currentTier,
				error: error instanceof Error ? error.message : 'Unknown error'
			});
		} finally {
			isLoading = false;
		}
	}

	// Track modal view
	$effect(() => {
		if (isOpen) {
			posthogManager.trackEvent('downgrade_modal_viewed', {
				current_tier: currentTier
			});
		}
	});
</script>

{#if isOpen}
	<!-- Modal backdrop -->
	<dialog class="modal-open modal">
		<div class="modal-box max-w-2xl">
			<!-- Close button -->
			<form method="dialog">
				<button class="btn absolute top-2 right-2 btn-circle btn-ghost btn-sm" onclick={closeModal}
					>✕</button
				>
			</form>

			<!-- Header -->
			<div class="mb-6">
				<h2 class="mb-2 text-2xl font-bold">We're Sorry to See You Go</h2>
				<p class="opacity-70">
					Your subscription will remain active until the end of your billing period. After that,
					you'll be moved to the Free tier.
				</p>
			</div>

			<!-- Feedback form -->
			<div class="space-y-6">
				<!-- Reason selection -->
				<div class="form-control">
					<label class="label" for="downgrade-reason">
						<span class="label-text font-semibold">Why are you downgrading?</span>
						<span class="label-text-alt text-error">*Required</span>
					</label>
					<select
						id="downgrade-reason"
						class="select select-bordered w-full"
						bind:value={selectedReason}
					>
						<option value="" disabled>Select a reason...</option>
						{#each reasons as reason (reason.value)}
							<option value={reason.value}>{reason.label}</option>
						{/each}
					</select>
				</div>

				<!-- Additional feedback -->
				<div class="form-control">
					<label class="label" for="additional-feedback">
						<span class="label-text font-semibold">Additional feedback (optional)</span>
						<span class="label-text-alt">Help us improve</span>
					</label>
					<textarea
						id="additional-feedback"
						class="textarea textarea-bordered h-24"
						placeholder="Tell us more about your experience..."
						bind:value={additionalFeedback}
						maxlength="500"
					></textarea>
					<label class="label">
						<span class="label-text-alt"></span>
						<span class="label-text-alt">{additionalFeedback.length}/500</span>
					</label>
				</div>

				<!-- What happens next -->
				<div class="alert alert-info">
					<span class="icon-[mdi--information] h-6 w-6 shrink-0"></span>
					<div class="text-sm">
						<h3 class="font-bold">What happens next:</h3>
						<ul class="mt-2 list-inside list-disc space-y-1">
							<li>Your {currentTier} features remain active until your billing period ends</li>
							<li>You won't be charged again</li>
							<li>You can reactivate anytime before the period ends</li>
							<li>After that, you'll have free tier access</li>
						</ul>
					</div>
				</div>
			</div>

			<!-- Actions -->
			<div class="modal-action">
				<button class="btn btn-ghost" onclick={closeModal} disabled={isLoading}>
					Never Mind, Keep {currentTier}
				</button>
				<button class="btn btn-error" onclick={handleConfirm} disabled={isLoading || !selectedReason}>
					{#if isLoading}
						<span class="loading loading-sm loading-spinner"></span>
						Processing...
					{:else}
						Confirm Downgrade
					{/if}
				</button>
			</div>
		</div>

		<!-- Modal backdrop click to close -->
		<form method="dialog" class="modal-backdrop">
			<button onclick={closeModal}>close</button>
		</form>
	</dialog>
{/if}
