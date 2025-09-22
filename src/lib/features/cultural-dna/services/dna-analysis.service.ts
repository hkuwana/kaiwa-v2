// 🧬 Cultural DNA Analysis Service
// Core logic for analyzing conversation patterns and generating cultural personality results

import type {
	DNAAssessmentSession,
	CulturalDNA,
	ConversationTraits,
	CulturalMix,
	CulturalCompatibility,
	DNAPersonalityType,
	ShareableData
} from '../types/cultural-dna.types';
import { culturalTraitMappings, culturalDescriptors } from '../data/cultural-traits';
import { hyperSpecificTraitMappings, languageToHyperCultures } from '../data/hyper-specific-traits';
import {
	viralPersonalityArchetypes
} from '../data/viral-personality-archetypes';
import { viralScenarios } from '../data/viral-scenarios';

// Use the viral personality archetypes
const personalityArchetypes = viralPersonalityArchetypes;

// Main analysis function
export function analyzeCulturalDNA(session: DNAAssessmentSession): CulturalDNA {
	console.log('🧬 Analyzing Cultural DNA for session:', session.sessionId);

	// Analyze conversation traits from responses
	const traits = analyzeConversationTraits(session);
	console.log('📊 Extracted traits:', traits);

	// Find best matching cultural mix
	const culturalMix = calculateCulturalMix(traits, session);
	console.log('🌍 Cultural mix:', culturalMix);

	// Determine personality type
	const personalityType = determinePersonalityType(traits, culturalMix);
	console.log('🎭 Personality type:', personalityType);

	// Calculate compatibility
	const compatibility = calculateCompatibility(traits, culturalMix);

	// Generate shareable data
	const shareableData = generateShareableData(personalityType, culturalMix, session.sessionId);

	const result: CulturalDNA = {
		id: `dna_${session.sessionId}`,
		personalityType: personalityType.name,
		culturalMix,
		traits,
		compatibility,
		createdAt: new Date(),
		shareableData
	};

	console.log('✨ DNA analysis complete:', result.personalityType);
	return result;
}

// Extract conversation traits from user responses
function analyzeConversationTraits(session: DNAAssessmentSession): ConversationTraits {
	const responses = session.responses;
	if (responses.length === 0) {
		// Return default traits if no responses
		return {
			conflictStyle: 'diplomatic',
			emotionalExpression: 'warm',
			decisionMaking: 'collaborative',
			formalityLevel: 'balanced',
			communicationPace: 'moderate'
		};
	}

	// Aggregate traits based on scenario weights and response analysis
	const aggregatedTraits = {
		conflictStyle: 0,
		emotionalExpression: 0,
		decisionMaking: 0,
		formalityLevel: 0,
		communicationPace: 0
	};

	responses.forEach((response) => {
		const scenario = viralScenarios.find((s) => s.id === response.scenarioId);
		if (!scenario) return;

		// Analyze response content for trait indicators
		const responseTraits = analyzeResponseContent(response.audioTranscript, scenario.id);

		// Apply weighted contributions
		Object.entries(scenario.analysisWeights).forEach(([trait, weight]) => {
			const traitKey = trait as keyof typeof aggregatedTraits;
			const traitValue = getTraitScore(
				responseTraits[traitKey as keyof ConversationTraits] || 'moderate'
			);
			aggregatedTraits[traitKey] += traitValue * weight;
		});
	});

	// Convert scores back to trait names
	return {
		conflictStyle: scoreToConflictStyle(aggregatedTraits.conflictStyle),
		emotionalExpression: scoreToEmotionalExpression(aggregatedTraits.emotionalExpression),
		decisionMaking: scoreToDecisionMaking(aggregatedTraits.decisionMaking),
		formalityLevel: scoreToFormalityLevel(aggregatedTraits.formalityLevel),
		communicationPace: scoreToCommunicationPace(aggregatedTraits.communicationPace)
	};
}

