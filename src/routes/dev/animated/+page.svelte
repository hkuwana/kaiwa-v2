<script lang="ts">
	import { onMount } from 'svelte';
	import { speakersData } from '$lib/data/speakers';
	import { aboutPagePrompts, characterPrompts, scenarioPrompts } from '$lib/prompts/dev-animated';

	type Speaker = Record<string, unknown>;

	onMount(() => {
		document.title = 'Animation Prompts - Kaiwa Dev';
	});

	// Prompt style selector
	let promptStyle = $state<'original' | 'refined-ghibli' | 'abstract' | 'illustrated'>(
		'refined-ghibli'
	);

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
					<pre class="mt-2 overflow-x-auto rounded bg-base-300 p-4 text-xs">{generateSpeakerPrompt(
							speakersData.find((s) => s.id === 'ja-jp-female'),
							promptStyle
						)}</pre>
				</div>
			</details>
		</div>

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
	</div>
</div>
