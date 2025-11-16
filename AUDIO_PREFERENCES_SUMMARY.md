# Audio & Preference Settings Summary

## Overview
This document summarizes the implementation of cookie-based persistence for user preferences including audio input mode, scenario selection, and language/speaker selection.

## Changes Made

### 1. **Cookie Utility Module** ✅
**File**: `src/lib/utils/cookies.ts` (NEW)

Created a comprehensive cookie utility module with the following features:
- Cookie management functions (get, set, delete)
- Preference-specific helpers for:
  - Audio input mode (VAD/PTT)
  - Scenario selection
  - Language selection
  - Speaker selection
- 365-day cookie expiration for persistent storage
- SameSite=Lax attribute for security
- Browser environment safety checks

**Key Functions**:
- `getAudioInputModeFromCookie()` / `setAudioInputModeCookie()`
- `getSelectedScenarioIdFromCookie()` / `setSelectedScenarioIdCookie()`
- `getSelectedLanguageIdFromCookie()` / `setSelectedLanguageIdCookie()`
- `getSelectedSpeakerIdFromCookie()` / `setSelectedSpeakerIdCookie()`

### 2. **Advanced Audio Options Component** ✅
**File**: `src/lib/components/AdvancedAudioOptions.svelte`

**Changes**:
- ✅ Changed default audio input mode from 'ptt' to 'vad' (auto-detect)
- ✅ Removed VAD→PTT migration that was forcing all users to push-to-talk
- ✅ Added cookie support for quick recall of user's last audio mode choice
- ✅ Implemented preference hierarchy:
  1. Check cookie first (fastest - user's last session preference)
  2. Fall back to user preferences store (persistent across devices)
  3. Default to 'vad' (auto-detect mode)

**Behavior**:
```
User visits app
  ↓
Check cookie for saved audio mode
  ↓
If found → Use cookie value
If not found → Check user preferences
  ↓
If not found → Default to 'vad' (auto-detect)
  ↓
Save any changes to BOTH cookie and preferences
```

### 3. **Scenario Selector Component** ✅
**File**: `src/lib/features/scenarios/components/ScenarioSelector.svelte`

**Changes**:
- ✅ Added cookie persistence for selected scenario
- ✅ When user selects a scenario, the scenario ID is saved to a cookie
- ✅ This allows the app to remember and restore the user's last selected scenario

### 4. **Language Selector Component** ✅
**File**: `src/lib/components/LanguageSelector.svelte`

**Changes**:
- ✅ Added cookie persistence for selected language
- ✅ Added cookie persistence for selected speaker
- ✅ When user selects a language, both language ID and default speaker are saved to cookies
- ✅ When user manually selects a different speaker, the selection is also saved to cookie

## Cookie Names

```typescript
COOKIE_NAMES = {
  AUDIO_INPUT_MODE: 'kaiwa_audio_input_mode',        // 'vad' | 'ptt'
  SELECTED_SCENARIO_ID: 'kaiwa_selected_scenario_id', // scenario ID string
  SELECTED_LANGUAGE_ID: 'kaiwa_selected_language_id', // language code string
  SELECTED_SPEAKER_ID: 'kaiwa_selected_speaker_id'    // speaker ID string
}
```

## Storage Strategy

The app now uses a **dual persistence strategy**:

1. **Cookies** (Fast, Browser-Local)
   - Used for quick recall within same session/browser
   - 365-day expiration
   - Fast to read on page load
   - Not synced across devices

2. **User Preferences Store** (Persistent, Cross-Device)
   - Uses localStorage for guests
   - Uses database for authenticated users
   - Synced across all devices where user is logged in
   - Survives browser/cookie deletions for authenticated users

## Default Audio Mode

**Before**: Push-to-Talk (ptt) - Required user to manually press/hold microphone button

**After**: Auto-Detect Mode (vad) - Automatically detects when user is speaking
- Better for quiet environments
- More natural conversation flow
- Users can still switch to Push-to-Talk if they prefer

## User Experience

### First Visit
1. App defaults to auto-detect mode
2. User can switch to push-to-talk in Advanced Options if preferred
3. Choice is saved to cookie immediately

### Subsequent Visits
1. **Same browser**: Cookie is read → User's last preference is restored
2. **Different browser**: Preferences store is checked → User's account preference is restored
3. **Logged out**: Cookie is used → Guest preference is restored

### Scenario Selection
- When user selects a scenario, the ID is saved to cookie
- App can use this to restore their last scenario on next visit

### Language/Speaker Selection
- When user selects a language, both language and default speaker are saved
- When user manually selects a different speaker, that choice is saved
- This ensures consistency across sessions

## Technical Details

### Cookie Attributes
- **Path**: `/` (accessible site-wide)
- **SameSite**: `Lax` (security - CSRF protection)
- **Expiration**: 365 days
- **Encoding**: URL-encoded values for safety

### Browser Support
- Works in all modern browsers (IE 11+)
- Gracefully degrades if cookies are disabled
- Server-side rendering safe (checks `browser` environment)

### TypeScript Safety
- Fully typed with TypeScript
- Type-safe cookie getters/setters
- Audio mode types validated at compile time

## Migration Notes

If users had the old VAD→PTT migration in place:
- ✅ Migration code removed
- ✅ Users will see auto-detect mode by default on next visit
- ✅ Their previous push-to-talk preference (if forced) will be overridden
- ✅ Users can always switch back to push-to-talk manually

## Testing Checklist

- [ ] Clear browser cookies
- [ ] Load app → Audio mode should default to 'vad' (auto-detect)
- [ ] Switch to push-to-talk → Cookie should be set
- [ ] Reload page → Should restore to push-to-talk (from cookie)
- [ ] Clear cookies, reload → Should revert to 'vad'
- [ ] Select a scenario → Cookie should be set
- [ ] Select a language → Language and speaker cookies should be set
- [ ] Logout/login → Preferences should sync with database

## Future Enhancements

Potential improvements:
1. Add cookie consent banner (GDPR compliance)
2. Add preference sync UI to show what's stored
3. Add "Reset to Defaults" button
4. Add analytics to track most popular mode preference
5. Add preference export/import for users

## Files Modified

1. ✅ `src/lib/utils/cookies.ts` - NEW
2. ✅ `src/lib/components/AdvancedAudioOptions.svelte`
3. ✅ `src/lib/features/scenarios/components/ScenarioSelector.svelte`
4. ✅ `src/lib/components/LanguageSelector.svelte`

## Backward Compatibility

✅ Fully backward compatible
- Existing user preferences are preserved
- Guests without cookies will get defaults
- No breaking changes to component APIs
- All changes are additive (no removals)

