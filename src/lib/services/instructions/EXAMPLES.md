# Examples: Agile Instruction System

Real-world examples showing how to use the new instruction system.

---

## 🎯 Example 1: Basic Conversation

Simple conversation with automatic CEFR-based settings:

```typescript
import { composeInstructions } from '$lib/services/instructions';

const instructions = composeInstructions({
 user: {
  id: 'user123',
  displayName: 'Alex',
  nativeLanguageId: 'en'
 },
 language: {
  id: 'ja',
  code: 'ja',
  name: 'Japanese',
  nativeName: '日本語'
 },
 preferences: {
  speakingLevel: 45, // Maps to B1
  speakingConfidence: 50,
  learningGoal: 'Travel'
 },
 speaker: {
  id: 'shimmer',
  voiceName: 'Hiro',
  gender: 'male',
  locales: ['ja-JP']
 }
});

// Result: B1-level instructions with:
// - Normal speaking speed
// - Medium sentence length
// - Moderate pauses
// - Everyday vocabulary
// - Flexible language mixing
```

---

## 🎓 Example 2: Grammar Tutor Session

Explicit teaching with heavy scaffolding:

```typescript
import { composeWithParameters, PARAMETER_PRESETS } from '$lib/services/instructions';

const instructions = composeWithParameters(
 {
  user,
  language,
  preferences,
  scenario: {
   id: 'grammar-particles',
   title: 'Japanese Particles Practice',
   role: 'tutor',
   description: 'Master は, が, を particles',
   learningObjectives: ['particle は', 'particle が', 'particle を']
  }
 },
 {
  // Start with tutor preset
  ...PARAMETER_PRESETS.tutor_explicit,
  // Custom adjustments
  speakingSpeed: 'slow', // Speak clearly
  sentenceLength: 'short', // Simple sentences
  scaffoldingLevel: 'heavy', // Lots of help
  topicChangeFrequency: 'focused' // Stay on particles
 }
);

// Result: Explicit teaching mode
// - Direct corrections with explanations
// - Repetition drills
// - Slow, clear speech
// - Focused on one grammar point
```

---

## 🎭 Example 3: Role-Play Scenario

Immersive character interaction:

```typescript
import { composeWithParameters } from '$lib/services/instructions';

const instructions = composeWithParameters(
 {
  user,
  language,
  preferences,
  scenario: {
   id: 'clinic-emergency',
   title: 'Hospital Emergency Room',
   role: 'character',
   description: 'You are a hospital nurse',
   context: 'Late night ER. Patient needs to describe symptoms urgently.',
   expectedOutcome: 'Successfully communicate medical issue',
   learningObjectives: ['symptom vocabulary', 'urgent language', 'clarifying questions']
  }
 },
 {
  languageMixingPolicy: 'strict_immersion', // Stay in character
  conversationPace: 'dynamic', // Realistic urgency
  scaffoldingLevel: 'light', // Minimal help (it's realistic)
  correctionStyle: 'minimal' // Don't break immersion
 }
);

// Result: Realistic roleplay
// - AI stays in character as nurse
// - Adds realistic pressure
// - Minimal out-of-character corrections
// - Tests real-world communication ability
```

---

## 🔄 Example 4: Dynamic Difficulty Adjustment

Responding to learner performance in real-time:

```typescript
import { createComposer } from '$lib/services/instructions';

// Create composer for session
const composer = createComposer({
 user,
 language,
 preferences,
 scenario: restaurantScenario
});

let instructions = composer.compose();
session.updateInstructions(instructions);

// Track errors
let errorCount = 0;
let successStreak = 0;

// Listen to conversation events
session.on('transcript', (transcript) => {
 if (transcript.containsError) {
  errorCount++;
  successStreak = 0;

  // After 3 errors: make it easier
  if (errorCount >= 3) {
   instructions = composer.updateParameters({
    speakingSpeed: 'slow',
    sentenceLength: 'short',
    scaffoldingLevel: 'heavy',
    pauseFrequency: 'frequent',
    encouragementFrequency: 'frequent'
   });
   session.updateInstructions(instructions);
   console.log('📉 Made easier - learner struggling');
   errorCount = 0; // Reset counter
  }
 } else {
  successStreak++;
  errorCount = 0;

  // After 5 successes: increase challenge
  if (successStreak >= 5) {
   instructions = composer.updateParameters({
    speakingSpeed: 'normal',
    vocabularyComplexity: 'advanced',
    scaffoldingLevel: 'light',
    pauseFrequency: 'moderate'
   });
   session.updateInstructions(instructions);
   console.log('📈 Increased difficulty - learner succeeding');
   successStreak = 0; // Reset counter
  }
 }
});
```

