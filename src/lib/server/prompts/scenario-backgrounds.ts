import type { Scenario } from '$lib/server/db/types';

type ScenarioForPrompt = Pick<
	Scenario,
	'id' | 'title' | 'description' | 'context' | 'tags' | 'role' | 'difficulty' | 'primarySkill'
>;

function formatContext(context?: string | null, description?: string | null): string {
	if (context?.trim()) return context.trim();
	if (description?.trim()) return description.trim();
	return 'Choose a setting that naturally supports conversation practice and feels grounded in real life.';
}

function formatTags(tags?: string[] | null): string {
	if (!tags || tags.length === 0) return '';
	const trimmed = tags
		.filter(Boolean)
		.map((tag) => tag.trim())
		.filter(Boolean);
	if (!trimmed.length) return '';
	return trimmed.slice(0, 5).join(', ');
}

export function buildGhibliBackgroundPrompt(scenario: ScenarioForPrompt): string {
	const tags = formatTags(scenario.tags);
	const context = formatContext(scenario.context, scenario.description);
	const roleLabel = scenario.role ? scenario.role.replace('-', ' ') : 'conversation';

	return `Studio Ghibli-inspired background for the Kaiwa scenario "${scenario.title}".
Setting: ${context}
Tone: Warm, welcoming, a touch of wonder; it should feel ready for a ${roleLabel} at the "${scenario.difficulty}" level.
Composition: Horizontal framing that can fill a phone screen without extreme panorama stretch; avoid empty skies and keep the focus on a clear gathering spot.
Style: Painterly, hand-drawn Ghibli look with soft natural lighting and layered depth; rich but balanced colors, visible brush textures.
Focus: Environmental storytelling only—no characters or text. Subtle human traces are fine (open notebook, two cups, chairs slightly pulled out).${tags ? ` Ambient cues can hint at ${tags}.` : ''}`;
}
