# Speech Analysis Implementation Plan

## Overview

Implement pronunciation and speech analysis for Kaiwa using Echogarden, with audio storage on Tigris/S3 and processing on Fly.io.

## Architecture

```text
User speaks → OpenAI Realtime → Audio Buffer + Transcript
                                         ↓
                            Save to Tigris/S3 + Database
                                         ↓
                        Background Job: Speech Analysis
                                         ↓
                            Echogarden Pronunciation Analysis
                                         ↓
                        Store Results in analysis_findings table
```

## Phase 1: Audio Storage Infrastructure

### 1.1 Choose Storage Provider

**Option A: Tigris (Recommended for Fly.io)**

- Native Fly.io integration
- S3-compatible API
- Free tier available
- Setup: `fly storage create`

**Option B: AWS S3**

- More mature, widely supported
- Pay as you go
- Better for future scalability

**Decision:** Start with Tigris for simplicity, can migrate to S3 later.

### 1.2 Install Dependencies

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
npm install echogarden
```

### 1.3 Set Up Environment Variables

```bash
# Add to fly.io secrets
fly secrets set \
  TIGRIS_BUCKET_NAME="kaiwa-audio" \
  TIGRIS_ACCESS_KEY_ID="your-key" \
  TIGRIS_SECRET_ACCESS_KEY="your-secret" \
  TIGRIS_ENDPOINT="https://fly.storage.tigris.dev"
```

### 1.4 Create Audio Storage Service

File: `src/lib/server/services/audio-storage.service.ts`

### 1.5 Add Audio Recording Table (Optional)

Alternative: Use existing `messages.audioUrl` field

```sql
ALTER TABLE messages
ADD COLUMN audio_storage_key TEXT,
ADD COLUMN audio_mime_type TEXT DEFAULT 'audio/wav',
ADD COLUMN audio_size_bytes INTEGER;
```

## Phase 2: Capture & Store Audio from Realtime

### 2.1 Modify Realtime Store to Save Audio Buffers

File: `src/lib/stores/realtime-openai.store.svelte.ts`

- Accumulate audio deltas per message
- When message is finalized, upload to storage

### 2.2 Create Audio Upload Endpoint

File: `src/routes/api/audio/upload/+server.ts`

- Accept audio buffer from client
- Upload to Tigris
- Update message record with audioUrl

### 2.3 Update Message Creation Flow

When saving messages to database:

1. Upload audio buffer to storage
2. Get public/signed URL
3. Save URL to `messages.audioUrl`
4. Save storage metadata

## Phase 3: Pronunciation Analysis Module

### 3.1 Create Echogarden Analysis Module

File: `src/lib/features/analysis/modules/pronunciation-analysis.module.ts`

Features to extract:

- Word-level timing alignment
- Speech rate (words per minute)
- Pause patterns and locations
- Hesitation detection
- Phoneme-level timings
- Pronunciation clarity metrics

### 3.2 Create Background Job for Speech Analysis

File: `src/lib/server/services/speech-analysis-job.service.ts`

Options for background processing:

- **Option A**: Simple polling (check for unprocessed audio every N minutes)
- **Option B**: Event-driven (trigger on message save)
- **Option C**: Manual trigger (user clicks "Analyze")

Recommendation: Start with Option C (manual), then add Option B.

### 3.3 Install Echogarden with Models

Echogarden needs model files. Two approaches:

1. **Download on first use** (easier, slower first time)
2. **Bundle in Docker image** (faster, larger image)

For Fly.io with limited disk space, use approach #1.

### 3.4 Handle Memory Constraints

Echogarden can be memory-intensive. Strategies:

- Process one audio file at a time
- Limit concurrent analysis jobs
- Use streaming where possible
- Consider upgrading to 2GB VM for analysis

## Phase 4: Integration with Analysis Pipeline

### 4.1 Extend Analysis Module Types

File: `src/lib/features/analysis/types/analysis-module.types.ts`

```typescript
export type AnalysisModality = 'text' | 'speech' | 'combined';
```

### 4.2 Update Analysis Pipeline Service

File: `src/lib/features/analysis/services/analysis-pipeline.service.ts`

- Support speech modality modules
- Fetch audio from storage URLs
- Pass audio buffers to speech modules

### 4.3 Create Speech Analysis Results Schema

File: `src/lib/features/analysis/types/speech-analysis.types.ts`

### 4.4 Store Results in analysis_findings

Use existing table with structured JSON:

```json
{
  "type": "pronunciation_analysis",
  "speechRate": 145.2,
  "pauses": [...],
  "problematicWords": [...],
  "timingAccuracy": 0.87,
  "recommendations": [...]
}
```

## Phase 5: UI Integration

### 5.1 Create Pronunciation Analysis Display Component

File: `src/lib/features/analysis/components/PronunciationAnalysis.svelte`

Features:

- Visual timeline of speech
- Highlight problematic words
- Show pause patterns
- Display speech rate
- Pronunciation recommendations

### 5.2 Add to QuickAnalysis Modal

Extend existing QuickAnalysis to show pronunciation insights

### 5.3 Add "Analyze Pronunciation" Button

In conversation history or message bubbles

## Phase 6: Optimization & Production

### 6.1 Implement Caching

- Cache analysis results
- Don't re-analyze same audio

### 6.2 Add Rate Limiting

- Limit analysis requests per user/day
- Integrate with existing quota system

### 6.3 Add Cleanup Job

- Delete old audio files after N days
- Free up storage space

### 6.4 Monitor & Optimize

- Track processing times
- Monitor memory usage
- Optimize model loading

## Technical Specifications

### Audio Format

- Format: PCM/WAV or WebM
- Sample Rate: 24000 Hz (from OpenAI Realtime)
- Channels: Mono
- Bit Depth: 16-bit

### Echogarden Configuration

```typescript
{
  alignment: {
    engine: 'dtw-ra', // Dynamic Time Warping with Refinement
    granularity: 'word', // or 'word+phoneme'
  },
  recognitionEngine: 'whisper', // Built-in Whisper model
  language: 'en' // Dynamic based on target language
}
```

### Storage Paths

```
/{userId}/{conversationId}/{messageId}.wav
```

### Cost Estimates

- Tigris: ~$0.02/GB stored, $0.09/GB transfer
- Echogarden: Free (runs locally)
- Processing: ~2-5 seconds per 10 seconds of audio

## Migration Path

### Immediate (Week 1)

1. Set up Tigris storage
2. Create audio-storage.service.ts
3. Test audio upload flow

### Short-term (Week 2-3)

4. Implement basic Echogarden integration
5. Create pronunciation-analysis module
6. Manual analysis trigger

### Medium-term (Month 2)

7. Automatic analysis on conversation end
8. UI components for displaying results
9. Integration with existing analysis pipeline

### Long-term (Month 3+)

10. Azure Speech SDK for advanced metrics
11. Real-time pronunciation feedback
12. Personalized pronunciation exercises

## Risks & Mitigations

### Risk 1: Echogarden Memory Usage

- **Mitigation**: Process smaller chunks, upgrade VM to 2GB

### Risk 2: Storage Costs

- **Mitigation**: Delete old audio, compress files, implement retention policy

### Risk 3: Processing Time

- **Mitigation**: Async processing, show progress indicator, cache results

### Risk 4: Model Downloads

- **Mitigation**: Pre-download models in Docker build, implement retry logic

## Success Metrics

- Audio upload success rate greather than 95%
- Analysis completion time less than 30s for 1min audio
- User engagement with pronunciation features above 30%
- Storage costs less than $10/month for 100 active users