---

## 🌍 Example 5: Multi-Language Support

Automatically adapt pronunciations and cultural context:

```typescript
import { composeInstructions } from '$lib/services/instructions';

// Japanese lesson
const japaneseInstructions = composeInstructions({
 user,
 language: {
  id: 'ja',
  code: 'ja',
  name: 'Japanese',
  nativeName: '日本語'
 },
 preferences,
 scenario: coffeeShopScenario
});

// Includes:
// - Japanese pronunciation guide (vowels, pitch accent)
// - Keigo (polite language) rules
// - Cultural norms for ordering

// Spanish lesson
const spanishInstructions = composeInstructions({
 user,
 language: {
  id: 'es',
  code: 'es',
  name: 'Spanish',
  nativeName: 'Español'
 },
 preferences,
 scenario: coffeeShopScenario
});

// Includes:
// - Spanish pronunciation guide (rolled R, regional variations)
// - Tú vs Usted guidance
// - Latin American vs European Spanish notes
```

---

## 📊 Example 6: Progress-Based Preset Switching

Switch between presets as learner advances:

```typescript
import { PARAMETER_PRESETS, createComposer } from '$lib/services/instructions';

const composer = createComposer({
 user,
 language,
 preferences: { speakingLevel: 25 } // A2 level
});

// Start with beginner preset
let instructions = composer.updateParameters(PARAMETER_PRESETS.beginner);
session.updateInstructions(instructions);

// After 10 successful sessions
if (sessionsCompleted === 10) {
 // Upgrade to intermediate
 instructions = composer.updateParameters(PARAMETER_PRESETS.intermediate);
 session.updateInstructions(instructions);
 console.log('🎉 Promoted to Intermediate level!');
}

// After 50 successful sessions
if (sessionsCompleted === 50) {
 // Upgrade to upper-intermediate
 instructions = composer.updateParameters(PARAMETER_PRESETS.upper_intermediate);
 session.updateInstructions(instructions);
 console.log('🎉 Promoted to Upper-Intermediate level!');
}
```

---

## 🎮 Example 7: User-Controlled Settings

Let users customize their experience:

```typescript
import { createComposer, type InstructionParameters } from '$lib/services/instructions';

// Create composer
const composer = createComposer({ user, language, preferences });

// User preferences from UI
const userSettings: Partial<InstructionParameters> = {
 speakingSpeed: userChoice.speed, // 'slow' | 'normal' | 'fast'
 correctionStyle: userChoice.corrections, // 'explicit' | 'recast' | 'none'
 scaffoldingLevel: userChoice.helpLevel, // 'heavy' | 'medium' | 'light'
 encouragementFrequency: userChoice.praise // 'frequent' | 'moderate' | 'minimal'
};

// Apply user settings
const instructions = composer.updateParameters(userSettings);
session.updateInstructions(instructions);

// Save to user profile
await db.update(users).set({ customInstructionParams: userSettings }).where(eq(users.id, user.id));
```

---

## 🧠 Example 8: Context-Aware Adaptation

Adjust based on session context and learner history:

```typescript
import { createComposer } from '$lib/services/instructions';

const composer = createComposer({
 user,
 language,
 preferences,
 sessionContext: {
  isFirstTime: false,
  memories: [
   'Interested in anime and manga',
   'Works as software engineer',
   'Planning trip to Tokyo in June'
  ],
  previousTopics: ['weekend activities', 'favorite foods', 'work culture']
 }
});

let instructions = composer.compose();

// Instructions now include:
// - Personalized greeting referencing past topics
// - Conversation hooks related to their interests
// - Context about their job and travel plans
// - Natural continuation from previous session
```

---

## ⚡ Example 9: Frustration Recovery Flow

Detect and respond to learner frustration:

