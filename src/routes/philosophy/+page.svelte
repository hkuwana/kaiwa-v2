<script lang="ts">
	import { onMount } from 'svelte';

	onMount(() => {
		// Set page title
		document.title = 'Philosophy - Kaiwa';
	});
</script>

<div class="min-h-screen bg-linear-to-br from-slate-900 via-purple-900 to-slate-900">
	<div class="container mx-auto px-4 py-16">
		<!-- Hero Section -->
		<div class="mb-16 text-center">
			<h1 class="mb-6 text-5xl font-bold text-white md:text-7xl">
				Have the conversation you're afraid of.
			</h1>
			<p class="mx-auto max-w-4xl text-xl leading-relaxed text-gray-300 md:text-2xl">
				For people who need to connect with the ones they love, in the language of their heart
			</p>
		</div>

		<!-- Mission Statement -->
		<div class="mx-auto mb-16 max-w-4xl">
			<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm">
				<p class="text-lg leading-relaxed text-gray-200">
					Kaiwa's Signal: Give you the specific, practiced skills to have a single, successful,
					high-stakes conversation with a loved one. Not test prep. Not vocab lists. Real connection
					with the people you love, in their language.
				</p>
				<p class="mt-4 text-gray-300">
					Our emotional outcome is simple: <strong
						>connecting without fear with the people who matter most.</strong
					> Every feature, every scenario, every piece of feedback exists to move you closer to that
					moment when they understand you, truly and deeply, in their language.
				</p>
			</div>
		</div>

		<!-- Signal Positioning -->
		<div class="mx-auto mb-16 max-w-6xl">
			<h2 class="mb-8 text-center text-3xl font-bold text-white">The Signal: Emotional Outcomes</h2>
			<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm">
				<p class="mb-6 text-lg text-gray-200">
					Kaiwa is built around one clear Signal: the specific conversations that connect you with
					the people you love. Not test scores. Not vocabulary counts. The moments where they
					understand you. And you understand them.
				</p>
				<div class="grid gap-8 md:grid-cols-2">
					<div>
						<h3 class="mb-4 text-xl font-semibold text-red-400">Noise (What We Ignore)</h3>
						<ul class="space-y-3 text-gray-300">
							<li>Gamification for its own sake (badges, leaderboards)</li>
							<li>Generic "soft skills" training</li>
							<li>Metrics like "time in app" or "days streak"</li>
							<li>Test prep and certifications</li>
							<li>Isolated vocabulary drills</li>
						</ul>
					</div>
					<div>
						<h3 class="mb-4 text-xl font-semibold text-green-400">Signal (Our Focus)</h3>
						<ul class="space-y-3 text-gray-300">
							<li>Tell your parents you're changing careers, and have them be proud</li>
							<li>Practice the 5-minute conversation that can save your relationship</li>
							<li>Meet your partner's family without a translator</li>
							<li>Apologize genuinely, in their language</li>
							<li>Share big news and feel understood</li>
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

				<!-- Connection Seeker -->
				<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-6 backdrop-blur-sm">
					<h3 class="mb-2 text-xl font-semibold text-white">The Connection Seeker</h3>
					<p class="mb-4 text-sm text-purple-400">"I want them to know the real me"</p>
					<ul class="space-y-2 text-sm text-gray-300">
						<li>
							<strong>Fear:</strong> They won't understand my real thoughts without a translator
						</li>
						<li>
							<strong>Signal Moment:</strong> Having an honest argument, laughing at jokes, sharing a
							difficult feeling. All without help
						</li>
						<li><strong>Win:</strong> "They finally understood me without me translating"</li>
					</ul>
				</div>

				<!-- Legacy Builder -->
				<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-6 backdrop-blur-sm">
					<h3 class="mb-2 text-xl font-semibold text-white">The Legacy Builder</h3>
					<p class="mb-4 text-sm text-purple-400">"I want to honor where I come from"</p>
					<ul class="space-y-2 text-sm text-gray-300">
						<li>
							<strong>Fear:</strong> Missing out on family stories, grandparents' wisdom, real connection
						</li>
						<li>
							<strong>Signal Moment:</strong> Having a real conversation with grandparents or extended
							family. Not just hellos
						</li>
						<li>
							<strong>Win:</strong> "They shared something vulnerable with me. In their language"
						</li>
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

		<!-- The Manifesto: The Signal Plan -->
		<div class="mx-auto max-w-4xl">
			<h2 class="mb-8 text-center text-3xl font-bold text-white">The Manifesto: Our Signal</h2>
			<div class="rounded-2xl border border-purple-500/20 bg-black/30 p-8 backdrop-blur-sm">
				<div class="space-y-4 leading-relaxed text-gray-200">
					<p class="text-lg font-semibold text-purple-400">Core Principle: Signal vs. Noise</p>
					<p>
						Our Signal is simple: giving users the specific, practiced skills to have a single,
						successful, high-stakes conversation with a loved one.
					</p>
					<p>
						We ignore the noise: gamification for its own sake, generic "soft skills" training,
						metrics like "time in app."
					</p>
					<p class="mt-6 font-semibold text-white">
						We built Kaiwa by working backwards from the user's real-world emotional goal.
					</p>
					<p>
						The user does not want to "practice AI conversations." The user wants their parents to
						be proud. Wants their partner to understand them. Wants to be in the room, fully
						present, without translating.
					</p>
					<p>So we built four phases:</p>
					<ul class="mt-4 space-y-2 text-gray-300">
						<li>
							<strong>Phase 1: User Acquisition</strong>: We market the solution to emotional
							problems, not features
						</li>
						<li>
							<strong>Phase 2: User Onboarding</strong>: We prove value instantly by helping with
							their specific conversation fear
						</li>
						<li>
							<strong>Phase 3: User Retention</strong>: We use engagement only to encourage deeper
							practice of what matters
						</li>
						<li>
							<strong>Phase 4: Real-World Bridge</strong>: We celebrate the real conversation
							outcomes that prove this works
						</li>
					</ul>
					<p class="mt-6 text-lg font-bold text-white">
						Welcome to Kaiwa. The app for people who need to connect, not just pass a test.
					</p>
				</div>
			</div>
		</div>
	</div>
</div>
