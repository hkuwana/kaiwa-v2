<script lang="ts">
	import UnifiedStartButton from '$lib/components/UnifiedStartButton.svelte';
	import { userManager } from '$lib/stores/user.store.svelte';

	const user = userManager.user;

	// Family conversation scenarios
	const familyScenarios = [
		{
			title: 'おばあちゃんとの会話',
			subtitle: 'Conversations with Grandmother',
			description:
				'Practice sharing your daily life, asking about her stories, and expressing gratitude',
			topics: [
				'Family memories',
				'Traditional recipes',
				'Childhood stories',
				'Health and wellbeing'
			]
		},
		{
			title: '家族の夕食',
			subtitle: 'Family Dinner Time',
			description: 'Natural conversations around the dinner table, sharing your day and connecting',
			topics: ['Daily experiences', 'Future plans', 'Food appreciation', 'Family traditions']
		},
		{
			title: '特別な日',
			subtitle: 'Special Occasions',
			description: 'Express feelings during holidays, birthdays, and meaningful family moments',
			topics: [
				'New Year greetings',
				'Birthday wishes',
				'Wedding congratulations',
				'Achievement celebrations'
			]
		}
	];

	const testimonials = [
		{
			name: 'Sarah M.',
			story:
				'After 3 months with Kaiwa, I finally had the courage to call my Japanese grandmother. We talked for an hour - it was magical.',
			relationship: 'Granddaughter living in California'
		},
		{
			name: 'David K.',
			story:
				"My wife's family welcomed me so warmly when I could finally express my gratitude in Japanese. Kaiwa made it possible.",
			relationship: 'Married to a Japanese speaker'
		},
		{
			name: 'Maria L.',
			story:
				"I was terrified of making mistakes. Kaiwa's gentle AI helped me build confidence before meeting my boyfriend's parents.",
			relationship: 'Learning for relationship'
		}
	];
</script>

<!-- Gentle, nature-inspired hero section -->
<div class="relative overflow-hidden bg-gradient-to-b from-sky-50 via-white to-green-50">
	<!-- Soft decorative elements -->
	<div class="absolute inset-0 opacity-10">
		<div class="absolute top-20 left-10 h-32 w-32 rounded-full bg-green-200 blur-3xl"></div>
		<div class="absolute top-40 right-20 h-24 w-24 rounded-full bg-blue-200 blur-2xl"></div>
		<div class="absolute bottom-20 left-1/3 h-40 w-40 rounded-full bg-pink-100 blur-3xl"></div>
	</div>

	<div class="relative mx-auto max-w-6xl px-6 py-20 text-center">
		<!-- Gentle Japanese-inspired heading -->
		<div class="mb-8">
			<h1 class="text-4xl leading-relaxed font-light text-gray-800 md:text-6xl">
				<span class="text-green-700">心をつなぐ</span><br />
				<span class="text-2xl font-normal text-gray-600 md:text-3xl"
					>Connect Hearts Through Language</span
				>
			</h1>
		</div>

		<p class="mx-auto mb-12 max-w-4xl text-xl leading-relaxed font-light text-gray-600 md:text-2xl">
			Practice Japanese conversations in a gentle, safe space.
			<br class="hidden md:block" />
			When you're ready, those precious family moments will flow naturally.
		</p>

		<!-- Soft CTA -->
		<div class="mb-16">
			<UnifiedStartButton
				variant="gentle"
				class="rounded-full bg-green-600 px-8 py-4 text-lg font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:bg-green-700 hover:shadow-xl"
			>
				Begin Your Journey 🌸
			</UnifiedStartButton>
		</div>

		<!-- Visual metaphor -->
		<div class="text-center text-sm text-gray-500">
			<p>
				Like morning mist clearing to reveal the mountain,<br />confidence grows one conversation at
				a time.
			</p>
		</div>
	</div>
</div>

