<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import type { UserPreferences } from '$lib/server/db/types';
	import { goto } from '$app/navigation';

	// Use $props to define the component's public API.
	const {
		results,
		isVisible,
		isGuestUser = true,
		onDismiss = () => {},
		onSave = () => {}
	}: {
		results: UserPreferences;
		isVisible: boolean;
		isGuestUser?: boolean;
		onSave?: () => void;
		onDismiss?: () => void;
	} = $props();

	function getSkillColor(level: number): string {
		if (level <= 20) return 'text-error bg-error/10';
		if (level <= 40) return 'text-warning bg-warning/10';
		if (level <= 60) return 'text-info bg-info/10';
		if (level <= 80) return 'text-primary bg-primary/10';
		return 'text-success bg-success/10';
	}

	function getSkillLabel(level: number): string {
		if (level <= 20) return 'Beginner';
		if (level <= 40) return 'Elementary';
		if (level <= 60) return 'Intermediate';
		if (level <= 80) return 'Advanced';
		return 'Proficient';
	}

	function getProgressWidth(level: number): string {
		return `${Math.min(100, Math.max(0, level))}%`;
	}

	// Handle create account for guest users
	function handleCreateAccount() {
		// Store assessment results in localStorage for account creation flow
		if (typeof window !== 'undefined') {
			localStorage.setItem('pendingAssessment', JSON.stringify(results));
		}

		// Navigate to auth page with assessment data
		goto('/auth?action=create_account&from=assessment');
	}

	// Handle continue learning for logged-in users
	function handleContinueLearning() {
		onDismiss();
	}

	// Handle start new conversation for logged-in users
	function handleStartNewConversation() {
		onDismiss();
		goto('/');
	}
</script>

