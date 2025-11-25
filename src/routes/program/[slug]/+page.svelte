<script lang="ts">
	import { page } from '$app/stores';
	import { createLearningPathJsonLd } from '$lib/seo/jsonld';
	import PathSyllabus from '$lib/features/learning-path/components/PathSyllabus.svelte';
	import EnrollCTA from '$lib/features/learning-path/components/EnrollCTA.svelte';
	import type { PageData } from './$types';

	/**
	 * Public Learning Path Template Page
	 *
	 * Displays a publicly-accessible, SEO-optimized learning path template.
	 * Includes JSON-LD structured data, meta tags, and conversion-focused CTAs.
	 *
	 * Route: /program/[slug]
	 * Example: /program/jp-meeting-partners-parents
	 */

	let { data }: { data: PageData } = $props();
	const { template } = data;

	// Get base URL for JSON-LD and meta tags
	const baseUrl = $page.url.origin;
	const pageUrl = `${baseUrl}/program/${template.shareSlug}`;

	// Language display names for meta description
	const languageNames: Record<string, string> = {
		ja: 'Japanese',
		es: 'Spanish',
		fr: 'French',
		de: 'German',
		zh: 'Chinese',
		ko: 'Korean',
		it: 'Italian',
		pt: 'Portuguese'
	};

	const languageName = languageNames[template.targetLanguage] || template.targetLanguage;
	const weeks = Math.ceil(template.schedule.length / 7);

	// Generate JSON-LD structured data
	const jsonLd = createLearningPathJsonLd(template, baseUrl);

	// Meta description for SEO
	const metaDescription = `${template.description} • ${template.schedule.length}-day ${languageName} learning program • Practice real conversations in ${weeks} weeks • Start free today!`;

	// Open Graph image (can be customized per template in the future)
	const ogImage = `${baseUrl}/og-image-learning-path.png`; // Placeholder
</script>

<svelte:head>
	<!-- Primary Meta Tags -->
	<title>{template.title} | Kaiwa Learning Path</title>
	<meta name="title" content="{template.title} | Kaiwa Learning Path" />
	<meta name="description" content={metaDescription} />

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta property="og:url" content={pageUrl} />
	<meta property="og:title" content="{template.title} | Kaiwa Learning Path" />
	<meta property="og:description" content={metaDescription} />
	<meta property="og:image" content={ogImage} />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta property="twitter:url" content={pageUrl} />
	<meta property="twitter:title" content="{template.title} | Kaiwa Learning Path" />
	<meta property="twitter:description" content={metaDescription} />
	<meta property="twitter:image" content={ogImage} />

	<!-- Canonical URL -->
	<link rel="canonical" href={pageUrl} />

	<!-- JSON-LD Structured Data -->
	{@html `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>`}
</svelte:head>

<div class="min-h-screen bg-base-100">
	<div class="container mx-auto px-4 py-8 max-w-6xl">
		<!-- Hero CTA -->
		<div class="mb-12">
			<EnrollCTA
				title={template.title}
				totalDays={template.schedule.length}
				shareSlug={template.shareSlug}
				variant="hero"
			/>
		</div>

		<!-- Program Overview -->
		<div class="prose prose-lg max-w-none mb-12">
			<h2>About This Program</h2>
			<p class="text-lg leading-relaxed">
				{template.description}
			</p>

			<div class="grid md:grid-cols-3 gap-6 not-prose my-8">
				<div class="card bg-base-200">
					<div class="card-body items-center text-center">
						<div class="text-4xl mb-2">🎯</div>
						<h3 class="card-title text-lg">Practical Focus</h3>
						<p class="text-sm">Real conversations you'll actually use</p>
					</div>
				</div>

				<div class="card bg-base-200">
					<div class="card-body items-center text-center">
						<div class="text-4xl mb-2">⚡</div>
						<h3 class="card-title text-lg">Quick Sessions</h3>
						<p class="text-sm">Just 5-20 minutes per day</p>
					</div>
				</div>

				<div class="card bg-base-200">
					<div class="card-body items-center text-center">
						<div class="text-4xl mb-2">🤖</div>
						<h3 class="card-title text-lg">AI-Powered</h3>
						<p class="text-sm">Practice anytime, get instant feedback</p>
					</div>
				</div>
			</div>

			{#if template.metadata}
				<div class="alert alert-info">
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						class="stroke-current shrink-0 w-6 h-6"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
						></path>
					</svg>
					<div class="text-sm">
						<strong>Level:</strong>
						{template.metadata.cefrLevel || 'Beginner to Intermediate'}
						{#if template.metadata.primarySkill}
							• <strong>Focus:</strong>
							{template.metadata.primarySkill}
						{/if}
					</div>
				</div>
			{/if}
		</div>

		<!-- Course Syllabus -->
		<div id="syllabus" class="mb-12">
			<PathSyllabus schedule={template.schedule} targetLanguage={template.targetLanguage} />
		</div>

		<!-- Bottom CTA -->
		<div class="mb-8">
			<EnrollCTA
				title={template.title}
				totalDays={template.schedule.length}
				shareSlug={template.shareSlug}
				variant="inline"
			/>
		</div>

		<!-- How It Works -->
		<div class="prose max-w-none mb-12">
			<h2>How It Works</h2>
			<div class="steps steps-vertical lg:steps-horizontal w-full">
				<div class="step step-primary">
					<div class="text-left">
						<h3 class="font-bold">1. Sign Up Free</h3>
						<p class="text-sm">Create your account in under 2 minutes</p>
					</div>
				</div>
				<div class="step step-primary">
					<div class="text-left">
						<h3 class="font-bold">2. Start Day 1</h3>
						<p class="text-sm">Practice your first conversation scenario</p>
					</div>
				</div>
				<div class="step step-primary">
					<div class="text-left">
						<h3 class="font-bold">3. Build Momentum</h3>
						<p class="text-sm">Complete daily lessons at your own pace</p>
					</div>
				</div>
				<div class="step step-primary">
					<div class="text-left">
						<h3 class="font-bold">4. Speak Confidently</h3>
						<p class="text-sm">Apply your skills in real conversations</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Social Proof / Benefits -->
		<div class="card bg-gradient-to-br from-base-200 to-base-300 mb-8">
			<div class="card-body">
				<h3 class="card-title text-2xl mb-4">Why Learners Love Kaiwa</h3>
				<div class="grid md:grid-cols-2 gap-4">
					<div class="flex gap-3">
						<div class="text-2xl">✓</div>
						<div>
							<h4 class="font-semibold">Safe Practice Environment</h4>
							<p class="text-sm text-base-content/70">
								Build confidence without fear of judgment
							</p>
						</div>
					</div>
					<div class="flex gap-3">
						<div class="text-2xl">✓</div>
						<div>
							<h4 class="font-semibold">Instant Feedback</h4>
							<p class="text-sm text-base-content/70">
								Get corrections and suggestions in real-time
							</p>
						</div>
					</div>
					<div class="flex gap-3">
						<div class="text-2xl">✓</div>
						<div>
							<h4 class="font-semibold">Flexible Schedule</h4>
							<p class="text-sm text-base-content/70">Practice whenever works for you</p>
						</div>
					</div>
					<div class="flex gap-3">
						<div class="text-2xl">✓</div>
						<div>
							<h4 class="font-semibold">Real Scenarios</h4>
							<p class="text-sm text-base-content/70">
								Conversations you'll actually have in real life
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	:global(.prose h2) {
		@apply text-3xl font-bold mt-12 mb-6;
	}

	:global(.prose h3) {
		@apply text-xl font-semibold mt-6 mb-3;
	}
</style>
