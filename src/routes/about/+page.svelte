<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		// Set page title
		document.title = 'About - Kaiwa';
	});
</script>

<svelte:head>
	<title>About - Kaiwa</title>
	<meta
		name="description"
		content="About Kaiwa and the philosophy behind the anti-language-learning app."
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
	<div class="container mx-auto px-4 py-16">
		<!-- Hero Section -->
		<div class="mb-16 text-center">
			<h1 class="mb-6 text-5xl font-bold text-white md:text-7xl">About Kaiwa</h1>
			<p class="mx-auto max-w-4xl text-xl leading-relaxed text-gray-300 md:text-2xl">
				The story behind the anti-language-learning app
			</p>
		</div>

		<!-- Founder's Philosophy -->
		<div class="mx-auto mb-16 max-w-4xl">
			<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm">
				<h2 class="mb-6 text-3xl font-bold text-white">A Founder's Philosophy</h2>
				<div class="space-y-4 leading-relaxed text-gray-200">
					<p class="text-lg">
						I don't believe you take medals, monuments, or certificates to the afterlife. You only
						take the wild experiences you have lived to the next world and the memories that come
						with it.
					</p>
					<p>
						This philosophy is at the heart of everything we do at Kaiwa. While other language apps
						focus on achievements, progress bars, and certifications, we focus on something far more
						valuable: the ability to create meaningful experiences through real communication.
					</p>
					<p>
						When you're comforting your grandmother in her native language, or expressing your love
						to your partner without translation, or connecting with family members you've never
						really spoken to—these are the moments that matter. These are the experiences that shape
						who you are and create the memories you'll carry with you.
					</p>
					<p class="font-semibold text-purple-400">
						Kaiwa isn't about passing tests. It's about living fully in the language you're
						learning.
					</p>
				</div>
			</div>
		</div>

		<!-- The Problem We're Solving -->
		<div class="mx-auto mb-16 max-w-4xl">
			<h2 class="mb-8 text-center text-3xl font-bold text-white">The Problem We're Solving</h2>
			<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm">
				<div class="space-y-4 leading-relaxed text-gray-200">
					<p>
						Traditional language learning apps teach you to say "the pen is on the table" but not "I
						love you" or "I'm sorry." They prepare you for hypothetical conversations in perfect
						grammar, but leave you helpless when real relationships get emotional.
					</p>
					<p>
						We've all been there: you've studied a language for years, you can conjugate verbs
						perfectly, you have a 500-day streak on Duolingo. But when your partner's family asks
						about your intentions, you panic. When your grandmother is crying and you want to
						comfort her, you don't know how. When you need to express your real feelings, you
						freeze.
					</p>
					<p class="font-semibold text-purple-400">
						This is the gap Kaiwa fills. We prepare you for the conversations you'll actually have,
						not the ones in textbooks.
					</p>
				</div>
			</div>
		</div>

		<!-- Our Approach -->
		<div class="mx-auto mb-16 max-w-6xl">
			<h2 class="mb-8 text-center text-3xl font-bold text-white">Our Approach</h2>
			<div class="grid gap-8 md:grid-cols-3">
				<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-6 backdrop-blur-sm">
					<h3 class="mb-4 text-xl font-semibold text-white">Real Situations</h3>
					<p class="text-gray-300">
						We focus on the conversations you'll actually have: meeting your partner's parents,
						comforting family members, expressing your feelings, handling emotional moments.
					</p>
				</div>
				<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-6 backdrop-blur-sm">
					<h3 class="mb-4 text-xl font-semibold text-white">No Gamification</h3>
					<p class="text-gray-300">
						No points, no streaks, no certificates. Just the satisfaction of being able to handle
						real situations when they matter most.
					</p>
				</div>
				<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-6 backdrop-blur-sm">
					<h3 class="mb-4 text-xl font-semibold text-white">Survival Focus</h3>
					<p class="text-gray-300">
						We're not preparing you for a test. We're preparing you for life. For the messy,
						chaotic, beautiful reality of actually using Japanese.
					</p>
				</div>
			</div>
		</div>

		<!-- The Vision -->
		<div class="mx-auto mb-16 max-w-4xl">
			<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm">
				<h2 class="mb-6 text-3xl font-bold text-white">The Vision</h2>
				<div class="space-y-4 leading-relaxed text-gray-200">
					<p>
						Imagine a world where language learning isn't about accumulating knowledge, but about
						building the confidence to create experiences. Where every conversation you have in
						Japanese becomes a memory you'll treasure, not just another lesson completed.
					</p>
					<p>
						We envision Kaiwa users who don't just "know" a language—they live it. They connect with
						family members they've never really spoken to, build relationships without translation
						apps, and create the kind of deep, authentic connections that make life worth living.
					</p>
					<p class="text-lg font-semibold text-purple-400">
						Because at the end of the day, it's not about what you've learned—it's about what you've
						lived.
					</p>
				</div>
			</div>
		</div>

		<!-- Call to Action -->
		<div class="text-center">
			<div
				class="mx-auto max-w-2xl rounded-2xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm"
			>
				<h2 class="mb-4 text-2xl font-bold text-white">Ready to Start Living?</h2>
				<p class="mb-6 text-gray-300">
					Stop studying. Start surviving. Start creating the experiences that matter.
				</p>
				<a
					href="/"
					class="inline-block rounded-lg bg-purple-600 px-8 py-3 font-semibold text-white transition-colors duration-200 hover:bg-purple-700"
				>
					Try Kaiwa Now
				</a>
			</div>
		</div>
	</div>
</div>
