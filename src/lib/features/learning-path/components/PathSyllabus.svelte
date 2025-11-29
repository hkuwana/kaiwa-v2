<script lang="ts">
	import { getLanguageName } from '$lib/data/languages';

	/**
	 * PathSyllabus Component
	 *
	 * Displays the complete syllabus/schedule for a learning path template.
	 * Groups days by week and shows theme, difficulty, and optional descriptions.
	 *
	 * **Props:**
	 * - schedule: Array of day entries with theme, difficulty, description
	 * - targetLanguage: Language code (e.g., 'ja', 'es')
	 */

	interface DayScheduleEntry {
		dayIndex: number;
		theme: string;
		difficulty: string;
		description?: string;
	}

	interface Props {
		schedule: DayScheduleEntry[];
		targetLanguage: string;
	}

	let { schedule, targetLanguage }: Props = $props();

	// Group schedule by weeks
	const weeks = $derived.by(() => {
		const grouped: DayScheduleEntry[][] = [];
		for (let i = 0; i < schedule.length; i += 7) {
			grouped.push(schedule.slice(i, i + 7));
		}
		return grouped;
	});

	const languageName = getLanguageName(targetLanguage);

	// Map difficulty codes to display text
	function formatDifficulty(difficulty: string): string {
		// CEFR levels (A1, A2, B1, B2, C1, C2)
		if (/^[ABC][12]$/.test(difficulty)) {
			return difficulty.toUpperCase();
		}
		// Text levels
		return difficulty.charAt(0).toUpperCase() + difficulty.slice(1).toLowerCase();
	}

	// Difficulty badge colors
	function getDifficultyColor(difficulty: string): string {
		const level = difficulty.toLowerCase();
		if (level.includes('a1') || level.includes('beginner')) return 'badge-success';
		if (level.includes('a2') || level.includes('elementary')) return 'badge-info';
		if (level.includes('b1') || level.includes('intermediate')) return 'badge-warning';
		if (level.includes('b2') || level.includes('upper')) return 'badge-warning';
		if (level.includes('c1') || level.includes('advanced')) return 'badge-error';
		if (level.includes('c2') || level.includes('proficient')) return 'badge-error';
		return 'badge-neutral';
	}
</script>

<div class="path-syllabus">
	<h2 class="mb-6 text-2xl font-bold">📚 Course Syllabus</h2>

	<div class="space-y-8">
		{#each weeks as week, weekIndex (weekIndex)}
			<div class="week-section">
				<h3 class="mb-4 flex items-center gap-2 text-xl font-semibold">
					<span class="badge badge-primary">Week {weekIndex + 1}</span>
					<span class="text-base font-normal text-base-content/70">
						Days {week[0].dayIndex}–{week[week.length - 1].dayIndex}
					</span>
				</h3>

				<div class="grid gap-3 md:grid-cols-2">
					{#each week as day (day.dayIndex)}
						<div class="card bg-base-200 shadow-sm">
							<div class="card-body p-4">
								<div class="flex items-start justify-between gap-2">
									<div class="flex-1">
										<div class="mb-2 flex items-center gap-2">
											<span class="text-sm font-semibold text-base-content/60">
												Day {day.dayIndex}
											</span>
											<span class="badge badge-sm {getDifficultyColor(day.difficulty)}">
												{formatDifficulty(day.difficulty)}
											</span>
										</div>
										<h4 class="mb-1 text-base leading-tight font-medium">
											{day.theme}
										</h4>
										{#if day.description}
											<p class="mt-2 text-sm text-base-content/70">
												{day.description}
											</p>
										{/if}
									</div>
								</div>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<!-- Summary Stats -->
	<div class="stats mt-8 stats-vertical shadow lg:stats-horizontal">
		<div class="stat">
			<div class="stat-title">Total Days</div>
			<div class="stat-value text-primary">{schedule.length}</div>
			<div class="stat-desc">{Math.ceil(schedule.length / 7)} weeks of learning</div>
		</div>

		<div class="stat">
			<div class="stat-title">Target Language</div>
			<div class="stat-value text-3xl text-secondary">{languageName}</div>
			<div class="stat-desc">Conversation-focused practice</div>
		</div>

		<div class="stat">
			<div class="stat-title">Daily Commitment</div>
			<div class="stat-value text-3xl text-accent">~20 min</div>
			<div class="stat-desc">Fits into your busy schedule</div>
		</div>
	</div>
</div>
