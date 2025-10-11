# Agile Instruction System

A parameter-driven, composable instruction system for OpenAI Realtime API that follows OpenAI's best practices.

## 🎯 Key Features

- **Agile Parameters**: Adjust speaking speed, difficulty, scaffolding, etc. in real-time
- **OpenAI Compliant**: Follows the official Realtime API prompting guide structure
- **Bullet-Based**: Uses bullets over paragraphs for better model comprehension
- **Scenario-Aware**: Automatically adapts to tutor/character/friend roles
- **CEFR-Driven**: Maps learner level to appropriate instruction parameters

## 📋 OpenAI Recommended Structure

Our composer generates instructions following this template:

```
# Role & Objective        — who you are and what "success" means
# Personality & Tone      — the voice and style to maintain
# Context                 — retrieved context, relevant info
# Reference Pronunciations — phonetic guides for tricky words
# Tools                   — names, usage rules, and preambles
# Instructions / Rules    — do's, don'ts, and approach
# Conversation Flow       — states, goals, and transitions
# Safety & Escalation     — fallback and handoff logic
```

## 🚀 Quick Start

### Basic Usage

```typescript
import { composeInstructions } from '$lib/services/instructions/composer';

const instructions = composeInstructions({
 user: currentUser,
 language: targetLanguage,
 preferences: userPreferences,
 scenario: selectedScenario,
 speaker: selectedSpeaker
});

// Use instructions with OpenAI Realtime API
const agent = new RealtimeAgent({
 name: speaker.voiceName,
 instructions: instructions,
 voice: speaker.id
});
```

### Dynamic Parameter Adjustment

```typescript
import { createComposer } from '$lib/services/instructions/composer';

// Create composer instance
const composer = createComposer({
 user: currentUser,
 language: targetLanguage,
 preferences: userPreferences
});

// Get initial instructions
let instructions = composer.compose();

// Later: Adjust speaking speed when learner struggles
instructions = composer.updateParameters({
 speakingSpeed: 'slow', // Slow down
 pauseFrequency: 'frequent', // Add more pauses
 scaffoldingLevel: 'heavy' // Provide more help
});

// Send update to session
session.updateInstructions(instructions);
```

### Custom Parameters

```typescript
import { composeWithParameters } from '$lib/services/instructions/composer';

const instructions = composeWithParameters(
 {
  user: currentUser,
  language: targetLanguage,
  preferences: userPreferences,
  scenario: grammarScenario
 },
 {
  // Custom overrides
  correctionStyle: 'explicit', // Tutor gives direct corrections
  speakingSpeed: 'slow', // Speak slowly
  sentenceLength: 'short', // Short sentences
  scaffoldingLevel: 'heavy', // Lots of support
  languageMixingPolicy: 'bilingual_support' // Allow native language help
 }
);
```

## 🎛️ Available Parameters

### Speaking Dynamics

- `speakingSpeed`: `'very_slow' | 'slow' | 'normal' | 'fast' | 'native'`
- `sentenceLength`: `'very_short' | 'short' | 'medium' | 'long' | 'native'`
- `pauseFrequency`: `'minimal' | 'moderate' | 'frequent'`

### Difficulty & Complexity

- `targetCEFR`: `'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'`
- `vocabularyComplexity`: `'basic' | 'everyday' | 'advanced' | 'specialized'`
- `grammarComplexity`: `'simple' | 'intermediate' | 'advanced' | 'native'`

### Support & Scaffolding

- `scaffoldingLevel`: `'none' | 'light' | 'medium' | 'heavy'`
- `correctionStyle`: `'explicit' | 'recast' | 'minimal' | 'none'`
- `languageMixingPolicy`: `'strict_immersion' | 'flexible' | 'bilingual_support' | 'code_switching'`

### Engagement & Pacing

- `encouragementFrequency`: `'minimal' | 'moderate' | 'frequent'`
- `conversationPace`: `'relaxed' | 'steady' | 'dynamic'`
- `topicChangeFrequency`: `'focused' | 'moderate' | 'exploratory'`

## 📦 Presets

Use pre-configured parameter sets:

```typescript
import { PARAMETER_PRESETS } from '$lib/services/instructions/parameters';

// Available presets:
PARAMETER_PRESETS.absolute_beginner;
PARAMETER_PRESETS.beginner;
PARAMETER_PRESETS.intermediate;
PARAMETER_PRESETS.upper_intermediate;
PARAMETER_PRESETS.advanced;
PARAMETER_PRESETS.native_like;
PARAMETER_PRESETS.tutor_explicit; // For grammar lessons
PARAMETER_PRESETS.conversation_partner; // For natural conversation
```

## 🎯 Real-Time Adjustments

### Responding to Learner Struggles

```typescript
// Detect frustration or repeated errors
if (errorCount >= 3) {
 instructions = composer.updateParameters({
  speakingSpeed: 'slow',
  scaffoldingLevel: 'heavy',
  sentenceLength: 'very_short',
  encouragementFrequency: 'frequent'
 });
 session.updateInstructions(instructions);
}
```

### Responding to Success

```typescript
// Learner is doing well - increase challenge
if (successStreak >= 5) {
 instructions = composer.updateParameters({
  speakingSpeed: 'normal',
  vocabularyComplexity: 'advanced',
  scaffoldingLevel: 'light'
 });
 session.updateInstructions(instructions);
}
```