{#if isVisible && results}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-2 sm:p-4"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="max-h-[95vh] w-full max-w-sm overflow-y-auto rounded-xl bg-base-100 shadow-2xl sm:max-w-md lg:max-w-2xl"
			transition:fly={{ y: 20, duration: 300 }}
		>
			<div class="flex items-center justify-between border-b border-base-200 p-4 sm:p-6">
				<div class="flex items-center gap-2 sm:gap-3">
					<div
						class="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary sm:h-12 sm:w-12"
					>
						<svg
							class="h-5 w-5 text-base-100 sm:h-6 sm:w-6"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div>
						<h2 class="text-lg font-bold sm:text-xl">Your Learning Profile</h2>
						<p class="text-xs text-base-content/60 sm:text-sm">Based on our short conversation:</p>
					</div>
				</div>
				<button class="btn btn-circle btn-ghost btn-sm" onclick={onDismiss}>
					<svg class="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="space-y-4 p-4 sm:space-y-6 sm:p-6">
				<div class="space-y-3 sm:space-y-4">
					<div class="space-y-3 sm:space-y-4">
						<div class="flex items-center gap-2">
							<svg class="h-4 w-4 text-error sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
								<path
									d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
								/>
							</svg>
							<h3 class="text-base font-semibold sm:text-lg">
								Your Learning Goals: {results.learningGoal}
							</h3>
						</div>

						<div class="space-y-3">
							{#if results.specificGoals}
								<div class="space-y-2">
									<div class="text-xs font-medium sm:text-sm">Specific Goals</div>
									<div class="flex flex-wrap gap-1 sm:gap-2">
										{#each results.specificGoals as goal}
											<span class="badge badge-outline badge-xs sm:badge-sm">{goal}</span>
										{/each}
									</div>
								</div>
							{/if}
						</div>
					</div>
					<div class="flex items-center gap-2">
						<svg class="h-4 w-4 text-warning sm:h-5 sm:w-5" fill="currentColor" viewBox="0 0 20 20">
							<path d="M10 2L3 8v10a2 2 0 002 2h10a2 2 0 002-2V8l-7-6z" />
						</svg>
						<h3 class="text-base font-semibold sm:text-lg">Current Skill Levels</h3>
					</div>

					<div class="grid gap-3 sm:gap-4">
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<span class="text-xs font-medium sm:text-sm">Speaking</span>
								<div class="badge {getSkillColor(results.speakingLevel)} badge-xs sm:badge-sm">
									{getSkillLabel(results.speakingLevel)}
								</div>
							</div>
							<div class="h-2 w-full rounded-full bg-base-200">
								<div
									class="h-2 rounded-full bg-primary transition-all duration-1000 ease-out"
									style="width: {getProgressWidth(results.speakingLevel)}"
								></div>
							</div>
						</div>

						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<span class="text-xs font-medium sm:text-sm">Listening</span>
								<div class="badge {getSkillColor(results.listeningLevel)} badge-xs sm:badge-sm">
									{getSkillLabel(results.listeningLevel)}
								</div>
							</div>
							<div class="h-2 w-full rounded-full bg-base-200">
								<div
									class="h-2 rounded-full bg-success transition-all duration-1000 ease-out"
									style="width: {getProgressWidth(results.listeningLevel)}"
								></div>
							</div>
						</div>

						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<span class="text-xs font-medium sm:text-sm">Confidence</span>
								<div class="badge {getSkillColor(results.speakingConfidence)} badge-xs sm:badge-sm">
									{results.speakingConfidence}%
								</div>
							</div>
							<div class="h-2 w-full rounded-full bg-base-200">
								<div
									class="h-2 rounded-full bg-secondary transition-all duration-1000 ease-out"
									style="width: {getProgressWidth(results.speakingConfidence)}"
								></div>
							</div>
						</div>
					</div>
				</div>

				<div class="space-y-3 sm:space-y-4">
					<div class="flex items-center gap-2">
						<svg
							class="h-4 w-4 text-base-content/60 sm:h-5 sm:w-5"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 8a2 2 0 110 4 2 2 0 010-4zM10 14a2 2 0 110 4 2 2 0 010-4z"
							/>
						</svg>
						<h3 class="text-base font-semibold sm:text-lg">Learning Preferences</h3>
					</div>

					<div class="grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-4">
						<div class="card border border-base-200">
							<div class="card-body p-3 sm:p-4">
								<div class="text-xs font-medium text-base-content/70 sm:text-sm">
									Challenge Level:
								</div>
								<div class="mt-1 text-xs font-medium capitalize sm:text-sm">
									{results.challengePreference}
								</div>
							</div>
						</div>

						<div class="card border border-base-200">
							<div class="card-body p-3 sm:p-4">
								<div class="text-xs font-medium text-base-content/70 sm:text-sm">
									Correction Style:
								</div>
								<div class="mt-1 text-xs font-medium capitalize sm:text-sm">
									{results.correctionStyle}
								</div>
							</div>
						</div>

						<div class="card border border-base-200">
							<div class="card-body p-3 sm:p-4">
								<div class="text-xs font-medium text-base-content/70 sm:text-sm">Daily Goal:</div>
								<div class="mt-1 text-xs font-medium sm:text-sm">
									{results.dailyGoalSeconds} seconds
								</div>
							</div>
						</div>
					</div>
				</div>

				{#if isGuestUser}
					<!-- Guest User Actions -->
					<div class="flex flex-col gap-3 border-t border-base-200 pt-4">
						<p class="text-center text-xs text-base-content/60 sm:text-sm">
							Create an account to save your assessment and continue learning!
						</p>
						<button onclick={handleCreateAccount} class="btn flex-1 btn-lg btn-primary">
							Create Account
						</button>
					</div>
				{:else}
					<!-- Logged-in User Actions -->
					<div class="flex flex-col gap-3 border-t border-base-200 pt-4 sm:flex-row">
						<button onclick={handleContinueLearning} class="btn flex-1 btn-primary">
							Close & Continue Learning
						</button>
						<button onclick={handleStartNewConversation} class="btn flex-1 btn-outline">
							Start New Conversation
						</button>
					</div>

					<div class="alert alert-success">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							class="h-5 w-5 shrink-0 stroke-current sm:h-6 sm:w-6"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
						<div>
							<h4 class="text-xs font-bold sm:text-sm">Assessment saved to your account</h4>
							<div class="text-xs">
								Your learning profile has been updated and will be used for future conversations!
							</div>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
