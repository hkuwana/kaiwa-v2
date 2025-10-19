<script lang="ts">
	import { track } from '$lib/analytics/posthog';
	import { SvelteDate } from 'svelte/reactivity';

	interface Props {
		sessionId: string;
		onClose: () => void;
	}

	let { sessionId, onClose }: Props = $props();

	let reason = $state('');
	let comment = $state('');
	let isSubmitting = $state(false);

	async function handleSubmit() {
		if (!reason) return;

		isSubmitting = true;

		try {
			// Track to PostHog
			track('exit_survey_submitted', {
				sessionId,
				reason,
				comment,
				timestamp: new SvelteDate().toISOString()
			});

			// Save to database
			await fetch('/api/feedback/exit-survey', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ sessionId, reason, comment })
			});

			onClose();
		} catch (error) {
			console.error('Error submitting exit survey:', error);
		} finally {
			isSubmitting = false;
		}
	}
</script>

<dialog class="modal-open modal">
	<div class="modal-box max-w-md">
		<h3 class="mb-4 text-xl font-bold">Quick Question Before You Go</h3>
		<p class="mb-4 text-base opacity-90">What conversation were you hoping to practice?</p>

		<div class="mb-4 space-y-2">
			<label class="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-base-200">
				<input
					type="radio"
					name="reason"
					value="partner_family"
					bind:group={reason}
					class="radio radio-sm radio-primary"
				/>
				<span class="text-sm">Meeting my partner's family</span>
			</label>

			<label class="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-base-200">
				<input
					type="radio"
					name="reason"
					value="heritage"
					bind:group={reason}
					class="radio radio-sm radio-primary"
				/>
				<span class="text-sm">Talking with heritage relatives (grandparents, etc.)</span>
			</label>

			<label class="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-base-200">
				<input
					type="radio"
					name="reason"
					value="travel"
					bind:group={reason}
					class="radio radio-sm radio-primary"
				/>
				<span class="text-sm">Travel/survival conversations</span>
			</label>

			<label class="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-base-200">
				<input
					type="radio"
					name="reason"
					value="business"
					bind:group={reason}
					class="radio radio-sm radio-primary"
				/>
				<span class="text-sm">Business/work scenarios</span>
			</label>

			<label class="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-base-200">
				<input
					type="radio"
					name="reason"
					value="general"
					bind:group={reason}
					class="radio radio-sm radio-primary"
				/>
				<span class="text-sm">General practice</span>
			</label>

			<label class="flex cursor-pointer items-center gap-3 rounded-lg p-3 hover:bg-base-200">
				<input
					type="radio"
					name="reason"
					value="other"
					bind:group={reason}
					class="radio radio-sm radio-primary"
				/>
				<span class="text-sm">Something else</span>
			</label>
		</div>

		<textarea
			class="textarea-bordered textarea mb-4 w-full text-sm"
			placeholder="Anything else we should know? (optional)"
			rows="3"
			bind:value={comment}
		></textarea>

		<div class="modal-action">
			<button class="btn btn-ghost btn-sm" onclick={onClose} disabled={isSubmitting}> Skip </button>
			<button
				class="btn btn-sm btn-primary"
				onclick={handleSubmit}
				disabled={!reason || isSubmitting}
			>
				{isSubmitting ? 'Submitting...' : 'Submit'}
			</button>
		</div>
	</div>
	<!-- Backdrop -->
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={onClose}></div>
</dialog>
