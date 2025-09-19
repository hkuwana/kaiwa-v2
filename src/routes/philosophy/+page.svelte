<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		// Set page title
		document.title = 'Philosophy - Kaiwa';
	});
</script>

<svelte:head>
	<title>Philosophy - Kaiwa</title>
	<meta
		name="description"
		content="The anti-language-learning app. For people who need to actually use Japanese, not pass a test."
	/>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
	<div class="container mx-auto px-4 py-16">
		<!-- Hero Section -->
		<div class="mb-16 text-center">
			<h1 class="mb-6 text-5xl font-bold text-white md:text-7xl">The Anti-Language-Learning App</h1>
			<p class="mx-auto max-w-4xl text-xl leading-relaxed text-gray-300 md:text-2xl">
				For people who need to actually use the language, not pass a test
			</p>
		</div>

		<!-- Mission Statement -->
		<div class="mx-auto mb-16 max-w-4xl">
			<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm">
				<p class="text-lg leading-relaxed text-gray-200">
					Kaiwa is the anti-language-learning app. We're not here to help you achieve B2 proficiency
					or master 2000 vocabulary words. We're here to help you survive real situations, connect
					with loved ones, and handle the conversations that actually matter in your life.
				</p>
			</div>
		</div>

		<!-- Brand Positioning Matrix -->
		<div class="mx-auto mb-16 max-w-6xl">
			<h2 class="mb-8 text-center text-3xl font-bold text-white">Brand Positioning Matrix</h2>
			<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm">
				<div class="grid gap-8 md:grid-cols-2">
					<div>
						<h3 class="mb-4 text-xl font-semibold text-red-400">Traditional Apps</h3>
						<ul class="space-y-3 text-gray-300">
							<li>"Achieve B2 proficiency"</li>
							<li>"Master 2000 vocabulary words"</li>
							<li>"Perfect grammar structures"</li>
							<li>"JLPT certification prep"</li>
							<li>"Business Japanese"</li>
						</ul>
					</div>
					<div>
						<h3 class="mb-4 text-xl font-semibold text-green-400">Kaiwa</h3>
						<ul class="space-y-3 text-gray-300">
							<li>"Survive a night in Kabukicho"</li>
							<li>"Talk your way out of missing the last train"</li>
							<li>"Flirt without Google Translate"</li>
							<li>"Argue about politics at an izakaya"</li>
							<li>"Convince the landlord you're not destroying the apartment"</li>
						</ul>
					</div>
				</div>
			</div>
		</div>

		<!-- User Personas -->
		<div class="mx-auto mb-16 max-w-6xl">
			<h2 class="mb-8 text-center text-3xl font-bold text-white">Target User Personas</h2>
			<div class="grid gap-8 md:grid-cols-3">
				<!-- Expat Survivor -->
				<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-6 backdrop-blur-sm">
					<h3 class="mb-2 text-xl font-semibold text-white">The Expat Survivor</h3>
					<p class="mb-4 text-sm text-purple-400">"For when 'sumimasen' isn't enough"</p>
					<ul class="space-y-2 text-sm text-gray-300">
						<li><strong>Profile:</strong> Living in Tokyo, tired of pointing at menus</li>
						<li><strong>Needs:</strong> Order ramen with modifications, argue with NHK guy</li>
						<li><strong>Current solution:</strong> Google Translate + prayer</li>
					</ul>
				</div>

				<!-- Relationship Navigator -->
				<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-6 backdrop-blur-sm">
					<h3 class="mb-2 text-xl font-semibold text-white">The Relationship Navigator</h3>
					<p class="mb-4 text-sm text-purple-400">"Because love shouldn't need subtitles"</p>
					<ul class="space-y-2 text-sm text-gray-300">
						<li><strong>Profile:</strong> Dating someone Japanese</li>
						<li><strong>Needs:</strong> Impress the parents, fight fairly</li>
						<li><strong>Current solution:</strong> Partner translates everything (awkward)</li>
					</ul>
				</div>

				<!-- Family Connector -->
				<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-6 backdrop-blur-sm">
					<h3 class="mb-2 text-xl font-semibold text-white">The Family Connector</h3>
					<p class="mb-4 text-sm text-purple-400">"Because family shouldn't need subtitles"</p>
					<ul class="space-y-2 text-sm text-gray-300">
						<li><strong>Profile:</strong> Has family members who speak the language</li>
						<li><strong>Needs:</strong> Connect with relatives, understand family stories</li>
						<li><strong>Current solution:</strong> Missing out on family conversations</li>
					</ul>
				</div>
			</div>
		</div>

		<!-- Real Situations Campaign -->
		<div class="mx-auto mb-16 max-w-4xl">
			<h2 class="mb-8 text-center text-3xl font-bold text-white">The "Real Situations" Campaign</h2>
			<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm">
				<p class="mb-6 text-gray-300">
					Weekly scenario releases for practicing the conversations you'll actually have:
				</p>
				<ul class="space-y-3 text-gray-300">
					<li>• "Explain to your partner's parents why you're serious about the relationship"</li>
					<li>• "Comfort your grandmother when she's feeling lonely"</li>
					<li>• "Handle a medical emergency with confidence"</li>
					<li>• "Express your feelings without Google Translate"</li>
					<li>• "Connect with family members you've never really talked to"</li>
				</ul>
			</div>
		</div>

		<!-- Anti-Features -->
		<div class="mx-auto mb-16 max-w-4xl">
			<h2 class="mb-8 text-center text-3xl font-bold text-white">
				Anti-Features (Our Selling Points)
			</h2>
			<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm">
				<div class="space-y-4">
					<div class="flex items-center justify-between border-b border-gray-700 py-3">
						<span class="text-gray-300">Grammar explanations</span>
						<span class="text-sm text-purple-400"
							>The taxi driver doesn't care about your particle usage</span
						>
					</div>
					<div class="flex items-center justify-between border-b border-gray-700 py-3">
						<span class="text-gray-300">Vocabulary lists</span>
						<span class="text-sm text-purple-400"
							>You'll remember words when you need them to survive</span
						>
					</div>
					<div class="flex items-center justify-between border-b border-gray-700 py-3">
						<span class="text-gray-300">Progress bars</span>
						<span class="text-sm text-purple-400">Life doesn't have XP points</span>
					</div>
					<div class="flex items-center justify-between border-b border-gray-700 py-3">
						<span class="text-gray-300">Certificates</span>
						<span class="text-sm text-purple-400">Nobody in Shibuya asks for your JLPT level</span>
					</div>
					<div class="flex items-center justify-between py-3">
						<span class="text-gray-300">Streak counters</span>
						<span class="text-sm text-purple-400">Missing a day won't kill your Japanese</span>
					</div>
				</div>
			</div>
		</div>

		<!-- The Manifesto -->
		<div class="mx-auto max-w-4xl">
			<h2 class="mb-8 text-center text-3xl font-bold text-white">The Manifesto</h2>
			<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm">
				<div class="space-y-4 leading-relaxed text-gray-200">
					<p>
						We built Kaiwa because we were tired of 'knowing' a language but being unable to connect
						with the people we love.
					</p>
					<p>
						Tired of watching family conversations happen without us. Tired of our partners having
						to translate our feelings.
					</p>
					<p>
						Tired of apps that teach you to say 'the pen is on the table' but not 'I love you' or
						'I'm sorry.'
					</p>
					<p>
						Tired of perfect grammar exercises but inability to express what's really in your heart.
					</p>
					<p class="font-semibold text-purple-400">
						Real relationships are messy. Real conversations are emotional. And you need to be
						ready.
					</p>
					<p>No courses. No evaluations. Just the conversations that actually matter.</p>
					<p class="text-lg font-bold text-white">
						Welcome to Kaiwa. The app for people who need to connect, not just communicate.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
