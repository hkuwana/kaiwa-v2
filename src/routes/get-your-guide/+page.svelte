<script lang="ts">
	import { goto } from '$app/navigation';
	import { userManager } from '$lib/stores/user.store.svelte';
	import { posthogManager } from '$lib/client/posthog';
	import { onMount } from 'svelte';
	import { page } from '$app/stores';

	// Form state
	let selectedLanguage = $state('');
	let selectedGoal = $state('');
	let selectedLevel = $state('');
	let isGenerating = $state(false);
	let error = $state('');

	const languages = [
		{ code: 'ja', name: 'Japanese', flag: 'JP' },
		{ code: 'es', name: 'Spanish', flag: 'ES' },
		{ code: 'fr', name: 'French', flag: 'FR' },
		{ code: 'de', name: 'German', flag: 'DE' },
		{ code: 'ko', name: 'Korean', flag: 'KR' },
		{ code: 'zh-CN', name: 'Chinese', flag: 'CN' },
		{ code: 'it', name: 'Italian', flag: 'IT' },
		{ code: 'pt', name: 'Portuguese', flag: 'BR' }
	];

	const goals = [
		{ id: 'travel', label: 'Travel', desc: 'Navigate trips with confidence' },
		{ id: 'career', label: 'Career', desc: 'Professional communication' },
		{ id: 'connection', label: 'Connection', desc: 'Talk with friends & family' },
		{ id: 'culture', label: 'Culture', desc: 'Explore media & traditions' },
		{ id: 'academic', label: 'Academic', desc: 'Studies & exams' },
		{ id: 'growth', label: 'Growth', desc: 'Personal challenge' }
	];

	const levels = [
		{ id: 'beginner', label: 'Beginner', desc: "I'm just starting out" },
		{ id: 'elementary', label: 'Elementary', desc: 'I know some basics' },
		{ id: 'intermediate', label: 'Intermediate', desc: 'I can have simple conversations' },
		{ id: 'advanced', label: 'Advanced', desc: 'I want to refine my skills' }
	];

	onMount(() => {
		// Track page view with UTM params
		const utmSource = $page.url.searchParams.get('utm_source');
		const utmMedium = $page.url.searchParams.get('utm_medium');

		posthogManager.trackEvent('get_your_guide_page_viewed', {
			utm_source: utmSource,
			utm_medium: utmMedium
		});
	});

	async function generatePath() {
		if (!selectedLanguage || !selectedGoal || !selectedLevel) {
			error = 'Please complete all selections';
			return;
		}

		if (!userManager.isLoggedIn) {
			// Store selections and redirect to login
			sessionStorage.setItem(
				'pending_learning_path',
				JSON.stringify({
					language: selectedLanguage,
					goal: selectedGoal,
					level: selectedLevel
				})
			);
			goto('/auth/google?redirect=/get-your-guide/create');
			return;
		}

		isGenerating = true;
		error = '';

		try {
			posthogManager.trackEvent('learning_path_generation_started', {
				language: selectedLanguage,
				goal: selectedGoal,
				level: selectedLevel
			});

			const response = await fetch('/api/learning-paths/from-preferences', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					language: selectedLanguage,
					motivation: selectedGoal,
					proficiencyLevel: selectedLevel
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to generate learning path');
			}

			const { path, assignment } = await response.json();

			posthogManager.trackEvent('learning_path_generated', {
				pathId: path.id,
				language: selectedLanguage,
				goal: selectedGoal
			});

			// Redirect to the new path
			goto(`/path/${path.id}?welcome=true`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Something went wrong';
			isGenerating = false;
		}
	}

	function isFormComplete() {
		return selectedLanguage && selectedGoal && selectedLevel;
	}
</script>

<svelte:head>
	<title>Get Your Personalized 28-Day Guide | Kaiwa</title>
	<meta
		name="description"
		content="Create a custom 28-day language learning path tailored to your goals, schedule, and current level. Free and takes just 2 minutes."
	/>
</svelte:head>

<div class="min-h-screen bg-linear-to-br from-base-100 via-primary/5 to-secondary/5">
	<!-- Hero Section -->
	<div class="container mx-auto max-w-4xl px-4 py-12">
		<div class="mb-12 text-center">
			<h1 class="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
				Your Personalized
				<span class="bg-linear-to-r from-primary to-secondary bg-clip-text text-transparent">
					28-Day Guide
				</span>
			</h1>
			<p class="mx-auto max-w-2xl text-lg text-base-content/70">
				A custom learning path built around your goals, schedule, and current level. Daily
				scenarios. Weekly themes. Real progress.
			</p>
		</div>

		<!-- Form Card -->
		<div class="card mx-auto max-w-2xl bg-base-100 shadow-xl">
			<div class="card-body p-6 md:p-8">
				<!-- Step 1: Language -->
				<div class="mb-8">
					<h2 class="mb-4 text-lg font-semibold">1. What language are you learning?</h2>
					<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
						{#each languages as lang}
							<button
								type="button"
								class="btn h-auto flex-col gap-1 py-4 {selectedLanguage === lang.code
									? 'btn-primary'
									: 'btn-outline'}"
								onclick={() => (selectedLanguage = lang.code)}
							>
								<span class="text-2xl"
									>{lang.flag === 'JP'
										? '🇯🇵'
										: lang.flag === 'ES'
											? '🇪🇸'
											: lang.flag === 'FR'
												? '🇫🇷'
												: lang.flag === 'DE'
													? '🇩🇪'
													: lang.flag === 'KR'
														? '🇰🇷'
														: lang.flag === 'CN'
															? '🇨🇳'
															: lang.flag === 'IT'
																? '🇮🇹'
																: '🇧🇷'}</span
								>
								<span class="text-sm">{lang.name}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Step 2: Goal -->
				<div class="mb-8">
					<h2 class="mb-4 text-lg font-semibold">2. What's your main goal?</h2>
					<div class="grid grid-cols-2 gap-3 md:grid-cols-3">
						{#each goals as goal}
							<button
								type="button"
								class="btn h-auto flex-col items-start gap-1 p-4 text-left btn-outline {selectedGoal ===
								goal.id
									? 'btn-primary'
									: ''}"
								onclick={() => (selectedGoal = goal.id)}
							>
								<span class="font-semibold">{goal.label}</span>
								<span class="text-xs opacity-70">{goal.desc}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Step 3: Level -->
				<div class="mb-8">
					<h2 class="mb-4 text-lg font-semibold">3. What's your current level?</h2>
					<div class="grid grid-cols-2 gap-3 md:grid-cols-4">
						{#each levels as level}
							<button
								type="button"
								class="btn h-auto flex-col items-start gap-1 p-4 text-left btn-outline {selectedLevel ===
								level.id
									? 'btn-primary'
									: ''}"
								onclick={() => (selectedLevel = level.id)}
							>
								<span class="font-semibold">{level.label}</span>
								<span class="text-xs opacity-70">{level.desc}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Error Message -->
				{#if error}
					<div class="mb-4 alert alert-error">
						<span>{error}</span>
					</div>
				{/if}

				<!-- Submit Button -->
				<button
					class="btn w-full btn-lg btn-primary"
					onclick={generatePath}
					disabled={!isFormComplete() || isGenerating}
				>
					{#if isGenerating}
						<span class="loading loading-spinner"></span>
						Creating your path...
					{:else}
						Create My 28-Day Plan
					{/if}
				</button>

				<p class="mt-4 text-center text-sm text-base-content/60">
					{#if userManager.isLoggedIn}
						Your personalized path will be ready in seconds.
					{:else}
						You'll need to sign in to save your learning path.
					{/if}
				</p>
			</div>
		</div>

		<!-- Benefits Section -->
		<div class="mt-16 grid gap-8 md:grid-cols-3">
			<div class="text-center">
				<div class="mb-4 text-4xl">📅</div>
				<h3 class="mb-2 font-semibold">Daily Scenarios</h3>
				<p class="text-sm text-base-content/70">
					Each day has a specific conversation scenario tailored to your goals.
				</p>
			</div>
			<div class="text-center">
				<div class="mb-4 text-4xl">📈</div>
				<h3 class="mb-2 font-semibold">Progressive Difficulty</h3>
				<p class="text-sm text-base-content/70">
					Start comfortable and gradually build to more challenging topics.
				</p>
			</div>
			<div class="text-center">
				<div class="mb-4 text-4xl">🔔</div>
				<h3 class="mb-2 font-semibold">Daily Reminders</h3>
				<p class="text-sm text-base-content/70">
					Optional email reminders to keep you on track with your learning.
				</p>
			</div>
		</div>

		<!-- Social Proof -->
		<div class="mt-16 text-center">
			<p class="text-base-content/60">
				Join learners who've completed their 28-day journeys and built real speaking confidence.
			</p>
		</div>
	</div>
</div>
