<script lang="ts">
	/**
	 * EnrollCTA Component
	 *
	 * Call-to-action component for enrolling in a learning path template.
	 * Encourages visitors to sign up and start the program.
	 *
	 * **Props:**
	 * - title: Learning path title
	 * - totalDays: Number of days in the program
	 * - shareSlug: Slug for this template (optional, for tracking)
	 * - variant: 'hero' (large, top of page) or 'inline' (smaller, within content)
	 */

	interface Props {
		title: string;
		totalDays: number;
		shareSlug?: string;
		variant?: 'hero' | 'inline';
	}

	let { title, totalDays, shareSlug, variant = 'inline' }: Props = $props();

	const weeks = Math.ceil(totalDays / 7);

	// Build signup URL with UTM parameters for tracking
	const signupUrl = $derived.by(() => {
		const params = new URLSearchParams({
			utm_source: 'learning_path',
			utm_medium: 'cta',
			utm_campaign: shareSlug || 'template'
		});
		// Send users through the main auth flow
		return `/auth?${params.toString()}`;
	});

	const isHero = variant === 'hero';
</script>

{#if isHero}
	<!-- Hero CTA - Large, prominent -->
	<div class="hero rounded-2xl bg-linear-to-br from-primary/10 via-secondary/10 to-accent/10">
		<div class="hero-content px-6 py-12 text-center">
			<div class="max-w-2xl">
				<h1 class="mb-4 text-4xl font-bold md:text-5xl">
					{title}
				</h1>
				<p class="mb-2 text-lg text-base-content/80">
					Master real conversations in just {weeks} weeks
				</p>
				<p class="mb-8 text-base text-base-content/60">
					Practice {totalDays} days of authentic scenarios • Build confidence before talking with real
					people
				</p>

				<div class="flex flex-col items-center justify-center gap-4 sm:flex-row">
					<a href={signupUrl} class="btn gap-2 btn-lg btn-primary">
						<span class="icon-[mdi--rocket-launch-outline] h-6 w-6"></span>
						Start Learning Free
					</a>
					<a href="#syllabus" class="btn btn-outline btn-lg"> View Full Syllabus </a>
				</div>

				<p class="mt-6 text-sm text-base-content/50">
					<span class="inline-flex items-center gap-1">
						<span class="icon-[mdi--check] text-success"></span>
						No credit card required
					</span>
					<span class="mx-1">•</span>
					<span class="inline-flex items-center gap-1">
						<span class="icon-[mdi--check] text-success"></span>
						5 minutes a day
					</span>
					<span class="mx-1">•</span>
					<span class="inline-flex items-center gap-1">
						<span class="icon-[mdi--check] text-success"></span>
						AI-powered conversations
					</span>
				</p>
			</div>
		</div>
	</div>
{:else}
	<!-- Inline CTA - Smaller, within content -->
	<div class="card bg-primary text-primary-content shadow-xl">
		<div class="card-body items-center text-center">
			<h3 class="mb-2 card-title text-2xl">Ready to Start?</h3>
			<p class="mb-4">Join thousands of learners building confidence with real conversations</p>
			<div class="card-actions">
				<a href={signupUrl} class="btn btn-wide gap-2 btn-secondary">
					<span class="icon-[mdi--rocket-launch-outline] h-5 w-5"></span>
					Enroll Free Today
				</a>
			</div>
			<p class="mt-2 text-sm opacity-80">Get started in less than 2 minutes</p>
		</div>
	</div>
{/if}
