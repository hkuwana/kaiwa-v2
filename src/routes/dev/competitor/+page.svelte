<script lang="ts">
	let selectedConcept = $state('quiz');

	// Quiz state
	let currentQuestion = $state(0);
	let answers: string[] = [];
	let showResults = $state(false);

	const quizQuestions = [
		{
			question: "What's your biggest frustration with language learning apps?",
			options: [
				{ id: 'setup', text: 'Too many tutorials before I can actually speak', pain: 'setup' },
				{ id: 'time', text: 'Limited speaking time or paywalls', pain: 'limits' },
				{ id: 'boring', text: "Boring topics that don't relate to real life", pain: 'relevance' },
				{ id: 'scripts', text: "Reading characters I don't understand", pain: 'scripts' }
			]
		},
		{
			question: 'When you do get to practice speaking, what feels missing?',
			options: [
				{ id: 'emotion', text: 'Real human emotions and relationships', pain: 'emotion' },
				{ id: 'memory', text: 'Conversations that remember who I am', pain: 'memory' },
				{ id: 'culture', text: 'Cultural context and local phrases', pain: 'culture' },
				{ id: 'flow', text: 'Natural conversation flow', pain: 'flow' }
			]
		}
	];

	// Timeline data
	const timelineComparison = [
		{
			period: 'Day 1',
			kaiwa: {
				title: 'Start Speaking',
				desc: 'Click and start a real conversation immediately',
				icon: '⚡'
			},
			others: {
				title: 'Complete Tutorials',
				desc: 'Watch intro videos, complete setup, unlock speaking',
				icon: '📚'
			}
		},
		{
			period: 'Week 1',
			kaiwa: {
				title: '20+ Real Conversations',
				desc: 'Practice apologies, compliments, asking for help',
				icon: '💬'
			},
			others: {
				title: 'Vocabulary Drills',
				desc: 'Repeat words, match pictures, fill in blanks',
				icon: '🔄'
			}
		},
		{
			period: 'Month 1',
			kaiwa: {
				title: 'Unlimited Practice',
				desc: 'Speak as much as you want, always free',
				icon: '♾️'
			},
			others: {
				title: 'Hit Limits',
				desc: 'Daily caps reached, premium upgrade required',
				icon: '🚫'
			}
		},
		{
			period: 'Month 3',
			kaiwa: {
				title: 'Personal Context',
				desc: 'AI remembers your interests and builds on them',
				icon: '🌱'
			},
			others: {
				title: 'Repetitive Topics',
				desc: 'Same basic scenarios, no personal connection',
				icon: '🔁'
			}
		}
	];

	// Carousel data
	const competitorProblems = [
		{
			name: 'ChatGPT Voice',
			problem: 'Daily voice limits',
			detail:
				"Free users get limited daily voice usage. Paid users get more, but it's still capped.",
			kaiwaFix: 'Unlimited speaking practice, always free',
			color: 'bg-green-100'
		},
		{
			name: 'Duolingo',
			problem: '2-minute conversation cap',
			detail: 'Lily interrupts after 2 minutes and says she has to go. Very limited depth.',
			kaiwaFix: 'Conversations flow naturally as long as you want',
			color: 'bg-blue-100'
		},
		{
			name: 'Speak.com',
			problem: 'Premium paywall',
			detail: 'Core conversation features require expensive monthly subscription.',
			kaiwaFix: 'Best features available in free tier',
			color: 'bg-purple-100'
		},
		{
			name: 'Babbel',
			problem: 'Scripted responses',
			detail: 'Guided conversations follow predetermined scripts, limited flexibility.',
			kaiwaFix: 'Free-flowing conversations about anything',
			color: 'bg-orange-100'
		}
	];

	// Gallery scenarios
	const scenarioGallery = [
		{
			title: 'Starting a Conversation',
			kaiwaImg: 'One-click to speak',
			othersImg: 'Tutorial maze',
			description: 'See how quickly you can start practicing'
		},
		{
			title: 'Emotional Conversations',
			kaiwaImg: 'Apologizing to a friend',
			othersImg: 'Basic restaurant order',
			description: 'Practice conversations that actually matter'
		},
		{
			title: 'Asian Language Support',
			kaiwaImg: 'Japanese with furigana',
			othersImg: 'Confusing characters',
			description: 'Reading support when you need it'
		}
	];

	// Tabs data by user type
	const userTypes = {
		beginner: {
			title: 'Complete Beginner',
			comparisons: [
				{
					feature: 'Getting started',
					kaiwa: 'Click → Speak',
					others: 'Lessons → Tests → Unlock',
					rating: 5
				},
				{ feature: 'First conversation', kaiwa: 'Immediate', others: 'After 2-3 hours', rating: 5 },
				{ feature: 'Anxiety level', kaiwa: 'Low pressure', others: 'Performance stress', rating: 4 }
			]
		},
		intermediate: {
			title: 'Intermediate Learner',
			comparisons: [
				{
					feature: 'Conversation depth',
					kaiwa: 'Complex emotions',
					others: 'Basic topics',
					rating: 5
				},
				{
					feature: 'Personal relevance',
					kaiwa: 'Remembers your life',
					others: 'Generic scenarios',
					rating: 5
				},
				{
					feature: 'Cultural context',
					kaiwa: 'Local phrases',
					others: 'Textbook language',
					rating: 4
				}
			]
		},
		asian: {
			title: 'Asian Language Learner',
			comparisons: [
				{
					feature: 'Character support',
					kaiwa: 'Furigana/romanization',
					others: 'Raw characters',
					rating: 5
				},
				{ feature: 'Reading anxiety', kaiwa: 'Supported', others: 'Blocked by scripts', rating: 5 },
				{
					feature: 'Speaking confidence',
					kaiwa: 'Can focus on speaking',
					others: 'Stuck on reading',
					rating: 4
				}
			]
		}
	};

	function selectAnswer(questionIndex: number, optionId: string) {
		answers[questionIndex] = optionId;
		if (questionIndex < quizQuestions.length - 1) {
			currentQuestion = questionIndex + 1;
		} else {
			showResults = true;
		}
	}

	function resetQuiz() {
		currentQuestion = 0;
		answers = [];
		showResults = false;
	}

	function getPersonalizedResults() {
		const painPoints = answers
			.map(
				(answerId) =>
					quizQuestions
						.find((q) => q.options.some((opt) => opt.id === answerId))
						?.options.find((opt) => opt.id === answerId)?.pain
			)
			.filter(Boolean);

		return painPoints;
	}
