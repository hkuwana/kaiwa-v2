<script lang="ts">
	import { onMount } from 'svelte';

	let currentTestimonial = $state(0);
	const testimonials = [
		{
			name: 'David T.',
			text: 'Being able to practice realistic conversations has helped me gain confidence in speaking Japanese. The feedback is so helpful!',
			language: 'Japanese'
		},
		{
			name: 'Scott H.',
			text: 'Kaiwa is like WD-40 for being rusty at a language.',
			language: 'Spanish'
		},
		{
			name: 'Miguel L.',
			text: "I love how Kaiwa adapts to my skill level. It's like having a patient tutor available whenever I have time to practice.",
			language: 'French'
		}
	];

	onMount(() => {
		const interval = setInterval(() => {
			currentTestimonial = (currentTestimonial + 1) % testimonials.length;
		}, 5000);
		return () => clearInterval(interval);
	});
</script>

<div class="mx-auto mt-24 max-w-5xl">
	<h2 class="mb-12 text-center text-3xl font-bold">What Our Users Say</h2>

	<div class="relative mb-12 h-48">
		{#each testimonials as testimonial, i (testimonial.name)}
			<div
				class="absolute top-0 left-0 w-full px-4 transition-opacity duration-500 ease-in-out"
				style="opacity: {i === currentTestimonial ? '1' : '0'};"
			>
				<div class="mx-auto flex max-w-2xl flex-col items-center text-center">
					<p class="mb-4 text-xl italic">"{testimonial.text}"</p>
					<div>
						<p class="font-bold">{testimonial.name}</p>
						<p class="text-sm text-base-content/70">
							Learning {testimonial.language}
						</p>
					</div>
				</div>
			</div>
		{/each}
	</div>
	<div class="mb-20 flex justify-center gap-2">
		{#each testimonials as _, i (_)}
			<button
				aria-label={`Testimonial ${i + 1}`}
				onclick={() => (currentTestimonial = i)}
				class="h-2.5 w-2.5 rounded-full transition-colors duration-300
           {i === currentTestimonial
					? 'bg-primary'
					: 'bg-base-content/20 hover:bg-base-content/40'}"
			>
			</button>
		{/each}
	</div>
</div>
