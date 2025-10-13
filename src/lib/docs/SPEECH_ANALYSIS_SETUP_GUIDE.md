# Speech Analysis Setup Guide

## Quick Start Summary

You now have a complete foundation for speech analysis! Here's what's been created and what you need to do next.

## 📁 Files Created

1. **[SPEECH_ANALYSIS_IMPLEMENTATION_PLAN.md](SPEECH_ANALYSIS_IMPLEMENTATION_PLAN.md)** - Complete implementation roadmap
2. **[src/lib/server/services/audio-storage.service.ts](src/lib/server/services/audio-storage.service.ts)** - Audio upload/download service
3. **[src/lib/features/analysis/types/speech-analysis.types.ts](src/lib/features/analysis/types/speech-analysis.types.ts)** - Type definitions
4. **[src/lib/features/analysis/modules/pronunciation-analysis.module.ts](src/lib/features/analysis/modules/pronunciation-analysis.module.ts)** - Analysis module

## 🚀 Next Steps (Small Incremental Steps)

### Step 1: Install Dependencies (5 minutes)

```bash
# Install AWS SDK for Tigris/S3 storage
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner

# Install Echogarden for speech analysis
npm install echogarden

# Optional: TypeScript types
npm install --save-dev @types/node
```

### Step 2: Set Up Tigris Storage on Fly.io (10 minutes)

```bash
# Create a Tigris bucket
fly storage create

# The command will output credentials. Save them!
# Example output:
# Access Key ID: tid_xxxxx
# Secret Access Key: tsec_xxxxx
# Bucket Name: kaiwa-audio
# Endpoint: https://fly.storage.tigris.dev

# Set secrets in Fly.io
fly secrets set \
  TIGRIS_BUCKET_NAME="kaiwa-audio" \
  TIGRIS_ACCESS_KEY_ID="tid_xxxxx" \
  TIGRIS_SECRET_ACCESS_KEY="tsec_xxxxx" \
  TIGRIS_ENDPOINT="https://fly.storage.tigris.dev"
```

### Step 3: Test Audio Storage Service (15 minutes)

Create a test script to verify storage works:

**File: `scripts/test-audio-storage.ts`**
```typescript
import { audioStorageService } from '$lib/server/services/audio-storage.service';
import { readFileSync } from 'fs';

async function testAudioStorage() {
  console.log('🧪 Testing audio storage...\n');

  // Check configuration
  console.log('Config:', audioStorageService.getConfig());
  console.log('Is configured:', audioStorageService.isConfigured());

  // Create a test audio buffer (or use a real file)
  const testAudioBuffer = Buffer.from('fake audio data for testing');

  try {
    // Upload
    console.log('\n📤 Uploading test audio...');
    const result = await audioStorageService.uploadAudio({
      userId: 'test-user',
      conversationId: 'test-convo',
      messageId: 'test-msg',
      audioBuffer: testAudioBuffer
    });

    console.log('✅ Upload successful!');
    console.log('Storage key:', result.storageKey);
    console.log('Public URL:', result.publicUrl);
    console.log('Size:', result.sizeBytes, 'bytes');

    // Download
    console.log('\n📥 Downloading audio...');
    const downloaded = await audioStorageService.downloadAudio(result.storageKey);
    console.log('✅ Download successful!');
    console.log('Size:', downloaded.length, 'bytes');

    // Cleanup
    console.log('\n🗑️  Cleaning up...');
    await audioStorageService.deleteAudio(result.storageKey);
    console.log('✅ Cleanup complete!');

    console.log('\n🎉 All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

testAudioStorage();
```

Run it:
```bash
npx tsx scripts/test-audio-storage.ts
```

### Step 4: Capture Audio During Realtime Conversations (20 minutes)

You need to modify your realtime store to save audio buffers. Here's how:

**File: `src/lib/stores/realtime-openai.store.svelte.ts`**

