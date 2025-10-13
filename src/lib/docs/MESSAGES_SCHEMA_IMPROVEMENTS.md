# Messages Schema Improvements - Implementation Summary

## Overview

Successfully enhanced the messages schema to support comprehensive audio storage, speech analysis, and retention policy management. The improvements separate text data from heavy audio analysis data for optimal performance.

## Changes Made

### 1. Messages Table Enhancements

#### **Audio Storage Metadata** (New Fields)
- `audio_url` (text) - Signed URL for audio access
- `audio_url_expires_at` (timestamp) - **NEW** - When signed URL expires (7 days TTL)
- `audio_storage_key` (text) - **NEW** - Permanent S3/Tigris key for regenerating URLs
- `audio_duration_ms` (integer) - **CHANGED** - Was `audio_duration` (text), now milliseconds
- `audio_size_bytes` (integer) - **NEW** - File size for cost tracking
- `audio_format` (text) - **NEW** - Audio codec (pcm16, wav, mp3, etc.)
- `audio_sample_rate` (integer) - **NEW** - Sample rate in Hz (default: 24000)
- `audio_channels` (integer) - **NEW** - Mono/stereo (default: 1)

#### **Audio Processing State** (New Fields)
- `audio_processing_state` (text) - **NEW** - Tracks async pipeline:
  - `pending` → `uploading` → `uploaded` → `analyzing` → `analyzed` | `failed`
- `audio_processing_error` (text) - **NEW** - Error details if processing fails

#### **Audio Retention Policy** (New Fields)
- `audio_retention_expires_at` (timestamp) - **NEW** - When to delete audio (30-365 days based on tier)
- `audio_deleted_at` (timestamp) - **NEW** - Audit trail of deletion

#### **Speech Analysis Scores** (New/Changed Fields)
- `pronunciation_score` (integer) - **CHANGED** - Was text, now 0-100 integer
- `fluency_score` (integer) - **NEW** - 0-100 fluency rating
- `speech_rate_wpm` (integer) - **NEW** - Words per minute

#### **Removed Fields**
- `speech_timings` (jsonb) - **REMOVED** - Moved to `message_audio_analysis` table

#### **New Indexes**
```sql
CREATE INDEX messages_audio_storage_idx ON messages (audio_storage_key);
CREATE INDEX messages_audio_processing_idx ON messages (audio_processing_state);
CREATE INDEX messages_audio_retention_idx ON messages (audio_retention_expires_at);
CREATE INDEX messages_pronunciation_idx ON messages (pronunciation_score, fluency_score);
CREATE INDEX messages_audio_cleanup_idx ON messages (audio_retention_expires_at, audio_deleted_at);
```

### 2. New Table: message_audio_analysis

**Purpose:** Stores detailed speech analysis results separately from messages for performance.

**Design Rationale:**
- One-to-one relationship with messages
- Loaded on-demand (not with every message query)
- Can be re-analyzed without modifying core message data
- Can be pruned independently for cost savings

**Schema:**
```typescript
{
  id: uuid (primary key)
  message_id: text (unique, foreign key to messages.id, cascade delete)
  analyzed_at: timestamp (default: now)
  analysis_version: text (default: '1.0')

  // Overall scores
  overall_accuracy_score: integer (0-100)
  overall_fluency_score: integer (0-100)

  // Speech rate metrics
  speech_rate_wpm: integer
  articulation_rate_wpm: integer
  total_speech_duration_ms: integer
  total_pause_duration_ms: integer

  // Pause/hesitation analysis
  pause_count: integer
  hesitation_count: integer
  average_pause_duration_ms: integer
  longest_pause_duration_ms: integer

  // Detailed timing data
  speech_timings: jsonb // Array of word-level timings with confidence
  phoneme_analysis: jsonb // Array of phoneme-level pronunciation scores
  problematic_words: jsonb // Array of words needing practice
  recommendations: jsonb // Array of actionable suggestions
  practice_words: jsonb // Array of words to focus on

  // Raw data (for debugging/reprocessing)
  raw_alignment: jsonb
  raw_features: jsonb

  // Analysis metadata
  analysis_engine: text (default: 'echogarden')
  analysis_model_version: text
  analysis_language: text
  analysis_duration_ms: integer
  analysis_error: text
  analysis_warnings: jsonb
}
```

**Indexes:**
- `message_id` - Primary lookup
- `analyzed_at` - Time-based queries
- `overall_accuracy_score` - Analytics
- `overall_fluency_score` - Analytics
- `analysis_engine + analysis_version` - Performance monitoring
- `analysis_language` - Language-specific queries

### 3. Audio Retention Policy Configuration

**File:** `src/lib/server/config/audio-retention.config.ts`

**Retention Periods by Tier:**
- Free: 30 days
- Plus: 90 days
- Premium: 365 days
- Guest: 1 day
- System: 7 days

**Signed URL TTL:** 7 days (all tiers)

