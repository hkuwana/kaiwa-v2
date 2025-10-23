# Universal Speech Speed Solution - Design Document

## Problem Statement
**User Feedback:** Speech is too fast across ALL languages, not just Chinese
- Affects beginners in Japanese, Korean, Chinese, Spanish, etc.
- Different users need different speeds based on proficiency
- Current system has no user control over speech speed
- AI instructions help but sometimes AI still speaks too fast

---

## Solution: Dual-Layer Speed Control ⭐⭐ BEST APPROACH

We implement **BOTH** instruction-based AND playback-based speed control:

### Layer 1: AI Instructions (What we have)
- Tell AI to speak slower through text prompts
- Adjusts pacing, pauses, and articulation
- Natural-sounding slower speech

### Layer 2: Audio Playback Rate (What we need to add) ✨
- Browser's native `audioElement.playbackRate` API
- Range: 0.5 (50% speed) to 1.0 (100% speed)
- No quality loss, preserves pitch
- User has fine-grained control (0-100 slider)

**Why Both?**
1. **Instructions alone**: AI may not always comply perfectly
2. **Playback alone**: Can sound unnatural if too slow
3. **Combined**: Best of both worlds - natural pacing + precise control

---

## Technical Discovery

### ✅ We Have Access to Audio Element!
```typescript
// src/lib/services/realtime-agents.service.ts:232
const audioElement = document.createElement('audio');
audioElement.autoplay = true;
```

### ✅ Playback Rate API Available
```typescript
// Browser native API - no library needed
audioElement.playbackRate = 0.75; // 75% speed
// Range: 0.5 to 2.0 (we'll use 0.5 to 1.0 for language learning)
```

---

## Architecture-Aligned Implementation

Following **3-Layer Clean Architecture** from core-architecture.md:

```
UI Layer (Profile Settings, Audio Options)
    ↓
Store Layer (userPreferences, realtimeOpenAI)
    ↓
Service Layer (audioPlayback service, instructions service)
```

---

## Recommended Implementation

### Phase 1: Add Speech Speed Preference (1.5 hours)

#### 1.1 Database Schema Update
```typescript
// src/lib/server/db/schema/user-preferences.ts

export const speechSpeedEnum = pgEnum('speech_speed_enum', [
  'auto',        // Smart default based on CEFR
  'very_slow',   // AI: 40% + Playback: 0.6 (24% total)
  'slow',        // AI: 60% + Playback: 0.75 (45% total)
  'normal',      // AI: 70% + Playback: 0.85 (60% total)
  'fast',        // AI: 80% + Playback: 0.95 (76% total)
  'native'       // AI: 85% + Playback: 1.0 (85% total)
]);

// Add to userPreferences table:
speechSpeed: speechSpeedEnum('speech_speed').default('auto').notNull(),
playbackSpeedOverride: integer('playback_speed_override'), // 0-100, null = use preset
```

#### 1.2 User Preferences Store
```typescript
// src/lib/stores/user-preferences.store.svelte.ts

interface UserPreferences {
  // ... existing fields
  speechSpeed: 'auto' | 'very_slow' | 'slow' | 'normal' | 'fast' | 'native';
  playbackSpeedOverride?: number; // 0-100, fine-grained control
}
```

---

### Phase 2: Create Audio Playback Service (45 minutes)

```typescript
// src/lib/services/audio-playback.service.ts (NEW FILE)

/**
 * Audio Playback Service
 * Pure business logic for controlling audio playback speed
 */

export type SpeechSpeedPreset = 'very_slow' | 'slow' | 'normal' | 'fast' | 'native';

// Playback rate mappings (0.5 = 50%, 1.0 = 100%)
const PRESET_PLAYBACK_RATES: Record<SpeechSpeedPreset, number> = {
  very_slow: 0.60,  // 60% playback
  slow: 0.75,       // 75% playback
  normal: 0.85,     // 85% playback
  fast: 0.95,       // 95% playback
  native: 1.0       // 100% playback
};

/**
 * Convert 0-100 slider value to playback rate
 */
export function sliderToPlaybackRate(sliderValue: number): number {
  // Slider 0 = 50% speed (0.5 playback rate)
  // Slider 100 = 100% speed (1.0 playback rate)
  return 0.5 + (sliderValue / 100) * 0.5;
}

/**
 * Convert playback rate to 0-100 slider value
 */
export function playbackRateToSlider(rate: number): number {
  return Math.round((rate - 0.5) * 200);
}

/**
 * Get playback rate for user preferences
 */
export function resolvePlaybackRate(
  speechSpeed: SpeechSpeedPreset | 'auto',
  playbackSpeedOverride: number | null,
  cefrLevel: string
): number {
  // 1. Manual override takes precedence
  if (playbackSpeedOverride !== null) {
    return sliderToPlaybackRate(playbackSpeedOverride);
  }

  // 2. Preset-based
  if (speechSpeed !== 'auto') {
    return PRESET_PLAYBACK_RATES[speechSpeed];
  }

  // 3. Auto mode - map CEFR to preset
  const autoPreset = CEFR_TO_PRESET_MAP[cefrLevel] || 'slow';
  return PRESET_PLAYBACK_RATES[autoPreset];
}

const CEFR_TO_PRESET_MAP: Record<string, SpeechSpeedPreset> = {
  'A1': 'very_slow',
  'A2': 'slow',
  'B1': 'normal',
  'B2': 'fast',
  'C1': 'fast',
  'C2': 'native'
};

/**
 * Apply playback rate to audio element
 */
export function setAudioPlaybackRate(
  audioElement: HTMLAudioElement,
  rate: number
): void {
  if (!audioElement) {
    console.warn('Audio element not available for playback rate control');
    return;
  }

  // Clamp to safe range (0.5 to 1.0 for language learning)
  const clampedRate = Math.max(0.5, Math.min(1.0, rate));

  audioElement.playbackRate = clampedRate;
  console.log(`🎚️ Audio playback rate set to: ${clampedRate} (${Math.round(clampedRate * 100)}%)`);
}
```