Add this to the class:
```typescript
// Add near the top of the class
private audioBuffers: Record<string, ArrayBuffer[]> = {};

// Add this method to accumulate audio
private accumulateAudioDelta(messageId: string, audioData: ArrayBuffer) {
  if (!this.audioBuffers[messageId]) {
    this.audioBuffers[messageId] = [];
  }
  this.audioBuffers[messageId].push(audioData);
}

// Modify processServerEventOrdered to capture audio
private async processServerEventOrdered(serverEvent: SDKTransportEvent) {
  // Existing code...

  // ADD THIS: Capture audio deltas
  if (
    serverEvent?.type === 'response.output_audio.delta' ||
    serverEvent?.type === 'response.audio.delta'
  ) {
    const messageId = this.currentAssistantMessageId;
    if (messageId && serverEvent.delta) {
      // Decode base64 audio and accumulate
      const audioData = this.base64ToArrayBuffer(serverEvent.delta);
      this.accumulateAudioDelta(messageId, audioData);
    }

    this.handleAssistantAudioDelta(serverEvent);
  }

  // Existing code...
}

// Add helper method
private base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// When message is finalized, upload audio
private async finalizeTranscriptMessage(itemId: string, role: 'assistant' | 'user', text: string) {
  // ... existing code ...

  // ADD THIS: Upload accumulated audio
  if (this.audioBuffers[itemId]) {
    const combinedBuffer = this.combineArrayBuffers(this.audioBuffers[itemId]);
    const buffer = Buffer.from(combinedBuffer);

    // Upload to storage
    try {
      const result = await fetch('/api/audio/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: itemId,
          conversationId: this.conversationContext?.sessionId,
          userId: this.conversationContext?.userId,
          audioBase64: buffer.toString('base64')
        })
      });

      const data = await result.json();
      console.log('✅ Audio uploaded:', data.audioUrl);

      // Update message with audio URL
      // TODO: Call your message update API
    } catch (error) {
      console.error('Failed to upload audio:', error);
    }

    // Cleanup
    delete this.audioBuffers[itemId];
  }

  // ... rest of existing code ...
}

// Helper to combine buffers
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
```

### Step 5: Create Audio Upload API Endpoint (10 minutes)

**File: `src/routes/api/audio/upload/+server.ts`**
```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { audioStorageService } from '$lib/server/services/audio-storage.service';
import { messagesRepository } from '$lib/server/repositories/messages.repository';

export const POST: RequestHandler = async ({ request, locals }) => {
  try {
    const { messageId, conversationId, userId, audioBase64 } = await request.json();

    if (!audioBase64) {
      return json({ error: 'No audio data provided' }, { status: 400 });
    }

    // Convert base64 to buffer
    const audioBuffer = Buffer.from(audioBase64, 'base64');

    // Upload to storage
    const result = await audioStorageService.uploadAudio({
      userId: userId || locals.user?.id || 'anonymous',
      conversationId,
      messageId,
      audioBuffer,
      mimeType: 'audio/wav'
    });

    // Update message in database with audio URL
    await messagesRepository.update(messageId, {
      audioUrl: result.signedUrl,
      audioStorageKey: result.storageKey,
      audioDuration: undefined // TODO: Calculate from buffer
    });

    return json({
      success: true,
      messageId,
      audioUrl: result.signedUrl,
      storageKey: result.storageKey,
      sizeBytes: result.sizeBytes
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

### Step 6: Register Pronunciation Analysis Module (5 minutes)

Find your module registry file (likely `src/lib/features/analysis/modules/module-registry.ts` or similar):

```typescript
import { pronunciationAnalysisModule } from './pronunciation-analysis.module';

// Add to your module registry
export function listAnalysisModules() {
  return [
    // ... existing modules
    pronunciationAnalysisModule,
  ];
}
```

### Step 7: Test Speech Analysis (15 minutes)

Create a test endpoint:

**File: `src/routes/api/analysis/test-speech/+server.ts`**
```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { pronunciationAnalysisModule } from '$lib/features/analysis/modules/pronunciation-analysis.module';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { conversationId, languageCode = 'en' } = await request.json();

    // Get messages from conversation
    const messages = await messagesRepository.getConversationMessages(conversationId);

    // Run analysis
    const result = await pronunciationAnalysisModule.run({
      conversationId,
      languageCode,
      messages: messages.map(m => ({
        id: m.id,
        role: m.role,
        content: m.content,
        audioUrl: m.audioUrl,
        audioStorageKey: m.audioStorageKey
      }))
    });

    return json(result);
  } catch (error) {
    return json({ error: String(error) }, { status: 500 });
  }
};
```

Test it:
```bash
curl -X POST http://localhost:3000/api/analysis/test-speech \
  -H "Content-Type: application/json" \
  -d '{"conversationId": "your-conversation-id", "languageCode": "en"}'
```

### Step 8: Add UI Component (30 minutes)

**File: `src/lib/features/analysis/components/PronunciationAnalysisDisplay.svelte`**
```svelte
<script lang="ts">
  import type { PronunciationAnalysisResult } from '../types/speech-analysis.types';

  let { result }: { result: PronunciationAnalysisResult } = $props();
</script>

