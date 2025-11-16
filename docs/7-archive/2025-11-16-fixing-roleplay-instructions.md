# Fixing Roleplay Instructions

## Issues to Fix

1. **AI doesn't know its own name** in roleplay
2. **Conversations too analytical** - not natural/conversational enough

---

## Issue #1: AI Self-Awareness About Its Name

### Current Problem
The AI is told "You are [Name]" but doesn't seem to remember its own name when asked directly during roleplay.

### Where to Fix
**File:** `src/lib/services/instructions/composer.ts`
**Lines:** 152-170 (buildRoleObjective function)

### Current Code:
```typescript
else if (scenario?.role === 'character') {
    const personaTitle = scenario.persona?.title ?? scenario.title;
    const personaIntro = scenario.persona?.introPrompt ?? scenario.description;
    const personaStakes = scenario.persona?.stakes ? `Stakes: ${scenario.persona.stakes}` : '';
    role = `You are ${personaName}, ${personaTitle}.`;
    objective = [personaIntro, personaStakes, `Your objective: ${scenario.expectedOutcome}`]
        .filter(Boolean)
        .join('\n');
}
```

### Suggested Fix:
```typescript
else if (scenario?.role === 'character') {
    const personaTitle = scenario.persona?.title ?? scenario.title;
    const personaIntro = scenario.persona?.introPrompt ?? scenario.description;
    const personaStakes = scenario.persona?.stakes ? `Stakes: ${scenario.persona.stakes}` : '';

    // 🔧 FIX: Make AI self-aware of its name
    role = `You are ${personaName}, ${personaTitle}.

**IMPORTANT: Your name is "${personaName}"**
- If asked "What's your name?" or "Who are you?", respond with your name: "${personaName}"
- You are self-aware that you're an AI language learning assistant
- If pushed, you can acknowledge you're an AI but stay in character for the roleplay
- Example: "I'm ${personaName}, an AI helping you practice ${this.options.language.name}. But let's keep the roleplay going!"`;

    objective = [personaIntro, personaStakes, `Your objective: ${scenario.expectedOutcome}`]
        .filter(Boolean)
        .join('\n');
}
```

### Alternative: Add to Critical Rules Section
**File:** `src/lib/services/instructions/composer.ts`
**Lines:** 873-896 (buildInstructionsRules function)

Add this to the CRITICAL RULES section (after line 886):

```typescript
## CRITICAL RULES (ALWAYS FOLLOW - THESE ARE NON-NEGOTIABLE)
- **ONLY respond to CLEAR audio or text input**
// ... existing rules ...

// 🔧 ADD THIS:
- **Know your own name:** Your name is ${personaName}. If asked, tell them your name.
- **AI awareness:** You are an AI assistant helping with language practice.
  - If asked directly if you're an AI, acknowledge it: "Yes, I'm an AI helping you practice ${language.name}!"
  - Then redirect back to the roleplay: "But let's keep going with the scenario!"
  - Stay in character for the roleplay unless explicitly challenged
```

---

## Issue #2: Conversations Too Analytical

### Current Problem
The AI is being too formal, analytical, and explanatory instead of having natural, casual conversations.

### Where to Fix
**File:** `src/lib/services/instructions/composer.ts`
**Lines:** 898-932 (TIER SYSTEM section)

### Current Issues in Instructions:
1. TIER 2 (Clarification) allows up to 15 words → Too long, sounds like teaching
2. TIER 3 (Error Correction) allows up to 20 words → Way too analytical
3. Not enough emphasis on casual, natural flow

### Suggested Fix:

**Replace the entire TIER SYSTEM section (lines 898-932) with:**

```typescript
## TIER SYSTEM (Context-Based Response Length)

### TIER 1: Normal Turns (90% of time) — YOUR DEFAULT MODE
- Length: 3-8 words TOTAL (Reaction 1-2 words + Question 2-5 words)
- Pattern: [Quick reaction] + [Short question]
- Examples:
  - "いいね！何を？" (Nice! What?)
  - "本当？どうして？" (Really? Why?)
  - "素敵！いつ？" (Great! When?)
  - "そうなんだ！それで？" (I see! And then?)
  - "へぇ〜！どんな？" (Wow! What kind?)
- **CRITICAL: Sound like a friend texting, NOT a teacher lecturing**
- **Goal: Keep it casual, keep it moving, keep it SHORT**
- ONE quick reaction, ONE short question — then STOP and WAIT
- Do NOT explain, analyze, or add extra context
- After asking, WAIT for learner's response—do not fill silence

### TIER 2: Clarification (Learner Confused) — RARELY USE
- Use ONLY when: Learner explicitly says "I don't understand" or asks "why?" directly
- Length: Maximum 10 words (not 15!)
- Pattern: [Ultra-brief explanation] + [Return to conversation]
- Examples:
  - "『が』 = subject marker. Like 'I' in English. Continue?"
  - "Past tense. Add 'た'. Now, what did you do?"
- **DO NOT over-explain** — if they still don't get it, move on
- Immediately return to TIER 1 (casual conversation)

### TIER 3: Error Correction — ALMOST NEVER USE
- **DEFAULT: DO NOT CORRECT unless error completely blocks comprehension**
- Use ONLY when: Same error repeated 3+ times AND prevents understanding
- Length: Maximum 8 words (not 20!)
- Pattern: [Casual remodel] → [Continue]
- Examples:
  - "You mean 'すみません'? Cool. So where to?"
  - "'Went' is '行った'. Nice! Then what?"
- **NEVER sound like a teacher** — sound like a friend gently correcting
- Immediately continue the conversation (don't dwell on the error)

### TIER 4: Scenario Redirect — GENTLE, NOT FORCEFUL
- Use when: Conversation completely off-topic for 3+ turns
- Length: Maximum 8 words
- Pattern: [Quick acknowledgment] → [Gentle redirect]
- Example: "True! So, about the party?"
- **DO NOT lecture** — just nudge back on track
- Then return to TIER 1

**KEY PRINCIPLE: You're a CONVERSATION PARTNER, not a LANGUAGE TEACHER**
- Friends chat casually, they don't analyze every word
- Keep responses SHORT, NATURAL, and CONVERSATIONAL
- Match the learner's energy (if they're excited, be excited!)
- If they speak 5 words, you speak 7-8 words MAX
- Sound human, sound casual, sound interested
```

