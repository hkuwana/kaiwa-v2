// 🎭 Hyper-Specific Cultural Traits
// City/region-specific personality types that are surprisingly accurate and shareable

import type { CultureType, ConversationTraits } from '../types/cultural-dna.types';

// Extended culture types with city/regional specificity
export type HyperSpecificCultureType =
	// English variants
	| 'london_tube_commuter' | 'brooklyn_hipster' | 'silicon_valley_optimist' | 'australian_larrikin'
	// German variants
	| 'berlin_efficiency_expert' | 'bavarian_gemutlichkeit' | 'hamburg_maritime_direct'
	// French variants
	| 'parisian_intellectual' | 'lyon_food_critic' | 'nice_vacation_philosopher'
	// Spanish variants
	| 'madrid_night_owl' | 'barcelona_creative' | 'seville_family_gatherer'
	// Italian variants
	| 'milanese_fashion_critic' | 'roman_storyteller' | 'neapolitan_passionate'
	// Japanese variants
	| 'tokyo_salaryman' | 'kyoto_traditional_diplomat' | 'osaka_comedian'
	// Chinese variants
	| 'beijing_authority_respecter' | 'shanghai_business_networker' | 'guangzhou_pragmatic_trader'
	// Korean variants
	| 'seoul_hierarchical_perfectionist' | 'busan_coastal_direct' | 'jeju_island_peaceful'
	// Portuguese variants
	| 'lisbon_melancholic_poet' | 'rio_beach_philosopher' | 'sao_paulo_hustle_culture'
	// Arabic variants
	| 'dubai_international_connector' | 'cairo_storytelling_historian' | 'marrakech_hospitality_master'
	// Other specific types
	| 'amsterdam_blunt_cyclist' | 'istanbul_bridge_cultural' | 'mumbai_bollywood_dramatic'
	| 'moscow_stoic_survivor' | 'hanoi_family_consensus' | 'manila_relationship_harmony'
	| 'jakarta_humble_community';

