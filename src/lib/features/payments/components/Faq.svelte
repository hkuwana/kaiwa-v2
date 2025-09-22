<script lang="ts">
	const faqs = [
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
		}
	];
	let expandedFaq = $state(-1);
</script>

<div class="mx-auto mt-24 max-w-5xl">
	<h2 class="mb-10 text-center text-3xl font-bold">Common Questions</h2>
	<div class="mx-auto max-w-3xl space-y-4">
		{#each faqs as faq, index (faq.question)}
			<div class="collapse-plus collapse bg-base-200">
				<input
					type="radio"
					name="faq-accordion"
					checked={expandedFaq === index}
					onchange={() => (expandedFaq = expandedFaq === index ? -1 : index)}
				/>
				<div class="collapse-title text-xl font-medium">{faq.question}</div>
				<div class="collapse-content">
					<p class="pt-2 text-base-content/90">{faq.answer}</p>
				</div>
			</div>
		{/each}
	</div>
</div>
