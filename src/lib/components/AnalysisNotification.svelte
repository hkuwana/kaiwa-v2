<script lang="ts">
	import { fly, fade } from 'svelte/transition';
	import type { AnalysisResult } from '$lib/services/analysis.service';

	interface Props {
		isVisible: boolean;
		analysisResult?: AnalysisResult;
		isGuestUser: boolean;
		onViewResults: () => void;
		onCreateAccount: () => void;
		onDismiss: () => void;
	}

	const {
		isVisible,
		analysisResult,
		isGuestUser,
		onViewResults,
		onCreateAccount,
		onDismiss
	}: Props = $props();

	// Determine notification content based on analysis type and user status
	const notificationTitle = $derived(() => {
		if (!analysisResult?.success) return 'Analysis Complete';

		switch (analysisResult.analysisType) {
			case 'onboarding':
				return '🎯 Your Learning Profile is Ready!';
			case 'regular':
				return '📊 Conversation Analysis Complete';
			case 'scenario-generation':
				return '🎭 Custom Scenarios Generated';
			default:
				return 'Analysis Complete';
		}
	});

	const notificationMessage = $derived(() => {
		if (!analysisResult?.success) {
			return 'There was an issue with the analysis. Please try again.';
		}

		const data = analysisResult.data;
		switch (analysisResult.analysisType) {
			case 'onboarding':
				return isGuestUser
					? "We've analyzed your conversation and created a personalized learning profile. Create an account to save your progress!"
					: 'Your personalized learning profile has been updated based on this conversation.';

			case 'regular':
				const insightCount = data?.insights?.length || 0;
				return `We found ${insightCount} key insights from your conversation to help improve your learning.`;

			case 'scenario-generation':
				const scenarioCount = data?.customScenarios?.length || 0;
				return `We've created ${scenarioCount} custom practice scenarios based on your interests and topics you discussed.`;

			default:
				return 'Your conversation has been analyzed successfully.';
		}
	});

	const customScenarios = $derived(analysisResult?.data?.customScenarios || []);
	const showScenarioPreview = $derived(customScenarios.length > 0);
</script>

<!-- Notification Popup -->
{#if isVisible}
	<div
		class="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 backdrop-blur-sm"
		in:fade={{ duration: 200 }}
		out:fade={{ duration: 200 }}
		onclick={onDismiss}
		role="dialog"
		aria-modal="true"
	>
		<div
			class="mx-4 w-full max-w-lg transform rounded-2xl bg-base-100 shadow-2xl"
			in:fly={{ y: 20, duration: 300, delay: 100 }}
			out:fly={{ y: -20, duration: 200 }}
			onclick={(e) => e.stopPropagation()}
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-base-200 p-6 pb-4">
				<div class="flex items-center gap-3">
					<div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
						{#if analysisResult?.analysisType === 'onboarding'}
							<svg
								class="h-5 w-5 text-primary"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
								/>
							</svg>
						{:else if analysisResult?.analysisType === 'scenario-generation'}
							<svg
								class="h-5 w-5 text-primary"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
								/>
							</svg>
						{:else}
							<svg
								class="h-5 w-5 text-primary"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 01 2 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
								/>
							</svg>
						{/if}
					</div>
					<h2 class="text-lg font-semibold text-base-content">
						{notificationTitle}
					</h2>
				</div>
				<button
					class="btn btn-circle btn-ghost btn-sm"
					onclick={onDismiss}
					aria-label="Close notification"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- Content -->
			<div class="p-6">
				<p class="mb-4 leading-relaxed text-base-content/80">
					{notificationMessage}
				</p>

				<!-- Custom Scenarios Preview (if applicable) -->
				{#if showScenarioPreview}
					<div class="mb-4 rounded-lg bg-base-200/50 p-4">
						<h3 class="mb-2 text-sm font-medium text-base-content">Custom Scenarios Preview:</h3>
						<div class="space-y-2">
							{#each customScenarios.slice(0, 2) as scenario}
								<div class="flex items-center justify-between rounded bg-base-100 p-2">
									<div>
										<div class="text-sm font-medium">{scenario.title}</div>
										<div class="text-xs text-base-content/60">
											{scenario.category} • {scenario.difficulty}
										</div>
									</div>
									<div class="badge badge-sm badge-primary">{scenario.suggestedDuration}min</div>
								</div>
							{/each}
							{#if customScenarios.length > 2}
								<div class="text-center text-xs text-base-content/50">
									+{customScenarios.length - 2} more scenarios available
								</div>
							{/if}
						</div>
					</div>
				{/if}

				<!-- Guest User Call-to-Action -->
				{#if isGuestUser && analysisResult?.analysisType === 'onboarding'}
					<div class="mb-4 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
						<div class="flex items-start gap-3">
							<svg
								class="mt-0.5 h-5 w-5 text-primary"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d="M13 10V3L4 14h7v7l9-11h-7z"
								/>
							</svg>
							<div>
								<div class="text-sm font-medium text-base-content">
									Create your free account to:
								</div>
								<ul class="mt-1 space-y-1 text-xs text-base-content/70">
									<li>• Save your learning profile & progress</li>
									<li>• Access personalized custom scenarios</li>
									<li>• Track your improvement over time</li>
								</ul>
							</div>
						</div>
					</div>
				{/if}
			</div>

			<!-- Actions -->
			<div class="flex gap-3 border-t border-base-200 p-6">
				<button class="btn flex-1 btn-outline" onclick={onDismiss}> Maybe Later </button>

				{#if isGuestUser && analysisResult?.analysisType === 'onboarding'}
					<button class="btn flex-1 btn-primary" onclick={onCreateAccount}>
						Create Free Account
					</button>
				{:else}
					<button class="btn flex-1 btn-primary" onclick={onViewResults}> View Results </button>
				{/if}
			</div>
		</div>
	</div>
{/if}