```typescript
import { createComposer } from '$lib/services/instructions';

const composer = createComposer({ user, language, preferences });

// Monitor audio cues for frustration
session.on('audio', (audio) => {
 const frustrationLevel = detectFrustration(audio); // Your detection logic

 if (frustrationLevel === 'high') {
  // Emergency simplification
  composer.updateParameters({
   speakingSpeed: 'very_slow',
   sentenceLength: 'very_short',
   scaffoldingLevel: 'heavy',
   languageMixingPolicy: 'code_switching', // Allow native language
   encouragementFrequency: 'frequent',
   conversationPace: 'relaxed'
  });

  // Also send a supportive message
  session.sendMessage({
   type: 'conversation.item.create',
   item: {
    type: 'message',
    role: 'system',
    content: [
     {
      type: 'text',
      text: 'IMMEDIATE SUPPORT NEEDED: Learner is frustrated. Simplify drastically. Offer native language help. Provide quick win within 10 seconds.'
     }
    ]
   }
  });
 }
});
```

---

## 🎯 Example 10: A/B Testing Different Approaches

Compare instruction effectiveness:

```typescript
import { composeWithParameters, PARAMETER_PRESETS } from '$lib/services/instructions';

// Group A: Explicit corrections
const groupAInstructions = composeWithParameters(
 { user, language, preferences, scenario },
 {
  ...PARAMETER_PRESETS.intermediate,
  correctionStyle: 'explicit' // Direct feedback
 }
);

// Group B: Implicit recasting
const groupBInstructions = composeWithParameters(
 { user, language, preferences, scenario },
 {
  ...PARAMETER_PRESETS.intermediate,
  correctionStyle: 'recast' // Natural reformulation
 }
);

// Randomly assign
const instructions = Math.random() < 0.5 ? groupAInstructions : groupBInstructions;

// Track metrics
await analytics.track('instruction_variant', {
 userId: user.id,
 variant: Math.random() < 0.5 ? 'explicit' : 'recast',
 sessionId: session.id
});

// Later: analyze which approach led to better outcomes
```

---

## 🔍 Example 11: Debugging Parameter Effects

Understand what each parameter does:

```typescript
import { createComposer } from '$lib/services/instructions';

const composer = createComposer({ user, language, preferences });

// Test different speaking speeds
const speeds = ['very_slow', 'slow', 'normal', 'fast', 'native'] as const;

for (const speed of speeds) {
 const instructions = composer.updateParameters({ speakingSpeed: speed });

 console.log(`\n=== SPEAKING SPEED: ${speed} ===`);
 console.log(instructions);

 // Look for the speaking speed section
 const speedSection = instructions.match(/## SPEAKING SPEED:.*?(?=##|$)/s);
 console.log(speedSection?.[0]);
}
```

---

## 🎓 Example 12: Advanced Scenario Customization

Combine scenario + custom params for perfect control:

```typescript
import { composeWithParameters } from '$lib/services/instructions';

const instructions = composeWithParameters(
 {
  user,
  language,
  preferences: { speakingLevel: 55 }, // B2 level
  scenario: {
   id: 'business-negotiation',
   title: 'Salary Negotiation',
   role: 'character',
   description: 'Negotiating salary with Japanese HR manager',
   context: 'Office setting, formal meeting, high stakes',
   expectedOutcome: 'Successfully negotiate higher salary',
   learningObjectives: [
    'formal business language',
    'negotiation vocabulary',
    'polite disagreement',
    'stating your worth'
   ]
  }
 },
 {
  // Formal, business-appropriate settings
  vocabularyComplexity: 'specialized', // Business terms
  grammarComplexity: 'advanced', // Formal grammar
  languageMixingPolicy: 'strict_immersion', // Stay professional
  conversationPace: 'steady', // Not rushed
  correctionStyle: 'recast', // Subtle corrections
  scaffoldingLevel: 'light', // Expect proficiency
  encouragementFrequency: 'minimal' // Professional tone
 }
);

// Result: Professional, high-stakes roleplay
// - Uses keigo (敬語) appropriately
// - Business vocabulary and etiquette
// - Stays in character as HR manager
// - Tests real negotiation skills
```

---

## 📈 Key Takeaways

1. **Start Simple**: Use `composeInstructions()` with defaults
2. **Add Presets**: Use `PARAMETER_PRESETS` for common scenarios
3. **Customize**: Use `composeWithParameters()` for specific needs
4. **Go Dynamic**: Use `createComposer()` for real-time adjustments
5. **Monitor & Adapt**: Track performance and update parameters accordingly

Each example shows a different way to leverage the agile instruction system. Mix and match approaches based on your needs!