<div class="card bg-base-200 p-6">
  <h3 class="text-xl font-bold mb-4">🎤 Pronunciation Analysis</h3>

  <!-- Overall Scores -->
  <div class="grid grid-cols-2 gap-4 mb-6">
    <div class="stat bg-base-100 rounded-lg">
      <div class="stat-title">Accuracy</div>
      <div class="stat-value">{result.overallAccuracyScore}%</div>
    </div>
    <div class="stat bg-base-100 rounded-lg">
      <div class="stat-title">Fluency</div>
      <div class="stat-value">{result.overallFluencyScore}%</div>
    </div>
  </div>

  <!-- Speech Rate -->
  <div class="mb-6">
    <h4 class="font-semibold mb-2">Speech Rate</h4>
    <p class="text-sm">{Math.round(result.speechRate.wordsPerMinute)} words/minute</p>
    <progress
      class="progress progress-primary w-full"
      value={result.speechRate.wordsPerMinute}
      max="200"
    ></progress>
  </div>

  <!-- Issues -->
  {#if result.issues.length > 0}
    <div class="mb-6">
      <h4 class="font-semibold mb-2">Issues Found ({result.issues.length})</h4>
      <div class="space-y-2">
        {#each result.issues.slice(0, 5) as issue}
          <div class="alert alert-warning py-2">
            <span class="text-sm">{issue.description}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Practice Words -->
  {#if result.recommendedPracticeWords.length > 0}
    <div class="mb-6">
      <h4 class="font-semibold mb-2">Words to Practice</h4>
      <div class="flex flex-wrap gap-2">
        {#each result.recommendedPracticeWords as word}
          <span class="badge badge-lg badge-primary">{word}</span>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Recommendations -->
  <div>
    <h4 class="font-semibold mb-2">Recommendations</h4>
    <ul class="list-disc list-inside space-y-1">
      {#each result.recommendations as rec}
        <li class="text-sm">{rec}</li>
      {/each}
    </ul>
  </div>
</div>
```

## 🧪 Testing Checklist

- [ ] Tigris storage configured and accessible
- [ ] Audio upload works (test with dummy data)
- [ ] Audio download works
- [ ] Echogarden can be imported
- [ ] Pronunciation analysis runs without errors
- [ ] Results are stored in database
- [ ] UI displays results correctly

## 🎯 Summary of What You Built

### Phase 1: Storage ✅
- **audio-storage.service.ts** - Handles all S3/Tigris operations
- Supports upload, download, delete, signed URLs
- Works on Fly.io with Tigris

### Phase 2: Analysis ✅
- **pronunciation-analysis.module.ts** - Main analysis engine
- Uses Echogarden for forced alignment
- Detects pauses, hesitations, speech rate
- Generates fluency scores and recommendations
- Identifies problematic words

### Phase 3: Types ✅
- **speech-analysis.types.ts** - Complete type system
- Covers all speech analysis features
- Ready for UI integration

## 📊 What Gets Analyzed

1. **Word-level timing** - How long each word takes
2. **Pauses** - Natural vs hesitation pauses
3. **Speech rate** - Words per minute, articulation rate
4. **Fluency** - Hesitations, filler words, flow
5. **Issues** - Specific problems with pronunciation
6. **Recommendations** - Personalized practice suggestions

## 🔮 Next Features to Add

1. **Real-time feedback** - Show pronunciation during conversation
2. **Historical tracking** - Track improvement over time
3. **Phoneme-level analysis** - Detailed sound-by-sound feedback
4. **Azure Speech SDK** - Add professional pronunciation scoring
5. **Practice exercises** - Generate targeted exercises based on issues

## 💡 Integration with Your Existing Analysis

Your existing analysis pipeline already has:
- Grammar analysis
- Vocabulary analysis
- Text-based insights

Now you can combine these with speech analysis:

```typescript
// In your analysis pipeline
const analysisResults = await runAnalysis({
  conversationId,
  languageCode: 'en',
  moduleIds: [
    'grammar-analysis',      // Existing
    'vocabulary-analysis',   // Existing
    'pronunciation-analysis' // NEW!
  ]
});
```

## 🚀 Deployment Considerations for Fly.io

### Memory
- Echogarden can use ~500MB-1GB for models
- Consider upgrading to 2GB VM: `fly scale memory 2048`

### Storage
- Audio files: ~1-5MB per minute
- Implement cleanup policy (delete after 30 days)

### Processing Time
- ~2-5 seconds per 10 seconds of audio
- Run as background job to avoid blocking requests

### Costs (Estimated)
- Tigris: ~$0.02/GB storage + $0.09/GB transfer
- Fly.io: ~$0.02/hour for 2GB VM
- ~$10-30/month for 100 active users

## 🆘 Troubleshooting

### "Echogarden not found"
```bash
npm install echogarden
# If it fails, try:
npm install echogarden --legacy-peer-deps
```

### "Tigris credentials not configured"
```bash
fly secrets list
# Should show TIGRIS_* variables
```

### "Audio upload fails"
- Check Tigris bucket exists: `fly storage list`
- Verify credentials are correct
- Check bucket permissions

### "Analysis takes too long"
- Process smaller audio chunks
- Upgrade VM memory
- Use simpler alignment engine

## 📚 Resources

- [Echogarden Documentation](https://github.com/echogarden-project/echogarden)
- [Fly.io Tigris Storage](https://fly.io/docs/reference/tigris/)
- [AWS S3 SDK](https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/)

---

**Need help?** Check the implementation plan for detailed architecture and decision-making rationale.