**Cleanup Configuration:**
- Schedule: Daily at 3 AM UTC
- Batch size: 100 messages
- Grace period: 7 days after expiry
- Soft delete: Keep audit trail
- Dry run mode: Available for testing

**Cost Monitoring:**
- Storage alert: 50 GB threshold
- Transfer alert: 100 GB/month threshold
- Estimated costs (Tigris):
  - Storage: $0.02/GB/month
  - Transfer: $0.09/GB
  - 100 users × 30 min/month = 3-15GB = $0.06-$0.30/month

**Helper Functions:**
```typescript
getRetentionPeriodDays(tier) // Get days for tier
calculateAudioRetentionExpiry(tier, date) // Calculate expiry
calculateSignedUrlExpiry(date) // Calculate URL expiry
needsSignedUrlRefresh(expiresAt) // Check if refresh needed
shouldDeleteAudio(retentionExpiresAt) // Check if deletion due
estimateStorageCost(bytes, days) // Estimate costs
```

### 4. TypeScript Type Updates

**New Types:**
```typescript
// Main types
export type MessageAudioAnalysis = InferSelectModel<typeof messageAudioAnalysis>;
export type NewMessageAudioAnalysis = InferInsertModel<typeof messageAudioAnalysis>;

// Helper types for nested structures
export type SpeechTiming = NonNullable<MessageAudioAnalysis['speechTimings']>[number];
export type PhonemeAnalysis = NonNullable<MessageAudioAnalysis['phonemeAnalysis']>[number];
export type ProblematicWord = NonNullable<MessageAudioAnalysis['problematicWords']>[number];
```

**Updated Message Type:**
- `audioDurationMs` now integer (was text)
- `pronunciationScore` now integer (was text)
- All new audio fields available

## Migration Details

**File:** `drizzle/0023_round_gateway.sql`

**Status:** ✅ Applied successfully

**Breaking Changes:**
1. `audio_duration` → `audio_duration_ms` (text → integer)
2. `pronunciation_score` (text → integer)
3. `speech_timings` moved from messages to message_audio_analysis

**Data Migration:**
- No data loss (all fields were nullable/empty)
- Manual conversion handled for type changes

## Usage Examples

### 1. Setting Audio Retention on Message Creation

```typescript
import { calculateAudioRetentionExpiry, calculateSignedUrlExpiry } from '$lib/server/config/audio-retention.config';

const message = await messagesRepository.createMessage({
  id: messageId,
  content: "Hello",
  role: "user",
  conversationId,
  // Audio storage
  audioUrl: signedUrl,
  audioUrlExpiresAt: calculateSignedUrlExpiry(),
  audioStorageKey: `audio/${userId}/${conversationId}/${messageId}.wav`,
  audioDurationMs: 5000, // 5 seconds
  audioSizeBytes: 240000, // ~240KB
  audioFormat: 'pcm16',
  audioSampleRate: 24000,
  audioChannels: 1,
  // Retention policy
  audioRetentionExpiresAt: calculateAudioRetentionExpiry(userTier),
  audioProcessingState: 'uploaded'
});
```

### 2. Creating Audio Analysis Record

```typescript
import { messageAudioAnalysis } from '$lib/server/db/schema';

const analysis = await db.insert(messageAudioAnalysis).values({
  messageId: message.id,
  overallAccuracyScore: 85,
  overallFluencyScore: 78,
  speechRateWpm: 145,
  articulationRateWpm: 162,
  pauseCount: 3,
  hesitationCount: 1,
  speechTimings: [
    { word: "hello", startMs: 0, endMs: 500, charStart: 0, charEnd: 5, confidence: 0.98 },
    { word: "world", startMs: 600, endMs: 1100, charStart: 6, charEnd: 11, confidence: 0.95 }
  ],
  problematicWords: [
    { word: "world", issue: "Slight mispronunciation", severity: "low", startMs: 600, endMs: 1100 }
  ],
  recommendations: [
    "Practice 'world' pronunciation",
    "Good overall fluency, keep it up!"
  ],
  practiceWords: ["world"],
  analysisEngine: 'echogarden',
  analysisLanguage: 'en'
});
```

### 3. Checking if URL Needs Refresh

```typescript
import { needsSignedUrlRefresh } from '$lib/server/config/audio-retention.config';

const message = await messagesRepository.getMessageById(messageId);

if (needsSignedUrlRefresh(message.audioUrlExpiresAt)) {
  // Regenerate signed URL from storage key
  const newUrl = await audioStorageService.getSignedUrl(message.audioStorageKey);
  await messagesRepository.updateMessage(messageId, {
    audioUrl: newUrl,
    audioUrlExpiresAt: calculateSignedUrlExpiry()
  });
}
```

### 4. Cleanup Job (Pseudo-code)