<!-- Family scenarios section with gentle styling -->
<div class="bg-white py-20">
	<div class="mx-auto max-w-6xl px-6">
		<div class="mb-16 text-center">
			<h2 class="mb-4 text-3xl font-light text-gray-800 md:text-4xl">
				Family Conversation Practice
			</h2>
			<p class="mx-auto max-w-2xl text-lg leading-relaxed text-gray-600">
				Start with scenarios that matter most. Each conversation brings you closer to those you
				love.
			</p>
		</div>

		<div class="grid gap-8 md:grid-cols-3">
			{#each familyScenarios as scenario}
				<div
					class="rounded-2xl border border-gray-100 bg-gradient-to-br from-white to-gray-50 p-8 shadow-sm transition-all duration-300 hover:shadow-md"
				>
					<div class="mb-6 text-center">
						<h3 class="mb-2 text-xl font-medium text-gray-800">{scenario.title}</h3>
						<p class="font-light text-green-600">{scenario.subtitle}</p>
					</div>

					<p class="mb-6 leading-relaxed text-gray-600">{scenario.description}</p>

					<div class="space-y-2">
						<p class="mb-3 text-sm font-medium text-gray-700">Practice Topics:</p>
						{#each scenario.topics as topic}
							<div
								class="mr-2 mb-2 inline-block rounded-full bg-green-50 px-3 py-1 text-sm text-green-700"
							>
								{topic}
							</div>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Safe space messaging -->
<div class="bg-gradient-to-r from-blue-50 to-green-50 py-20">
	<div class="mx-auto max-w-4xl px-6 text-center">
		<h2 class="mb-8 text-3xl font-light text-gray-800 md:text-4xl">A Gentle Space to Grow</h2>

		<div class="mb-12 grid gap-8 md:grid-cols-3">
			<div class="text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100"
				>
					<span class="text-2xl">🌱</span>
				</div>
				<h3 class="mb-2 font-medium text-gray-800">No Judgment</h3>
				<p class="text-sm text-gray-600">
					Make mistakes freely. Our AI responds with patience and encouragement.
				</p>
			</div>

			<div class="text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100"
				>
					<span class="text-2xl">🕊️</span>
				</div>
				<h3 class="mb-2 font-medium text-gray-800">At Your Pace</h3>
				<p class="text-sm text-gray-600">
					Practice when you feel ready. No pressure, just gentle progress.
				</p>
			</div>

			<div class="text-center">
				<div
					class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-pink-100"
				>
					<span class="text-2xl">💝</span>
				</div>
				<h3 class="mb-2 font-medium text-gray-800">Meaningful Purpose</h3>
				<p class="text-sm text-gray-600">
					Every conversation brings you closer to connecting with loved ones.
				</p>
			</div>
		</div>

		<UnifiedStartButton
			class="rounded-full bg-blue-600 px-8 py-4 text-lg font-medium text-white shadow-lg transition-all duration-300 hover:bg-blue-700"
		>
			Start Practicing Safely
		</UnifiedStartButton>
	</div>
</div>

<!-- Heartfelt testimonials -->
<div class="bg-white py-20">
	<div class="mx-auto max-w-6xl px-6">
		<div class="mb-16 text-center">
			<h2 class="mb-4 text-3xl font-light text-gray-800 md:text-4xl">Hearts Connected</h2>
			<p class="text-lg text-gray-600">Real stories of family connections made possible</p>
		</div>

		<div class="grid gap-8 md:grid-cols-3">
			{#each testimonials as testimonial}
				<div
					class="rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white p-6 shadow-sm"
				>
					<div class="mb-4">
						<div class="mb-3 flex text-yellow-400">
							{#each Array(5) as _}
								<span class="text-sm">⭐</span>
							{/each}
						</div>
						<p class="leading-relaxed text-gray-700 italic">"{testimonial.story}"</p>
					</div>
					<div class="border-t pt-4">
						<p class="font-medium text-gray-800">{testimonial.name}</p>
						<p class="text-sm text-gray-500">{testimonial.relationship}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<!-- Final gentle CTA -->
<div class="bg-gradient-to-b from-green-50 to-blue-50 py-20">
	<div class="mx-auto max-w-4xl px-6 text-center">
		<h2 class="mb-6 text-3xl font-light text-gray-800 md:text-4xl">Your Family is Waiting</h2>
		<p class="mb-8 text-xl leading-relaxed text-gray-600">
			Take the first gentle step toward those conversations that matter most.
		</p>

		<UnifiedStartButton
			class="rounded-full bg-gradient-to-r from-green-600 to-blue-600 px-12 py-4 text-xl font-medium text-white shadow-lg transition-all duration-300 hover:scale-105 hover:from-green-700 hover:to-blue-700 hover:shadow-xl"
		>
			Begin Your Journey Home 🏡
		</UnifiedStartButton>

		<p class="mt-4 text-sm text-gray-500">Free to start • No pressure • Your pace</p>
	</div>
</div>