### Switching Modes

```typescript
// Switch from conversation to explicit teaching
instructions = composer.updateParameters({
 correctionStyle: 'explicit', // Direct corrections
 scaffoldingLevel: 'heavy', // More support
 topicChangeFrequency: 'focused', // Stay on topic
 conversationPace: 'relaxed' // Slower pace
});
```

## 🔄 Migration from Old System

### Before (Old System)

```typescript
// Hardcoded, not adjustable
const instructions = generateInitialInstructions(
 user,
 language,
 preferences,
 scenario,
 sessionContext,
 speaker
);

// Can't easily adjust speed or difficulty
```

### After (New System)

```typescript
// Create flexible composer
const composer = createComposer({
 user,
 language,
 preferences,
 scenario,
 speaker,
 sessionContext: {
  isFirstTime: !preferences.successfulExchanges,
  memories: preferences.memories,
  previousTopics: preferences.conversationContext?.recentTopics
 }
});

// Get initial instructions
let instructions = composer.compose();

// Easy to adjust later
if (learnerStruggling) {
 instructions = composer.updateParameters({
  speakingSpeed: 'slow',
  scaffoldingLevel: 'heavy'
 });
 session.updateInstructions(instructions);
}
```

## 🎨 Best Practices

### 1. Start with Presets

```typescript
import { getParametersForCEFR } from '$lib/services/instructions/parameters';

const baseParams = getParametersForCEFR(learnerLevel);
```

### 2. Make Incremental Adjustments

```typescript
// Don't jump from 'very_slow' to 'native'
// Instead: very_slow → slow → normal → fast → native

// BAD
composer.updateParameters({ speakingSpeed: 'native' });

// GOOD
composer.updateParameters({ speakingSpeed: 'slow' }); // One step at a time
```

### 3. Monitor and Adapt

```typescript
// Track learner signals
if (comprehensionIssues) {
 // Simplify immediately
 composer.updateParameters({
  speakingSpeed: 'slow',
  sentenceLength: 'short',
  scaffoldingLevel: 'heavy'
 });
}

if (learnerEngaged && succeeding) {
 // Gradually increase challenge
 composer.updateParameters({
  vocabularyComplexity: 'advanced'
 });
}
```

### 4. Scenario-Specific Tuning

```typescript
// Grammar lesson
if (scenario.role === 'tutor') {
 parameters = {
  ...parameters,
  correctionStyle: 'explicit',
  scaffoldingLevel: 'heavy',
  topicChangeFrequency: 'focused'
 };
}

// Roleplay scenario
if (scenario.role === 'character') {
 parameters = {
  ...parameters,
  languageMixingPolicy: 'strict_immersion',
  conversationPace: 'dynamic'
 };
}
```

## 📊 Example Flows

### Beginner Lesson Flow

```typescript
// Start gentle
const composer = createComposer({
 user,
 language,
 preferences,
 parameters: PARAMETER_PRESETS.beginner
});

let instructions = composer.compose();

// Learner struggles → more support
instructions = composer.updateParameters({
 speakingSpeed: 'very_slow',
 scaffoldingLevel: 'heavy'
});

// Learner succeeds → slight challenge increase
instructions = composer.updateParameters({
 sentenceLength: 'short', // was 'very_short'
 vocabularyComplexity: 'everyday' // was 'basic'
});
```

### Advanced Conversation Flow

```typescript
// Start challenging
const composer = createComposer({
 user,
 language,
 preferences,
 parameters: PARAMETER_PRESETS.advanced
});

let instructions = composer.compose();

// Topic gets complex → slow down slightly
instructions = composer.updateParameters({
 speakingSpeed: 'normal', // was 'fast'
 pauseFrequency: 'moderate' // was 'minimal'
});

// Back to flowing → speed up
instructions = composer.updateParameters({
 speakingSpeed: 'fast',
 pauseFrequency: 'minimal'
});
```

## 🧪 Testing

```typescript
// Get current parameters
const currentParams = composer.getParameters();
console.log('Current speaking speed:', currentParams.speakingSpeed);

// Test parameter changes
const testInstructions = composer.updateParameters({
 speakingSpeed: 'slow'
});

// Verify changes
const newParams = composer.getParameters();
console.log('New speaking speed:', newParams.speakingSpeed); // 'slow'
```

## 📚 Architecture

```
parameters.ts       → Parameter definitions and presets
composer.ts         → Main instruction composer
README.md           → This file
```

## 🔗 Integration with Existing Code

Use the shared service wrapper when wiring up realtime sessions:

```typescript
import { createScenarioSessionConfig } from '$lib/services/instructions.service';

const { instructions, initialMessage, voice } = createScenarioSessionConfig(
 scenario,
 user,
 language,
 preferences,
 speaker
);

realtimeSession.update({
 instructions,
 voice
});
```

## 🎓 Learn More

- [OpenAI Realtime API Prompting Guide](https://github.com/openai/openai-cookbook/blob/main/examples/Realtime_prompting_guide.ipynb)
- [CEFR Levels](https://en.wikipedia.org/wiki/Common_European_Framework_of_Reference_for_Languages)