```typescript
import { shouldDeleteAudio } from '$lib/server/config/audio-retention.config';

// Run daily
export async function cleanupExpiredAudio() {
  const messages = await db
    .select()
    .from(messages)
    .where(and(
      isNotNull(messages.audioStorageKey),
      isNull(messages.audioDeletedAt),
      lte(messages.audioRetentionExpiresAt, new Date())
    ))
    .limit(100);

  for (const message of messages) {
    if (shouldDeleteAudio(message.audioRetentionExpiresAt)) {
      // Delete from Tigris
      await audioStorageService.deleteAudio(message.audioStorageKey);

      // Mark as deleted
      await messagesRepository.updateMessage(message.id, {
        audioDeletedAt: new Date(),
        audioUrl: null,
        audioStorageKey: null // Optional: Remove key after deletion
      });
    }
  }
}
```

## Performance Considerations

### Query Optimization

**Before (Heavy):**
```typescript
// Loads all messages with potentially large speech_timings
const messages = await messagesRepository.getConversationMessages(conversationId);
// Each message could have 100+ word timings = large payload
```

**After (Lean):**
```typescript
// Load messages without heavy audio data
const messages = await messagesRepository.getConversationMessages(conversationId);

// Only load analysis when needed (e.g., showing pronunciation feedback)
const analysis = await db
  .select()
  .from(messageAudioAnalysis)
  .where(eq(messageAudioAnalysis.messageId, selectedMessageId));
```

### Index Usage

- `audio_processing_state` index: Fast lookup of pending analysis jobs
- `audio_retention_expires_at` index: Efficient cleanup queries
- `audio_storage_key` index: Quick lookup by storage key
- Composite `(audio_retention_expires_at, audio_deleted_at)`: Optimized cleanup queries

## Next Steps

Now that the schema is ready, you can proceed with:

1. **✅ COMPLETED** - Schema updates
2. **✅ COMPLETED** - Audio retention configuration
3. **NEXT** - Implement audio upload service (from SPEECH_ANALYSIS_SETUP_GUIDE.md)
4. **NEXT** - Create background job for speech analysis
5. **NEXT** - Build UI components for pronunciation feedback

## Cost Estimates

**Storage (Tigris):**
- 100 active users
- 30 minutes/month average
- 1-5 MB per minute = 3-15 GB/month
- Storage: 15 GB × $0.02 = $0.30/month
- Transfer: 15 GB × $0.09 = $1.35/month
- **Total: ~$1.65/month for 100 users**

**With Retention Policy:**
- Free users (30 days): Reduces storage by 92% vs. permanent
- Plus users (90 days): Reduces storage by 75% vs. permanent
- Premium users (365 days): Full retention

## Migration Rollback

If needed, rollback with:

```sql
-- Remove new table
DROP TABLE message_audio_analysis CASCADE;

-- Remove new columns (keep essential ones)
ALTER TABLE messages DROP COLUMN audio_url_expires_at;
ALTER TABLE messages DROP COLUMN audio_storage_key;
ALTER TABLE messages DROP COLUMN audio_size_bytes;
ALTER TABLE messages DROP COLUMN audio_format;
ALTER TABLE messages DROP COLUMN audio_sample_rate;
ALTER TABLE messages DROP COLUMN audio_channels;
ALTER TABLE messages DROP COLUMN audio_processing_state;
ALTER TABLE messages DROP COLUMN audio_processing_error;
ALTER TABLE messages DROP COLUMN audio_retention_expires_at;
ALTER TABLE messages DROP COLUMN audio_deleted_at;
ALTER TABLE messages DROP COLUMN fluency_score;
ALTER TABLE messages DROP COLUMN speech_rate_wpm;

-- Revert type changes (if needed)
ALTER TABLE messages ALTER COLUMN audio_duration_ms SET DATA TYPE text;
ALTER TABLE messages ALTER COLUMN pronunciation_score SET DATA TYPE text;
ALTER TABLE messages RENAME COLUMN audio_duration_ms TO audio_duration;

-- Re-add speech_timings if needed
ALTER TABLE messages ADD COLUMN speech_timings jsonb;
```

## References

- **Schema Files:**
  - [src/lib/server/db/schema/messages.ts](../server/db/schema/messages.ts)
  - [src/lib/server/db/schema/message-audio-analysis.ts](../server/db/schema/message-audio-analysis.ts)

- **Configuration:**
  - [src/lib/server/config/audio-retention.config.ts](../server/config/audio-retention.config.ts)

- **Types:**
  - [src/lib/server/db/types.ts](../server/db/types.ts)

- **Migration:**
  - [drizzle/0023_round_gateway.sql](../../../drizzle/0023_round_gateway.sql)

- **Next Steps:**
  - [SPEECH_ANALYSIS_SETUP_GUIDE.md](./SPEECH_ANALYSIS_SETUP_GUIDE.md)

---

**Status:** ✅ All schema improvements completed and tested
**Migration:** ✅ Successfully applied
**Breaking Changes:** ⚠️ Yes - see Migration Details section
**Data Loss:** ❌ None - all changes were additive or converted safely
