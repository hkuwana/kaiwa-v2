<script lang="ts">
	import ExitSurvey from '$lib/components/ExitSurvey.svelte';

	let showSurvey = $state(true);
	let surveyResults = $state<{ reason: string; comment: string } | null>(null);
	let testSessionId = $state('test-session-' + Date.now());

	function handleClose() {
		showSurvey = false;
		console.log('Survey closed');
	}

	function resetTest() {
		showSurvey = true;
		surveyResults = null;
		testSessionId = 'test-session-' + Date.now();
	}

	// Listen for PostHog events
	if (typeof window !== 'undefined') {
		const originalPostHog = (window as Record<string, unknown>).posthog as Record<string, unknown> | undefined;
		if (originalPostHog) {
			const originalCapture = originalPostHog.capture;
			originalPostHog.capture = function (...args: unknown[]) {
				if (args[0] === 'exit_survey_submitted') {
					surveyResults = {
						reason: args[1].reason || 'unknown',
						comment: args[1].comment || ''
					};
				}
				return originalCapture.apply(this, args);
			};
		}
	}
</script>

<svelte:head>
	<title>Exit Survey Test - Dev</title>
</svelte:head>

<div class="min-h-screen bg-base-200 p-8">
	<div class="mx-auto max-w-2xl">
		<div class="mb-6 rounded-lg bg-base-100 p-6 shadow-lg">
			<h1 class="mb-4 text-3xl font-bold">Exit Survey Test</h1>
			<p class="mb-4 text-base-content/70">
				This page allows you to test the exit survey modal in isolation.
			</p>

			<div class="mb-6 rounded-lg bg-info/10 p-4">
				<h2 class="mb-2 text-lg font-semibold">Test Info:</h2>
				<ul class="space-y-1 text-sm">
					<li><strong>Session ID:</strong> {testSessionId}</li>
					<li><strong>Survey Visible:</strong> {showSurvey ? 'Yes' : 'No'}</li>
					<li><strong>PostHog Event:</strong> exit_survey_submitted</li>
					<li><strong>API Endpoint:</strong> /api/feedback/exit-survey</li>
				</ul>
			</div>

			{#if surveyResults}
				<div class="mb-4 rounded-lg bg-success/10 p-4">
					<h2 class="mb-2 text-lg font-semibold text-success">✓ Survey Submitted!</h2>
					<div class="space-y-2 text-sm">
						<div>
							<strong>Reason:</strong>
							{surveyResults.reason}
						</div>
						{#if surveyResults.comment}
							<div>
								<strong>Comment:</strong>
								{surveyResults.comment}
							</div>
						{/if}
					</div>
				</div>
			{/if}

			<div class="flex gap-3">
				<button class="btn btn-primary" onclick={() => (showSurvey = true)}>
					Show Exit Survey
				</button>
				<button class="btn btn-secondary" onclick={resetTest}> Reset Test </button>
				<a href="/dev" class="btn btn-ghost">← Back to Dev Menu</a>
			</div>
		</div>

		<div class="rounded-lg bg-base-100 p-6 shadow-lg">
			<h2 class="mb-4 text-xl font-semibold">How it works:</h2>
			<ol class="list-inside list-decimal space-y-2 text-sm">
				<li>Click "Show Exit Survey" to display the modal</li>
				<li>Select a reason from the radio options</li>
				<li>Optionally add a comment</li>
				<li>Click "Submit" or "Skip"</li>
				<li>
					Check the console and PostHog for the <code class="rounded bg-base-200 px-1"
						>exit_survey_submitted</code
					> event
				</li>
				<li>
					Check database: <code class="rounded bg-base-200 px-1"
						>SELECT * FROM analytics_events WHERE event_name = 'exit_survey_submitted'</code
					>
				</li>
			</ol>
		</div>
	</div>
</div>

<!-- Exit Survey Modal -->
{#if showSurvey}
	<ExitSurvey sessionId={testSessionId} onClose={handleClose} />
{/if}