// Analyze response content for trait indicators with hyper-specific cultural detection
function analyzeResponseContent(
	transcript: string,
	scenarioId: string
): Partial<ConversationTraits> {
	const text = transcript.toLowerCase();
	const traits: Partial<ConversationTraits> = {};

	// Enhanced conflict style analysis with cultural markers
	if (
		text.includes('excuse me') ||
		text.includes('sorry') ||
		text.includes('pardon') ||
		text.includes('sumimasen')
	) {
		traits.conflictStyle = 'diplomatic';
	} else if (
		text.includes('hey') ||
		text.includes("that's not fair") ||
		text.includes('you cut') ||
		text.includes('wat doe je')
	) {
		traits.conflictStyle = 'direct';
	} else if (
		text.includes('whatever') ||
		text.includes('fine') ||
		text.includes("doesn't matter") ||
		text.includes('never mind')
	) {
		traits.conflictStyle = 'avoidant';
	} else {
		traits.conflictStyle = 'harmonious';
	}

	// Enhanced emotional expression with cultural intensity markers
	const dramaticWords = [
		'absolutely',
		'incredible',
		'disaster',
		'magnificent',
		'terrible',
		'fantastic'
	];
	const expressiveWords = ['love', 'hate', 'amazing', 'awful', 'feel', 'excited', 'upset'];
	const reservedWords = ['i think', 'perhaps', 'maybe', 'possibly', 'somewhat', 'rather'];

	const hasDramaticWords = dramaticWords.some((word) => text.includes(word));
	const hasExpressiveWords = expressiveWords.some((word) => text.includes(word));
	const hasReservedWords = reservedWords.some((word) => text.includes(word));

	if (text.includes('!') && (hasDramaticWords || text.length > 80)) {
		traits.emotionalExpression = 'dramatic';
	} else if (hasExpressiveWords || text.includes('!')) {
		traits.emotionalExpression = 'expressive';
	} else if (hasReservedWords || text.includes('...')) {
		traits.emotionalExpression = 'reserved';
	} else {
		traits.emotionalExpression = 'warm';
	}

	// Enhanced formality with cultural politeness markers
	const formalMarkers = [
		'sir',
		"ma'am",
		'please accept my apologies',
		'i would be honored',
		'sensei',
		'sama'
	];
	const casualMarkers = ['hey', 'dude', 'yeah', 'nah', 'sup', 'mate', 'bro'];
	const ceremonialMarkers = ['deeply sorry', 'humbly request', 'with great respect'];

	if (ceremonialMarkers.some((marker) => text.includes(marker))) {
		traits.formalityLevel = 'ceremonial';
	} else if (formalMarkers.some((marker) => text.includes(marker))) {
		traits.formalityLevel = 'formal';
	} else if (casualMarkers.some((marker) => text.includes(marker))) {
		traits.formalityLevel = 'casual';
	} else {
		traits.formalityLevel = 'balanced';
	}

	// Enhanced decision making style based on scenario-specific responses
	if (scenarioId === 'family-dinner-invitation') {
		if (text.includes('family') || text.includes('together') || text.includes('we should')) {
			traits.decisionMaking = 'consensus';
		} else if (text.includes('i need to') || text.includes('my schedule')) {
			traits.decisionMaking = 'individual';
		} else if (text.includes('hierarchy') || text.includes('proper')) {
			traits.decisionMaking = 'hierarchical';
		} else {
			traits.decisionMaking = 'collaborative';
		}
	} else {
		// General decision making analysis
		if (text.includes("let's discuss") || text.includes('what do you think')) {
			traits.decisionMaking = 'collaborative';
		} else if (text.includes('everyone should') || text.includes('group decision')) {
			traits.decisionMaking = 'consensus';
		} else if (text.includes('i will') || text.includes('my choice')) {
			traits.decisionMaking = 'individual';
		} else {
			traits.decisionMaking = 'hierarchical';
		}
	}

	// Enhanced communication pace with cultural timing markers
	const rapidMarkers = ['quick', 'fast', 'asap', 'immediately', 'right now'];
	const slowMarkers = ['carefully', 'thoughtfully', 'when the time is right', 'patience'];

	if (rapidMarkers.some((marker) => text.includes(marker)) || text.length < 15) {
		traits.communicationPace = 'rapid';
	} else if (text.length < 30) {
		traits.communicationPace = 'fast';
	} else if (slowMarkers.some((marker) => text.includes(marker)) || text.length > 120) {
		traits.communicationPace = 'slow';
	} else {
		traits.communicationPace = 'moderate';
	}

	return traits;
}

