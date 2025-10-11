<script lang="ts">
	import { onMount } from 'svelte';
	import { speakersData } from '$lib/data/speakers';
	import { aboutPagePrompts, characterPrompts, scenarioPrompts } from '$lib/prompts/dev-animated';

	onMount(() => {
		document.title = 'Animation Prompts - Kaiwa Dev';
	});

	// Image generation state
	let isGenerating = $state(false);
	let generationResults = $state<
		Array<{
			speaker: any;
			imageUrl: string;
			error?: string;
			generating?: boolean;
		}>
	>([]);

	// Selected model
	let selectedModel = $state<'dall-e-3' | 'gpt-image-1'>('dall-e-3');

	// Generate image for a specific speaker
	async function generateSpeakerImage(
		speaker: any,
		model: 'dall-e-3' | 'gpt-image-1' = selectedModel
	) {
		const prompt = generateSpeakerPrompt(speaker);

		// Add to results with generating state
		const resultIndex = generationResults.length;
		generationResults.push({
			speaker,
			imageUrl: '',
			generating: true
		});

		try {
			const response = await fetch('/dev/animated/generate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					speakerId: speaker.id,
					prompt,
					model
				})
			});

			const result = await response.json();

			if (result.success) {
				generationResults[resultIndex] = {
					speaker,
					imageUrl: result.imageUrl,
					generating: false
				};
			} else {
				generationResults[resultIndex] = {
					speaker,
					imageUrl: '',
					error: result.error,
					generating: false
				};
			}
		} catch {
			generationResults[resultIndex] = {
				speaker,
				imageUrl: '',
				error: 'Network error',
				generating: false
			};
		}
	}

	// Generate all Japanese speakers
	async function generateJapaneseSpeakers() {
		const japaneseSpeakers = speakersData.filter((s) => s.languageId === 'ja');
		isGenerating = true;

		for (const speaker of japaneseSpeakers) {
			await generateSpeakerImage(speaker);
			// Add delay between requests
			await new Promise((resolve) => setTimeout(resolve, 2000));
		}

		isGenerating = false;
	}

	// Clear results
	function clearResults() {
		generationResults = [];
	}

	// Generate character prompt for each speaker
	function generateSpeakerPrompt(speaker: any): string {
		const genderDescriptor = speaker.gender === 'male' ? 'man' : 'woman';

		let culturalElements = '';
		let personalityTraits = '';

		// Add subtle cultural context without stereotypes
		switch (speaker.languageId) {
			case 'ja':
				culturalElements =
					'subtle Japanese aesthetic in their clothing choice, reflecting a clean and thoughtful presentation';
				personalityTraits = 'a gentle, attentive, and quietly confident personality';
				break;
			case 'es':
				culturalElements =
					speaker.region === 'Spain'
						? 'a European Spanish style with warm, Mediterranean colors'
						: 'a style that reflects Latin American warmth in their expression';
				personalityTraits = 'an expressive, warm-hearted, and naturally welcoming personality';
				break;
			case 'zh':
				culturalElements =
					speaker.region === 'Taiwan'
						? 'a modern Taiwanese casual style'
						: 'a contemporary Chinese aesthetic';
				personalityTraits = 'a thoughtful, patient, and encouraging demeanor';
				break;
			case 'fr':
				culturalElements = 'a classic French style that is simple and elegant';
				personalityTraits = 'a sophisticated yet approachable and naturally expressive personality';
				break;
			case 'ko':
				culturalElements = 'a modern Korean fashion sense with a clean, contemporary style';
				personalityTraits = 'a friendly, considerate, and quietly supportive personality';
				break;
			case 'de':
				culturalElements = 'a German practicality in their style, with understated elegance';
				personalityTraits = 'a direct but kind and genuinely helpful personality';
				break;
			case 'pt':
				culturalElements =
					speaker.region === 'Brazil'
						? 'a style with Brazilian warmth and vibrancy'
						: 'a classic Portuguese style';
				personalityTraits = 'a naturally joyful, inclusive, and life-loving personality';
				break;
			case 'it':
				culturalElements = 'an Italian sense of style and natural elegance';
				personalityTraits = 'a passionate, expressive, and naturally charming personality';
				break;
			default:
				culturalElements = 'an international modern style';
				personalityTraits = 'a warm, approachable, and genuinely interested personality';
		}

		const prompt = `
			A heartwarming and gentle character portrait in the nostalgic, hand-drawn animation style of Studio Ghibli, reminiscent of films like "Whisper of the Heart" or "Kiki's Delivery Service".

			**Subject:** A young ${genderDescriptor} named ${speaker.voiceName}. The character has ${personalityTraits} and wears clothing with ${culturalElements}.

			**Composition:** Close-up headshot from the shoulders up, with the character facing forward and looking directly at the camera.

			**Action:** A warm, gentle expression with kind eyes that show readiness to help. The mouth is slightly open, as if in the middle of a friendly conversation.

			**Location:** A simple, clean, neutral background that keeps the focus entirely on the character.

			**Editing Instructions:** Portrait orientation. The lighting should be soft and natural. The art should have clean line art, subtle watercolor-like shading, and highly expressive facial features. Ensure authentic and respectful cultural representation. IMPORTANT: Only one person in the image.
		`;
		return prompt.trim();
	}

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
	}