---

### Phase 3: Integrate with Realtime Store (30 minutes)

```typescript
// src/lib/stores/realtime-openai.store.svelte.ts

import { resolvePlaybackRate, setAudioPlaybackRate } from '$lib/services/audio-playback.service';
import { userPreferencesStore } from '$lib/stores/user-preferences.store.svelte';

class RealtimeOpenAIStore {
  // ... existing properties

  private audioElement: HTMLAudioElement | null = null;
  private currentPlaybackRate = $state(1.0);

  /**
   * Set audio element reference (called after connection)
   */
  setAudioElement(element: HTMLAudioElement) {
    this.audioElement = element;
    this.applyPlaybackRate(); // Apply user's preferred rate
  }

  /**
   * Apply user's playback rate preference
   */
  private applyPlaybackRate() {
    if (!this.audioElement) return;

    const prefs = userPreferencesStore.preferences;
    const user = userManager.user;

    const rate = resolvePlaybackRate(
      prefs.speechSpeed || 'auto',
      prefs.playbackSpeedOverride || null,
      user.cefrLevel || 'A2'
    );

    setAudioPlaybackRate(this.audioElement, rate);
    this.currentPlaybackRate = rate;
  }

  /**
   * Update playback rate (called when user changes setting)
   */
  updatePlaybackRate(newRate: number) {
    if (!this.audioElement) return;

    setAudioPlaybackRate(this.audioElement, newRate);
    this.currentPlaybackRate = newRate;
  }
}
```

---

## UI Component Design

### Speech Speed Selector with 0-100 Slider

User gets **both** preset buttons AND fine-grained slider:

```
┌─────────────────────────────────────────┐
│ Speech Speed              [75%]         │
├─────────────────────────────────────────┤
│ Presets:                                │
│ [🐌 Very Slow] [🐢 Slow] [● Normal]     │
│ [🏃 Fast] [🚀 Native]                   │
│                                          │
│ Advanced:                               │
│ [✓] Custom speed                        │
│ ├────────●────────────┤                │
│ 50%        75%        100%              │
│                                          │
│ ℹ️ Combines AI pacing + audio playback │
│    for natural slower speech            │
└─────────────────────────────────────────┘
```

---

## Dual-Layer Speed Calculation

### Combined Effect Example:
```
User selects: "Slow"

Layer 1 (AI Instructions):
- AI instructed to speak at 60% of native speed
- Adds 2-3 second pauses between sentences
- Uses clearer enunciation

Layer 2 (Playback Rate):
- audioElement.playbackRate = 0.75 (75%)

Total Effect:
- Perceived speed: ~45% of native (0.60 × 0.75)
- Very comprehensible for beginners
- Still sounds natural (not robotic)
```

---

## Migration Strategy

### Database Migration:
```sql
-- Add columns to user_preferences
ALTER TABLE user_preferences
ADD COLUMN speech_speed text DEFAULT 'auto',
ADD COLUMN playback_speed_override integer DEFAULT NULL;

-- Set existing users to auto mode
UPDATE user_preferences
SET speech_speed = 'auto'
WHERE speech_speed IS NULL;
```

---

## Files to Create/Modify

### New Files:
1. `src/lib/services/audio-playback.service.ts` - Playback logic
2. `src/lib/components/SpeechSpeedSelector.svelte` - UI component

### Modified Files:
1. `src/lib/server/db/schema/user-preferences.ts` - Add fields
2. `src/lib/stores/user-preferences.store.svelte.ts` - Add types
3. `src/lib/stores/realtime-openai.store.svelte.ts` - Integrate playback
4. `src/lib/services/realtime-agents.service.ts` - Set initial rate
5. `src/lib/services/instructions/parameters.ts` - Keep instruction speed sync
6. `src/lib/components/AdvancedAudioOptions.svelte` - Add selector
7. `src/routes/profile/+page.svelte` - Add selector

---

## Timeline Estimate

- **Phase 1 (Database):** 30 minutes
- **Phase 2 (Audio Service):** 45 minutes
- **Phase 3 (Store Integration):** 30 minutes
- **Phase 4 (UI Component):** 2 hours
- **Phase 5 (Settings Integration):** 30 minutes
- **Testing & Polish:** 1 hour

**Total:** ~5.5 hours of focused work

---

## Success Metrics

- ✅ Users can adjust speed with 0-100 slider
- ✅ Preset buttons provide quick access
- ✅ Auto mode works intelligently for new users
- ✅ Playback rate changes apply immediately
- ✅ Speed persists across sessions
- ✅ Positive feedback on "too fast" issue resolved

---

**Key Advantage:** By using BOTH instruction-based AND playback-based control, we get:
- Natural-sounding speech from AI (instruction layer)
- Precise user control (playback layer)
- Best user experience possible within API constraints
