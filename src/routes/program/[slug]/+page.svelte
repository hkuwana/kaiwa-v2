<script lang="ts">
	import { page } from '$app/state';
	import { createLearningPathJsonLd, createBreadcrumbJsonLd } from '$lib/seo/jsonld';
	import PathSyllabus from '$lib/features/learning-path/components/PathSyllabus.svelte';
	import EnrollCTA from '$lib/features/learning-path/components/EnrollCTA.svelte';
	import type { PageData } from './$types';
	import { getLanguageName } from '$lib/data/languages';

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
	const baseUrl = page.url.origin;
	const pageUrl = `${baseUrl}/program/${template.shareSlug}`;

	const languageName = getLanguageName(template.targetLanguage);
	const weeks = Math.ceil(template.schedule.length / 7);

	// Generate JSON-LD structured data
		const jsonLd = createLearningPathJsonLd(
			{
				...template,
				shareSlug: template.shareSlug ?? '',
				metadata: template.metadata ?? undefined
			},
			baseUrl
		);

	// Create breadcrumb navigation
	const breadcrumbJsonLd = createBreadcrumbJsonLd(
		[
			{ name: 'Home', url: '/' },
			{ name: 'Programs', url: '/programs' },
			{ name: template.title, url: `/program/${template.shareSlug}` }
		],
		baseUrl
	);

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

	<!-- JSON-LD Structured Data - Course -->
	<script type="application/ld+json">
		{@html JSON.stringify(jsonLd)}
	</script>

	<!-- JSON-LD Structured Data - Breadcrumbs -->
	<script type="application/ld+json">
		{@html JSON.stringify(breadcrumbJsonLd)}
	</script>
</svelte:head>

<div class="min-h-screen bg-base-100">
	<div class="container mx-auto max-w-6xl px-4 py-8">
		<!-- Hero CTA -->
		<div class="mb-12">
			<EnrollCTA
				title={template.title}
				totalDays={template.schedule.length}
								shareSlug={template.shareSlug ?? undefined}
				variant="hero"
			/>
		</div>

		<!-- Program Overview -->
		<div class="prose-lg mb-12 prose max-w-none">
			<h2>About This Program</h2>
			<p class="text-lg leading-relaxed">
				{template.description}
			</p>

			<div class="not-prose my-8 grid gap-6 md:grid-cols-3">
				<div class="card bg-base-200">
					<div class="card-body items-center text-center">
						<span class="mb-2 icon-[mdi--target] h-10 w-10 text-primary"></span>
						<h3 class="card-title text-lg">Practical Focus</h3>
						<p class="text-sm">Real conversations you'll actually use</p>
					</div>
				</div>

				<div class="card bg-base-200">
					<div class="card-body items-center text-center">
						<span class="mb-2 icon-[mdi--flash] h-10 w-10 text-secondary"></span>
						<h3 class="card-title text-lg">Quick Sessions</h3>
						<p class="text-sm">Just 5-20 minutes per day</p>
					</div>
				</div>

				<div class="card bg-base-200">
					<div class="card-body items-center text-center">
						<span class="mb-2 icon-[mdi--robot-outline] h-10 w-10 text-accent"></span>
						<h3 class="card-title text-lg">AI-Powered</h3>
						<p class="text-sm">Practice anytime, get instant feedback</p>
					</div>
				</div>
			</div>

			{#if template.metadata}
				<div class="alert alert-info">
					<span class="icon-[mdi--information-outline] h-6 w-6 shrink-0"></span>
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
								shareSlug={template.shareSlug ?? undefined}
				variant="inline"
			/>
		</div>

		<!-- How It Works -->
		<div class="mb-12 prose max-w-none">
			<h2>How It Works</h2>
			<div class="steps steps-vertical w-full lg:steps-horizontal">
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
		<div class="card mb-8 bg-linear-to-br from-base-200 to-base-300">
			<div class="card-body">
				<h3 class="mb-4 card-title text-2xl">Why Learners Love Kaiwa</h3>
				<div class="grid gap-4 md:grid-cols-2">
					<div class="flex gap-3">
						<span class="mt-1 icon-[mdi--check-circle] h-5 w-5 text-success"></span>
						<div>
							<h4 class="font-semibold">Safe Practice Environment</h4>
							<p class="text-sm text-base-content/70">Build confidence without fear of judgment</p>
						</div>
					</div>
					<div class="flex gap-3">
						<span class="mt-1 icon-[mdi--check-circle] h-5 w-5 text-success"></span>
						<div>
							<h4 class="font-semibold">Instant Feedback</h4>
							<p class="text-sm text-base-content/70">
								Get corrections and suggestions in real-time
							</p>
						</div>
					</div>
					<div class="flex gap-3">
						<span class="mt-1 icon-[mdi--check-circle] h-5 w-5 text-success"></span>
						<div>
							<h4 class="font-semibold">Flexible Schedule</h4>
							<p class="text-sm text-base-content/70">Practice whenever works for you</p>
						</div>
					</div>
					<div class="flex gap-3">
						<span class="mt-1 icon-[mdi--check-circle] h-5 w-5 text-success"></span>
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