</script>

<svelte:head>
	<title>Animation Prompts - Kaiwa Dev</title>
</svelte:head>

<div class="min-h-screen bg-base-100 p-8">
	<div class="container mx-auto max-w-6xl">
		<div class="mb-8">
			<h1 class="mb-4 text-4xl font-bold">Kaiwa Animation Prompts</h1>
			<p class="text-lg opacity-75">
				Studio Ghibli-style prompts optimized for DALL-E, Midjourney, or Stable Diffusion. Click any
				prompt to copy to clipboard.
			</p>
		</div>

		<!-- Live Image Generation -->
		<section class="mb-12">
			<h2 class="mb-6 text-3xl font-bold text-success">🤖 Live Image Generation</h2>
			<div class="mb-6 alert alert-info">
				<div>
					<p>
						<strong>Test OpenAI Image Generation</strong> - Generate character images directly using
						your API credits.
					</p>
				</div>
			</div>

			<!-- Model Selector -->
			<div class="card mb-6 border border-info/20 bg-base-200 p-4">
				<h3 class="mb-3 font-bold">🤖 Model Selection</h3>
				<div class="form-control">
					<label class="label cursor-pointer">
						<span class="label-text">
							<strong>DALL-E 3</strong> - Stable, widely available ($0.08 per HD image)
						</span>
						<input
							type="radio"
							name="model"
							class="radio checked:bg-blue-500"
							bind:group={selectedModel}
							value="dall-e-3"
						/>
					</label>
				</div>
				<div class="form-control">
					<label class="label cursor-pointer">
						<span class="label-text">
							<strong>GPT-Image-1</strong> - Better instruction following, may solve multiple character
							issue (Preview, variable cost)
						</span>
						<input
							type="radio"
							name="model"
							class="radio checked:bg-green-500"
							bind:group={selectedModel}
							value="gpt-image-1"
						/>
					</label>
				</div>
				<div class="mt-2 text-sm opacity-70">
					Current selection: <strong>{selectedModel}</strong>
				</div>
			</div>

			<div class="mb-6 flex flex-wrap gap-4">
				<button
					class="btn btn-success"
					disabled={isGenerating}
					onclick={() => generateSpeakerImage(speakersData.find((s) => s.id === 'ja-jp-male'))}
				>
					Generate Hiro 🇯🇵 (Male)
				</button>
				<button
					class="btn btn-success"
					disabled={isGenerating}
					onclick={() => generateSpeakerImage(speakersData.find((s) => s.id === 'ja-jp-female'))}
				>
					Generate Yuki 🇯🇵 (Female)
				</button>
				<button
					class="btn btn-success"
					class:loading={isGenerating}
					disabled={isGenerating}
					onclick={generateJapaneseSpeakers}
				>
					{isGenerating ? 'Generating...' : 'Generate All 3 Japanese Speakers'}
				</button>
				<button class="btn btn-outline" onclick={clearResults} disabled={isGenerating}>
					Clear Results
				</button>
			</div>

			{#if generationResults.length > 0}
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each generationResults as result (result.speaker.speakerEmoji + result.speaker.speakerName)}
						<div class="card border border-success/20 bg-base-200 shadow-xl">
							<div class="card-body">
								<h3 class="card-title text-lg">
									{result.speaker.speakerEmoji}
									{result.speaker.voiceName}
									<div class="badge badge-sm">{result.speaker.region}</div>
								</h3>
								<p class="text-sm opacity-75">
									{result.speaker.dialectName} • {result.speaker.gender}
								</p>

								{#if result.generating}
									<div class="flex items-center justify-center py-8">
										<span class="loading loading-lg loading-spinner"></span>
									</div>
								{:else if result.error}
									<div class="alert alert-error">
										<p class="text-sm">❌ {result.error}</p>
									</div>
								{:else if result.imageUrl}
									<div class="mt-4">
										<img
											src={result.imageUrl}
											alt={`Generated character for ${result.speaker.voiceName}`}
											class="w-full rounded-lg"
											loading="lazy"
										/>
										<div class="mt-2 flex gap-2">
											<button
												class="btn btn-xs btn-primary"
												onclick={() => window.open(result.imageUrl, '_blank')}
											>
												Open Full Size
											</button>
											<button
												class="btn btn-outline btn-xs"
												onclick={() => copyToClipboard(result.imageUrl)}
											>
												Copy URL
											</button>
										</div>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<!-- About Page Illustrations -->
		<section class="mb-12">
			<h2 class="mb-6 text-3xl font-bold text-primary">About Page Illustrations</h2>
			<div class="grid gap-6 md:grid-cols-2">
				{#each aboutPagePrompts as item (item.title)}
					<div class="card border border-primary/20 bg-base-200 shadow-xl">
						<div class="card-body">
							<h3 class="card-title text-lg">{item.title}</h3>
							<p class="text-sm opacity-75">{item.description}</p>
							<div class="mt-4">
								<textarea
									class="textarea-bordered textarea h-48 w-full text-sm"
									readonly
									value={item.prompt}
								></textarea>
								<button
									class="btn mt-2 btn-sm btn-primary"
									onclick={() => copyToClipboard(item.prompt)}
								>
									Copy Prompt
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Character Designs -->
		<section class="mb-12">
			<h2 class="mb-6 text-3xl font-bold text-secondary">Character Designs</h2>
			<div class="grid gap-6 md:grid-cols-2">
				{#each characterPrompts as item (item.title)}
					<div class="card border border-secondary/20 bg-base-200 shadow-xl">
						<div class="card-body">
							<h3 class="card-title text-lg">{item.title}</h3>
							<p class="text-sm opacity-75">{item.description}</p>
							<div class="mt-4">
								<textarea
									class="textarea-bordered textarea h-48 w-full text-sm"
									readonly
									value={item.prompt}
								></textarea>
								<button
									class="btn mt-2 btn-sm btn-secondary"
									onclick={() => copyToClipboard(item.prompt)}
								>
									Copy Prompt
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Speaker Characters -->
		<section class="mb-12">
			<h2 class="mb-6 text-3xl font-bold text-info">
				Speaker Characters ({speakersData.length} total)
			</h2>
			<div class="mb-4 alert alert-info">
				<div>
					<p>
						<strong>Auto-generated prompts</strong> for each speaker in your database. Each prompt includes
						their name, cultural context, and personality traits while avoiding stereotypes.
					</p>
				</div>
			</div>
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each speakersData as speaker (speaker.id)}
					<div class="card border border-info/20 bg-base-200 shadow-xl">
						<div class="card-body p-4">
							<h3 class="card-title text-base">
								{speaker.speakerEmoji}
								{speaker.voiceName}
								<div class="badge badge-sm">{speaker.region}</div>
							</h3>
							<p class="text-xs opacity-75">{speaker.dialectName} • {speaker.gender}</p>
							<div class="mt-3">
								<textarea
									class="textarea-bordered textarea h-48 w-full text-xs"
									readonly
									value={generateSpeakerPrompt(speaker)}
								></textarea>
								<button
									class="btn mt-2 btn-xs btn-info"
									onclick={() => copyToClipboard(generateSpeakerPrompt(speaker))}
								>
									Copy Prompt
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Scenario Backgrounds -->
		<section class="mb-12">
			<h2 class="mb-6 text-3xl font-bold text-accent">Scenario Backgrounds</h2>
			<div class="grid gap-6 md:grid-cols-2">
				{#each scenarioPrompts as item (item.title)}
					<div class="card border border-accent/20 bg-base-200 shadow-xl">
						<div class="card-body">
							<h3 class="card-title text-lg">{item.title}</h3>
							<p class="text-sm opacity-75">{item.description}</p>
							<div class="mt-4">
								<textarea
									class="textarea-bordered textarea h-48 w-full text-sm"
									readonly
									value={item.prompt}
								></textarea>
								<button
									class="btn mt-2 btn-sm btn-accent"
									onclick={() => copyToClipboard(item.prompt)}
								>
									Copy Prompt
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Automation Options -->
		<section class="mb-12">
			<h2 class="mb-6 text-3xl font-bold text-warning">Automation Options</h2>
			<div class="grid gap-6 md:grid-cols-2">
				<div class="card border border-warning/20 bg-base-200 shadow-xl">
					<div class="card-body">
						<h3 class="card-title text-lg">🤖 OpenAI DALL-E API</h3>
						<p class="mb-4 text-sm opacity-75">Most reliable for Ghibli-style consistency</p>
						<div class="space-y-2 text-sm">
							<p><strong>Endpoint:</strong> https://api.openai.com/v1/images/generations</p>
							<p><strong>Model:</strong> dall-e-3</p>
							<p><strong>Size:</strong> 1024x1024 (square) or 1792x1024 (landscape)</p>
							<p><strong>Cost:</strong> ~$0.04 per image</p>
							<p><strong>Batch Size:</strong> 1 image per request</p>
						</div>
						<div class="mt-4">
							<button
								class="btn btn-sm btn-warning"
								onclick={() =>
									copyToClipboard(`
// OpenAI DALL-E API automation example
async function generateSpeakerImages() {
  const speakers = speakersData;
  
  for (const speaker of speakers) {
    const prompt = generateSpeakerPrompt(speaker);
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_OPENAI_API_KEY',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        style: 'natural'
      }),
    });
    
    const data = await response.json();
    const imageUrl = data.data[0].url;
    
    // Save image with filename: speaker-[speaker.id].png
	    console.log("Generated image for \${speaker.voiceName}: \${imageUrl}\\n");
    
    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}`)}
							>
								Copy API Code
							</button>
						</div>
					</div>
				</div>

				<div class="card border border-warning/20 bg-base-200 shadow-xl">
					<div class="card-body">
						<h3 class="card-title text-lg">🎨 Stable Diffusion Local</h3>
						<p class="mb-4 text-sm opacity-75">Free but requires local setup</p>
						<div class="space-y-2 text-sm">
							<p><strong>Setup:</strong> Automatic1111 WebUI or ComfyUI</p>
							<p><strong>Model:</strong> Dreamshaper XL or similar anime model</p>
							<p><strong>Cost:</strong> Free (uses your GPU)</p>
							<p><strong>Batch Size:</strong> Limited by VRAM</p>
							<p><strong>Speed:</strong> ~30-60 seconds per image</p>
						</div>
						<div class="mt-4">
							<button
								class="btn btn-sm btn-warning"
								onclick={() =>
									copyToClipboard(`
# Stable Diffusion automation script (Python)
import requests
import json
import time

def generate_speaker_images():
    speakers = speakersData  # Load your speakers data
    
    for speaker in speakers:
        prompt = generateSpeakerPrompt(speaker)
        enhanced_prompt = f"{prompt}, high quality, detailed, masterpiece, best quality"
        
        payload = {
            "prompt": enhanced_prompt,
            "negative_prompt": "low quality, blurry, distorted, ugly, bad anatomy",
            "steps": 30,
            "sampler_name": "DPM++ 2M Karras",
            "cfg_scale": 7,
            "width": 512,
            "height": 512,
            "batch_size": 1
        }
        
        response = requests.post(
            "http://127.0.0.1:7860/sdapi/v1/txt2img",
            json=payload
        )
        
        if response.status_code == 200:
            result = response.json()
            # Save image as speaker-[speaker_id].png
            print(f"Generated image for {speaker['voiceName']}")
        
        time.sleep(2)  # Avoid overloading
`)}
							>
								Copy Python Script
							</button>
						</div>
					</div>
				</div>

				<div class="card border border-warning/20 bg-base-200 shadow-xl">
					<div class="card-body">
						<h3 class="card-title text-lg">⚡ Batch Processing Tips</h3>
						<ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
							<li>
								<strong>Start Small:</strong> Generate 5-10 characters first to test consistency
							</li>
							<li><strong>Use Seeds:</strong> For character consistency across variations</li>
							<li>
								<strong>Naming Convention:</strong> speaker-[speaker-id].png or character-[speaker-name].png
							</li>
							<li><strong>Quality Check:</strong> Review each image for cultural sensitivity</li>
							<li><strong>Backup Originals:</strong> Keep high-res versions before resizing</li>
						</ul>
					</div>
				</div>

				<div class="card border border-warning/20 bg-base-200 shadow-xl">
					<div class="card-body">
						<h3 class="card-title text-lg">🔧 Recommended Workflow</h3>
						<div class="space-y-2 text-sm">
							<p><strong>1.</strong> Test with 3-5 characters manually first</p>
							<p><strong>2.</strong> Refine prompts based on results</p>
							<p><strong>3.</strong> Run automated batch generation</p>
							<p><strong>4.</strong> Post-process: resize, optimize, rename</p>
							<p><strong>5.</strong> Update database with image paths</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Generation Tips -->
		<section class="mb-12">
			<div class="alert alert-success">
				<div>
					<h3 class="font-bold">Generation Tips & Best Practices:</h3>
					<ul class="mt-2 list-disc space-y-1 pl-5">
						<li>
							<strong>DALL-E 3:</strong> Most consistent for Ghibli style, works with prompts as-is
						</li>
						<li><strong>Midjourney:</strong> Add "--ar 1:1 --style raw" for character sheets</li>
						<li><strong>Stable Diffusion:</strong> Use anime/manga models like Dreamshaper XL</li>
						<li>
							<strong>Consistency:</strong> Use the same seed/style reference across characters
						</li>
						<li>
							<strong>Cultural Sensitivity:</strong> Always review generated images for respectful representation
						</li>
						<li>
							<strong>Backup Strategy:</strong> Keep original high-res versions before any processing
						</li>
					</ul>
				</div>
			</div>
		</section>
	</div>
</div>
