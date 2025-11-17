<script lang="ts">
	import { onMount } from 'svelte';
	import { speakersData } from '$lib/data/speakers';
	import { aboutPagePrompts, characterPrompts, scenarioPrompts } from '$lib/prompts/dev-animated';
	import { SvelteMap } from 'svelte/reactivity';

	type Speaker = Record<string, unknown>;

	onMount(() => {
		document.title = 'Animation Prompts - Kaiwa Dev';
	});

	// Image generation state
	let isGenerating = $state(false);
	let generationResults = $state<
		Array<{
			speaker: Speaker;
			imageUrl: string;
			error?: string;
			generating?: boolean;
		}>
	>([]);

	// Selected model
	let selectedModel = $state<'dall-e-3' | 'gpt-image-1'>('dall-e-3');

	// Prompt style selector
	let promptStyle = $state<'original' | 'refined-ghibli' | 'abstract' | 'illustrated'>(
		'refined-ghibli'
	);

	// Individual speaker testing
	let selectedTestSpeaker = $state<string | null>(null);

	// Cost tracking
	let totalCost = $derived(generationResults.filter((r) => r.imageUrl).length * 0.08);

	// Get personality for preview
	function getPersonalityForSpeaker(speakerId: string): string {
		const personalities = [
			'Open & Playful 😊',
			'Warm & Curious 🌟',
			'Upbeat & Energetic ⚡',
			'Confident & Easygoing 😌',
			'Friendly & Spontaneous 🎉',
			'Kind & Adventurous 🌸'
		];
		const index =
			speakerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % personalities.length;
		return personalities[index];
	}

	// Generate image for a specific speaker
	async function generateSpeakerImage(
		speaker: Speaker,
		model: 'dall-e-3' | 'gpt-image-1' = selectedModel,
		style: string = promptStyle
	): Promise<boolean> {
		const prompt = generateSpeakerPrompt(speaker, style);

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
				return true;
			} else {
				generationResults[resultIndex] = {
					speaker,
					imageUrl: '',
					error: result.error,
					generating: false
				};
				return false;
			}
		} catch {
			generationResults[resultIndex] = {
				speaker,
				imageUrl: '',
				error: 'Network error',
				generating: false
			};
			return false;
		}
	}

	// Generate all speakers for a specific language
	async function generateLanguageSpeakers(languageId: string) {
		const languageSpeakers = speakersData.filter((s) => s.languageId === languageId);
		isGenerating = true;

		for (const speaker of languageSpeakers) {
			await generateSpeakerImage(speaker);
			// Add delay between requests to respect rate limits
			await new Promise((resolve) => setTimeout(resolve, 3000));
		}

		isGenerating = false;
	}

	// Generate ALL speakers (use with caution - ~73 images, ~$6-8 total)
	async function generateAllSpeakers() {
		const confirmed = window.confirm(
			`This will generate ~${speakersData.length} images at ~$0.08 each (Total: ~$${(speakersData.length * 0.08).toFixed(2)}). Continue?`
		);
		if (!confirmed) {
			return;
		}

		isGenerating = true;
		let successCount = 0;
		let errorCount = 0;

		for (const speaker of speakersData) {
			const result = await generateSpeakerImage(speaker);
			if (result) successCount++;
			else errorCount++;

			// Add delay between requests (3 seconds to be safe)
			await new Promise((resolve) => setTimeout(resolve, 3000));
		}

		console.log(`Batch complete! Success: ${successCount}, Errors: ${errorCount}`);
		isGenerating = false;
	}

	// Get unique languages from speakers
	function getUniqueLanguages(): Array<{ id: string; name: string; count: number }> {
		const languageMap = new SvelteMap<string, { name: string; count: number }>();
		const languageNames: Record<string, string> = {
			ja: 'Japanese',
			ko: 'Korean',
			es: 'Spanish',
			zh: 'Chinese',
			fr: 'French',
			de: 'German',
			pt: 'Portuguese',
			it: 'Italian',
			ar: 'Arabic',
			ru: 'Russian',
			hi: 'Hindi'
		};

		speakersData.forEach((s) => {
			const current = languageMap.get(s.languageId) || {
				name: languageNames[s.languageId] || s.languageId,
				count: 0
			};
			current.count++;
			languageMap.set(s.languageId, current);
		});

		return Array.from(languageMap.entries()).map(([id, data]) => ({
			id,
			name: data.name,
			count: data.count
		}));
	}

	// Clear results
	function clearResults() {
		generationResults = [];
	}

	// Generate character prompt for each speaker
	function generateSpeakerPrompt(speaker: Speaker, style: string = 'original'): string {
		// Route to appropriate prompt generator based on style
		switch (style) {
			case 'refined-ghibli':
				return generateRefinedGhibliPrompt(speaker);
			case 'abstract':
				return generateAbstractPrompt(speaker);
			case 'illustrated':
				return generateIllustratedPrompt(speaker);
			case 'original':
			default:
				return generateOriginalPrompt(speaker);
		}
	}

	// ORIGINAL PROMPT (your current version)
	function generateOriginalPrompt(speaker: Speaker): string {
		const genderDescriptor = speaker.gender === 'male' ? 'man' : 'woman';

		// Personality archetypes - timeless, open, upbeat, and fun
		const personalities = [
			{
				trait: 'open and playful',
				expression: 'a bright, welcoming smile with playful eyes that suggest they love adventure',
				vibe: "someone who's up for anything and makes everything feel like fun"
			},
			{
				trait: 'warm and curious',
				expression:
					'a genuine smile with engaged, curious eyes - someone actively interested in you',
				vibe: 'someone who listens well and makes you feel heard and interesting'
			},
			{
				trait: 'upbeat and energetic',
				expression: 'an animated, enthusiastic expression with eyes that light up when talking',
				vibe: 'someone whose energy is contagious and lifts your mood instantly'
			},
			{
				trait: 'confident and easygoing',
				expression: 'a relaxed, natural smile with comfortable confidence - no pretense',
				vibe: "someone who's comfortable in their own skin and makes others feel at ease"
			},
			{
				trait: 'friendly and spontaneous',
				expression: 'a spontaneous, genuine laugh captured mid-moment, eyes crinkling with joy',
				vibe: 'someone who lives in the moment and knows how to have a good time'
			},
			{
				trait: 'kind and adventurous',
				expression: 'a warm smile with an adventurous glint in their eyes, ready to explore',
				vibe: 'someone who balances kindness with a sense of adventure and fun'
			}
		];

		// Assign personality based on speaker name hash for consistency
		const personalityIndex =
			speaker.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) %
			personalities.length;
		const personality = personalities[personalityIndex];

		let culturalElements = '';
		let styleContext = '';
		let ageRange = '23-28 years old';

		// Timeless cultural context - focused on universal appeal
		switch (speaker.languageId) {
			case 'ja':
				culturalElements = 'casual Japanese style with clean lines and natural elegance';
				styleContext = "like someone you'd meet while exploring a park or getting coffee";
				break;
			case 'es':
				culturalElements =
					speaker.region === 'Spain'
						? 'relaxed Mediterranean style with natural warmth'
						: 'casual Latin American style with vibrant, open energy';
				styleContext = 'like someone who loves good conversation over a meal or walk';
				break;
			case 'zh':
				culturalElements =
					speaker.region === 'Taiwan'
						? 'comfortable Taiwanese casual style'
						: 'contemporary Chinese everyday fashion';
				styleContext = 'like someone friendly and easy to talk to';
				break;
			case 'fr':
				culturalElements = 'effortlessly casual French style, simple and timeless';
				styleContext = "like someone you'd enjoy a long walk or conversation with";
				break;
			case 'ko':
				culturalElements = 'modern Korean casual style with natural charm';
				styleContext = 'like someone comfortable and fun to be around';
				break;
			case 'de':
				culturalElements = 'practical German style with natural elegance';
				styleContext = 'like someone straightforward and genuine';
				break;
			case 'pt':
				culturalElements =
					speaker.region === 'Brazil'
						? 'relaxed Brazilian style with natural, joyful energy'
						: 'comfortable Portuguese style with warm authenticity';
				styleContext = 'like someone who knows how to enjoy life';
				break;
			case 'it':
				culturalElements = 'casual Italian style with natural confidence';
				styleContext = 'like someone warm and expressive in the best way';
				break;
			default:
				culturalElements = 'comfortable international style';
				styleContext = "like someone you'd meet while traveling and want to keep in touch with";
		}

		// Timeless, open, upbeat, and fun character prompt
		const prompt = `Create a character portrait illustration in the timeless Studio Ghibli animation style, specifically referencing the warm, genuine character designs from "Whisper of the Heart" (1995), "Kiki's Delivery Service" (1989), and "Only Yesterday" (1991).

CHARACTER CONCEPT:
- A ${ageRange} ${genderDescriptor} named ${speaker.voiceName}
- Personality: ${personality.trait}
- Cultural style: ${culturalElements}
- Feeling: ${styleContext}
- Energy: ${personality.vibe}

EXPRESSION & EMOTION (Critical - Open, Upbeat, Fun):
- ${personality.expression}
- OPEN and APPROACHABLE - someone easy to talk to
- UPBEAT and POSITIVE - brings good energy without being over-the-top
- FUN and ENGAGING - someone you'd enjoy spending time with
- Natural, unforced happiness - not a stock photo smile
- Genuine human warmth that feels timeless

VISUAL STYLE (Timeless Ghibli):
- Hand-drawn cel animation aesthetic with visible, confident line art
- Soft watercolor textures with gentle, natural gradients
- Warm, inviting color palette with natural lighting
- Expressive eyes that show ${personality.trait} - full of life and personality
- Soft, approachable facial features
- Natural, flowing hair with organic movement
- Casual, comfortable clothing that feels timeless (not trendy)

COMPOSITION:
- Portrait from shoulders up, natural angle (3/4 view or straight-on)
- Character making friendly eye contact, mid-conversation
- Relaxed, natural posture - no stiffness
- Simple, soft background (warm cream, soft beige, natural light blue)
- Should feel like talking to a friend you're comfortable with

RELATIONSHIP/CONVERSATION CONTEXT:
- This is someone you'd want to practice conversations with - comfortable but engaging
- Attractive in a natural, timeless way (not model-pretty, real-person pretty)
- The kind of person who makes conversation feel easy and fun
- A conversation partner who's genuinely interested in connecting
- Balance between being attractive and being approachable
- Strong but warm - confident in who they are

TECHNICAL DETAILS:
- Clean line art with natural confidence (black or dark brown outlines)
- Subtle watercolor shading with soft transitions
- Bright, lively eye highlights that show personality
- Natural skin tones with appropriate, respectful cultural representation
- Simple clothing details - focus on the character's face and expression

CRITICAL REQUIREMENTS:
- ONLY ONE PERSON in the image
- No photorealistic elements - pure Ghibli hand-drawn animation style
- No digital painting style - must look traditionally animated
- No multiple characters, no background figures
- Character should have TIMELESS appeal - not dated by trends
- Should feel FUN, OPEN, and UPBEAT - someone you'd love to chat with`;

		return prompt.trim();
	}

	// REFINED GHIBLI PROMPT (Step-by-step, better for AI)
	function generateRefinedGhibliPrompt(speaker: Speaker): string {
		const genderDescriptor = speaker.gender === 'male' ? 'man' : 'woman';
		const personalities = [
			{
				trait: 'open and playful',
				expression: 'a bright, welcoming smile with playful eyes that suggest they love adventure',
				vibe: "someone who's up for anything and makes everything feel like fun"
			},
			{
				trait: 'warm and curious',
				expression:
					'a genuine smile with engaged, curious eyes - someone actively interested in you',
				vibe: 'someone who listens well and makes you feel heard and interesting'
			},
			{
				trait: 'upbeat and energetic',
				expression: 'an animated, enthusiastic expression with eyes that light up when talking',
				vibe: 'someone whose energy is contagious and lifts your mood instantly'
			},
			{
				trait: 'confident and easygoing',
				expression: 'a relaxed, natural smile with comfortable confidence - no pretense',
				vibe: "someone who's comfortable in their own skin and makes others feel at ease"
			},
			{
				trait: 'friendly and spontaneous',
				expression: 'a spontaneous, genuine laugh captured mid-moment, eyes crinkling with joy',
				vibe: 'someone who lives in the moment and knows how to have a good time'
			},
			{
				trait: 'kind and adventurous',
				expression: 'a warm smile with an adventurous glint in their eyes, ready to explore',
				vibe: 'someone who balances kindness with a sense of adventure and fun'
			}
		];

		const personalityIndex =
			speaker.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) %
			personalities.length;
		const personality = personalities[personalityIndex];

		let culturalElements = '';
		let ageRange = '23-28 years old';

		switch (speaker.languageId) {
			case 'ja':
				culturalElements = 'casual Japanese style with clean lines and natural elegance';
				break;
			case 'ko':
				culturalElements = 'modern Korean casual style with natural charm';
				break;
			case 'es':
				culturalElements =
					speaker.region === 'Spain'
						? 'relaxed Mediterranean style with natural warmth'
						: 'casual Latin American style with vibrant, open energy';
				break;
			case 'zh':
				culturalElements =
					speaker.region === 'Taiwan'
						? 'comfortable Taiwanese casual style'
						: 'contemporary Chinese everyday fashion';
				break;
			default:
				culturalElements = 'comfortable international style';
		}

		return `Create a character portrait in the style of 1990s Japanese hand-drawn animation, with soft watercolor aesthetics.

STEP 1 - ANALYZE COMPOSITION:
- Portrait from shoulders up, 3/4 view or straight-on
- ${ageRange} ${genderDescriptor} named ${speaker.voiceName}
- Personality: ${personality.trait}
- Natural, conversational expression: ${personality.expression}
- Cultural styling: ${culturalElements}
- Energy: ${personality.vibe}

STEP 2 - APPLY VISUAL STYLE:
- Soft, vibrant color palette (warm peachy skin tones, natural hair colors)
- Detailed but gentle line work (confident black outlines, 2-3px weight)
- Large, expressive eyes with multiple highlights showing ${personality.trait}
- Watercolor-style shading with visible brush texture
- Soft edges and natural color bleeding between sections
- Hand-drawn cel animation aesthetic

STEP 3 - REFINE CHARACTER DETAILS:
- Hair: Natural flow with individual strand detail, organic movement
- Eyes: Large and emotive, with 2-3 white highlights per eye showing life
- Expression: Mid-conversation warmth - mouth slightly open or gentle smile
- Clothing: Simple, casual, timeless (soft colors, minimal patterns)
- Background: Soft gradient (cream to pale blue) with subtle texture

STEP 4 - LIGHTING & ATMOSPHERE:
- Soft, diffused natural lighting from upper left
- Gentle shadows under chin and around nose
- Warm highlights on cheekbones and nose tip
- Overall mood: Approachable, friendly, upbeat
- Golden hour warmth without being too saturated

STEP 5 - EMOTIONAL TONE:
- OPEN and APPROACHABLE - someone easy to talk to
- UPBEAT and POSITIVE - brings good energy without being over-the-top
- FUN and ENGAGING - someone you'd enjoy spending time with
- Natural, unforced happiness - not a stock photo smile
- Genuine human warmth that feels timeless

TECHNICAL REQUIREMENTS:
- Hand-drawn animation aesthetic (NOT digital painting, NOT photorealistic)
- Visible line art with watercolor fills
- Whimsical but authentic character design reminiscent of Whisper of the Heart, Kiki's Delivery Service
- Only ONE person in frame
- Focus on expressive, friendly face that invites conversation
- Character should look like someone you'd want to practice speaking with`;
	}

	// ABSTRACT PROMPT (Amorphous, like "Her")
	function generateAbstractPrompt(speaker: Speaker): string {
		const personalities = [
			{ trait: 'open and playful', colors: 'warm coral and soft peach gradients' },
			{ trait: 'warm and curious', colors: 'golden yellow and soft amber gradients' },
			{ trait: 'upbeat and energetic', colors: 'vibrant orange and sunny yellow gradients' },
			{ trait: 'confident and easygoing', colors: 'soft teal and gentle blue gradients' },
			{ trait: 'friendly and spontaneous', colors: 'warm pink and soft rose gradients' },
			{ trait: 'kind and adventurous', colors: 'sage green and soft mint gradients' }
		];

		const personalityIndex =
			speaker.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) %
			personalities.length;
		const personality = personalities[personalityIndex];

		return `Create an abstract, minimalist visual representation of a friendly conversation partner.

CONCEPT:
- Amorphous, flowing organic shapes that suggest a warm presence
- ${personality.colors}
- Soft, inviting forms that convey ${personality.trait} through shape and color
- No facial features, but personality expressed through form and movement

VISUAL STYLE:
- Smooth gradients with soft, diffused edges
- Gentle, organic forms that feel warm and alive
- Layered transparency creating depth
- Soft glow or subtle halo effect around edges
- Modern, clean aesthetic

COMPOSITION:
- Centered organic shape, roughly portrait-oriented
- Flowing, natural movement implied in the form
- Minimal background (neutral gradient, light to slightly darker)
- Should feel present but not intrusive
- Balance between abstract and approachable

MOOD & ATMOSPHERE:
- Friendly, warm, non-threatening
- Inviting without being demanding
- Conveys ${personality.trait} through color temperature and form
- Universal appeal, no cultural assumptions
- Modern but timeless

TECHNICAL DETAILS:
- Clean, professional execution
- Soft shadows and highlights for depth
- Subtle texture (optional, very light grain)
- Should work well at small sizes (40x40px avatar)
- Format: Portrait orientation, simple background`;
	}

	// ILLUSTRATED PROMPT (Semi-realistic, editorial style)
	function generateIllustratedPrompt(speaker: Speaker): string {
		const genderDescriptor = speaker.gender === 'male' ? 'man' : 'woman';
		const personalities = [
			{
				trait: 'open and playful',
				expression: 'a bright, welcoming smile with playful eyes'
			},
			{
				trait: 'warm and curious',
				expression: 'a genuine smile with engaged, curious eyes'
			},
			{
				trait: 'upbeat and energetic',
				expression: 'an animated, enthusiastic expression with bright eyes'
			},
			{
				trait: 'confident and easygoing',
				expression: 'a relaxed, natural smile with comfortable confidence'
			},
			{
				trait: 'friendly and spontaneous',
				expression: 'a spontaneous, genuine laugh with joyful eyes'
			},
			{
				trait: 'kind and adventurous',
				expression: 'a warm smile with an adventurous glint'
			}
		];

		const personalityIndex =
			speaker.id.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) %
			personalities.length;
		const personality = personalities[personalityIndex];

		let culturalElements = '';
		let ageRange = '23-28 years old';

		switch (speaker.languageId) {
			case 'ja':
				culturalElements = 'subtle Japanese aesthetic with clean, elegant lines';
				break;
			case 'ko':
				culturalElements = 'modern Korean style with natural charm';
				break;
			case 'es':
				culturalElements = 'warm Mediterranean or Latin American style';
				break;
			case 'zh':
				culturalElements = 'contemporary East Asian aesthetic';
				break;
			default:
				culturalElements = 'international contemporary style';
		}

		return `Create a warm, illustrated portrait in the style of contemporary editorial illustration.

CHARACTER:
- ${ageRange} ${genderDescriptor} named ${speaker.voiceName}
- Personality: ${personality.trait}
- Expression: ${personality.expression}
- Cultural context: ${culturalElements}

VISUAL STYLE:
- Digital illustration with natural, painterly textures
- Realistic proportions but slightly stylized, approachable features
- Soft, painterly brushwork (NOT photorealistic, clearly illustrated)
- Warm, saturated colors with good contrast
- Professional editorial quality

ART DIRECTION:
- Portrait from shoulders up
- Friendly, conversational expression that feels genuine
- Simple background (solid color with subtle texture or soft gradient)
- Natural skin tones with appropriate, respectful cultural representation
- Clothing that suggests ${culturalElements}

REFERENCE STYLE:
- Contemporary editorial illustration (The New Yorker, The Atlantic)
- Warm children's book illustration aesthetic
- Clean but expressive - focus on personality
- Professional and trustworthy but approachable
- Clearly hand-illustrated, not a photograph

MOOD:
- Warm, inviting, friendly
- Professional but not corporate
- Approachable and human
- Someone you'd enjoy talking to

TECHNICAL DETAILS:
- Clear it's an illustration, not a photo
- Focus on expressive face and eyes
- Simple, uncluttered composition
- Should work well at various sizes
- Portrait orientation`;
	}

	// State for copy feedback
	let copiedUrl = $state<string | null>(null);

	function copyToClipboard(text: string) {
		navigator.clipboard.writeText(text);
		copiedUrl = text;
		setTimeout(() => {
			copiedUrl = null;
		}, 2000);
	}

	// Download all generated images as a JSON manifest
	function downloadManifest() {
		const manifest = generationResults
			.filter((r) => r.imageUrl)
			.map((r) => ({
				speakerId: r.speaker.id,
				voiceName: r.speaker.voiceName,
				region: r.speaker.region,
				language: r.speaker.languageId,
				gender: r.speaker.gender,
				imageUrl: r.imageUrl
			}));

		const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `kaiwa-characters-manifest-${Date.now()}.json`;
		a.click();
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Animation Prompts - Kaiwa Dev</title>
</svelte:head>

<div class="min-h-screen bg-base-100 p-8">
	<div class="container mx-auto max-w-6xl">
		<div class="mb-8">
			<h1 class="mb-4 text-4xl font-bold">Kaiwa Character Generation System</h1>
			<p class="mb-2 text-lg opacity-75">
				Enhanced Studio Ghibli-style prompts for all {speakersData.length} speakers. Generate character
				portraits with specific art direction for consistency and emotional warmth.
			</p>
			<div class="alert alert-info">
				<div>
					<p class="font-bold">✨ Timeless, Open, Upbeat & Fun Characters:</p>
					<ul class="mt-2 list-disc space-y-1 pl-5 text-sm">
						<li>
							<strong>6 Personality Types:</strong> Open & Playful, Warm & Curious, Upbeat & Energetic,
							Confident & Easygoing, Friendly & Spontaneous, Kind & Adventurous
						</li>
						<li>
							<strong>Timeless Appeal:</strong> Not trendy or dated - these characters will feel fresh
							for years
						</li>
						<li>
							<strong>Natural & Genuine:</strong> Real-person pretty (not model-pretty), comfortable
							and approachable
						</li>
						<li>
							<strong>Fun & Engaging:</strong> People you'd actually want to practice conversations with
						</li>
						<li>
							<strong>Classic Ghibli:</strong> References "Whisper of the Heart", "Kiki's Delivery Service",
							"Only Yesterday"
						</li>
						<li>
							<strong>Universal Context:</strong> Meeting at a park, getting coffee, enjoying a walk
							- timeless scenarios
						</li>
					</ul>
				</div>
			</div>
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

			<!-- Prompt Style Selector -->
			<div class="card mb-6 border border-success/20 bg-base-200 p-4">
				<h3 class="mb-3 font-bold">🎨 Prompt Style (A/B Testing)</h3>
				<p class="mb-4 text-sm opacity-75">
					Test different approaches to see which produces the best character art
				</p>

				<div class="form-control">
					<label class="label cursor-pointer">
						<span class="label-text">
							<strong>Refined Ghibli</strong> - Step-by-step instructions, better AI understanding
							<span class="ml-2 badge badge-sm badge-success">RECOMMENDED</span>
						</span>
						<input
							type="radio"
							name="promptStyle"
							class="radio checked:bg-success"
							bind:group={promptStyle}
							value="refined-ghibli"
						/>
					</label>
				</div>

				<div class="form-control">
					<label class="label cursor-pointer">
						<span class="label-text">
							<strong>Original</strong> - Your current Ghibli-style prompt (baseline)
						</span>
						<input
							type="radio"
							name="promptStyle"
							class="radio checked:bg-blue-500"
							bind:group={promptStyle}
							value="original"
						/>
					</label>
				</div>

				<div class="form-control">
					<label class="label cursor-pointer">
						<span class="label-text">
							<strong>Abstract</strong> - Amorphous shapes (like "Her"), no faces
						</span>
						<input
							type="radio"
							name="promptStyle"
							class="radio checked:bg-purple-500"
							bind:group={promptStyle}
							value="abstract"
						/>
					</label>
				</div>

				<div class="form-control">
					<label class="label cursor-pointer">
						<span class="label-text">
							<strong>Illustrated</strong> - Editorial style, semi-realistic portraits
						</span>
						<input
							type="radio"
							name="promptStyle"
							class="radio checked:bg-orange-500"
							bind:group={promptStyle}
							value="illustrated"
						/>
					</label>
				</div>

				<div class="mt-3 text-sm opacity-70">
					Current style: <strong>{promptStyle}</strong>
				</div>

				<!-- Prompt Preview -->
				<details class="collapse-arrow collapse mt-4 border border-base-300 bg-base-100">
					<summary class="collapse-title text-sm font-medium">
						Preview Current Prompt (for Yuki example)
					</summary>
					<div class="collapse-content">
						<pre
							class="mt-2 overflow-x-auto rounded bg-base-300 p-4 text-xs">{generateSpeakerPrompt(
								speakersData.find((s) => s.id === 'ja-jp-female'),
								promptStyle
							)}</pre>
					</div>
				</details>
			</div>

			<!-- Individual Speaker Testing (Style Comparison) -->
			<div class="card mb-6 border border-success/20 bg-base-200 p-4">
				<h3 class="mb-3 font-bold">🎨 Test Individual Speaker (Compare Styles)</h3>
				<p class="mb-4 text-sm opacity-75">
					Select a speaker and generate with different prompt styles to compare results
				</p>

				<div class="grid gap-4 md:grid-cols-2">
					<!-- Speaker Selector -->
					<div class="form-control">
						<label class="label">
							<span class="label-text font-semibold">Select Speaker</span>
						</label>
						<select class="select-bordered select" bind:value={selectedTestSpeaker}>
							<option value={null}>Choose a speaker...</option>
							<optgroup label="Japanese">
								{#each speakersData.filter((s) => s.languageId === 'ja') as speaker (speaker.id)}
									<option value={speaker.id}>
										{speaker.speakerEmoji}
										{speaker.voiceName} ({speaker.gender}, {speaker.region})
									</option>
								{/each}
							</optgroup>
							<optgroup label="Korean">
								{#each speakersData.filter((s) => s.languageId === 'ko') as speaker (speaker.id)}
									<option value={speaker.id}>
										{speaker.speakerEmoji}
										{speaker.voiceName} ({speaker.gender}, {speaker.region})
									</option>
								{/each}
							</optgroup>
							<optgroup label="Spanish">
								{#each speakersData.filter((s) => s.languageId === 'es') as speaker (speaker.id)}
									<option value={speaker.id}>
										{speaker.speakerEmoji}
										{speaker.voiceName} ({speaker.gender}, {speaker.region})
									</option>
								{/each}
							</optgroup>
							<optgroup label="Other Languages">
								{#each speakersData.filter((s) => !['ja', 'ko', 'es'].includes(s.languageId)) as speaker (speaker.id)}
									<option value={speaker.id}>
										{speaker.speakerEmoji}
										{speaker.voiceName} ({speaker.languageId}, {speaker.gender})
									</option>
								{/each}
							</optgroup>
						</select>
					</div>

					<!-- Generate Button -->
					<div class="form-control">
						<label class="label">
							<span class="label-text font-semibold">Action</span>
						</label>
						<button
							class="btn btn-success"
							disabled={isGenerating || !selectedTestSpeaker}
							onclick={() => {
								const speaker = speakersData.find((s) => s.id === selectedTestSpeaker);
								if (speaker) generateSpeakerImage(speaker);
							}}
						>
							{isGenerating ? 'Generating...' : '✨ Generate Image ($0.08)'}
						</button>
					</div>
				</div>

				{#if selectedTestSpeaker}
					<div class="mt-4 alert alert-info">
						<div class="text-sm">
							<p class="font-semibold">
								Testing: {speakersData.find((s) => s.id === selectedTestSpeaker)?.voiceName}
							</p>
							<p>Style: <strong>{promptStyle}</strong></p>
							<p class="mt-1 opacity-75">
								💡 Tip: Generate once, then change the prompt style above and generate again to
								compare results
							</p>
						</div>
					</div>
				{/if}
			</div>

			<!-- Priority Characters Test -->
			<div class="mb-6 alert alert-warning">
				<div>
					<h3 class="font-bold">🎯 Priority Characters Test</h3>
					<p class="mb-3 text-sm">
						Generate the 5 most important characters for validation. Total cost: ~$0.40
					</p>
					<button
						class="btn btn-sm btn-warning"
						disabled={isGenerating}
						onclick={async () => {
							const prioritySpeakers = [
								speakersData.find((s) => s.id === 'ja-jp-female'), // Yuki
								speakersData.find((s) => s.id === 'ja-jp-male'), // Hiro
								speakersData.find((s) => s.id === 'ja-jp-osaka-female'), // Minami
								speakersData.find((s) => s.id === 'ko-kr-female'), // Korean Female
								speakersData.find((s) => s.id === 'ko-kr-male') // Korean Male
							].filter(Boolean);

							isGenerating = true;
							for (const speaker of prioritySpeakers) {
								await generateSpeakerImage(speaker);
								// 3 second delay between requests
								await new Promise((resolve) => setTimeout(resolve, 3000));
							}
							isGenerating = false;
						}}
					>
						{isGenerating ? 'Generating...' : 'Generate Priority 5 Characters'}
					</button>
					<span class="ml-2 text-xs opacity-75">
						(Yuki, Hiro, Minami, Korean F/M • ~15 seconds with delays)
					</span>
				</div>
			</div>

			<!-- Batch generation by language -->
			<div class="mb-4">
				<h3 class="mb-2 font-bold">Batch Generate by Language</h3>
				<div class="flex flex-wrap gap-2">
					{#each getUniqueLanguages() as lang (lang.id)}
						<button
							class="btn btn-sm btn-primary"
							disabled={isGenerating}
							onclick={() => generateLanguageSpeakers(lang.id)}
						>
							{lang.name} ({lang.count} speakers) ~${(lang.count * 0.08).toFixed(2)}
						</button>
					{/each}
				</div>
			</div>

			<!-- Generate ALL (danger zone) -->
			<div class="mb-6">
				<h3 class="mb-2 font-bold text-warning">⚠️ Batch Generate ALL Speakers</h3>
				<button
					class="btn btn-warning"
					class:loading={isGenerating}
					disabled={isGenerating}
					onclick={generateAllSpeakers}
				>
					{isGenerating
						? `Generating... (${generationResults.length}/${speakersData.length})`
						: `Generate ALL ${speakersData.length} Speakers (~$${(speakersData.length * 0.08).toFixed(2)})`}
				</button>
				<button class="btn ml-2 btn-outline" onclick={clearResults} disabled={isGenerating}>
					Clear Results
				</button>
			</div>

			{#if generationResults.length > 0}
				<!-- Stats and Download -->
				<div class="mb-6 alert alert-success">
					<div class="w-full">
						<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
							<div>
								<p class="font-bold">Generation Stats</p>
								<p class="text-sm">
									Success: {generationResults.filter((r) => r.imageUrl).length} | Errors: {generationResults.filter(
										(r) => r.error
									).length} | In Progress: {generationResults.filter((r) => r.generating).length}
								</p>
								<p class="text-sm">
									<strong>Estimated Cost:</strong> ${totalCost.toFixed(2)}
								</p>
							</div>
							<div class="flex gap-2">
								<button
									class="btn btn-sm btn-primary"
									onclick={() => {
										const urls = generationResults
											.filter((r) => r.imageUrl)
											.map((r) => `${r.speaker.voiceName}: ${r.imageUrl}`)
											.join('\n\n');
										copyToClipboard(urls);
									}}
									disabled={generationResults.filter((r) => r.imageUrl).length === 0}
								>
									📋 Copy All URLs
								</button>
								<button
									class="btn btn-sm btn-primary"
									onclick={downloadManifest}
									disabled={generationResults.filter((r) => r.imageUrl).length === 0}
								>
									📥 Download JSON
								</button>
							</div>
						</div>
					</div>
				</div>

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
								<p class="text-xs font-semibold text-primary">
									{getPersonalityForSpeaker(result.speaker.id)}
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
										<div class="mt-2 flex flex-wrap gap-2">
											<button
												class="btn btn-xs btn-primary"
												onclick={() => window.open(result.imageUrl, '_blank')}
											>
												📂 Open Full Size
											</button>
											<button
												class="btn btn-xs"
												class:btn-success={copiedUrl === result.imageUrl}
												class:btn-outline={copiedUrl !== result.imageUrl}
												onclick={() => copyToClipboard(result.imageUrl)}
											>
												{copiedUrl === result.imageUrl ? '✅ Copied!' : '📋 Copy URL'}
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
						<strong>Timeless, fun conversation partner prompts</strong> for each speaker. Each character
						has a unique personality archetype (open, upbeat, warm, etc.) assigned consistently based
						on their speaker ID. This creates varied, engaging characters that feel natural and fun to
						practice with - not generic or trendy, but timelessly appealing.
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
							<p class="text-xs opacity-75">
								{speaker.dialectName} • {speaker.gender}
							</p>
							<p class="mt-1 text-xs font-semibold text-primary">
								{getPersonalityForSpeaker(speaker.id)}
							</p>
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
							<p><strong>Size:</strong> 1024x1024 (square)</p>
							<p><strong>Quality:</strong> HD (higher fidelity for character portraits)</p>
							<p><strong>Cost:</strong> ~$0.08 per HD image ($0.04 standard)</p>
							<p><strong>Batch Size:</strong> 1 image per request</p>
							<p class="text-warning"><strong>Total for all 73 speakers:</strong> ~$5.84</p>
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
