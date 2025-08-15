# 🧪 Testing Strategy

> **Core Principle**: Test each feature layer in isolation before integration to ensure solid foundations.

---

## 🎯 **Testing Philosophy**

Following your **"Functional Core, Imperative Shell"** principle:

- **🧠 Functional Core**: Pure functions are easy to test - same input always gives same output
- **🔌 Imperative Shell**: Adapters can be mocked for isolated testing
- **🎭 Orchestrator Pattern**: Test coordination logic separately from side effects

---

## 🏗️ **Testing Architecture: Layer by Layer**

### **Layer 1: Audio Feature Testing**
Test the audio system in complete isolation from other features.

```typescript
// Test audio core (pure functions)
describe('Audio Core', () => {
  it('should transition from idle to recording', () => {
    const state = audioCore.initial();
    const action = { type: 'START_RECORDING' as const };
    const newState = audioCore.transition(state, action);
    
    expect(newState.status).toBe('recording');
    expect(newState.recordingSession).toBeDefined();
  });

  it('should generate correct effects for recording', () => {
    const state = audioCore.initial();
    const action = { type: 'START_RECORDING' as const };
    const effects = audioCore.effects(state, action);
    
    expect(effects).toContainEqual({
      type: 'INITIALIZE_RECORDING',
      deviceId: undefined
    });
  });
});

// Test audio adapters (with mocks)
describe('Howler Audio Adapter', () => {
  it('should play audio from URL', async () => {
    const adapter = new HowlerAudioAdapter();
    const mockUrl = '/test-audio.mp3';
    
    await adapter.playFromUrl(mockUrl);
    
    expect(adapter.isPlaying()).toBe(true);
  });
});
```

### **Layer 2: Conversation Feature Testing**
Test conversation logic without audio or AI dependencies.

```typescript
// Test conversation core (pure functions)
describe('Conversation Core', () => {
  it('should handle complete conversation cycle', () => {
    let state = conversationCore.initial();
    
    // Start conversation
    state = conversationCore.transition(state, { type: 'START_CONVERSATION' });
    expect(state.status).toBe('idle');
    expect(state.sessionId).toBeDefined();
    
    // Start recording
    state = conversationCore.transition(state, { type: 'START_RECORDING' });
    expect(state.status).toBe('recording');
    
    // Stop recording
    state = conversationCore.transition(state, { type: 'STOP_RECORDING' });
    expect(state.status).toBe('processing');
  });
});

// Test conversation orchestrator (with mock adapters)
describe('Conversation Orchestrator', () => {
  it('should coordinate conversation flow', async () => {
    const mockAudioAdapter = createMockAudioAdapter();
    const mockAIAdapter = createMockAIAdapter();
    const orchestrator = new ConversationOrchestrator(
      mockEventBus,
      mockAudioAdapter,
      mockAIAdapter
    );
    
    await orchestrator.startConversation('en', 'alloy');
    expect(orchestrator.getState().status).toBe('idle');
  });
});
```

### **Layer 3: OpenAI Realtime Testing**
Test AI integration without conversation complexity.

```typescript
// Test OpenAI adapter (with mock API responses)
describe('OpenAI Audio Adapter', () => {
  beforeEach(() => {
    // Mock fetch for OpenAI API calls
    global.fetch = vi.fn();
  });

  it('should transcribe audio successfully', async () => {
    const mockResponse = 'Hello, this is a test transcription';
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      text: () => Promise.resolve(mockResponse)
    });

    const adapter = new OpenAIAudioAdapter('test-key');
    const mockAudio = new ArrayBuffer(1024);
    
    const transcript = await adapter.transcribe(mockAudio);
    
    expect(transcript).toBe(mockResponse);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/audio/transcriptions'),
      expect.any(Object)
    );
  });

  it('should handle transcription errors gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('API Error'));
    
    const adapter = new OpenAIAudioAdapter('test-key');
    const mockAudio = new ArrayBuffer(1024);
    
    await expect(adapter.transcribe(mockAudio)).rejects.toThrow('Failed to transcribe audio');
  });
});
```

### **Layer 4: Integration Testing**
Test all features working together.

```typescript
// Test complete conversation flow
describe('Unified Conversation Flow', () => {
  it('should complete full conversation cycle', async () => {
    const orchestrator = new UnifiedConversationOrchestrator();
    
    // Start conversation
    await orchestrator.startConversation('en', 'alloy');
    expect(orchestrator.getState().status).toBe('idle');
    
    // Start recording
    await orchestrator.startRecording();
    expect(orchestrator.getState().status).toBe('recording');
    
    // Simulate audio recording
    const mockAudio = new ArrayBuffer(1024);
    await orchestrator.processRecording(mockAudio);
    
    // Verify AI response
    expect(orchestrator.getState().messages.length).toBeGreaterThan(0);
    expect(orchestrator.getState().status).toBe('speaking');
  });
});
```

---

## 🧪 **Testing Tools & Setup**