</script>

<div class="container mx-auto max-w-6xl p-4">
	<div class="mb-8 text-center">
		<h1 class="text-3xl font-bold">Interactive Competitor Showcase Concepts</h1>
		<p class="mt-2 opacity-70">
			Choose a concept to explore different ways of showcasing Kaiwa's advantages
		</p>
	</div>

	<!-- Concept Selector -->
	<div class="mb-8">
		<div class="tabs-boxed tabs justify-center">
			<button
				class="tab {selectedConcept === 'quiz' ? 'tab-active' : ''}"
				onclick={() => (selectedConcept = 'quiz')}
			>
				🎯 Pain Point Quiz
			</button>
			<button
				class="tab {selectedConcept === 'timeline' ? 'tab-active' : ''}"
				onclick={() => (selectedConcept = 'timeline')}
			>
				⏱️ Learning Journey
			</button>
			<button
				class="tab {selectedConcept === 'carousel' ? 'tab-active' : ''}"
				onclick={() => (selectedConcept = 'carousel')}
			>
				🎠 Problem Carousel
			</button>
			<button
				class="tab {selectedConcept === 'gallery' ? 'tab-active' : ''}"
				onclick={() => (selectedConcept = 'gallery')}
			>
				🖼️ Hover Gallery
			</button>
			<button
				class="tab {selectedConcept === 'tabs' ? 'tab-active' : ''}"
				onclick={() => (selectedConcept = 'tabs')}
			>
				📊 User Type Tabs
			</button>
		</div>
	</div>

	<!-- Quiz Concept -->
	{#if selectedConcept === 'quiz'}
		<div class="space-y-6">
			<div class="text-center">
				<h2 class="text-2xl font-bold">Find Your Learning Pain Point</h2>
				<p class="mt-2 opacity-70">
					Discover which Kaiwa features solve your specific frustrations
				</p>
			</div>

			{#if !showResults}
				<div class="card mx-auto max-w-2xl bg-base-100 shadow-xl">
					<div class="card-body">
						<div class="mb-4 flex items-center justify-between">
							<h3 class="card-title">Question {currentQuestion + 1} of {quizQuestions.length}</h3>
							<div class="text-sm opacity-70">
								{Math.round((currentQuestion / quizQuestions.length) * 100)}% complete
							</div>
						</div>

						<progress
							class="progress mb-4 w-full progress-primary"
							value={currentQuestion}
							max={quizQuestions.length}
						></progress>

						<h4 class="mb-6 text-lg font-medium">{quizQuestions[currentQuestion].question}</h4>

						<div class="grid gap-3">
							{#each quizQuestions[currentQuestion].options as option}
								<div
									class="card-compact card cursor-pointer bg-base-200 transition-colors hover:bg-base-300"
									role="button"
									tabindex="0"
									onclick={() => selectAnswer(currentQuestion, option.id)}
									onkeydown={(e) => {
										if (e.key === 'Enter' || e.key === ' ') {
											e.preventDefault();
											selectAnswer(currentQuestion, option.id);
										}
									}}
								>
									<div class="card-body">
										<p>{option.text}</p>
									</div>
								</div>
							{/each}
						</div>
					</div>
				</div>
			{:else}
				<div class="card mx-auto max-w-2xl bg-base-100 shadow-xl">
					<div class="card-body text-center">
						<h3 class="mb-4 card-title justify-center text-2xl">Your Personalized Results</h3>
						<div class="space-y-4">
							<div class="alert alert-success">
								<span class="text-lg">🎯 Kaiwa directly addresses your pain points!</span>
							</div>

							{#each getPersonalizedResults() as painPoint}
								<div class="card border border-primary/20 bg-primary/10">
									<div class="card-body py-4">
										{#if painPoint === 'setup'}
											<h4 class="font-bold">✅ Instant Speaking Practice</h4>
											<p class="text-sm">
												No tutorials or setup required. Click once and start your first real
												conversation.
											</p>
										{:else if painPoint === 'limits'}
											<h4 class="font-bold">✅ Unlimited Free Speaking</h4>
											<p class="text-sm">
												Speak as much as you want, whenever you want. No daily limits or paywalls.
											</p>
										{:else if painPoint === 'relevance'}
											<h4 class="font-bold">✅ Personally Relevant Conversations</h4>
											<p class="text-sm">
												AI remembers your interests and creates conversations about topics you
												actually care about.
											</p>
										{:else if painPoint === 'scripts'}
											<h4 class="font-bold">✅ Reading Support for Asian Languages</h4>
											<p class="text-sm">
												Furigana and romanization help you focus on speaking without getting stuck
												on characters.
											</p>
										{:else if painPoint === 'emotion'}
											<h4 class="font-bold">✅ Real Human Emotions</h4>
											<p class="text-sm">
												Practice apologies, expressions of affection, conflict
												resolution—conversations that actually matter.
											</p>
										{:else if painPoint === 'memory'}
											<h4 class="font-bold">✅ Conversation Memory</h4>
											<p class="text-sm">
												Each conversation builds on previous ones, creating continuity and deeper
												relationships.
											</p>
										{:else if painPoint === 'culture'}
											<h4 class="font-bold">✅ Cultural Insider Knowledge</h4>
											<p class="text-sm">
												Learn phrases locals actually use and understand the cultural context behind
												them.
											</p>
										{:else if painPoint === 'flow'}
											<h4 class="font-bold">✅ Natural Conversation Flow</h4>
											<p class="text-sm">
												True back-and-forth dialogue that feels human, with natural turn-taking and
												responses.
											</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>

						<div class="mt-6 card-actions justify-center">
							<button class="btn btn-primary">Try Kaiwa Now</button>
							<button class="btn btn-ghost" onclick={resetQuiz}>Retake Quiz</button>
						</div>
					</div>
				</div>
			{/if}
		</div>
	{/if}

	<!-- Timeline Concept -->
	{#if selectedConcept === 'timeline'}
		<div class="space-y-6">
			<div class="text-center">
				<h2 class="text-2xl font-bold">Your Learning Journey: Kaiwa vs Others</h2>
				<p class="mt-2 opacity-70">See how your experience differs from day one to fluency</p>
			</div>

			<div class="grid gap-8">
				{#each timelineComparison as period}
					<div class="diff mx-auto aspect-[16/9] max-w-4xl">
						<div class="diff-item-1">
							<div
								class="grid place-content-center bg-primary text-9xl font-black text-primary-content"
							>
								Other Apps
							</div>
						</div>
						<div class="diff-item-2">
							<div class="grid place-content-center bg-base-200 text-9xl font-black">Kaiwa</div>
						</div>
						<div class="diff-resizer"></div>
					</div>

					<div class="mx-auto max-w-4xl timeline-box">
						<div class="grid items-center gap-6 md:grid-cols-3">
							<!-- Timeline marker -->
							<div class="text-center">
								<div class="text-2xl font-bold text-primary">{period.period}</div>
								<div class="mx-auto mt-2 h-4 w-4 rounded-full bg-primary"></div>
							</div>

							<!-- Other apps -->
							<div class="card bg-base-200 shadow">
								<div class="card-body">
									<div class="mb-2 flex items-center gap-2">
										<span class="text-2xl">{period.others.icon}</span>
										<h4 class="card-title text-lg">{period.others.title}</h4>
									</div>
									<p class="text-sm opacity-80">{period.others.desc}</p>
									<div class="mt-2 text-xs opacity-60">Typical language learning apps</div>
								</div>
							</div>

							<!-- Kaiwa -->
							<div class="card bg-primary text-primary-content shadow-lg">
								<div class="card-body">
									<div class="mb-2 flex items-center gap-2">
										<span class="text-2xl">{period.kaiwa.icon}</span>
										<h4 class="card-title text-lg">{period.kaiwa.title}</h4>
									</div>
									<p class="text-sm opacity-90">{period.kaiwa.desc}</p>
									<div class="mt-2 text-xs opacity-75">With Kaiwa</div>
								</div>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Carousel Concept -->
	{#if selectedConcept === 'carousel'}
		<div class="space-y-6">
			<div class="text-center">
				<h2 class="text-2xl font-bold">Common Problems with Language Learning Apps</h2>
				<p class="mt-2 opacity-70">Swipe through real limitations and see how Kaiwa solves them</p>
			</div>

			<div class="carousel w-full">
				{#each competitorProblems as problem, i (i)}
					<div id="slide{i + 1}" class="relative carousel-item w-full">
						<div class="card {problem.color} mx-auto w-full max-w-2xl shadow-xl">
							<div class="card-body">
								<div class="mb-4 flex items-start justify-between">
									<h3 class="card-title text-2xl">{problem.name}</h3>
									<div class="badge badge-error">{problem.problem}</div>
								</div>

								<div class="space-y-4">
									<div class="alert alert-warning">
										<span class="font-medium">The Problem:</span>
										<p>{problem.detail}</p>
									</div>

									<div class="alert alert-success">
										<span class="font-medium">Kaiwa's Solution:</span>
										<p>{problem.kaiwaFix}</p>
									</div>
								</div>

								<div class="mt-6 card-actions justify-center">
									<button class="btn btn-primary">Try Kaiwa's Approach</button>
								</div>
							</div>
						</div>
						<div
							class="absolute top-1/2 right-5 left-5 flex -translate-y-1/2 transform justify-between"
						>
							<a href="#slide{i === 0 ? competitorProblems.length : i}" class="btn btn-circle">❮</a>
							<a
								href="#slide{i === competitorProblems.length - 1 ? 1 : i + 2}"
								class="btn btn-circle">❯</a
							>
						</div>
					</div>
				{/each}
			</div>

			<div class="flex w-full justify-center gap-2 py-2">
				{#each competitorProblems as _, i (i)}
					<a href="#slide{i + 1}" class="btn btn-xs">{i + 1}</a>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Hover Gallery Concept -->
	{#if selectedConcept === 'gallery'}
		<div class="space-y-6">
			<div class="text-center">
				<h2 class="text-2xl font-bold">Experience the Difference</h2>
				<p class="mt-2 opacity-70">Hover over each scenario to see the comparison</p>
			</div>

			<div class="grid gap-6 md:grid-cols-3">
				{#each scenarioGallery as scenario}
					<div
						class="group card bg-base-100 shadow-xl transition-all duration-300 hover:shadow-2xl"
					>
						<div class="card-body">
							<h3 class="card-title">{scenario.title}</h3>
							<p class="mb-4 text-sm opacity-70">{scenario.description}</p>

							<div class="space-y-3">
								<div
									class="mockup-browser border bg-base-300 transition-colors group-hover:bg-success group-hover:text-success-content"
								>
									<div class="mockup-browser-toolbar">
										<div class="input">kaiwa.app</div>
									</div>
									<div
										class="flex justify-center bg-base-200 px-4 py-16 group-hover:bg-success-content"
									>
										<div class="text-center">
											<div class="mb-2 text-4xl">✨</div>
											<div class="font-medium">{scenario.kaiwaImg}</div>
										</div>
									</div>
								</div>

								<div
									class="mockup-browser border bg-base-300 transition-colors group-hover:bg-error group-hover:text-error-content"
								>
									<div class="mockup-browser-toolbar">
										<div class="input">other-app.com</div>
									</div>
									<div
										class="flex justify-center bg-base-200 px-4 py-16 group-hover:bg-error-content"
									>
										<div class="text-center">
											<div class="mb-2 text-4xl">😕</div>
											<div class="font-medium">{scenario.othersImg}</div>
										</div>
									</div>
								</div>
							</div>

							<div class="tooltip tooltip-bottom mt-4" data-tip="Click to try this scenario">
								<button class="btn w-full btn-sm btn-primary">Experience This</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Tabs Concept -->
	{#if selectedConcept === 'tabs'}
		<div class="space-y-6">
			<div class="text-center">
				<h2 class="text-2xl font-bold">Find Your Learning Profile</h2>
				<p class="mt-2 opacity-70">See how Kaiwa addresses your specific needs</p>
			</div>

			<div class="tabs-lifted tabs justify-center tabs-lg">
				{#each Object.entries(userTypes) as [key, userType] (key)}
					<input
						type="radio"
						name="user_tabs"
						role="tab"
						class="tab"
						aria-label={userType.title}
						checked={key === 'beginner'}
					/>
					<div role="tabpanel" class="tab-content rounded-box border-base-300 bg-base-100 p-6">
						<h3 class="mb-4 text-xl font-bold">{userType.title}</h3>

						<div class="space-y-4">
							{#each userType.comparisons as comparison}
								<div class="bg-base-50 card border border-base-300">
									<div class="card-body py-4">
										<div class="mb-2 flex items-center justify-between">
											<h4 class="font-medium">{comparison.feature}</h4>
											<div class="rating-sm rating">
												{#each Array(5) as _, i}
													<input
														type="radio"
														class="mask bg-orange-400 mask-star-2"
														checked={i < comparison.rating}
														disabled
													/>
												{/each}
											</div>
										</div>

										<div class="diff aspect-[4/1]">
											<div class="diff-item-1">
												<div
													class="grid place-content-center bg-base-300 p-2 text-sm font-medium text-base-content"
												>
													Others: {comparison.others}
												</div>
											</div>
											<div class="diff-item-2">
												<div
													class="grid place-content-center bg-primary p-2 text-sm font-medium text-primary-content"
												>
													Kaiwa: {comparison.kaiwa}
												</div>
											</div>
											<div class="diff-resizer"></div>
										</div>
									</div>
								</div>
							{/each}
						</div>

						<div class="mt-6 text-center">
							<button class="btn btn-primary">Perfect for {userType.title}s</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