// Calculate cultural mix based on traits and language context
function calculateCulturalMix(
	traits: ConversationTraits,
	session: DNAAssessmentSession
): CulturalMix[] {
	const culturalScores: Record<string, number> = {};
	const languageCode = session.selectedLanguage.code;

	// Get hyper-specific cultures for this language
	const hyperCultures = languageToHyperCultures[languageCode] || [];

	// Score hyper-specific cultures first (higher weight)
	hyperCultures.forEach((hyperCulture) => {
		const hyperTraits = hyperSpecificTraitMappings[hyperCulture];
		if (hyperTraits) {
			let score = 0;
			let matchCount = 0;

			Object.entries(traits).forEach(([trait, value]) => {
				const traitKey = trait as keyof ConversationTraits;
				if (hyperTraits[traitKey] === value) {
					score += 30; // Higher weight for hyper-specific matches
					matchCount++;
				} else {
					score += 8; // Partial credit
				}
			});

			// Bonus for language-specific cultural accuracy
			score += 15;
			culturalScores[hyperCulture] = score;
		}
	});

	// Score basic cultures (lower weight)
	Object.entries(culturalTraitMappings).forEach(([culture, cultureTraits]) => {
		let score = 0;
		let matchCount = 0;

		Object.entries(traits).forEach(([trait, value]) => {
			const traitKey = trait as keyof ConversationTraits;
			if (cultureTraits[traitKey] === value) {
				score += 20; // Perfect match
				matchCount++;
			} else {
				score += 5; // Partial credit for having the trait
			}
		});

		// Only add if not already covered by hyper-specific
		if (!hyperCultures.some((hc) => hc.includes(culture))) {
			culturalScores[culture] = score;
		}
	});

	// Get top 2-3 cultures
	const sortedCultures = Object.entries(culturalScores)
		.sort(([, a], [, b]) => b - a)
		.slice(0, 3);

	// Calculate percentages
	const totalScore = sortedCultures.reduce((sum, [, score]) => sum + score, 0);

	const culturalMix: CulturalMix[] = sortedCultures.map(([culture, score]) => {
		// Try to get traits from hyper-specific first, then fall back to basic
		const hyperTraits =
			hyperSpecificTraitMappings[culture as keyof typeof hyperSpecificTraitMappings];
		const basicTraits = culturalDescriptors[culture as keyof typeof culturalDescriptors];

		let dominantTraits: string[] = [];
		if (hyperTraits) {
			// Extract surprising traits for hyper-specific cultures
			dominantTraits = [
				hyperTraits.unexpectedTrait.split(' ')[0],
				hyperTraits.viralDescription.split(' ')[0],
				hyperTraits.viralDescription.split(' ')[1] || 'unique'
			];
		} else if (basicTraits) {
			dominantTraits = basicTraits.keywords.slice(0, 3);
		}

		return {
			culture: culture as any,
			percentage: Math.round((score / totalScore) * 100),
			dominantTraits
		};
	});

	// Ensure percentages add up to 100
	const totalPercentage = culturalMix.reduce((sum, mix) => sum + mix.percentage, 0);
	if (totalPercentage !== 100 && culturalMix.length > 0) {
		culturalMix[0].percentage += 100 - totalPercentage;
	}

	return culturalMix.filter((mix) => mix.percentage >= 15); // Only include significant percentages
}