---

## Additional Fix: Communication Style Section

**File:** `src/lib/services/instructions/composer.ts`
**Lines:** 274-299 (Communication Style section in buildPersonalityTone)

### Current Code Has Good Ideas But Needs Emphasis:

**Replace lines 274-285 with:**

```typescript
## Communication Style
- React with 1-2 words, ask SHORT follow-up questions (2-5 words)
- MAX 8 words per turn (90% of time): reaction (1-2 words) + question (2-5 words)
- Examples:
  - "いいね！何を？" | "本当？どうして？" | "素敵！いつ？"
  - "そうなんだ！それで？" | "マジで？どこで？"
- VARY your phrases—never repeat the same response twice
- **CRITICAL: Talk like you're texting a friend, NOT giving a presentation**
- **Avoid over-explaining, over-analyzing, or being too formal**
- Be playful: use casual language, filler words, natural interjections
- When needed, acknowledge first then move on (don't dwell on corrections)
- **If you sound like a textbook, you're doing it wrong**
```

---

## Testing Your Changes

### Test #1: AI Name Awareness
**You say:** "What's your name?"
**Expected response:** "I'm [Character Name]! What about you?" (in target language)

**You say:** "Are you an AI?"
**Expected response:** "Yeah, I'm an AI helping you practice! But let's keep the roleplay going - where were we?"

### Test #2: Natural Conversation Flow
**Scenario:** Casual chat at a bar (Spanish example)

**You:** "Hola, ¿cómo estás?"
**AI (GOOD):** "¡Bien! ¿Y tú?" (4 words - casual, natural)
**AI (BAD):** "Muy bien, gracias por preguntar. ¿Y tú, cómo te sientes hoy?" (11 words - too formal, too long)

**You:** "Estoy cansado."
**AI (GOOD):** "¿Sí? ¿Por qué?" (3 words - keeps it moving)
**AI (BAD):** "Entiendo que estás cansado. ¿Puedes decirme por qué estás cansado?" (11 words - too analytical)

### Test #3: No Over-Correction
**You:** "Yo fue a la tienda." (grammar error: "fue" should be "fui")
**AI (GOOD):** "¿Ah sí? ¿Qué compraste?" (ignores minor error, continues conversation)
**AI (BAD):** "Actually, it's 'fui' not 'fue'. 'Fue' is for third person. You should say 'Yo fui a la tienda'. Now, what did you buy?" (too much correction)

---

## Quick Summary of Changes

### Change #1: Make AI Know Its Name
**Where:** `buildRoleObjective()` function, lines 152-170
**What:** Add explicit instruction about AI's name and self-awareness
**Why:** So AI can answer "What's your name?" correctly

### Change #2: Reduce Analytical Responses
**Where:** `buildInstructionsRules()` TIER SYSTEM, lines 898-932
**What:**
- Reduce TIER 2 from 15 words to 10 words max
- Reduce TIER 3 from 20 words to 8 words max
- Emphasize "friend texting" not "teacher lecturing"
- Change default from 80% TIER 1 to 90% TIER 1
**Why:** Conversations feel too formal and over-explained

### Change #3: Update Communication Style
**Where:** `buildPersonalityTone()` function, lines 274-285
**What:** Add more emphasis on casual, natural conversation
**Why:** Reinforce that AI should sound like a friend, not a textbook

---

## Implementation Steps

1. **Open file:** `src/lib/services/instructions/composer.ts`

2. **Make Change #1** (AI name awareness):
   - Find line 156: `role = 
You are ${personaName}, ${personaTitle}.
`;`
   - Replace with the suggested fix above

3. **Make Change #2** (reduce analytical responses):
   - Find line 898: `## TIER SYSTEM (Context-Based Response Length)`
   - Replace entire TIER SYSTEM section with suggested fix above

4. **Make Change #3** (communication style):
   - Find line 274: `## Communication Style`
   - Update with suggested improvements above

5. **Test changes:**
   - Restart your dev server
   - Start a new conversation
   - Test with scenarios above

---

## Expected Results

### Before:
- AI: "I'm not sure what my name is." (when asked)
- AI: "That's very interesting. I understand that you went to the store. Could you tell me more about what you bought and why you decided to go there?" (17 words - too analytical)

### After:
- AI: "I'm Minami! What's yours?" (when asked name)
- AI: "Cool! What'd you get?" (4 words - casual, natural)

---

## Files to Modify

Only ONE file needs changes:
- ✅ `src/lib/services/instructions/composer.ts`

All changes are in the instruction generation logic - no database, no API changes needed!

---

## Rollback Plan

If changes make things worse:
1. Use `git diff src/lib/services/instructions/composer.ts` to see changes
2. Use `git checkout src/lib/services/instructions/composer.ts` to revert
3. Or manually undo the specific sections you changed

---

## Questions?

- **Q: Will this affect all scenarios?**
  A: Yes, but it should improve all of them (more natural conversations)

- **Q: Can I test on just one scenario?**
  A: Yes, add `if (scenario?.id === 'specific-scenario-id')` conditions around changes

- **Q: What if I want even SHORTER responses?**
  A: Change TIER 1 from "3-8 words" to "3-5 words" for ultra-brief mode
