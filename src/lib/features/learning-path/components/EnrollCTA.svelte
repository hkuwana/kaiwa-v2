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
	const signupUrl = $derived(() => {
		const params = new URLSearchParams({
			utm_source: 'learning_path',
			utm_medium: 'cta',
			utm_campaign: shareSlug || 'template'
		});
		return `/signup?${params.toString()}`;
	})();

	const isHero = variant === 'hero';
</script>

{#if isHero}
	<!-- Hero CTA - Large, prominent -->
	<div class="hero bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-2xl">
		<div class="hero-content text-center py-12 px-6">
			<div class="max-w-2xl">
				<h1 class="text-4xl md:text-5xl font-bold mb-4">
					{title}
				</h1>
				<p class="text-lg mb-2 text-base-content/80">
					Master real conversations in just {weeks} weeks
				</p>
				<p class="text-base mb-8 text-base-content/60">
					Practice {totalDays} days of authentic scenarios • Build confidence before talking with
					real people
				</p>

				<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
					<a href={signupUrl} class="btn btn-primary btn-lg gap-2">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6"
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
						Start Learning Free
					</a>
					<a href="#syllabus" class="btn btn-outline btn-lg">
						View Full Syllabus
					</a>
				</div>

				<p class="text-sm mt-6 text-base-content/50">
					✓ No credit card required • ✓ 5 minutes a day • ✓ AI-powered conversations
				</p>
			</div>
		</div>
	</div>
{:else}
	<!-- Inline CTA - Smaller, within content -->
	<div class="card bg-primary text-primary-content shadow-xl">
		<div class="card-body items-center text-center">
			<h3 class="card-title text-2xl mb-2">Ready to Start?</h3>
			<p class="mb-4">
				Join thousands of learners building confidence with real conversations
			</p>
			<div class="card-actions">
				<a href={signupUrl} class="btn btn-secondary btn-wide gap-2">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						class="h-5 w-5"
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
					Enroll Free Today
				</a>
			</div>
			<p class="text-sm mt-2 opacity-80">
				Get started in less than 2 minutes
			</p>
		</div>
	</div>
{/if}
