# Conversation Structuring Guide

This note captures how the realtime instructor now keeps dialogue punchy and conversational. It pulls from the logic in `src/lib/services/instructions/composer.ts` and the casual expression catalogue in `src/lib/services/instructions/casual-interjections.ts`.

## Instruction Stack Overview

- **Role & Objective** – Anchors persona and success criteria per scenario (`src/lib/services/instructions/composer.ts:75`).
- **Personality & Tone** – Sets regional voice, confidence-aware tone, and high-level communication posture (`src/lib/services/instructions/composer.ts:207`).
- **Context** – Injects scenario, memory, and language metadata so replies stay grounded (`src/lib/services/instructions/composer.ts:240`).
- **Casual Expressions** – Provides language- or fallback-specific interjections to keep speech informal (`src/lib/services/instructions/composer.ts:302`).
- **Instructions / Rules** – Merges parameter presets with scenario overrides for pace, corrections, and scaffolding (`src/lib/services/instructions/composer.ts:389`).
- **Conversation Flow** – Defines opening, mid-flow, and closing beats (`src/lib/services/instructions/composer.ts:465`).
- **Safety & Escalation** – Handles audio quality, frustration, and crisis logic (`src/lib/services/instructions/composer.ts:516`).

## Conversational Style Levers

- **Brevity mandate** – Communication style bullets cap turns at 1–2 short sentences, reinforce volley mindset, and prevent monologues (`src/lib/services/instructions/composer.ts:221`).
- **Response formula** – `buildConversationalPatternGuidance` emits a reaction + question recipe with localized examples, then reminds the model to stop speaking (`src/lib/services/instructions/composer.ts:310`).
- **Casual vocabulary** – `formatCasualExpressionsForPrompt` serves per-language interjections; if a language is missing, it clearly states that we’re translating generic English prompts instead of pretending to have local data (`src/lib/services/instructions/casual-interjections.ts:687`).
- **Scenario tuning** – Tutor, character, friendly chat, and expert roles adjust correction style, pacing, and authenticity cues without losing the brevity guardrails (`src/lib/services/instructions/composer.ts:420`).

## Parameter Presets & Real-time Tuning

- CEFR-driven presets now favor shorter sentences (`short`/`medium`) and dynamic pacing for intermediate+ users, which keeps the AI from drifting into essays (`src/lib/services/instructions/parameters.ts:418`).
- Encouragement frequency defaults to `minimal` unless the user profile explicitly needs more cheerleading, reinforcing natural reactions instead of repeated praise.
- Scenario overrides layer on scaffolding or immersion without undoing the short-turn defaults (`src/lib/services/instructions/composer.ts:520`).

## Fallback Behavior

- `hasCasualExpressionsForLanguage` guards the casual-expression header so unsupported languages don’t get mislabeled fragments (`src/lib/services/instructions/casual-interjections.ts:671`).
- When we fall back to the generic list the prompt explicitly instructs the model to translate those snippets into the target language, keeping responses consistent with the learner’s setting.

## Implementation Checklist

1. Update parameter presets if we need even tighter sentence caps or alternate pacing (`src/lib/services/instructions/parameters.ts:90`).
2. Extend `CASUAL_EXPRESSIONS` as new languages roll out; once added, the composer automatically picks them up.
3. Validate instructions via the dev instructions playground to confirm the examples render correctly for non-Japanese locales.
