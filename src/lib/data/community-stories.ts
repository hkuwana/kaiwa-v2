export type LearningGoal = 'Connection' | 'Career' | 'Travel' | 'Academic' | 'Culture' | 'Growth';

export interface CommunityStory {
	id: string;
	learningGoal: LearningGoal;
	headline: string;
	subheadline: string;
	quote: string;
	author: {
		name: string;
		role: string;
		location?: string;
	};
	context: string;
	result: string;
	playbook: Array<{
		title: string;
		tip: string;
	}>;
	action: {
		label: string;
		description: string;
		urlPath: string;
	};
}

/**
 * Curated community stories aligned to learner motivations.
 * Used by the CommunityStoryEmailService to pick authentic narratives.
 */
export const communityStories: CommunityStory[] = [
	{
		id: 'connection-shared-micro-wins',
		learningGoal: 'Connection',
		headline: 'Finding a daily rhythm that still feels personal',
		subheadline: 'Micro-reps with family check-ins turned call anxiety into momentum.',
		quote:
			'"I felt guilty reading scripts to my mom. Now we have a goofy ritual: five questions, every night, in Japanese. She says I sound more like myself each week."',
		author: {
			name: 'Mariko H.',
			role: 'Product designer learning Japanese to talk with family',
			location: 'San Diego → Osaka'
		},
		context:
			'Mariko moved back to the US but wanted nightly connection with her parents in Osaka. She only had 10 minutes between work and dinner.',
		result:
			'By stacking a five-question ritual onto her existing video calls, she built confidence and emotional intimacy without adding new meetings.',
		playbook: [
			{
				title: 'Reuse the questions that already spark stories',
				tip: 'She listed the questions that always made her parents smile, then practiced those lines in Kaiwa before each call.'
			},
			{
				title: 'Anchor the call to the same moment',
				tip: 'The "tea is ready" notification became her cue. No calendar invite, just a physical trigger.'
			},
			{
				title: 'Celebrate a single improvement',
				tip: 'They rate one phrase together at the end (“more natural than yesterday?”). That feedback keeps her invested.'
			}
		],
		action: {
			label: 'Practice a five-question family check-in',
			description: 'Warm up with the Connection playbook before your next call.',
			urlPath: '/?scenario=family-dinner-introduction'
		}
	},
	{
		id: 'career-stakeholder-confidence',
		learningGoal: 'Career',
		headline: 'Owning the Monday stand-up in a second language',
		subheadline: 'One product manager carved 90 seconds of prep into her commute.',
		quote:
			'“The first time I ran our Berlin stand-up in German, my teammates said my summary was clearer than in English. I didn’t expect that.”',
		author: {
			name: 'Lina R.',
			role: 'Product manager at a fintech startup',
			location: 'Berlin'
		},
		context:
			'Lina’s new role demanded German stand-ups twice a week. She felt slow and translated in her head mid-sentence.',
		result:
			'By recording a short Kaiwa practice run on the train, she hit record, listened back, and tweaked key transitions. The difference was immediate.',
		playbook: [
			{
				title: 'Compress updates into three beats',
				tip: 'Kaiwa helped her drill a status → blocker → ask format that fits inside 45 seconds.'
			},
			{
				title: 'Use the same transition phrases every time',
				tip: '“Als Nächstes” and “Daraus folgt” became anchors, so she sounded decisive instead of hesitant.'
			},
			{
				title: 'Replay and mark one improvement',
				tip: 'She listened to the AI’s recap and jotted a single tweak before hopping off the train.'
			}
		],
		action: {
			label: 'Run a stand-up dry run',
			description: 'Practice the “Stakeholder update” scenario with your latest blockers.',
			urlPath: '/?scenario=stakeholder-update-briefing'
		}
	},
	{
		id: 'travel-border-agent-confidence',
		learningGoal: 'Travel',
		headline: 'Landing without the airport panic',
		subheadline: 'Practice sprints rewired how Nadia handles stressful checkpoints.',
		quote:
			'“Customs used to make me panic. Now I hear the questions before they’re asked, because I drilled them on the plane.”',
		author: {
			name: 'Nadia M.',
			role: 'Freelance photographer',
			location: 'Lisbon → São Paulo → Lisbon'
		},
		context:
			'Nadia flies constantly for shoots. Portuguese is new, and airport conversations were the most stressful part of her trips.',
		result:
			'Micro-sessions during boarding gave her calm repetition. She landed already warmed up, so small talk with agents felt automatic.',
		playbook: [
			{
				title: 'Stack practice onto an unavoidable wait',
				tip: 'She always runs a Kaiwa scenario once the plane door closes. No distractions, easy habit.'
			},
			{
				title: 'Capture the one tricky follow-up question',
				tip: 'If security throws a curveball, she writes it down and forces Kaiwa to rehearse it next flight.'
			},
			{
				title: 'Document the win immediately',
				tip: 'She logs the successful exchange in Kaiwa’s notes, which becomes her growing playbook.'
			}
		],
		action: {
			label: 'Run the border-control warmup',
			description: 'Try the “Arrival & customs check” scenario before your next flight.',
			urlPath: '/?scenario=airport-customs-check'
		}
	},
	{
		id: 'culture-volunteer-confidence',
		learningGoal: 'Culture',
		headline: 'Speaking up in the community choir',
		subheadline: 'Weekly storytelling prompts helped Arturo contribute instead of watching.',
		quote:
			'“I used to nod along in silence. Now I share the goofy rehearsal stories the same night, in Spanish.”',
		author: {
			name: 'Arturo V.',
			role: 'Community choir volunteer',
			location: 'Austin'
		},
		context:
			'Arturo volunteers with a Spanish-speaking choir. He understood most directions but stayed quiet during post-rehearsal hangs.',
		result:
			'He built a habit of practicing one rehearsal story with Kaiwa on the drive home, so he arrived at the after-party ready to contribute.',
		playbook: [
			{
				title: 'Capture the moment while emotions are high',
				tip: 'Kaiwa helps him recreate the rehearsal scene immediately while it’s vivid.'
			},
			{
				title: 'Drill the punchline twice',
				tip: 'He repeats the funniest detail until it flows naturally.'
			},
			{
				title: 'Use the same opener every week',
				tip: '“Tengo una anécdota rápida” became his comfortable entry point.'
			}
		],
		action: {
			label: 'Tell tonight’s rehearsal story',
			description: 'Use the “Story time with friends” scenario right after your next event.',
			urlPath: '/?scenario=share-evening-story'
		}
	},
	{
		id: 'academic-office-hours',
		learningGoal: 'Academic',
		headline: 'Owning office hours in a second language',
		subheadline: 'Kaiwa dry runs turned a quiet grad student into a confident asker.',
		quote:
			'“I stopped rewriting questions 12 times. Practicing the conversation first meant I could listen during office hours instead of panic.”',
		author: {
			name: 'Diya S.',
			role: 'Graduate student in Machine Learning',
			location: 'Toronto'
		},
		context:
			'Diya’s professors expect fast, precise questions during office hours. English is her second language, and she felt slow forming her thoughts aloud.',
		result:
			'She rehearsed each office hour session in Kaiwa, practicing follow-up questions and interjections aligned with academic norms.',
		playbook: [
			{
				title: 'Outline the goal, not the script',
				tip: 'She wrote the outcome she needed, then let Kaiwa pressure-test her explanation.'
			},
			{
				title: 'Practice interrupting politely',
				tip: 'Kaiwa coached her through phrases like “Can I zoom in on that equation?” so she could steer the conversation.'
			},
			{
				title: 'Summarize learnings in the target language',
				tip: 'After office hours she recapped what she understood to cement new vocabulary.'
			}
		],
		action: {
			label: 'Run a professor Q&A dry run',
			description: 'Try the “Academic office hours” scenario with your upcoming question.',
			urlPath: '/?scenario=academic-office-hours'
		}
	},
	{
		id: 'growth-self-reflection',
		learningGoal: 'Growth',
		headline: 'A five-minute “win debrief” that stuck',
		subheadline: 'Confidence journaling in the target language rewired how Sam tracks momentum.',
		quote:
			'“I used to tick boxes. Now my nightly recap sounds like I’m talking to a coach who knows the language I’m chasing.”',
		author: {
			name: 'Sam T.',
			role: 'Software engineer learning Korean',
			location: 'Seattle'
		},
		context:
			'Sam wanted to feel the growth each day, not just count minutes. He struggled to notice progress.',
		result:
			'A short Kaiwa reflection nightly helped him name one micro win and one micro challenge. He now sees compounding progress.',
		playbook: [
			{
				title: 'Keep the reflection under three prompts',
				tip: 'Win, challenge, next micro experiment. Any longer and he skipped it.'
			},
			{
				title: 'Speak, don’t type',
				tip: 'Saying the reflection aloud forced him to own the pronunciation.'
			},
			{
				title: 'Save one phrase to reuse tomorrow',
				tip: 'He copies a favorite sentence into his reminder email so the next session starts with a win.'
			}
		],
		action: {
			label: 'Record tonight’s win debrief',
			description: 'Use the “Growth reflection” scenario before you wrap for the night.',
			urlPath: '/?scenario=confidence-journal'
		}
	}
];