// Determine personality archetype
function determinePersonalityType(
	traits: ConversationTraits,
	culturalMix: CulturalMix[]
): DNAPersonalityType {
	// For now, use a simple matching algorithm
	// In production, this could be more sophisticated

	const primaryCulture = culturalMix[0]?.culture || 'american';

	// Find best matching archetype based on primary culture
	let bestMatch = personalityArchetypes[0]; // Default
	let bestScore = 0;

	personalityArchetypes.forEach((archetype) => {
		let score = 0;

		// Score based on cultural mix similarity
		culturalMix.forEach((mix) => {
			const archetypeMix = archetype.culturalMix.find((am) => am.culture === mix.culture);
			if (archetypeMix) {
				score += Math.min(mix.percentage, archetypeMix.percentage);
			}
		});

		// Score based on trait similarity
		Object.entries(traits).forEach(([trait, value]) => {
			const traitKey = trait as keyof ConversationTraits;
			if (archetype.traits[traitKey] === value) {
				score += 10;
			}
		});

		if (score > bestScore) {
			bestScore = score;
			bestMatch = archetype;
		}
	});

	return bestMatch;
}

// Calculate cultural compatibility
function calculateCompatibility(
	traits: ConversationTraits,
	culturalMix: CulturalMix[]
): CulturalCompatibility {
	// This is a simplified version - could be much more sophisticated
	const primaryCulture = culturalMix[0]?.culture || 'american';

	return {
		perfectMatches: [primaryCulture as any],
		goodMatches: ['scandinavian', 'canadian'],
		growthAreas: ['italian', 'brazilian'],
		travelCompatibility: [
			{ culture: primaryCulture as any, compatibilityScore: 95, reason: 'Perfect cultural match' },
			{ culture: 'canadian', compatibilityScore: 85, reason: 'Similar communication values' }
		],
		relationshipStyle: {
			strengths: ['Clear communication', 'Respectful boundaries'],
			challenges: ['May seem reserved initially'],
			idealPartnerTraits: ['Patient', 'Understanding', 'Direct'],
			communicationTips: ['Express feelings directly', 'Ask for clarity when needed']
		}
	};
}

// Generate shareable data for social media with hyper-specific appeal
function generateShareableData(
	personalityType: DNAPersonalityType,
	culturalMix: CulturalMix[],
	sessionId: string
): ShareableData {
	const mixSummary = culturalMix
		.map((mix) => {
			// Check if it's a hyper-specific culture
			const hyperTraits =
				hyperSpecificTraitMappings[mix.culture as keyof typeof hyperSpecificTraitMappings];
			if (hyperTraits) {
				// Use the hyper-specific name (e.g., "Tokyo Salaryman" instead of "Japanese")
				const cultureName = mix.culture
					.split('_')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ');
				return `${mix.percentage}% ${cultureName}`;
			} else {
				// Fall back to basic culture name
				return `${mix.percentage}% ${culturalDescriptors[mix.culture as keyof typeof culturalDescriptors]?.name || mix.culture}`;
			}
		})
		.join(' + ');

	// Create more viral one-liner using dominant traits
	const primaryCulture = culturalMix[0]?.culture;
	const hyperTraits = primaryCulture
		? hyperSpecificTraitMappings[primaryCulture as keyof typeof hyperSpecificTraitMappings]
		: null;

	let oneLiner: string;
	if (hyperTraits) {
		// Use the unexpected trait for viral appeal
		oneLiner = hyperTraits.viralDescription;
	} else {
		// Fall back to basic traits
		const primaryTraits = culturalMix[0]?.dominantTraits || ['unique'];
		oneLiner = `${primaryTraits[0]} yet ${primaryTraits[1] || 'thoughtful'}, ${primaryTraits[2] || 'balanced'} but adaptable`;
	}

	// Generate viral hashtags
	const viralHashtags = [
		'CulturalDNA',
		'PersonalityTest',
		'LanguageLearning',
		'Kaiwa',
		personalityType.name.replace(/\s+/g, ''),
		...(primaryCulture ? [primaryCulture.split('_')[0]] : [])
	];

	return {
		headline: personalityType.name,
		personalityType: personalityType.name,
		culturalMixSummary: mixSummary,
		oneLineSummary: oneLiner,
		shareUrl: `/cultural-dna/results/${sessionId}`,
		hashtags: viralHashtags
	};
}

// Helper functions for trait scoring
function getTraitScore(trait: string): number {
	const scores: Record<string, number> = {
		direct: 4,
		diplomatic: 3,
		harmonious: 2,
		avoidant: 1,
		dramatic: 4,
		expressive: 3,
		warm: 2,
		reserved: 1,
		individual: 4,
		collaborative: 3,
		consensus: 2,
		hierarchical: 1,
		formal: 4,
		balanced: 3,
		casual: 2,
		ceremonial: 1,
		rapid: 4,
		fast: 3,
		moderate: 2,
		slow: 1
	};
	return scores[trait] || 2;
}

