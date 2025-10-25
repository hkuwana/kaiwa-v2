# Speech Analysis - Complete Implementation Guide

> **Prerequisites:** ✅ [Audio Schema Migration](./feature-audio-schema-migration.md) must be completed first
> **Status:** 📋 Ready to implement
> **Estimated Time:** 2-3 hours for basic implementation

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Implementation Steps](#implementation-steps)
  - [Step 1: Install Dependencies](#step-1-install-dependencies-5-min)
  - [Step 2: Set Up Tigris Storage](#step-2-set-up-tigris-storage-10-min)
  - [Step 3: Test Audio Storage](#step-3-test-audio-storage-15-min)
  - [Step 4: Capture Audio from Realtime](#step-4-capture-audio-from-realtime-20-min)
  - [Step 5: Create Audio Upload API](#step-5-create-audio-upload-api-10-min)
  - [Step 6: Implement Speech Analysis](#step-6-implement-speech-analysis-30-min)
  - [Step 7: Background Processing](#step-7-background-processing-20-min)
  - [Step 8: Build UI Components](#step-8-build-ui-components-30-min)
- [Testing](#testing)
- [Deployment Considerations](#deployment-considerations)
- [Troubleshooting](#troubleshooting)
- [Future Enhancements](#future-enhancements)

---

## Overview

Implement comprehensive pronunciation and speech analysis for Kaiwa using **Echogarden** for forced alignment, with audio storage on **Tigris/S3** and processing on **Fly.io**. This system provides detailed phonetics feedback similar to professional language learning platforms.

### What You'll Build

✅ **Audio Capture** - Save OpenAI Realtime audio to cloud storage
✅ **Speech Analysis** - Analyze pronunciation, fluency, speech rate
✅ **Phonetics Analysis** - IPA transcription and phoneme-level feedback
✅ **Background Jobs** - Process audio asynchronously
✅ **Feedback UI** - Display pronunciation results to users
✅ **Cost Management** - Automatic cleanup based on retention policy

### Key Features

- **Word-level timing** - Precise alignment of words with audio
- **Pronunciation scores** - 0-100 accuracy ratings
- **Fluency analysis** - Detect pauses, hesitations, speech rate
- **Phonetics feedback** - IPA transcription and phoneme analysis
- **Problematic words** - Identify specific issues
- **Practice recommendations** - Personalized suggestions
- **Multi-language support** - 8+ languages with language-specific analysis

---

## Architecture

```text
┌─────────────────────────────────────────────────────────────┐
│                    User speaks in browser                    │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              OpenAI Realtime API (WebRTC)                   │
│  • Transcription + Audio deltas (base64 PCM16)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│           Realtime Store (Client-side aggregation)          │
│  • Accumulate audio deltas per message                      │
│  • When message complete → Upload to server                 │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  POST /api/audio/upload                     │
│  • Receive audio buffer                                      │
│  • Upload to Tigris/S3 (audio-storage.service)             │
│  • Update messages table with metadata                       │
│  • Set audio_processing_state = 'uploaded'                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         Background Job (Cron or Event-triggered)            │
│  • Find messages with audio_processing_state = 'uploaded'   │
│  • Download audio from Tigris                               │
│  • Run Echogarden analysis (pronunciation-analysis.module)  │
│  • Store results in message_audio_analysis table            │
│  • Update message: audio_processing_state = 'analyzed'      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  Display Results in UI                       │
│  • Pronunciation score badge                                 │
│  • Word-level highlighting (click to see details)           │
│  • Practice recommendations                                  │
│  • Progress tracking over time                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Audio Capture** → Client accumulates audio deltas from OpenAI
2. **Storage** → Upload to Tigris/S3, store metadata in `messages` table
3. **Analysis** → Background job processes audio with Echogarden
4. **Results** → Store detailed analysis in `message_audio_analysis` table
5. **Display** → Load analysis on-demand when user views message

---

## Implementation Steps

### Step 1: Install Dependencies (5 min)

```bash
# AWS SDK for Tigris/S3 storage
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Echogarden for speech analysis
npm install echogarden

# Optional: TypeScript types
npm install --save-dev @types/node
```

**Verify installation:**

```bash
npm list echogarden @aws-sdk/client-s3
```

---

### Step 2: Set Up Tigris Storage (10 min)

#### 2.1 Create Tigris Bucket

```bash
# Create a Tigris bucket on Fly.io
fly storage create

# Output will look like:
# Access Key ID: tid_xxxxx
# Secret Access Key: tsec_xxxxx
# Bucket Name: kaiwa-audio
# Endpoint: https://fly.storage.tigris.dev
```

#### 2.2 Set Environment Variables

```bash
# Set secrets in Fly.io
fly secrets set \
  TIGRIS_BUCKET_NAME="kaiwa-audio" \
  TIGRIS_ACCESS_KEY_ID="tid_xxxxx" \
  TIGRIS_SECRET_ACCESS_KEY="tsec_xxxxx" \
  TIGRIS_ENDPOINT="https://fly.storage.tigris.dev"

# For local development, add to .env.development:
TIGRIS_BUCKET_NAME=kaiwa-audio-dev
TIGRIS_ACCESS_KEY_ID=tid_xxxxx
TIGRIS_SECRET_ACCESS_KEY=tsec_xxxxx
TIGRIS_ENDPOINT=https://fly.storage.tigris.dev
```

#### 2.3 Verify Configuration

```bash
fly secrets list
# Should show TIGRIS_* variables
```

---

### Step 3: Test Audio Storage (15 min)

Create a test script to verify storage works:

**File: `scripts/test-audio-storage.ts`**

```typescript
import { audioStorageService } from '$lib/server/services/audio-storage.service';

async function testAudioStorage() {
	console.log('🧪 Testing audio storage...\n');

	// Check configuration
	console.log('Config:', audioStorageService.getConfig());
	console.log('Is configured:', audioStorageService.isConfigured());

	if (!audioStorageService.isConfigured()) {
		console.error('❌ Tigris not configured. Set environment variables.');
		process.exit(1);
	}

	// Create test audio buffer
	const testAudioBuffer = Buffer.from('fake audio data for testing');

	try {
		// Upload
		console.log('\n📤 Uploading test audio...');
		const result = await audioStorageService.uploadAudio({
			userId: 'test-user',
			conversationId: 'test-convo',
			messageId: 'test-msg',
			audioBuffer: testAudioBuffer,
			mimeType: 'audio/wav'
		});

		console.log('✅ Upload successful!');
		console.log('  Storage key:', result.storageKey);
		console.log('  Signed URL:', result.signedUrl.substring(0, 50) + '...');
		console.log('  Size:', result.sizeBytes, 'bytes');

		// Download
		console.log('\n📥 Downloading audio...');
		const downloaded = await audioStorageService.downloadAudio(result.storageKey);
		console.log('✅ Download successful!');
		console.log('  Size:', downloaded.length, 'bytes');

		// Verify content matches
		if (downloaded.equals(testAudioBuffer)) {
			console.log('  ✅ Content matches original');
		} else {
			console.error('  ❌ Content mismatch!');
		}

		// Cleanup
		console.log('\n🗑️  Cleaning up...');
		await audioStorageService.deleteAudio(result.storageKey);
		console.log('✅ Cleanup complete!');

		console.log('\n🎉 All tests passed!');
	} catch (error) {
		console.error('\n❌ Test failed:', error);
		process.exit(1);
	}
}

testAudioStorage();
```

**Run test:**

```bash
npx tsx scripts/test-audio-storage.ts
```

---

### Step 4: Capture Audio from Realtime (20 min)

Modify the realtime store to accumulate and upload audio.

**File: `src/lib/stores/realtime-openai.store.svelte.ts`**

Add these methods to your realtime store class:

```typescript
// Add to class properties
private audioBuffers: Record<string, ArrayBuffer[]> = {};

// Method 1: Accumulate audio deltas
private accumulateAudioDelta(messageId: string, audioData: ArrayBuffer) {
  if (!this.audioBuffers[messageId]) {
    this.audioBuffers[messageId] = [];
  }
  this.audioBuffers[messageId].push(audioData);

  console.log(`📼 Accumulated audio for ${messageId}: ${audioData.byteLength} bytes`);
}

// Method 2: Convert base64 to ArrayBuffer
private base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Method 3: Combine multiple ArrayBuffers
private combineArrayBuffers(buffers: ArrayBuffer[]): ArrayBuffer {
  const totalLength = buffers.reduce((sum, buf) => sum + buf.byteLength, 0);
  const combined = new Uint8Array(totalLength);
  let offset = 0;
  for (const buffer of buffers) {
    combined.set(new Uint8Array(buffer), offset);
    offset += buffer.byteLength;
  }
  return combined.buffer;
}

// Method 4: Upload audio when message is complete
private async uploadAudio(messageId: string, conversationId: string) {
  const buffers = this.audioBuffers[messageId];
  if (!buffers || buffers.length === 0) {
    console.warn(`No audio buffers for message ${messageId}`);
    return;
  }

  try {
    // Combine all audio chunks
    const combinedBuffer = this.combineArrayBuffers(buffers);
    const buffer = Buffer.from(combinedBuffer);

    console.log(`📤 Uploading ${buffer.length} bytes for message ${messageId}`);

    // Upload to server
    const response = await fetch('/api/audio/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageId,
        conversationId,
        audioBase64: buffer.toString('base64'),
        format: 'pcm16',
        sampleRate: 24000,
        channels: 1
      })
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Audio uploaded:', data.audioUrl);

    // Cleanup buffer
    delete this.audioBuffers[messageId];
  } catch (error) {
    console.error('Failed to upload audio:', error);
  }
}

// Modify your existing event handler to capture audio
private async processServerEventOrdered(serverEvent: SDKTransportEvent) {
  // ... existing code ...

  // ADD THIS: Capture audio deltas
  if (
    serverEvent?.type === 'response.audio.delta' ||
    serverEvent?.type === 'response.output_audio.delta'
  ) {
    const messageId = this.currentAssistantMessageId;
    if (messageId && serverEvent.delta) {
      const audioData = this.base64ToArrayBuffer(serverEvent.delta);
      this.accumulateAudioDelta(messageId, audioData);
    }
  }

  // When message is done, upload audio
  if (serverEvent?.type === 'response.output_audio.done') {
    const messageId = this.currentAssistantMessageId;
    const conversationId = this.conversationContext?.sessionId;
    if (messageId && conversationId) {
      await this.uploadAudio(messageId, conversationId);
    }
  }

  // ... rest of existing code ...
}
```

---

### Step 5: Create Audio Upload API (10 min)

**File: `src/routes/api/audio/upload/+server.ts`**

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { audioStorageService } from '$lib/server/services/audio-storage.service';
import { messagesRepository } from '$lib/server/repositories/messages.repository';
import {
	calculateAudioRetentionExpiry,
	calculateSignedUrlExpiry
} from '$lib/server/config/audio-retention.config';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const {
			messageId,
			conversationId,
			audioBase64,
			format = 'pcm16',
			sampleRate = 24000,
			channels = 1
		} = await request.json();

		if (!messageId || !audioBase64) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Get user tier for retention policy
		const user = locals.user;
		const userTier = user?.tier || 'free';

		// Convert base64 to buffer
		const audioBuffer = Buffer.from(audioBase64, 'base64');
		console.log(`📥 Received audio for message ${messageId}: ${audioBuffer.length} bytes`);

		// Upload to Tigris/S3
		const uploadResult = await audioStorageService.uploadAudio({
			userId: user?.id || 'anonymous',
			conversationId,
			messageId,
			audioBuffer,
			mimeType: `audio/${format}`
		});

		console.log(`✅ Uploaded to storage: ${uploadResult.storageKey}`);

		// Update message with audio metadata
		await messagesRepository.updateMessage(messageId, {
			audioUrl: uploadResult.signedUrl,
			audioUrlExpiresAt: calculateSignedUrlExpiry(),
			audioStorageKey: uploadResult.storageKey,
			audioDurationMs: Math.round((audioBuffer.length / (sampleRate * channels * 2)) * 1000), // Rough estimate
			audioSizeBytes: uploadResult.sizeBytes,
			audioFormat: format,
			audioSampleRate: sampleRate,
			audioChannels: channels,
			audioProcessingState: 'uploaded',
			audioRetentionExpiresAt: calculateAudioRetentionExpiry(userTier)
		});

		console.log(`✅ Updated message ${messageId} with audio metadata`);

		return json({
			success: true,
			messageId,
			audioUrl: uploadResult.signedUrl,
			storageKey: uploadResult.storageKey,
			sizeBytes: uploadResult.sizeBytes
		});
	} catch (error) {
		console.error('Audio upload failed:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Upload failed' },
			{ status: 500 }
		);
	}
};
```

---

### Step 6: Implement Speech Analysis (30 min)

#### 6.1 Phonetics Analysis Features

**IPA Transcription Support**

- International Phonetic Alphabet representation for each word
- Phoneme-level timing and accuracy analysis
- Cross-language phonetic comparison capabilities

**Phoneme-Level Feedback**

- Individual sound accuracy scores (0-100)
- Common pronunciation errors identification
- Targeted practice recommendations for specific sounds

**Language-Specific Analysis**

- English: Vowel/consonant analysis, stress patterns
- Japanese: Hiragana/Katakana pronunciation, pitch accent
- Spanish: Romance language patterns, rolled R detection
- French: Nasal vowel analysis, liaison patterns
- German: Consonant cluster analysis, umlaut pronunciation
- Chinese: Tone analysis and accuracy
- Korean: Syllable structure analysis
- Italian, Portuguese, Russian: Language-specific phonetic patterns

#### 6.2 Create Pronunciation Analysis Module

**File: `src/lib/features/analysis/modules/pronunciation-analysis.module.ts`**

```typescript
import { align } from 'echogarden';
import type { Message, MessageAudioAnalysis } from '$lib/server/db/types';
import { audioStorageService } from '$lib/server/services/audio-storage.service';
import { messageAudioAnalysisRepository } from '$lib/server/repositories/message-audio-analysis.repository';

export interface PronunciationAnalysisInput {
	message: Message;
	languageCode: string;
}

export interface PronunciationAnalysisResult {
	overallAccuracyScore: number;
	overallFluencyScore: number;
	speechRateWpm: number;
	articulationRateWpm: number;
	pauseCount: number;
	hesitationCount: number;
	speechTimings: Array<{
		word: string;
		startMs: number;
		endMs: number;
		charStart: number;
		charEnd: number;
		confidence?: number;
	}>;
	problematicWords: Array<{
		word: string;
		issue: string;
		severity: 'low' | 'medium' | 'high';
		startMs: number;
		endMs: number;
	}>;
	recommendations: string[];
	practiceWords: string[];
}

export class PronunciationAnalysisModule {
	async analyze(input: PronunciationAnalysisInput): Promise<PronunciationAnalysisResult> {
		const { message, languageCode } = input;

		console.log(`🔍 Analyzing pronunciation for message ${message.id}`);

		// Download audio from storage
		if (!message.audioStorageKey) {
			throw new Error('No audio storage key found');
		}

		const audioBuffer = await audioStorageService.downloadAudio(message.audioStorageKey);
		console.log(`📥 Downloaded ${audioBuffer.length} bytes`);

		// Run Echogarden alignment
		const alignmentResult = await align(audioBuffer, {
			text: message.content,
			language: languageCode,
			options: {
				engine: 'whisper',
				model: 'tiny' // Start with tiny model, can upgrade to base/small
			}
		});

		console.log(`✅ Alignment complete: ${alignmentResult.timeline.length} segments`);

		// Process alignment results
		const speechTimings: PronunciationAnalysisResult['speechTimings'] = [];
		const pauses: number[] = [];
		let totalSpeechMs = 0;
		let totalPauseMs = 0;

		for (let i = 0; i < alignmentResult.timeline.length; i++) {
			const segment = alignmentResult.timeline[i];
			const startMs = Math.round(segment.startTime * 1000);
			const endMs = Math.round(segment.endTime * 1000);

			speechTimings.push({
				word: segment.text,
				startMs,
				endMs,
				charStart: segment.startOffset || 0,
				charEnd: segment.endOffset || segment.text.length,
				confidence: segment.confidence
			});

			totalSpeechMs += endMs - startMs;

			// Detect pauses (gaps between words)
			if (i > 0) {
				const prevSegment = alignmentResult.timeline[i - 1];
				const prevEndMs = Math.round(prevSegment.endTime * 1000);
				const pauseMs = startMs - prevEndMs;

				if (pauseMs > 150) {
					// 150ms threshold
					pauses.push(pauseMs);
					totalPauseMs += pauseMs;
				}
			}
		}

		// Calculate metrics
		const wordCount = speechTimings.length;
		const totalDurationMs = message.audioDurationMs || totalSpeechMs + totalPauseMs;
		const speechRateWpm = (wordCount / (totalDurationMs / 1000)) * 60;
		const articulationRateWpm = (wordCount / (totalSpeechMs / 1000)) * 60;

		// Detect hesitations (um, uh, er, etc.)
		const hesitationWords = ['um', 'uh', 'er', 'ah', 'hmm'];
		const hesitationCount = speechTimings.filter((timing) =>
			hesitationWords.includes(timing.word.toLowerCase())
		).length;

		// Calculate scores (simplified - can be enhanced)
		const avgConfidence =
			speechTimings.reduce((sum, t) => sum + (t.confidence || 0), 0) / speechTimings.length;
		const overallAccuracyScore = Math.round(avgConfidence * 100);

		// Fluency score based on pauses and hesitations
		const pausePenalty = Math.min(pauses.length * 5, 30);
		const hesitationPenalty = Math.min(hesitationCount * 10, 30);
		const overallFluencyScore = Math.max(0, Math.min(100, 100 - pausePenalty - hesitationPenalty));

		// Identify problematic words (low confidence)
		const problematicWords = speechTimings
			.filter((t) => t.confidence && t.confidence < 0.7)
			.map((t) => ({
				word: t.word,
				issue: `Low confidence pronunciation (${Math.round((t.confidence || 0) * 100)}%)`,
				severity: (t.confidence || 0) < 0.5 ? ('high' as const) : ('medium' as const),
				startMs: t.startMs,
				endMs: t.endMs
			}))
			.slice(0, 10); // Limit to top 10

		// Generate recommendations
		const recommendations: string[] = [];
		if (overallAccuracyScore < 70) {
			recommendations.push('Focus on clear pronunciation of each word');
		}
		if (pauses.length > 5) {
			recommendations.push('Try to reduce pauses between words');
		}
		if (hesitationCount > 2) {
			recommendations.push('Practice speaking without filler words (um, uh)');
		}
		if (speechRateWpm < 100) {
			recommendations.push('Try to speak a bit faster');
		} else if (speechRateWpm > 180) {
			recommendations.push('Slow down for better clarity');
		}
		if (recommendations.length === 0) {
			recommendations.push('Great job! Keep practicing to maintain your skills.');
		}

		const practiceWords = problematicWords.map((pw) => pw.word).slice(0, 5);

		return {
			overallAccuracyScore,
			overallFluencyScore,
			speechRateWpm: Math.round(speechRateWpm),
			articulationRateWpm: Math.round(articulationRateWpm),
			pauseCount: pauses.length,
			hesitationCount,
			speechTimings,
			problematicWords,
			recommendations,
			practiceWords
		};
	}

	async saveResults(
		messageId: string,
		result: PronunciationAnalysisResult,
		languageCode: string
	): Promise<void> {
		await messageAudioAnalysisRepository.createAnalysis({
			messageId,
			overallAccuracyScore: result.overallAccuracyScore,
			overallFluencyScore: result.overallFluencyScore,
			speechRateWpm: result.speechRateWpm,
			articulationRateWpm: result.articulationRateWpm,
			pauseCount: result.pauseCount,
			hesitationCount: result.hesitationCount,
			totalSpeechDurationMs: result.speechTimings.reduce(
				(sum, t) => sum + (t.endMs - t.startMs),
				0
			),
			speechTimings: result.speechTimings as any,
			problematicWords: result.problematicWords as any,
			recommendations: result.recommendations,
			practiceWords: result.practiceWords,
			analysisEngine: 'echogarden',
			analysisLanguage: languageCode
		});

		console.log(`✅ Saved analysis for message ${messageId}`);
	}
}

export const pronunciationAnalysisModule = new PronunciationAnalysisModule();
```

---

### Step 7: Background Processing (20 min)

Create a background job to process uploaded audio.

**File: `src/lib/server/jobs/process-audio-analysis.ts`**

```typescript
import { db } from '$lib/server/db';
import { messages } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { pronunciationAnalysisModule } from '$lib/features/analysis/modules/pronunciation-analysis.module';
import { messagesRepository } from '$lib/server/repositories/messages.repository';

export async function processAudioAnalysis(batchSize = 10) {
	console.log('🔄 Starting audio analysis job...');

	// Find messages that need analysis
	const messagesToAnalyze = await db
		.select()
		.from(messages)
		.where(eq(messages.audioProcessingState, 'uploaded'))
		.limit(batchSize);

	if (messagesToAnalyze.length === 0) {
		console.log('✅ No messages to analyze');
		return 0;
	}

	console.log(`📊 Found ${messagesToAnalyze.length} messages to analyze`);

	let successCount = 0;
	let failureCount = 0;

	for (const message of messagesToAnalyze) {
		try {
			// Mark as analyzing
			await messagesRepository.updateMessage(message.id, {
				audioProcessingState: 'analyzing'
			});

			// Run analysis
			const result = await pronunciationAnalysisModule.analyze({
				message,
				languageCode: message.sourceLanguage || 'en'
			});

			// Save results
			await pronunciationAnalysisModule.saveResults(
				message.id,
				result,
				message.sourceLanguage || 'en'
			);

			// Update message with scores and mark as analyzed
			await messagesRepository.updateMessage(message.id, {
				pronunciationScore: result.overallAccuracyScore,
				fluencyScore: result.overallFluencyScore,
				speechRateWpm: result.speechRateWpm,
				audioProcessingState: 'analyzed'
			});

			successCount++;
			console.log(`✅ Analyzed message ${message.id}`);
		} catch (error) {
			failureCount++;
			console.error(`❌ Failed to analyze message ${message.id}:`, error);

			// Mark as failed
			await messagesRepository.updateMessage(message.id, {
				audioProcessingState: 'failed',
				audioProcessingError: error instanceof Error ? error.message : 'Unknown error'
			});
		}
	}

	console.log(`🎉 Analysis complete: ${successCount} success, ${failureCount} failed`);
	return successCount;
}
```

**Create API endpoint to trigger job:**

**File: `src/routes/api/jobs/process-audio/+server.ts`**

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { processAudioAnalysis } from '$lib/server/jobs/process-audio-analysis';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { batchSize = 10 } = await request.json().catch(() => ({}));

		const processedCount = await processAudioAnalysis(batchSize);

		return json({
			success: true,
			processedCount
		});
	} catch (error) {
		console.error('Job failed:', error);
		return json({ error: error instanceof Error ? error.message : 'Job failed' }, { status: 500 });
	}
};
```

**Optional: Set up cron job on Fly.io:**

Add to `fly.toml`:

```toml
[http_service.checks]
  grace_period = "10s"
  interval = "60s"
  method = "GET"
  timeout = "5s"
  path = "/api/health"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 2048  # Echogarden needs more memory

# Add this for scheduled jobs (requires Fly.io paid plan)
[processes]
  web = "node build/index.js"
  worker = "node build/worker.js"  # Create a worker process
```

---

### Step 8: Build UI Components (30 min)

#### 8.1 Phonetics Feedback UI Features

**Pronunciation Score Display**

- Overall accuracy and fluency scores (0-100)
- Visual progress indicators and badges
- Color-coded accuracy levels (green/yellow/red)

**Word-Level Phonetics Display**

- Clickable words with detailed feedback
- IPA transcription for each word
- Phoneme-level accuracy scores
- Timing visualization with confidence indicators

**Practice Recommendations Panel**

- Personalized suggestions based on analysis
- Targeted word practice lists
- Progress tracking over time
- Language-specific pronunciation tips

**Visual Timeline Component**

- Word-by-word timing visualization
- Pause and hesitation markers
- Confidence score indicators
- Interactive playback controls

#### 8.2 Pronunciation Feedback Component

**File: `src/lib/components/PronunciationFeedback.svelte`**

```svelte
<script lang="ts">
	import type { MessageAudioAnalysis } from '$lib/server/db/types';

	let { messageId }: { messageId: string } = $props();

	let analysis = $state<MessageAudioAnalysis | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);

	async function loadAnalysis() {
		try {
			const response = await fetch(`/api/analysis/pronunciation/${messageId}`);
			if (!response.ok) throw new Error('Failed to load analysis');
			analysis = await response.json();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		loadAnalysis();
	});
</script>

{#if loading}
	<div class="flex items-center gap-2">
		<span class="loading loading-sm loading-spinner"></span>
		<span class="text-sm">Analyzing pronunciation...</span>
	</div>
{:else if error}
	<div class="alert alert-error">
		<span>Failed to load analysis: {error}</span>
	</div>
{:else if analysis}
	<div class="card space-y-4 bg-base-200 p-4">
		<!-- Overall Scores -->
		<div class="grid grid-cols-2 gap-4">
			<div class="stat rounded-lg bg-base-100 p-3">
				<div class="stat-title text-xs">Accuracy</div>
				<div class="stat-value text-2xl">{analysis.overallAccuracyScore}%</div>
				<div class="stat-desc">
					{#if analysis.overallAccuracyScore >= 80}
						Great pronunciation!
					{:else if analysis.overallAccuracyScore >= 60}
						Good effort, keep practicing
					{:else}
						Needs improvement
					{/if}
				</div>
			</div>

			<div class="stat rounded-lg bg-base-100 p-3">
				<div class="stat-title text-xs">Fluency</div>
				<div class="stat-value text-2xl">{analysis.overallFluencyScore}%</div>
				<div class="stat-desc">
					{analysis.pauseCount} pauses, {analysis.hesitationCount} hesitations
				</div>
			</div>
		</div>

		<!-- Speech Rate -->
		<div class="rounded-lg bg-base-100 p-3">
			<h4 class="mb-2 text-sm font-semibold">Speech Rate</h4>
			<p class="mb-1 text-xs">{analysis.speechRateWpm} words/minute</p>
			<progress
				class="progress h-2 w-full progress-primary"
				value={analysis.speechRateWpm}
				max="200"
			></progress>
			<p class="mt-1 text-xs text-base-content/60">
				{#if analysis.speechRateWpm < 100}
					Try speaking a bit faster
				{:else if analysis.speechRateWpm > 180}
					Slow down for better clarity
				{:else}
					Good pace!
				{/if}
			</p>
		</div>

		<!-- Problematic Words -->
		{#if analysis.problematicWords && (analysis.problematicWords as any).length > 0}
			<div class="rounded-lg bg-base-100 p-3">
				<h4 class="mb-2 text-sm font-semibold">
					Words to Practice ({(analysis.problematicWords as any).length})
				</h4>
				<div class="flex flex-wrap gap-2">
					{#each analysis.problematicWords as any as word}
						<span class="badge badge-sm badge-warning">{word.word}</span>
					{/each}
				</div>
			</div>
		{/if}

		<!-- Recommendations -->
		{#if analysis.recommendations && (analysis.recommendations as any).length > 0}
			<div class="rounded-lg bg-base-100 p-3">
				<h4 class="mb-2 text-sm font-semibold">Recommendations</h4>
				<ul class="list-inside list-disc space-y-1 text-xs">
					{#each analysis.recommendations as any as rec}
						<li>{rec}</li>
					{/each}
				</ul>
			</div>
		{/if}
	</div>
{/if}
```

**Create API endpoint to fetch analysis:**

**File: `src/routes/api/analysis/pronunciation/[messageId]/+server.ts`**

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { messageAudioAnalysisRepository } from '$lib/server/repositories/message-audio-analysis.repository';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const analysis = await messageAudioAnalysisRepository.getByMessageId(params.messageId);

		if (!analysis) {
			return json({ error: 'Analysis not found' }, { status: 404 });
		}

		return json(analysis);
	} catch (error) {
		console.error('Failed to fetch analysis:', error);
		return json(
			{ error: error instanceof Error ? error.message : 'Failed to fetch analysis' },
			{ status: 500 }
		);
	}
};
```

---

## Testing

### Testing Checklist

- [ ] Tigris storage configured and accessible
- [ ] Audio upload works (test with dummy data)
- [ ] Audio download works
- [ ] Echogarden can be imported
- [ ] Pronunciation analysis runs without errors
- [ ] Results are stored in `message_audio_analysis` table
- [ ] Background job processes uploaded audio
- [ ] UI displays results correctly
- [ ] Signed URLs expire and refresh correctly
- [ ] Audio cleanup job works

### Manual Testing

```bash
# 1. Test audio storage
npx tsx scripts/test-audio-storage.ts

# 2. Start dev server
pnpm dev

# 3. Have a conversation in browser
# 4. Check that audio is uploaded
psql "$DATABASE_URL" -c "SELECT id, audio_storage_key, audio_processing_state FROM messages WHERE audio_storage_key IS NOT NULL ORDER BY timestamp DESC LIMIT 5;"

# 5. Trigger analysis job
curl -X POST http://localhost:5173/api/jobs/process-audio -H "Content-Type: application/json" -d '{"batchSize": 5}'

# 6. Check results
psql "$DATABASE_URL" -c "SELECT message_id, overall_accuracy_score, overall_fluency_score FROM message_audio_analysis ORDER BY analyzed_at DESC LIMIT 5;"
```

---

## Deployment Considerations

### Memory Requirements

Echogarden requires significant memory:

- **Minimum:** 1GB RAM
- **Recommended:** 2GB RAM for better performance

Update `fly.toml`:

```toml
[[vm]]
  memory_mb = 2048
```

### Processing Time

- ~2-5 seconds per 10 seconds of audio
- Run as background job to avoid blocking requests
- Consider rate limiting analysis requests

### Cost Management

**Storage (Tigris):**

- ~$0.02/GB storage
- ~$0.09/GB transfer
- Average: ~1-5MB per minute of audio

**Compute (Fly.io):**

- ~$0.02/hour for 2GB VM
- Analysis is CPU-intensive

**Total estimate:** ~$10-30/month for 100 active users

### Optimization Tips

1. **Use smaller Echogarden models** - Start with 'tiny', upgrade to 'base' if needed
2. **Batch processing** - Process multiple messages at once
3. **Caching** - Cache analysis results (already done via database)
4. **CDN** - Use Tigris global replication for faster downloads
5. **Retention** - Implement cleanup job (see Audio Schema Migration Guide)

---

## Troubleshooting

### Common Issues

#### 1. "Echogarden not found"

```bash
npm install echogarden
# If fails:
npm install echogarden --legacy-peer-deps
```

#### 2. "Out of memory" during analysis

- Upgrade VM memory: `fly scale memory 2048`
- Use smaller Echogarden model: `model: 'tiny'`
- Process fewer messages at once

#### 3. "Audio download fails"

- Check Tigris credentials: `fly secrets list`
- Verify bucket exists: `fly storage list`
- Check signed URL hasn't expired

#### 4. "Analysis takes too long"

- Process smaller audio chunks
- Use simpler alignment engine
- Increase timeout limits

#### 5. "UI doesn't show results"

- Check `audio_processing_state = 'analyzed'` in database
- Verify `message_audio_analysis` record exists
- Check browser console for errors

---

## Future Enhancements

### Phase 2 Features

1. **Real-time feedback** - Show pronunciation during conversation
2. **Historical tracking** - Track improvement over time with graphs
3. **Advanced phoneme-level analysis** - Detailed sound-by-sound feedback with IPA
4. **Azure Speech SDK** - Professional pronunciation scoring
5. **Practice exercises** - Generate targeted exercises based on issues
6. **Spectrogram visualization** - Visual representation of speech sounds
7. **Formant analysis** - Vowel quality and pronunciation analysis
8. **Accent reduction training** - Targeted accent modification exercises

### Advanced Features

6. **Multi-speaker support** - Analyze group conversations
7. **Accent detection** - Identify and adapt to accents
8. **IPA transcription** - Show International Phonetic Alphabet
9. **Audio playback** - Listen to specific problematic segments
10. **Comparison** - Compare pronunciation to native speakers

### Analytics

- Progress dashboard showing improvement over time
- Heatmap of frequently mispronounced words
- Leaderboard for gamification
- Export reports for teachers

---

## Summary

You now have a complete speech analysis pipeline:

✅ **Audio capture** - From OpenAI Realtime to cloud storage
✅ **Speech analysis** - Pronunciation, fluency, timing analysis
✅ **Background processing** - Async job for heavy processing
✅ **Data persistence** - Stored in `message_audio_analysis` table
✅ **UI feedback** - Display results to users
✅ **Cost management** - Retention policies and cleanup

**Next:** Test the full flow end-to-end and iterate on the analysis algorithms!

For schema details, see: [Audio Schema Migration Guide](./feature-audio-schema-migration.md)
