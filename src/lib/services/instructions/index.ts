// src/lib/services/instructions/index.ts
// Main export file for agile instruction system

// Core composer
export {
	InstructionComposer,
	composeInstructions,
	createComposer,
	composeWithParameters,
	type InstructionComposerOptions
} from './composer';

// Parameters
export {
	type InstructionParameters,
	type SpeakingSpeed,
	type SentenceLength,
	type PauseFrequency,
	type VocabularyComplexity,
	type GrammarComplexity,
	type ScaffoldingLevel,
	type CorrectionStyle,
	type LanguageMixingPolicy,
	type EncouragementFrequency,
	type ConversationPace,
	type TopicChangeFrequency,
	PARAMETER_PRESETS,
	getParametersForCEFR,
	mergeParameters,
	parametersToInstructions,
	SPEAKING_SPEED_RULES,
	SENTENCE_LENGTH_RULES,
	PAUSE_FREQUENCY_RULES,
	VOCABULARY_COMPLEXITY_RULES,
	GRAMMAR_COMPLEXITY_RULES,
	SCAFFOLDING_RULES,
	CORRECTION_STYLE_RULES,
	LANGUAGE_MIXING_RULES,
	ENCOURAGEMENT_RULES,
	CONVERSATION_PACE_RULES,
	TOPIC_CHANGE_RULES
} from './parameters';
