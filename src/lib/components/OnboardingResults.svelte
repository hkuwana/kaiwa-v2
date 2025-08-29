<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import type { UserPreferences } from '$lib/server/db/types';

	// Use $props to define the component's public API.
	// We've replaced the event dispatcher with `onSave` and `onDismiss` callback functions.
	let {
		results,
		isVisible,
		onSave = () => {},
		onDismiss = () => {}
	}: {
		results: UserPreferences;
		isVisible: boolean;
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

	// This function now calls both the `onSave` and `onDismiss` props.
	function handleSaveProfile() {
		onSave();
		onDismiss();
	}
</script>

{#if isVisible && results}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-base-100 shadow-2xl"
			transition:fly={{ y: 20, duration: 300 }}
		>
			<div class="flex items-center justify-between border-b border-base-200 p-6">
				<div class="flex items-center gap-3">
					<div
						class="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-secondary"
					>
						<svg class="h-6 w-6 text-base-100" fill="currentColor" viewBox="0 0 20 20">
							<path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
					</div>
					<div>
						<h2 class="text-xl font-bold">Your Learning Profile</h2>
						<p class="text-sm text-base-content/60">Based on our conversation</p>
					</div>
				</div>
				<button class="btn btn-circle btn-ghost btn-sm" onclick={onDismiss}>
					<svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<div class="space-y-6 p-6">
				<div class="space-y-4">
					<div class="flex items-center gap-2">
						<svg class="h-5 w-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
							<path d="M10 2L3 8v10a2 2 0 002 2h10a2 2 0 002-2V8l-7-6z" />
						</svg>
						<h3 class="text-lg font-semibold">Current Skill Levels</h3>
					</div>

					<div class="grid gap-4">
						<div class="space-y-2">
							<div class="flex items-center justify-between">
								<span class="text-sm font-medium">Speaking</span>
								<div class="badge {getSkillColor(results.speakingLevel)} badge-sm">
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
								<span class="text-sm font-medium">Listening</span>
								<div class="badge {getSkillColor(results.listeningLevel)} badge-sm">
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
								<span class="text-sm font-medium">Confidence</span>
								<div class="badge {getSkillColor(results.confidenceLevel)} badge-sm">
									{results.confidenceLevel}%
								</div>
							</div>
							<div class="h-2 w-full rounded-full bg-base-200">
								<div
									class="h-2 rounded-full bg-secondary transition-all duration-1000 ease-out"
									style="width: {getProgressWidth(results.confidenceLevel)}"
								></div>
							</div>
						</div>
					</div>
				</div>

				<div class="space-y-4">
					<div class="flex items-center gap-2">
						<svg class="h-5 w-5 text-error" fill="currentColor" viewBox="0 0 20 20">
							<path
								d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
							/>
						</svg>
						<h3 class="text-lg font-semibold">Your Learning Goals</h3>
					</div>

					<div class="space-y-3">
						<div class="card border border-primary/20 bg-primary/10">
							<div class="card-body p-4">
								<div class="text-sm font-medium text-primary">Main Focus</div>
								<div class="mt-1 font-medium text-primary">{results.learningGoal}</div>
							</div>
						</div>

						{#if results.specificGoals}
							<div class="space-y-2">
								<div class="text-sm font-medium">Specific Goals</div>
								<div class="flex flex-wrap gap-2">
									{#each results.specificGoals as goal}
										<span class="badge badge-outline badge-sm">{goal}</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>

				<div class="space-y-4">
					<div class="flex items-center gap-2">
						<svg class="h-5 w-5 text-base-content/60" fill="currentColor" viewBox="0 0 20 20">
							<path
								d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 8a2 2 0 110 4 2 2 0 010-4zM10 14a2 2 0 110 4 2 2 0 010-4z"
							/>
						</svg>
						<h3 class="text-lg font-semibold">Learning Preferences</h3>
					</div>

					<div class="grid gap-4 md:grid-cols-3">
						<div class="card border border-base-200">
							<div class="card-body p-4">
								<div class="text-sm font-medium text-base-content/70">Challenge</div>
								<div class="mt-1 font-medium capitalize">{results.challengePreference}</div>
							</div>
						</div>

						<div class="card border border-base-200">
							<div class="card-body p-4">
								<div class="text-sm font-medium text-base-content/70">Correction Style</div>
								<div class="mt-1 font-medium capitalize">
									{results.correctionStyle}
								</div>
							</div>
						</div>

						<div class="card border border-base-200">
							<div class="card-body p-4">
								<div class="text-sm font-medium text-base-content/70">Daily Goal</div>
								<div class="mt-1 font-medium">{results.dailyGoalMinutes} minutes</div>
							</div>
						</div>
					</div>
				</div>

				<div class="flex flex-col gap-3 border-t border-base-200 pt-4 sm:flex-row">
					<button onclick={onDismiss} class="btn flex-1 btn-primary"> Continue Learning </button>
					<button onclick={handleSaveProfile} class="btn flex-1 btn-outline">
						Save to Account
					</button>
				</div>

				<div class="alert alert-info">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						class="h-6 w-6 shrink-0 stroke-current"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<div>
						<h4 class="text-sm font-bold">Your data is saved locally</h4>
						<div class="text-xs">
							Create an account to sync across devices and unlock more features!
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}
