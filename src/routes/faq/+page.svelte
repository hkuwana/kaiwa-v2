<script lang="ts">
	import { createFaqPageJsonLd } from '$lib/seo/jsonld';

	const faqCategories = [
		{
			title: 'Getting Started',
			faqs: [
				{
					question: 'What is Kaiwa?',
					answer:
						'Kaiwa is an AI-powered conversation practice platform that helps you learn languages through realistic, spoken conversations. Unlike flashcard apps, Kaiwa focuses on building real speaking confidence for the conversations that matter most in your life.'
				},
				{
					question: 'How is Kaiwa different from Duolingo or other apps?',
					answer:
						'While apps like Duolingo are great for vocabulary and grammar basics, Kaiwa focuses specifically on speaking practice. We simulate real conversations you might have with family, at work, or while traveling, helping you move beyond tourist phrases to genuine connection.'
				},
				{
					question: 'What languages are supported?',
					answer:
						'Kaiwa supports 20+ languages including Japanese, Korean, Spanish, French, German, Mandarin Chinese, Portuguese, Italian, and many more. Each language has native-speaker AI voices and culturally appropriate scenarios.'
				},
				{
					question: 'Do I need to know any of the language before starting?',
					answer:
						'Not at all! Kaiwa adapts to your level, from complete beginners (A1) to advanced speakers (C2). Beginners can start with simple greetings and introductions, while advanced learners can practice business negotiations or complex family conversations.'
				}
			]
		},
		{
			title: 'How It Works',
			faqs: [
				{
					question: 'How does the AI conversation work?',
					answer:
						"You speak directly to our AI conversation partner using your microphone. The AI responds naturally, just like a real conversation. You'll get real-time feedback on pronunciation, grammar, and cultural appropriateness."
				},
				{
					question: 'What are scenarios?',
					answer:
						"Scenarios are conversation situations you might encounter in real life. Examples include: meeting your partner's parents, ordering at a restaurant, job interviews, or catching up with grandparents. Each scenario has a specific context and goals to help you practice meaningfully."
				},
				{
					question: 'Can I create my own scenarios?',
					answer:
						'Yes! You can create custom scenarios based on your specific needs. Want to practice a conversation with your Japanese grandmother about cooking? Or prepare for a business meeting in German? You can create scenarios tailored to your life.'
				},
				{
					question: 'What kind of feedback do I get?',
					answer:
						'After each conversation, you receive detailed feedback including: pronunciation tips, grammar corrections with explanations, cultural insights, suggested alternative phrases, and overall fluency assessment.'
				}
			]
		},
		{
			title: 'Billing & Subscription',
			faqs: [
				{
					question: 'Is there a free trial?',
					answer:
						'Yes! All new users get 15 minutes of free conversation practice. This gives you a chance to experience Kaiwa before committing to a subscription.'
				},
				{
					question: 'Can I cancel anytime?',
					answer:
						'Yes, you can cancel your subscription at any time. Your benefits will continue until the end of your billing period. You can manage your subscription through your account settings.'
				},
				{
					question: 'What happens to my rollover minutes if I cancel?',
					answer:
						'Rollover minutes are a benefit of an active subscription. If you cancel, your accumulated rollover minutes will expire at the end of your final billing period.'
				},
				{
					question: 'Can I upgrade or downgrade my plan?',
					answer:
						'Absolutely! You can change your plan at any time from your account settings. The new plan will be prorated and take effect immediately.'
				},
				{
					question: 'What if I have subscription or billing issues?',
					answer:
						'If you experience any problems with your subscription or billing, please email us at hiro@trykaiwa.com and we will help you resolve it as quickly as possible.'
				}
			]
		},
		{
			title: 'Technical',
			faqs: [
				{
					question: 'What devices can I use Kaiwa on?',
					answer:
						'Kaiwa works on any device with a modern web browser and microphone. This includes desktop computers, laptops, tablets, and smartphones. For the best experience, we recommend using headphones to prevent audio feedback.'
				},
				{
					question: 'Do I need headphones?',
					answer:
						"We recommend headphones or earbuds, especially when using Conversation Mode (hands-free). Without headphones, the AI's voice might be picked up by your microphone, creating an echo. Push-to-Talk mode works fine without headphones."
				},
				{
					question: 'Is my conversation data private?',
					answer:
						'Yes, your privacy is important to us. Conversations are processed securely and we do not share your personal data with third parties. See our Privacy Policy for full details.'
				}
			]
		}
	];

	let expandedFaq = $state<string | null>(null);

	function toggleFaq(id: string) {
		expandedFaq = expandedFaq === id ? null : id;
	}

	// Flatten all FAQs for JSON-LD schema
	const allFaqs = faqCategories.flatMap((cat) => cat.faqs);
	const faqJsonLd = createFaqPageJsonLd(allFaqs, 'https://trykaiwa.com');
</script>

<svelte:head>
	<title>FAQ | Kaiwa - AI Language Learning</title>
	<meta
		name="description"
		content="Frequently asked questions about Kaiwa, the AI-powered conversation practice platform for language learning. Learn about features, pricing, and how to get started."
	/>
	<meta
		name="keywords"
		content="Kaiwa FAQ, language learning questions, AI conversation practice, language app help"
	/>
	<link rel="canonical" href="https://trykaiwa.com/faq" />

	<!-- FAQ Schema for rich results in Google/Bing -->
	<script type="application/ld+json">
		{@html JSON.stringify(faqJsonLd)}
	</script>
</svelte:head>

<div class="container mx-auto max-w-4xl px-4 py-16 sm:py-20">
	<div class="mb-12 text-center">
		<h1 class="mb-4 text-4xl font-bold tracking-tight lg:text-5xl">Frequently Asked Questions</h1>
		<p class="mx-auto max-w-2xl text-lg text-base-content/70">
			Everything you need to know about practicing conversations with Kaiwa
		</p>
	</div>

	<div class="space-y-12">
		{#each faqCategories as category, categoryIndex (category.title)}
			<div>
				<h2 class="mb-6 text-2xl font-semibold">{category.title}</h2>
				<div class="space-y-3">
					{#each category.faqs as faq, faqIndex (faq.question)}
						{@const faqId = `${categoryIndex}-${faqIndex}`}
						<div class="collapse-plus collapse bg-base-200">
							<input
								type="checkbox"
								checked={expandedFaq === faqId}
								onchange={() => toggleFaq(faqId)}
							/>
							<div class="collapse-title text-lg font-medium">{faq.question}</div>
							<div class="collapse-content">
								<p class="pt-2 text-base-content/80">{faq.answer}</p>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>

	<div class="mt-16 rounded-2xl bg-base-200 p-8 text-center">
		<h3 class="mb-4 text-xl font-semibold">Still have questions?</h3>
		<p class="mb-6 text-base-content/70">
			We are happy to help! Reach out and we will get back to you as soon as possible.
		</p>
		<a href="mailto:hiro@trykaiwa.com" class="btn btn-primary">
			<span class="icon-[mdi--email-outline] h-5 w-5"></span>
			Contact Us
		</a>
	</div>
</div>
