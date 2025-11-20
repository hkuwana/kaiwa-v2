export const scenarioCategories = [
	{
		id: 'cafe',
		name: 'Café Conversation',
		style: 'Ghibli-inspired anime',
		emotion: 'warm and inviting',
		composition: 'a cozy, intimate space',
		location: 'A cozy café with a window seat.',
		time: 'Golden hour, late afternoon.',
		atmosphere: 'Warm and inviting.',
		elements:
			'A steaming mug of coffee on a rustic wooden table, a small vase with a single flower, a book left open.',
		perspective: 'First-person view, as if you are sitting at the table.',
		focalPoint: 'The empty chair opposite you, waiting for a conversation partner.',
		palette: 'Warm earth tones, soft yellows, and deep browns.',
		artStyle:
			'Emulate Studio Ghibli with detailed, hand-drawn backgrounds and soft, painterly light.',
		lighting: 'Soft, diffused light streaming through the window, creating long, gentle shadows.',
		mood: 'A feeling of peaceful anticipation.',
		textures:
			'Visible wood grain on the table, subtle reflections in the window, steam gently rising from the mug.',
		details: 'A forgotten scarf on a chair, a cat sleeping in a sunbeam.',
		emotionResonance: 'Make the viewer feel relaxed and curious about who might join them.'
	},
	{
		id: 'park',
		name: 'Walk in the Park',
		style: 'Vibrant digital art',
		emotion: 'calm and peaceful',
		composition: 'a serene, natural landscape',
		location: 'A public park with a winding path.',
		time: 'Bright afternoon.',
		atmosphere: 'Quiet and contemplative.',
		elements: 'A wooden bench under a large tree, cherry blossom trees in full bloom.',
		perspective: 'Looking down a path that disappears into the distance.',
		focalPoint: 'The path ahead.',
		palette: 'Soft pastels, with pops of pink from the cherry blossoms.',
		artStyle: 'A clean, modern digital art style with clear lines and soft gradients.',
		lighting: 'Bright, even light of a clear day.',
		mood: 'A sense of peace and tranquility.',
		textures: 'The rough texture of the path, the soft petals of the flowers.',
		details: 'A single petal falling from a tree.',
		emotionResonance: 'Make the viewer feel calm and refreshed.'
	}
];

export function generateScenarioPrompt(scenario: (typeof scenarioCategories)[0]): string {
	return `Create a scenario thumbnail in the style of a ${scenario.style}. The scene should be emotionally ${scenario.emotion} and visually ${scenario.composition}.

STEP 1 - ESTABLISH THE SCENE:
- Location: ${scenario.location}
- Time of Day: ${scenario.time}
- Atmosphere: ${scenario.atmosphere}
- Key Elements: ${scenario.elements}

STEP 2 - DEFINE THE COMPOSITION & STYLE:
- Perspective: ${scenario.perspective}
- Focal Point: ${scenario.focalPoint}
- Color Palette: ${scenario.palette}
- Art Style: ${scenario.artStyle}

STEP 3 - ADD LIGHTING & ATMOSPHERE:
- Lighting: ${scenario.lighting}
- Mood: ${scenario.mood}

STEP 4 - REFINE THE DETAILS:
- Texture: Incorporate textures like ${scenario.textures} to add depth.
- Subtle Details: Add small, telling details like ${scenario.details}.
- Emotional Resonance: The final image should make the viewer feel ${scenario.emotionResonance}.

TECHNICAL REQUIREMENTS:
- Aspect Ratio: 16:9, landscape orientation.
- Artistic Style: Must be ${scenario.style}, NOT photorealistic.
- Human Presence: No people in the shot, or only subtle hints of human presence. The focus is on the environment.
- Purpose: The image should serve as an inviting background that sets the stage for a conversation.`;
}

export const scenarios = scenarioCategories.map((category) => ({
	id: category.id,
	title: category.name,
	description: `A ${category.emotion} scene in a ${category.location.toLowerCase()}`,
	prompt: generateScenarioPrompt(category)
}));