// Hyper-specific cultural mappings with unexpected traits
export const hyperSpecificTraitMappings: Record<HyperSpecificCultureType, ConversationTraits & {
	unexpectedTrait: string;
	funnyScenario: string;
	viralDescription: string;
}> = {
	// English variants
	london_tube_commuter: {
		conflictStyle: 'avoidant',
		emotionalExpression: 'reserved',
		decisionMaking: 'individual',
		formalityLevel: 'formal',
		communicationPace: 'moderate',
		unexpectedTrait: 'Apologizes even when others bump into them',
		funnyScenario: 'Says "sorry" to an automatic door that doesn\'t open fast enough',
		viralDescription: 'Polite to a fault, treats queuing as a spiritual practice'
	},
	brooklyn_hipster: {
		conflictStyle: 'diplomatic',
		emotionalExpression: 'expressive',
		decisionMaking: 'individual',
		formalityLevel: 'casual',
		communicationPace: 'fast',
		unexpectedTrait: 'Judges coffee shops by their Instagram-ability',
		funnyScenario: 'Explains why their vintage camera takes better photos than your iPhone',
		viralDescription: 'Artisanal everything, knows a "better place" for whatever you suggest'
	},
	silicon_valley_optimist: {
		conflictStyle: 'diplomatic',
		emotionalExpression: 'warm',
		decisionMaking: 'collaborative',
		formalityLevel: 'casual',
		communicationPace: 'rapid',
		unexpectedTrait: 'Turns every conversation into a potential startup idea',
		funnyScenario: 'Describes their grocery list as "disrupting food acquisition workflows"',
		viralDescription: 'Everything is "amazing," every problem has an app solution'
	},
	australian_larrikin: {
		conflictStyle: 'direct',
		emotionalExpression: 'warm',
		decisionMaking: 'individual',
		formalityLevel: 'casual',
		communicationPace: 'fast',
		unexpectedTrait: 'Calls everyone "mate" including their boss and their mother',
		funnyScenario: 'Argues that putting pineapple on pizza is less controversial than their coffee preferences',
		viralDescription: 'Laid-back until someone insults their sports team, then it\'s personal'
	},

	// German variants
	berlin_efficiency_expert: {
		conflictStyle: 'direct',
		emotionalExpression: 'reserved',
		decisionMaking: 'individual',
		formalityLevel: 'casual',
		communicationPace: 'fast',
		unexpectedTrait: 'Schedules spontaneous activities in their calendar',
		funnyScenario: 'Arrives exactly 3 minutes early to everything, considers this "fashionably late"',
		viralDescription: 'Direct but cool, treats small talk like a waste of renewable energy'
	},
	bavarian_gemutlichkeit: {
		conflictStyle: 'harmonious',
		emotionalExpression: 'warm',
		decisionMaking: 'consensus',
		formalityLevel: 'casual',
		communicationPace: 'slow',
		unexpectedTrait: 'Believes every problem can be solved over beer and pretzels',
		funnyScenario: 'Mediates friend group drama by organizing a group hiking trip',
		viralDescription: 'Gemütlich energy, turns conflicts into cozy conversations'
	},
	hamburg_maritime_direct: {
		conflictStyle: 'direct',
		emotionalExpression: 'reserved',
		decisionMaking: 'individual',
		formalityLevel: 'formal',
		communicationPace: 'moderate',
		unexpectedTrait: 'Uses nautical metaphors for everything, including dating',
		funnyScenario: 'Describes their relationship status as "anchored but ready to sail"',
		viralDescription: 'Straightforward as a ship\'s compass, weather-tested emotional stability'
	},

	// French variants
	parisian_intellectual: {
		conflictStyle: 'diplomatic',
		emotionalExpression: 'expressive',
		decisionMaking: 'individual',
		formalityLevel: 'formal',
		communicationPace: 'moderate',
		unexpectedTrait: 'Judges people by their choice of bookstore, not books',
		funnyScenario: 'Spends 20 minutes explaining why their café choice reflects their worldview',
		viralDescription: 'Philosophical about everything, including the "correct" way to eat croissants'
	},
	lyon_food_critic: {
		conflictStyle: 'diplomatic',
		emotionalExpression: 'expressive',
		decisionMaking: 'individual',
		formalityLevel: 'formal',
		communicationPace: 'slow',
		unexpectedTrait: 'Considers meal planning a form of cultural preservation',
		funnyScenario: 'Gets personally offended when someone puts ketchup on anything',
		viralDescription: 'Every meal is a cultural event, every ingredient has a story'
	},
	nice_vacation_philosopher: {
		conflictStyle: 'avoidant',
		emotionalExpression: 'warm',
		decisionMaking: 'collaborative',
		formalityLevel: 'casual',
		communicationPace: 'slow',
		unexpectedTrait: 'Finds deep meaning in Mediterranean sunsets and overpriced rosé',
		funnyScenario: 'Describes their unemployment as "taking time to find life\'s true rhythm"',
		viralDescription: 'Eternally relaxed, treats urgency as a northern European myth'
	},

	// Spanish variants
	madrid_night_owl: {
		conflictStyle: 'direct',
		emotionalExpression: 'expressive',
		decisionMaking: 'individual',
		formalityLevel: 'casual',
		communicationPace: 'rapid',
		unexpectedTrait: 'Considers dinner before 10pm as "afternoon snack timing"',
		funnyScenario: 'Suggests starting the party "early" at midnight',
		viralDescription: 'Peak energy at 2am, considers 9-5 jobs a form of time zone discrimination'
	},
	barcelona_creative: {
		conflictStyle: 'diplomatic',
		emotionalExpression: 'expressive',
		decisionMaking: 'collaborative',
		formalityLevel: 'casual',
		communicationPace: 'moderate',
		unexpectedTrait: 'Sees artistic potential in urban architecture and breakfast presentations',
		funnyScenario: 'Takes Instagram photos of their coffee foam art before every important conversation',
		viralDescription: 'Gaudí-level creativity in daily life, treats mundane moments as art projects'
	},
	seville_family_gatherer: {
		conflictStyle: 'harmonious',
		emotionalExpression: 'dramatic',
		decisionMaking: 'consensus',
		formalityLevel: 'casual',
		communicationPace: 'moderate',
		unexpectedTrait: 'Believes every celebration requires at least 3 generations present',
		funnyScenario: 'Invites extended family to "small" birthday party, 47 people show up',
		viralDescription: 'Family-first energy, turns grocery shopping into multi-generational events'
	},

	// Italian variants
	milanese_fashion_critic: {
		conflictStyle: 'direct',
		emotionalExpression: 'expressive',
		decisionMaking: 'individual',
		formalityLevel: 'formal',
		communicationPace: 'fast',
		unexpectedTrait: 'Notices when people wear the same outfit twice in a month',
		funnyScenario: 'Gives unsolicited style advice to delivery drivers',
		viralDescription: 'Runway-ready daily, considers good taste a moral obligation'
	},
	roman_storyteller: {
		conflictStyle: 'diplomatic',
		emotionalExpression: 'dramatic',
		decisionMaking: 'individual',
		formalityLevel: 'casual',
		communicationPace: 'moderate',
		unexpectedTrait: 'Relates every modern situation to something that happened during the Empire',
		funnyScenario: 'Explains traffic jams by referencing Caesar\'s military strategies',
		viralDescription: 'Living history book, makes grocery shopping sound like an epic saga'
	},
	neapolitan_passionate: {
		conflictStyle: 'direct',
		emotionalExpression: 'dramatic',
		decisionMaking: 'collaborative',
		formalityLevel: 'casual',
		communicationPace: 'rapid',
		unexpectedTrait: 'Argues about pizza toppings with the intensity of a UN diplomat',
		funnyScenario: 'Starts a heated family debate about the "correct" way to fold napkins',
		viralDescription: 'Peak Italian energy, treats every conversation like a passionate TED talk'
	},

	// Japanese variants
	tokyo_salaryman: {
		conflictStyle: 'harmonious',
		emotionalExpression: 'reserved',
		decisionMaking: 'hierarchical',
		formalityLevel: 'formal',
		communicationPace: 'moderate',
		unexpectedTrait: 'Bows slightly while talking on the phone',
		funnyScenario: 'Apologizes to vending machine when it doesn\'t accept wrinkled bills',
		viralDescription: 'Next-level politeness, treats punctuality as a spiritual practice'
	},
	kyoto_traditional_diplomat: {
		conflictStyle: 'avoidant',
		emotionalExpression: 'reserved',
		decisionMaking: 'consensus',
		formalityLevel: 'ceremonial',
		communicationPace: 'slow',
		unexpectedTrait: 'Considers silence more eloquent than words',
		funnyScenario: 'Spends 10 minutes choosing the perfect emoji to convey subtle seasonal feelings',
		viralDescription: 'Ancient wisdom meets modern problems, masters of meaningful pauses'
	},
	osaka_comedian: {
		conflictStyle: 'diplomatic',
		emotionalExpression: 'expressive',
		decisionMaking: 'collaborative',
		formalityLevel: 'casual',
		communicationPace: 'fast',
		unexpectedTrait: 'Finds humor in the most mundane daily situations',
		funnyScenario: 'Makes the convenience store clerk laugh while buying serious business supplies',
		viralDescription: 'Comedy-first approach to life, believes laughter is the best business strategy'
	},

	// Chinese variants
	beijing_authority_respecter: {
		conflictStyle: 'diplomatic',
		emotionalExpression: 'reserved',
		decisionMaking: 'hierarchical',
		formalityLevel: 'formal',
		communicationPace: 'slow',
		unexpectedTrait: 'Considers proper seating arrangements crucial for successful meetings',
		funnyScenario: 'Spends more time planning the protocol than the actual event',
		viralDescription: 'Respect-based hierarchy, treats etiquette as strategic advantage'
	},
	shanghai_business_networker: {
		conflictStyle: 'diplomatic',
		emotionalExpression: 'warm',
		decisionMaking: 'collaborative',
		formalityLevel: 'balanced',
		communicationPace: 'fast',
		unexpectedTrait: 'Sees every social interaction as potential business opportunity',
		funnyScenario: 'Exchanges business cards at their cousin\'s wedding',
		viralDescription: 'Global mindset, treats relationship-building as high art'
	},
	guangzhou_pragmatic_trader: {
		conflictStyle: 'direct',
		emotionalExpression: 'reserved',
		decisionMaking: 'individual',
		formalityLevel: 'casual',
		communicationPace: 'fast',
		unexpectedTrait: 'Negotiates better deals on everything, including friendship terms',
		funnyScenario: 'Haggles for bulk discounts at upscale restaurants',
		viralDescription: 'Deal-making instincts, finds the practical solution to everything'
	},

	// Korean variants
	seoul_hierarchical_perfectionist: {
		conflictStyle: 'harmonious',
		emotionalExpression: 'reserved',
		decisionMaking: 'hierarchical',
		formalityLevel: 'formal',
		communicationPace: 'moderate',
		unexpectedTrait: 'Uses different speech levels when talking to houseplants vs. pets',
		funnyScenario: 'Apologizes to senior colleagues for breathing too loudly in meetings',
		viralDescription: 'Respect-driven excellence, perfectionism meets traditional hierarchy'
	},
	busan_coastal_direct: {
		conflictStyle: 'direct',
		emotionalExpression: 'warm',
		decisionMaking: 'individual',
		formalityLevel: 'casual',
		communicationPace: 'fast',
		unexpectedTrait: 'Speaks to everyone like they\'ve been friends since childhood',
		funnyScenario: 'Calls their CEO "hyung" and somehow gets promoted',
		viralDescription: 'Port city energy, treats formality as mainland nonsense'
	},
	jeju_island_peaceful: {
		conflictStyle: 'harmonious',
		emotionalExpression: 'warm',
		decisionMaking: 'consensus',
		formalityLevel: 'casual',
		communicationPace: 'slow',
		unexpectedTrait: 'Measures time by seasons rather than clocks',
		funnyScenario: 'Suggests solving work stress by watching tangerine trees grow',
		viralDescription: 'Island time mentality, treats urgency as a mainland psychological disorder'
	},

	// Portuguese variants
	lisbon_melancholic_poet: {
		conflictStyle: 'avoidant',
		emotionalExpression: 'expressive',
		decisionMaking: 'individual',
		formalityLevel: 'formal',
		communicationPace: 'slow',
		unexpectedTrait: 'Finds existential meaning in everyday tram rides',
		funnyScenario: 'Writes emotional fado lyrics about waiting for the bus',
		viralDescription: 'Saudade energy, turns mundane moments into poetic contemplations'
	},
	rio_beach_philosopher: {
		conflictStyle: 'harmonious',
		emotionalExpression: 'dramatic',
		decisionMaking: 'collaborative',
		formalityLevel: 'casual',
		communicationPace: 'moderate',
		unexpectedTrait: 'Believes all life problems can be solved with beach volleyball and açaí',
		funnyScenario: 'Suggests team-building exercises should happen in bikinis',
		viralDescription: 'Carioca wisdom, treats stress as a temporary weather condition'
	},
	sao_paulo_hustle_culture: {
		conflictStyle: 'direct',
		emotionalExpression: 'expressive',
		decisionMaking: 'individual',
		formalityLevel: 'casual',
		communicationPace: 'rapid',
		unexpectedTrait: 'Drinks coffee like it\'s a competitive sport',
		funnyScenario: 'Schedules lunch meetings during their lunch meetings',
		viralDescription: 'Paulistano energy, treats relaxation as a productivity optimization strategy'
	},

	// Arabic variants
	dubai_international_connector: {
		conflictStyle: 'diplomatic',
		emotionalExpression: 'warm',
		decisionMaking: 'individual',
		formalityLevel: 'formal',
		communicationPace: 'fast',
		unexpectedTrait: 'Seamlessly switches between 4 languages in a single conversation',
		funnyScenario: 'Orders dinner in English, haggles in Arabic, and tips in emoji',
		viralDescription: 'Global hub mentality, treats cultural mixing as daily routine'
	},
	cairo_storytelling_historian: {
		conflictStyle: 'diplomatic',
		emotionalExpression: 'dramatic',
		decisionMaking: 'consensus',
		formalityLevel: 'formal',
		communicationPace: 'slow',
		unexpectedTrait: 'Relates every current event to something that happened during the Pharaohs',
		funnyScenario: 'Explains modern politics through ancient pyramid construction techniques',
		viralDescription: '5000-year perspective, makes waiting in line sound like historical destiny'
	},
	marrakech_hospitality_master: {
		conflictStyle: 'harmonious',
		emotionalExpression: 'warm',
		decisionMaking: 'collaborative',
		formalityLevel: 'formal',
		communicationPace: 'slow',
		unexpectedTrait: 'Insists on feeding everyone who enters their house, including delivery drivers',
		funnyScenario: 'Invites Uber driver in for mint tea and life advice',
		viralDescription: 'Hospitality as high art, treats guest comfort as personal mission'
	},

	// Other specific variants
	amsterdam_blunt_cyclist: {
		conflictStyle: 'direct',
		emotionalExpression: 'warm',
		decisionMaking: 'consensus',
		formalityLevel: 'casual',
		communicationPace: 'fast',
		unexpectedTrait: 'Judges people by their cycling etiquette more than their personality',
		funnyScenario: 'Gives dating advice based on how they handle bike lane navigation',
		viralDescription: 'Brutally honest but friendly, treats directness as kindness'
	},
	istanbul_bridge_cultural: {
		conflictStyle: 'diplomatic',
		emotionalExpression: 'expressive',
		decisionMaking: 'collaborative',
		formalityLevel: 'balanced',
		communicationPace: 'moderate',
		unexpectedTrait: 'Seamlessly blends European logic with Middle Eastern hospitality',
		funnyScenario: 'Serves Turkish tea while explaining German engineering principles',
		viralDescription: 'East-meets-West energy, masters of cultural code-switching'
	},
	mumbai_bollywood_dramatic: {
		conflictStyle: 'direct',
		emotionalExpression: 'dramatic',
		decisionMaking: 'collaborative',
		formalityLevel: 'casual',
		communicationPace: 'rapid',
		unexpectedTrait: 'Tells everyday stories with Bollywood-level emotional intensity',
		funnyScenario: 'Describes their commute like it\'s an epic hero\'s journey with dance numbers',
		viralDescription: 'Maximum drama energy, treats mundane life as blockbuster entertainment'
	},
	moscow_stoic_survivor: {
		conflictStyle: 'direct',
		emotionalExpression: 'reserved',
		decisionMaking: 'individual',
		formalityLevel: 'formal',
		communicationPace: 'slow',
		unexpectedTrait: 'Considers -20°C weather "refreshing" and perfect for outdoor dining',
		funnyScenario: 'Complains that modern problems are "too easy" compared to Soviet times',
		viralDescription: 'Unbreakable spirit, treats adversity as Tuesday morning routine'
	},
	hanoi_family_consensus: {
		conflictStyle: 'harmonious',
		emotionalExpression: 'reserved',
		decisionMaking: 'consensus',
		formalityLevel: 'formal',
		communicationPace: 'slow',
		unexpectedTrait: 'Consults three generations before choosing lunch restaurant',
		funnyScenario: 'Calls family meeting to decide which Netflix show to watch',
		viralDescription: 'Collective wisdom approach, treats individual decisions as family democracy'
	},
	manila_relationship_harmony: {
		conflictStyle: 'harmonious',
		emotionalExpression: 'warm',
		decisionMaking: 'consensus',
		formalityLevel: 'casual',
		communicationPace: 'moderate',
		unexpectedTrait: 'Considers "pakikipagkapwa" essential for proper selfie-taking',
		funnyScenario: 'Includes extended family in group chats about grocery shopping decisions',
		viralDescription: 'Harmony-first mentality, treats conflict avoidance as relationship superpower'
	},
	jakarta_humble_community: {
		conflictStyle: 'avoidant',
		emotionalExpression: 'warm',
		decisionMaking: 'consensus',
		formalityLevel: 'casual',
		communicationPace: 'slow',
		unexpectedTrait: 'Apologizes for personal achievements as if they inconvenience others',
		funnyScenario: 'Downplays promotion as "just lucky coincidence, really not that important"',
		viralDescription: 'Humble excellence, treats personal success as community effort'
	}
};

