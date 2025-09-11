<script lang="ts">
	import { onMount } from 'svelte';
	import { speakersData } from '$lib/data/speakers';

	onMount(() => {
		document.title = 'Animation Prompts - Kaiwa Dev';
	});

	// Image generation state
	let isGenerating = $state(false);
	let generationResults = $state<Array<{
		speaker: any;
		imageUrl: string;
		error?: string;
		generating?: boolean;
	}>>([]);

	// Selected model
	let selectedModel = $state<'dall-e-3' | 'gpt-image-1'>('dall-e-3');

	// Generate image for a specific speaker
	async function generateSpeakerImage(speaker: any, model: 'dall-e-3' | 'gpt-image-1' = selectedModel) {
		const prompt = generateSpeakerPrompt(speaker);
		
		// Add to results with generating state
		const resultIndex = generationResults.length;
		generationResults.push({
			speaker,
			imageUrl: '',
			generating: true
		});

		try {
			const response = await fetch('/dev-animated/generate', {
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
		} catch (error) {
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
		const japaneseSpeakers = speakersData.filter(s => s.languageId === 'ja');
		isGenerating = true;

		for (const speaker of japaneseSpeakers) {
			await generateSpeakerImage(speaker);
			// Add delay between requests
			await new Promise(resolve => setTimeout(resolve, 2000));
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
		const ageRange = speaker.gender === 'male' ? 'young to middle-aged' : 'young to middle-aged';
		
		let culturalElements = '';
		let personalityTraits = '';
		
		// Add subtle cultural context without stereotypes
		switch (speaker.languageId) {
			case 'ja':
				culturalElements = 'subtle Japanese aesthetic in clothing choice, clean and thoughtful presentation';
				personalityTraits = 'gentle, attentive, with quiet confidence';
				break;
			case 'es':
				culturalElements = speaker.region === 'Spain' ? 'European Spanish style, warm Mediterranean colors' : 'Latin American warmth in expression';
				personalityTraits = 'expressive, warm-hearted, naturally welcoming';
				break;
			case 'zh':
				culturalElements = speaker.region === 'Taiwan' ? 'modern Taiwanese casual style' : 'contemporary Chinese aesthetic';
				personalityTraits = 'thoughtful, patient, encouraging demeanor';
				break;
			case 'fr':
				culturalElements = 'classic French style, elegant simplicity';
				personalityTraits = 'sophisticated yet approachable, naturally expressive';
				break;
			case 'ko':
				culturalElements = 'modern Korean fashion sense, clean contemporary style';
				personalityTraits = 'friendly, considerate, quietly supportive';
				break;
			case 'de':
				culturalElements = 'German practicality in style, understated elegance';
				personalityTraits = 'direct but kind, genuinely helpful';
				break;
			case 'pt':
				culturalElements = speaker.region === 'Brazil' ? 'Brazilian warmth and vibrancy' : 'Portuguese classic style';
				personalityTraits = 'naturally joyful, inclusive, life-loving';
				break;
			case 'it':
				culturalElements = 'Italian sense of style, natural elegance';
				personalityTraits = 'passionate, expressive, naturally charming';
				break;
			default:
				culturalElements = 'international modern style';
				personalityTraits = 'warm, approachable, genuinely interested in helping';
		}

		return `IMPORTANT: Only one person in image. Single Japanese anime character portrait, close-up headshot from shoulders up, looking directly at camera. One individual ${ageRange} ${genderDescriptor} named ${speaker.voiceName} with ${personalityTraits}. ${culturalElements}. Direct eye contact with viewer, mouth slightly open as if speaking or about to speak, warm gentle expression with kind eyes that show readiness to help with language learning and conversation practice. Soft anime art style with clean line art, subtle shading, and expressive features. High-quality Japanese animation style similar to modern anime films. Portrait orientation, simple neutral background, focus on single person's facial features and direct gaze. Clean, polished anime aesthetic with authentic cultural representation. Professional character design, exactly one person only, headshot composition, facing forward, no other people visible.`;
	}

	const aboutPagePrompts = [
		{
			title: 'Hero Section - Language Doors',
			description: 'Main visual for "Languages open doors to experiences"',
			prompt: `Studio Ghibli style illustration, warm and inviting scene. A person standing before multiple ornate doors floating in a dreamlike space, each door glowing with warm light and showing glimpses of different cultural scenes behind them (Japanese garden, Spanish plaza, Chinese courtyard). Soft watercolor style, golden hour lighting, sense of wonder and possibility. No text overlays. Aspect ratio 16:9.`
		},
		{
			title: 'The Problem - Struggling Alone',
			description: 'Someone frustrated with traditional language learning',
			prompt: `Studio Ghibli style illustration. A young person sitting alone at a desk surrounded by language textbooks, phone with language app open, looking overwhelmed and discouraged. Room feels cold and isolated. Muted colors, soft shadows, conveying loneliness and frustration. Books are scattered, one hand on forehead in a gesture of defeat. Style reminiscent of Spirited Away's quieter moments. Aspect ratio 4:3.`
		},
		{
			title: 'Taiwan Breakthrough - Mahjong Scene',
			description: 'The moment everything clicked in Taiwan',
			prompt: `Studio Ghibli style illustration, warm and joyful. A cozy scene around a mahjong table with a young foreign student laughing and playing with a Taiwanese host family. Soft evening lighting through windows, traditional tiles on table, everyone engaged and smiling. Warm yellows and oranges, conveying breakthrough moment and human connection. Style like Spirited Away or My Neighbor Totoro's family scenes. Aspect ratio 16:9.`
		},
		{
			title: 'Cultural Connections - Izakaya',
			description: 'Connecting hearts in an izakaya',
			prompt: `Studio Ghibli style illustration. Intimate izakaya scene with warm lantern lighting, people of different backgrounds sharing stories over drinks and small plates. Focus on expressions of genuine connection and laughter. Rich warm colors - amber lights, wooden textures, traditional Japanese elements. Conveys the magic of cross-cultural friendship. Style reminiscent of Spirited Away's bathhouse warmth. Aspect ratio 21:9.`
		},
		{
			title: 'Cultural Connections - Spanish Tapas',
			description: 'Heart-to-heart in Granada tapas bar',
			prompt: `Studio Ghibli style illustration. Vibrant Spanish tapas bar scene with people sharing animated conversation over small plates and wine. Warm Mediterranean colors - terracotta, deep reds, golden yellows. Stone walls, hanging ham, bustling but intimate atmosphere. Focus on genuine human connection across cultures. Evening light filtering through small windows. Aspect ratio 21:9.`
		},
		{
			title: 'Family Connection',
			description: 'Connecting with in-laws in native tongue',
			prompt: `Studio Ghibli style illustration. Multi-generational family gathering around a dinner table, with special focus on meaningful eye contact between family members. Warm home lighting, traditional cultural elements subtly in background. Expressions show understanding and acceptance. Soft, warm color palette conveying love and belonging. Style like Castle in the Sky's family moments. Aspect ratio 16:9.`
		},
		{
			title: 'The Vision - Experiences Map',
			description: 'Languages creating life experiences',
			prompt: `Studio Ghibli style illustration, magical realism. An artistic map showing different cultural experiences connected by flowing ribbons of light - conversations in cafes, family dinners, street markets, festivals. Each scene glows warmly, connected by ethereal paths. Watercolor style with golden accents. Conveys the journey of language opening doors to experiences. Dreamlike quality. Aspect ratio 16:9.`
		}
	];

	const characterPrompts = [
		{
			title: 'Language Learner - Confident',
			description: 'Main character archetype - someone who has found their voice',
			prompt: `IMPORTANT: Only one person in image. Single Japanese anime character portrait, close-up headshot from shoulders up, looking directly at camera. One individual young adult with warm, confident expression, direct eye contact with viewer, mouth slightly open as if speaking, eyes showing determination and joy. Soft anime features with genuine smile that conveys both humility and excitement about learning. High-quality Japanese animation style with clean line art and expressive eyes. Simple neutral background, focus on single person's facial expression and direct gaze. Professional anime character design, exactly one person only, portrait composition, facing forward, no other people visible.`
		},
		{
			title: 'Language Learner - Nervous Beginner',
			description: 'Someone just starting their journey',
			prompt: `IMPORTANT: Only one person in image. Single Japanese anime character portrait, close-up headshot from shoulders up, looking directly at camera. One individual person with slightly nervous but hopeful expression, direct eye contact with viewer, mouth slightly open as if about to speak, conveying vulnerability and courage simultaneously. Soft, approachable anime features with expressive eyes. Modern Japanese animation style with clean aesthetic. Neutral background, exactly one person only, showing the beginning of a learning journey through facial expression. Professional anime portrait design, facing forward, no other people visible.`
		},
		{
			title: 'Native Speaker - Welcoming',
			description: 'The people who help learners feel at home',
			prompt: `IMPORTANT: Only one person in image. Single Japanese anime character portrait, close-up headshot from shoulders up, looking directly at camera. One individual warm, welcoming person with kind eyes and genuine smile, direct eye contact with viewer, mouth slightly open as if speaking encouragingly. Subtle cultural elements in appearance (not stereotypical). Conveys patience, wisdom, and joy in sharing culture through facial expression. High-quality anime art style with soft shading and expressive features. Simple background, exactly one person only, focus on welcoming personality. Professional anime character portrait, facing forward, no other people visible.`
		},
		{
			title: 'Host Family Member',
			description: 'The Taiwan host family archetype',
			prompt: `IMPORTANT: Only one person in image. Single Japanese anime character portrait, close-up headshot from shoulders up, looking directly at camera. One individual middle-aged person with warm, nurturing expression, direct eye contact with viewer, mouth slightly open as if offering gentle guidance, showing life experience and wisdom. Eyes convey patience and genuine care for helping others. Modern anime art style with detailed facial features and gentle expression. Traditional but contemporary appearance. Neutral background, exactly one person only, professional anime portrait composition, facing forward, no other people visible.`
		},
		{
			title: 'Fellow Language Explorer',
			description: 'Someone also on the journey',
			prompt: `IMPORTANT: Only one person in image. Single Japanese anime character portrait, close-up headshot from shoulders up, looking directly at camera. One individual person with excited, curious expression, direct eye contact with viewer, mouth slightly open as if eagerly sharing discoveries, showing enthusiasm for discovery and connection. Bright, optimistic anime features with sparkling eyes showing love of exploration. High-quality Japanese animation style with expressive face and gentle shading. Simple background, exactly one person only, focus on adventurous personality through facial expression, facing forward, no other people visible.`
		}
	];

	const scenarioPrompts = [
		{
			title: 'Coffee Shop Discovery',
			description: 'First real conversation in a foreign country',
			prompt: `Studio Ghibli style background illustration. Cozy international coffee shop with warm lighting, steam rising from cups, comfortable seating areas. Mix of local cultural elements and universal cafe atmosphere. Golden hour lighting through large windows. Style like Whisper of the Heart's antique shop - inviting and full of stories. Aspect ratio 21:9.`
		},
		{
			title: 'Family Kitchen',
			description: 'Cooking and connecting with host family',
			prompt: `Studio Ghibli style kitchen scene. Traditional kitchen with modern touches, ingredients and cooking tools visible, warm lighting suggesting evening meal preparation. Steam and aromatic elements. Style like Spirited Away's kitchen scenes or Castle in the Sky's cozy domestic moments. Rich, warm colors. Aspect ratio 16:9.`
		},
		{
			title: 'Local Festival',
			description: 'Being invited into cultural celebration',
			prompt: `Studio Ghibli style festival scene. Vibrant local celebration with lanterns, traditional decorations, people in festive clothing. Warm evening light, sense of community and joy. Cultural elements that feel authentic but not stereotypical. Style like Spirited Away's festival scenes. Rich, celebratory colors. Aspect ratio 21:9.`
		},
		{
			title: 'Neighborhood Market',
			description: 'Daily life conversations with vendors',
			prompt: `Studio Ghibli style market scene. Bustling but friendly local market with fresh produce, friendly vendors, morning light. Conveys daily life authenticity and community warmth. Style like Castle in the Sky's marketplace scenes. Earthy, natural colors with warm accent lighting. Aspect ratio 16:9.`
		}
	];

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
				Studio Ghibli-style prompts optimized for DALL-E, Midjourney, or Stable Diffusion.
				Click any prompt to copy to clipboard.
			</p>
		</div>

		<!-- Live Image Generation -->
		<section class="mb-12">
			<h2 class="mb-6 text-3xl font-bold text-success">🤖 Live Image Generation</h2>
			<div class="mb-6 alert alert-info">
				<div>
					<p><strong>Test OpenAI Image Generation</strong> - Generate character images directly using your API credits.</p>
				</div>
			</div>

			<!-- Model Selector -->
			<div class="mb-6 card border border-info/20 bg-base-200 p-4">
				<h3 class="font-bold mb-3">🤖 Model Selection</h3>
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
							<strong>GPT-Image-1</strong> - Better instruction following, may solve multiple character issue (Preview, variable cost)
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
					onclick={() => generateSpeakerImage(speakersData.find(s => s.id === 'ja-jp-male'))}
				>
					Generate Hiro 🇯🇵 (Male)
				</button>
				<button 
					class="btn btn-success" 
					disabled={isGenerating}
					onclick={() => generateSpeakerImage(speakersData.find(s => s.id === 'ja-jp-female'))}
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
				<button 
					class="btn btn-outline" 
					onclick={clearResults}
					disabled={isGenerating}
				>
					Clear Results
				</button>
			</div>

			{#if generationResults.length > 0}
				<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{#each generationResults as result}
						<div class="card border border-success/20 bg-base-200 shadow-xl">
							<div class="card-body">
								<h3 class="card-title text-lg">
									{result.speaker.speakerEmoji} {result.speaker.voiceName}
									<div class="badge badge-sm">{result.speaker.region}</div>
								</h3>
								<p class="text-sm opacity-75">{result.speaker.dialectName} • {result.speaker.gender}</p>
								
								{#if result.generating}
									<div class="flex items-center justify-center py-8">
										<span class="loading loading-spinner loading-lg"></span>
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
												class="btn btn-xs btn-outline"
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
				{#each aboutPagePrompts as item}
					<div class="card border border-primary/20 bg-base-200 shadow-xl">
						<div class="card-body">
							<h3 class="card-title text-lg">{item.title}</h3>
							<p class="text-sm opacity-75">{item.description}</p>
							<div class="mt-4">
								<textarea
									class="textarea textarea-bordered h-32 w-full text-sm"
									readonly
									value={item.prompt}
								></textarea>
								<button
									class="btn btn-primary btn-sm mt-2"
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
				{#each characterPrompts as item}
					<div class="card border border-secondary/20 bg-base-200 shadow-xl">
						<div class="card-body">
							<h3 class="card-title text-lg">{item.title}</h3>
							<p class="text-sm opacity-75">{item.description}</p>
							<div class="mt-4">
								<textarea
									class="textarea textarea-bordered h-32 w-full text-sm"
									readonly
									value={item.prompt}
								></textarea>
								<button
									class="btn btn-secondary btn-sm mt-2"
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
			<h2 class="mb-6 text-3xl font-bold text-info">Speaker Characters ({speakersData.length} total)</h2>
			<div class="mb-4 alert alert-info">
				<div>
					<p><strong>Auto-generated prompts</strong> for each speaker in your database. Each prompt includes their name, cultural context, and personality traits while avoiding stereotypes.</p>
				</div>
			</div>
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each speakersData as speaker}
					<div class="card border border-info/20 bg-base-200 shadow-xl">
						<div class="card-body p-4">
							<h3 class="card-title text-base">
								{speaker.speakerEmoji} {speaker.voiceName}
								<div class="badge badge-sm">{speaker.region}</div>
							</h3>
							<p class="text-xs opacity-75">{speaker.dialectName} • {speaker.gender}</p>
							<div class="mt-3">
								<textarea
									class="textarea textarea-bordered h-24 w-full text-xs"
									readonly
									value={generateSpeakerPrompt(speaker)}
								></textarea>
								<button
									class="btn btn-info btn-xs mt-2"
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
				{#each scenarioPrompts as item}
					<div class="card border border-accent/20 bg-base-200 shadow-xl">
						<div class="card-body">
							<h3 class="card-title text-lg">{item.title}</h3>
							<p class="text-sm opacity-75">{item.description}</p>
							<div class="mt-4">
								<textarea
									class="textarea textarea-bordered h-32 w-full text-sm"
									readonly
									value={item.prompt}
								></textarea>
								<button
									class="btn btn-accent btn-sm mt-2"
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
						<p class="text-sm opacity-75 mb-4">Most reliable for Ghibli-style consistency</p>
						<div class="space-y-2 text-sm">
							<p><strong>Endpoint:</strong> https://api.openai.com/v1/images/generations</p>
							<p><strong>Model:</strong> dall-e-3</p>
							<p><strong>Size:</strong> 1024x1024 (square) or 1792x1024 (landscape)</p>
							<p><strong>Cost:</strong> ~$0.04 per image</p>
							<p><strong>Batch Size:</strong> 1 image per request</p>
						</div>
						<div class="mt-4">
							<button class="btn btn-warning btn-sm" onclick={() => copyToClipboard(`
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
    console.log(\`Generated image for \${speaker.voiceName}: \${imageUrl}\`);
    
    // Add delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}`)}>
								Copy API Code
							</button>
						</div>
					</div>
				</div>

				<div class="card border border-warning/20 bg-base-200 shadow-xl">
					<div class="card-body">
						<h3 class="card-title text-lg">🎨 Stable Diffusion Local</h3>
						<p class="text-sm opacity-75 mb-4">Free but requires local setup</p>
						<div class="space-y-2 text-sm">
							<p><strong>Setup:</strong> Automatic1111 WebUI or ComfyUI</p>
							<p><strong>Model:</strong> Dreamshaper XL or similar anime model</p>
							<p><strong>Cost:</strong> Free (uses your GPU)</p>
							<p><strong>Batch Size:</strong> Limited by VRAM</p>
							<p><strong>Speed:</strong> ~30-60 seconds per image</p>
						</div>
						<div class="mt-4">
							<button class="btn btn-warning btn-sm" onclick={() => copyToClipboard(`
# Stable Diffusion automation script (Python)
import requests
import json
import time

def generate_speaker_images():
    speakers = speakersData  # Load your speakers data
    
    for speaker in speakers:
        prompt = generate_speaker_prompt(speaker)
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
`)}>
								Copy Python Script
							</button>
						</div>
					</div>
				</div>

				<div class="card border border-warning/20 bg-base-200 shadow-xl">
					<div class="card-body">
						<h3 class="card-title text-lg">⚡ Batch Processing Tips</h3>
						<ul class="mt-2 list-disc pl-5 space-y-1 text-sm">
							<li><strong>Start Small:</strong> Generate 5-10 characters first to test consistency</li>
							<li><strong>Use Seeds:</strong> For character consistency across variations</li>
							<li><strong>Naming Convention:</strong> speaker-[speaker-id].png or character-[speaker-name].png</li>
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
						<div class="mt-4">
							<button class="btn btn-warning btn-sm" onclick={() => copyToClipboard(`# Image optimization script (after generation)
# Resize and optimize all generated images
mogrify -resize 400x400^ -gravity center -extent 400x400 -quality 85 speaker-*.png
# Convert to WebP for smaller file sizes
for file in speaker-*.png; do
  cwebp -q 85 "$file" -o "\${file%.png}.webp"
done`)}>
								Copy Optimization Script
							</button>
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
					<ul class="mt-2 list-disc pl-5 space-y-1">
						<li><strong>DALL-E 3:</strong> Most consistent for Ghibli style, works with prompts as-is</li>
						<li><strong>Midjourney:</strong> Add "--ar 1:1 --style raw" for character sheets</li>
						<li><strong>Stable Diffusion:</strong> Use anime/manga models like Dreamshaper XL</li>
						<li><strong>Consistency:</strong> Use the same seed/style reference across characters</li>
						<li><strong>Cultural Sensitivity:</strong> Always review generated images for respectful representation</li>
						<li><strong>Backup Strategy:</strong> Keep original high-res versions before any processing</li>
					</ul>
				</div>
			</div>
		</section>
	</div>
</div>