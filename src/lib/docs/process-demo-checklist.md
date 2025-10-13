# Live Demo Checklist (4 Days)

## Pre-Demo Setup (30 mins before)

### 1. Environment Check

- [ ] `pnpm dev` - Server starts without errors
- [ ] Database is running: `pnpm db:start`
- [ ] Check database health: `pnpm db:health`
- [ ] Clear browser cache and test incognito mode

### 2. Core Flow Verification

#### Scenario Selection

- [ ] Navigate to scenarios page
- [ ] Select a Japanese conversation scenario
- [ ] Verify scenario loads with correct speaker/language

#### Conversation Flow

- [ ] Start conversation
- [ ] Speak in microphone → check transcription appears
- [ ] AI responds with Japanese text
- [ ] **Furigana Check**: Furigana appears above kanji automatically
- [ ] **Romanization Check**: Click "Show Romaji" button
- [ ] **Translation Check**: Click "Translate" → English appears below

#### Message Display Quality

- [ ] Furigana HTML renders correctly (not as raw text)
- [ ] Romanization is properly capitalized
- [ ] Translation appears with visual separator
- [ ] All text is readable and properly formatted

### 3. Database Verification

```bash
# Check if furigana/romanization are being saved
# Replace CONVERSATION_ID with actual ID from UI
psql $DATABASE_URL -c "
SELECT
  id,
  role,
  substring(content, 1, 50) as content_preview,
  substring(hiragana, 1, 50) as furigana_preview,
  substring(romanization, 1, 50) as romanization_preview,
  translated_content IS NOT NULL as has_translation
FROM messages
WHERE conversation_id = 'YOUR_CONVERSATION_ID'
ORDER BY timestamp DESC
LIMIT 5;
"
```

### 4. Common Issues & Quick Fixes

#### Issue: Furigana not showing

**Check:**

- [ ] Message role is 'assistant' (user messages may not have furigana)
- [ ] `message.hiragana` field is populated (check DB)
- [ ] `needsScripts` is true in [MessageBubble.svelte:118](src/lib/features/conversation/components/MessageBubble.svelte#L118)

**Quick Fix:**

```bash
# Restart furigana generation for a message
curl -X POST http://localhost:5173/api/features/furigana \
  -H "Content-Type: application/json" \
  -d '{"text":"こんにちは", "messageId":"msg_test"}'
```

#### Issue: Translation not working

**Check:**

- [ ] Translation service is responding
- [ ] `isTranslated` flag is set after translation

**Quick Fix:**
Check [translation.service.ts](src/lib/services/translation.service.ts) and verify API endpoint

#### Issue: Romanization button not appearing

**Check:**

- [ ] `message.romanization` exists in DB
- [ ] `needsScripts && hasScriptDataFlag` is true
- [ ] Check [MessageBubble.svelte:274](src/lib/features/conversation/components/MessageBubble.svelte#L274)

### 5. Demo Script (Practice This!)

**Opening:**
"I'm going to show you Kaiwa, a language learning app that helps you practice Japanese conversations."

**Scenario Selection:**

1. Navigate to scenarios
2. Select "Restaurant Order" or "Train Station"
3. Click "Start Conversation"

**Conversation:**

1. Click microphone, speak Japanese phrase
2. Point out: "Notice the transcription appears immediately"
3. Wait for AI response
4. **Highlight Furigana**: "See how the reading guides appear above the kanji automatically"
5. **Show Romanization**: Click "Show Romaji" - "And here's the romanization"
6. **Show Translation**: Click "Translate" - "And if you need help understanding, you can translate"

**Data Persistence:**

1. Navigate to history/conversation list
2. "All conversations are saved with the original text, furigana, and translations stored separately"

### 6. Fallback Plan

If something breaks during demo:

**Plan A - Live Demo Fails:**

- [ ] Have pre-recorded video ready
- [ ] Explain the issue briefly
- [ ] Show video instead

**Plan B - Partial Demo:**

- [ ] Focus on working features only
- [ ] Acknowledge what's not working
- [ ] Show database directly to prove data is saved correctly

### 7. Post-Demo Debugging (If Issues Found)

#### Enable Verbose Logging

```typescript
// Add to conversation page
console.log('Message with furigana:', {
	content: message.content,
	hiragana: message.hiragana,
	romanization: message.romanization,
	hasScriptData: hasScriptData(message)
});
```

#### Test Furigana Generation Endpoint

```bash
# Test the API directly
curl -X POST http://localhost:5173/api/features/furigana \
  -H "Content-Type: application/json" \
  -d '{
    "text": "今日は良い天気ですね",
    "messageId": "test_123"
  }' | jq
```

Expected response:

```json
{
	"hiragana": "<ruby>今日<rt>きょう</rt></ruby>は<ruby>良<rt>よ</rt></ruby>い<ruby>天気<rt>てんき</rt></ruby>ですね",
	"romanization": "Kyō wa yoi tenki desu ne",
	"katakana": "...",
	"furigana": "..."
}
```

## Critical Files to Review Before Demo

1. [MessageBubble.svelte](src/lib/features/conversation/components/MessageBubble.svelte) - Message display logic
2. [message.service.ts](src/lib/services/message.service.ts) - Message state management
3. [furigana.service.ts](src/lib/services/furigana.service.ts) - Furigana generation
4. [messages schema](src/lib/server/db/schema/messages.ts) - Database structure

## Success Criteria

- [ ] Furigana displays automatically on Japanese messages
- [ ] Romanization toggles on/off with button click
- [ ] Translation generates and displays correctly
- [ ] All data persists in database (check with SQL query)
- [ ] UI is responsive and doesn't hang
- [ ] No console errors in browser DevTools

## Emergency Contacts

- Database issues: Check Supabase dashboard
- Deployment issues: Check Fly.io logs with `fly logs`
- API issues: Check browser Network tab

---

**Good luck with your demo! 🎌**