// Mapping from language codes to possible hyper-specific culture types
export const languageToHyperCultures: Record<string, HyperSpecificCultureType[]> = {
	'en': ['london_tube_commuter', 'brooklyn_hipster', 'silicon_valley_optimist', 'australian_larrikin'],
	'de': ['berlin_efficiency_expert', 'bavarian_gemutlichkeit', 'hamburg_maritime_direct'],
	'fr': ['parisian_intellectual', 'lyon_food_critic', 'nice_vacation_philosopher'],
	'es': ['madrid_night_owl', 'barcelona_creative', 'seville_family_gatherer'],
	'it': ['milanese_fashion_critic', 'roman_storyteller', 'neapolitan_passionate'],
	'ja': ['tokyo_salaryman', 'kyoto_traditional_diplomat', 'osaka_comedian'],
	'zh': ['beijing_authority_respecter', 'shanghai_business_networker', 'guangzhou_pragmatic_trader'],
	'ko': ['seoul_hierarchical_perfectionist', 'busan_coastal_direct', 'jeju_island_peaceful'],
	'pt': ['lisbon_melancholic_poet', 'rio_beach_philosopher', 'sao_paulo_hustle_culture'],
	'ar': ['dubai_international_connector', 'cairo_storytelling_historian', 'marrakech_hospitality_master'],
	'nl': ['amsterdam_blunt_cyclist'],
	'tr': ['istanbul_bridge_cultural'],
	'hi': ['mumbai_bollywood_dramatic'],
	'ru': ['moscow_stoic_survivor'],
	'vi': ['hanoi_family_consensus'],
	'fil': ['manila_relationship_harmony'],
	'id': ['jakarta_humble_community']
};

// Get hyper-specific cultures for a language
export function getHyperCulturesForLanguage(languageCode: string): HyperSpecificCultureType[] {
	return languageToHyperCultures[languageCode] || [];
}

// Get hyper-specific trait data
export function getHyperSpecificTrait(culture: HyperSpecificCultureType) {
	return hyperSpecificTraitMappings[culture];
}