function scoreToConflictStyle(score: number): ConversationTraits['conflictStyle'] {
	if (score > 3.5) return 'direct';
	if (score > 2.5) return 'diplomatic';
	if (score > 1.5) return 'harmonious';
	return 'avoidant';
}

function scoreToEmotionalExpression(score: number): ConversationTraits['emotionalExpression'] {
	if (score > 3.5) return 'dramatic';
	if (score > 2.5) return 'expressive';
	if (score > 1.5) return 'warm';
	return 'reserved';
}

function scoreToDecisionMaking(score: number): ConversationTraits['decisionMaking'] {
	if (score > 3.5) return 'individual';
	if (score > 2.5) return 'collaborative';
	if (score > 1.5) return 'consensus';
	return 'hierarchical';
}

function scoreToFormalityLevel(score: number): ConversationTraits['formalityLevel'] {
	if (score > 3.5) return 'formal';
	if (score > 2.5) return 'balanced';
	if (score > 1.5) return 'casual';
	return 'ceremonial';
}

function scoreToCommunicationPace(score: number): ConversationTraits['communicationPace'] {
	if (score > 3.5) return 'rapid';
	if (score > 2.5) return 'fast';
	if (score > 1.5) return 'moderate';
	return 'slow';
}

// Generate mock DNA for testing with hyper-specific traits
export function generateMockDNA(): CulturalDNA {
	const mockArchetype =
		personalityArchetypes[Math.floor(Math.random() * personalityArchetypes.length)];

	// Generate mock shareable data with hyper-specific appeal
	const mixSummary = mockArchetype.culturalMix
		.map((mix) => {
			const hyperTraits =
				hyperSpecificTraitMappings[mix.culture as keyof typeof hyperSpecificTraitMappings];
			if (hyperTraits) {
				const cultureName = mix.culture
					.split('_')
					.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
					.join(' ');
				return `${mix.percentage}% ${cultureName}`;
			} else {
				return `${mix.percentage}% ${culturalDescriptors[mix.culture as keyof typeof culturalDescriptors]?.name || mix.culture}`;
			}
		})
		.join(' + ');

	return {
		id: `mock_${Date.now()}`,
		personalityType: mockArchetype.name,
		culturalMix: mockArchetype.culturalMix,
		traits: mockArchetype.traits,
		compatibility: {
			perfectMatches: ['berlin_efficiency_expert', 'tokyo_salaryman'],
			goodMatches: ['amsterdam_blunt_cyclist', 'seoul_hierarchical_perfectionist'],
			growthAreas: ['neapolitan_passionate', 'rio_beach_philosopher'],
			travelCompatibility: [
				{
					culture: 'berlin_efficiency_expert',
					compatibilityScore: 95,
					reason: 'Perfect efficiency wavelength'
				},
				{
					culture: 'kyoto_traditional_diplomat',
					compatibilityScore: 90,
					reason: 'Shared respect for thoughtful processes'
				}
			],
			relationshipStyle: {
				strengths: mockArchetype.career_strengths,
				challenges: [
					'Can be overly analytical about feelings',
					'May schedule romance too precisely'
				],
				idealPartnerTraits: ['Patient with systems', 'Appreciates efficiency', 'Values depth'],
				communicationTips: ['Be direct but respectful', 'Appreciate their methodical care']
			}
		},
		createdAt: new Date(),
		shareableData: {
			headline: mockArchetype.name,
			personalityType: mockArchetype.name,
			culturalMixSummary: mixSummary,
			oneLineSummary: mockArchetype.description,
			shareUrl: `/cultural-dna/results/mock_${Date.now()}`,
			hashtags: [
				'CulturalDNA',
				'PersonalityTest',
				'LanguageLearning',
				'Kaiwa',
				mockArchetype.name.replace(/\s+/g, '')
			]
		}
	};
}