### **Test Framework: Vitest**
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup-client.ts'],
    globals: true
  }
});
```

### **Mock Factories**
```typescript
// test-utils/mock-factories.ts
export function createMockAudioAdapter() {
  return {
    startRecording: vi.fn().mockResolvedValue(new MediaRecorder()),
    stopRecording: vi.fn().mockResolvedValue(new ArrayBuffer(1024)),
    play: vi.fn().mockResolvedValue(undefined),
    getDevices: vi.fn().mockResolvedValue([])
  };
}

export function createMockAIAdapter() {
  return {
    transcribe: vi.fn().mockResolvedValue('Mock transcript'),
    complete: vi.fn().mockResolvedValue('Mock AI response'),
    textToSpeech: vi.fn().mockResolvedValue(new ArrayBuffer(1024))
  };
}
```

---

## 🎮 **Interactive Testing with /dev Route**

The `/dev` route provides a playground for testing features in real-time:

### **Audio Testing Panel**
```svelte
<!-- Test audio recording/playback -->
<div class="audio-test-panel">
  <button on:click={testRecording}>Test Recording</button>
  <button on:click={testPlayback}>Test Playback</button>
  <div class="audio-status">{audioStatus}</div>
</div>
```

### **Conversation Testing Panel**
```svelte
<!-- Test conversation flow -->
<div class="conversation-test-panel">
  <button on:click={testConversation}>Test Conversation</button>
  <div class="conversation-state">{conversationState}</div>
  <div class="messages">{messages}</div>
</div>
```

### **AI Integration Testing Panel**
```svelte
<!-- Test OpenAI integration -->
<div class="ai-test-panel">
  <input bind:value={testText} placeholder="Text to speak" />
  <button on:click={testTTS}>Test Text-to-Speech</button>
  <button on:click={testTranscription}>Test Transcription</button>
</div>
```

---

## 🚀 **Testing Workflow**

### **1. Unit Tests (Fast)**
```bash
# Test individual components
pnpm test:unit:audio
pnpm test:unit:conversation
pnpm test:unit:ai
```

### **2. Integration Tests (Medium)**
```bash
# Test feature interactions
pnpm test:integration:audio-conversation
pnpm test:integration:conversation-ai
```

### **3. E2E Tests (Slow)**
```bash
# Test complete user flows
pnpm test:e2e:conversation-flow
```

### **4. Interactive Testing (Manual)**
```bash
# Start dev server and test manually
pnpm dev
# Navigate to /dev route
```

---

## 🔍 **Test Coverage Goals**

| Component | Unit Tests | Integration Tests | Coverage Target |
|-----------|------------|-------------------|-----------------|
| Audio Core | ✅ | ✅ | 95%+ |
| Audio Adapters | ✅ | ✅ | 90%+ |
| Conversation Core | ✅ | ✅ | 95%+ |
| AI Adapters | ✅ | ✅ | 85%+ |
| Orchestrators | ✅ | ✅ | 90%+ |
| Integration | ✅ | ✅ | 80%+ |

---

## 🎯 **Success Criteria**

### **Audio Feature**
- [ ] Recording starts/stops correctly
- [ ] Playback works across browsers
- [ ] Volume control functions properly
- [ ] Error handling is graceful

### **Conversation Feature**
- [ ] State transitions are correct
- [ ] Messages are stored properly
- [ ] Session management works
- [ ] Error recovery is robust

### **AI Integration**
- [ ] Transcription is accurate
- [ ] TTS generates audio
- [ ] API errors are handled
- [ ] Rate limiting is respected

### **Integration**
- [ ] Complete conversation flow works
- [ ] Audio and AI are synchronized
- [ ] Performance is acceptable
- [ ] User experience is smooth

---

## 🚨 **Common Testing Pitfalls**

### **1. Testing Implementation, Not Behavior**
```typescript
// ❌ Bad: Testing internal implementation
it('should call startRecording method', () => {
  const mockAdapter = createMockAudioAdapter();
  const service = new AudioService(mockAdapter);
  
  service.startRecording();
  
  expect(mockAdapter.startRecording).toHaveBeenCalled(); // Too specific
});

// ✅ Good: Testing observable behavior
it('should transition to recording state', async () => {
  const service = new AudioService();
  
  await service.startRecording();
  
  expect(service.isRecording).toBe(true); // Tests behavior
});
```

### **2. Not Testing Error Cases**
```typescript
// ❌ Bad: Only testing happy path
it('should transcribe audio', async () => {
  const adapter = new OpenAIAudioAdapter();
  const result = await adapter.transcribe(mockAudio);
  expect(result).toBeDefined();
});

// ✅ Good: Testing both success and failure
it('should handle transcription errors gracefully', async () => {
  const adapter = new OpenAIAudioAdapter();
  
  // Test success case
  const result = await adapter.transcribe(mockAudio);
  expect(result).toBeDefined();
  
  // Test error case
  const errorResult = await adapter.transcribe(invalidAudio);
  expect(errorResult).toThrow('Transcription failed');
});
```

---

**Remember**: Test each layer in isolation first. Only when all individual tests pass should you move to integration testing. This ensures you're building on solid foundations! 🧪✨
