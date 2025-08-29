# 🧪 Testing Strategy

> **Core Principle**: Test each layer of our 3-layer architecture (Services → Stores → UI) in isolation to ensure solid foundations.

---

## 🎯 **Testing Philosophy**

Following our **"Clean 3-Layer Architecture"** principle:

- **🔧 Service Layer**: Pure business logic that's easy to test in isolation
- **🎭 Store Layer**: Orchestration logic that can be tested with mocked services
- **🎨 UI Layer**: Presentation logic that can be tested with mocked stores

---

## 🏗️ **Testing Architecture: Layer by Layer**

### **Layer 1: Service Testing**

Test services in complete isolation from other services and UI.

```typescript
// Test AudioService (pure business logic)
describe('AudioService', () => {
  it('should get audio stream', async () => {
    const service = new AudioService();
    const stream = await service.getStream();
    
    expect(stream).toBeInstanceOf(MediaStream);
    expect(stream.getAudioTracks()).toHaveLength(1);
  });
  
  it('should get available devices', async () => {
    const service = new AudioService();
    const devices = await service.getAvailableDevices();
    
    expect(Array.isArray(devices)).toBe(true);
    expect(devices.every(d => d.kind === 'audioinput')).toBe(true);
  });
  
  it('should handle device selection', async () => {
    const service = new AudioService();
    const mockDeviceId = 'test-device-id';
    
    const stream = await service.getStream(mockDeviceId);
    
    expect(stream).toBeInstanceOf(MediaStream);
  });
});

// Test RealtimeService (with mocked dependencies)
describe('RealtimeService', () => {
  it('should connect with valid session data', async () => {
    const service = new RealtimeService();
    const mockStream = new MediaStream();
    const mockSessionData = {
      client_secret: { value: 'test-token', expires_at: Date.now() + 3600000 },
      session_id: 'test-session'
    };
    
    await service.connectWithSession(
      mockSessionData,
      mockStream,
      vi.fn(), // onMessage
      vi.fn()  // onConnectionStateChange
    );
    
    expect(service.isConnected()).toBe(true);
  });
  
  it('should handle connection failures gracefully', async () => {
    const service = new RealtimeService();
    const mockStream = new MediaStream();
    const invalidSessionData = {
      client_secret: { value: 'invalid-token', expires_at: Date.now() - 1000 },
      session_id: 'invalid-session'
    };
    
    await expect(
      service.connectWithSession(
        invalidSessionData,
        mockStream,
        vi.fn(),
        vi.fn()
      )
    ).rejects.toThrow();
  });
});
```

### **Layer 2: Store Testing**

Test store orchestration logic with mocked services.

```typescript
// Test ConversationStore (orchestration logic)
describe('ConversationStore', () => {
  it('should start conversation successfully', async () => {
    const mockAudioService = createMockAudioService();
    const mockRealtimeService = createMockRealtimeService();
    
    const store = new ConversationStore(mockRealtimeService, mockAudioService);
    
    await store.startConversation();
    
    expect(store.status).toBe('connected');
    expect(mockAudioService.getStream).toHaveBeenCalled();
    expect(mockRealtimeService.connectWithSession).toHaveBeenCalled();
  });
  
  it('should handle audio service failures', async () => {
    const mockAudioService = createMockAudioService();
    const mockRealtimeService = createMockRealtimeService();
    
    // Make audio service throw an error
    mockAudioService.getStream.mockRejectedValue(new Error('Permission denied'));
    
    const store = new ConversationStore(mockRealtimeService, mockAudioService);
    
    await store.startConversation();
    
    expect(store.status).toBe('error');
    expect(store.error).toBe('Permission denied');
  });
  
  it('should handle realtime service failures', async () => {
    const mockAudioService = createMockAudioService();
    const mockRealtimeService = createMockRealtimeService();
    
    // Make realtime service throw an error
    mockRealtimeService.connectWithSession.mockRejectedValue(new Error('Connection failed'));
    
    const store = new ConversationStore(mockRealtimeService, mockAudioService);
    
    await store.startConversation();
    
    expect(store.status).toBe('error');
    expect(store.error).toBe('Connection failed');
  });
  
  it('should manage conversation state transitions', async () => {
    const mockAudioService = createMockAudioService();
    const mockRealtimeService = createMockRealtimeService();
    
    const store = new ConversationStore(mockRealtimeService, mockAudioService);
    
    // Initial state
    expect(store.status).toBe('idle');
    
    // Start conversation
    await store.startConversation();
    expect(store.status).toBe('connected');
    
    // Start streaming
    store.startStreaming();
    expect(store.status).toBe('streaming');
    
    // Stop streaming
    store.stopStreaming();
    expect(store.status).toBe('connected');
    
    // End conversation
    store.endConversation();
    expect(store.status).toBe('idle');
  });
});

// Test SettingsStore (simple state management)
describe('SettingsStore', () => {
  it('should manage language selection', () => {
    const store = new SettingsStore();
    
    store.setLanguage('ja');
    expect(store.selectedLanguage?.code).toBe('ja');
    
    store.setLanguage('en');
    expect(store.selectedLanguage?.code).toBe('en');
  });
  
  it('should manage speaker selection', () => {
    const store = new SettingsStore();
    
    store.setSpeaker('alloy');
    expect(store.selectedSpeaker).toBe('alloy');
    
    store.setSpeaker('ash');
    expect(store.selectedSpeaker).toBe('ash');
  });
});
```

### **Layer 3: UI Testing**

Test UI components with mocked stores and user interactions.

```typescript
// Test conversation page (UI logic)
describe('Conversation Page', () => {
  it('should start conversation when button clicked', async ({ page }) => {
    await page.goto('/conversation');
    await page.click('button:has-text("Start Conversation")');
    
    await expect(page.locator('text=Connected!')).toBeVisible();
  });
  
  it('should show error message when conversation fails', async ({ page }) => {
    // Mock the API to return an error
    await page.route('/api/realtime-session', route => 
      route.fulfill({ status: 500, body: 'Server error' })
    );
    
    await page.goto('/conversation');
    await page.click('button:has-text("Start Conversation")');
    
    await expect(page.locator('text=Error:')).toBeVisible();
  });
  
  it('should display conversation messages', async ({ page }) => {
    await page.goto('/conversation');
    
    // Mock the store to have messages
    await page.evaluate(() => {
      // This would normally come from the store
      window.mockMessages = [
        { 
          role: 'user', 
          content: 'Hello', 
          timestamp: new Date(),
          id: 'mock1',
          conversationId: 'mock1',
          audioUrl: null,
          translatedContent: null,
          sourceLanguage: null,
          targetLanguage: null,
          grammarAnalysis: null,
          vocabularyAnalysis: null,
          pronunciationScore: null,
          audioDuration: null,
          difficultyLevel: null,
          learningTags: null
        },
        { 
          role: 'assistant', 
          content: 'Hi there!', 
          timestamp: new Date(),
          id: 'mock2',
          conversationId: 'mock1',
          audioUrl: null,
          translatedContent: null,
          sourceLanguage: null,
          targetLanguage: null,
          grammarAnalysis: null,
          vocabularyAnalysis: null,
          pronunciationScore: null,
          audioDuration: null,
          difficultyLevel: null,
          learningTags: null
        }
      ];
    });
    
    await page.click('button:has-text("Start Conversation")');
    
    await expect(page.locator('text=Hello')).toBeVisible();
    await expect(page.locator('text=Hi there!')).toBeVisible();
  });
  
  it('should handle audio device selection', async ({ page }) => {
    await page.goto('/conversation');
    
    // Mock available devices
    await page.evaluate(() => {
      window.mockDevices = [
        { deviceId: 'device1', label: 'Microphone 1' },
        { deviceId: 'device2', label: 'Microphone 2' }
      ];
    });
    
    await page.click('button:has-text("Start Conversation")');
    
    const deviceSelect = page.locator('select');
    await expect(deviceSelect).toBeVisible();
    await expect(deviceSelect.locator('option')).toHaveCount(2);
  });
});
```

---

## 🧪 **Testing Tools & Setup**

### **Unit Testing (Vitest)**

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest-setup-client.ts'],
    include: ['src/**/*.{test,spec}.{js,ts}'],
    globals: true
  }
});

// vitest-setup-client.ts
import { vi } from 'vitest';

// Mock browser APIs
global.MediaStream = vi.fn();
global.RTCPeerConnection = vi.fn();
global.navigator = {
  mediaDevices: {
    getUserMedia: vi.fn(),
    enumerateDevices: vi.fn()
  }
} as any;
```

### **E2E Testing (Playwright)**

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 🔧 **Mock Creation**

### **Service Mocks**

```typescript
// Create mock services for testing
export function createMockAudioService() {
  return {
    getStream: vi.fn().mockResolvedValue(new MediaStream()),
    getAvailableDevices: vi.fn().mockResolvedValue([
      { deviceId: 'device1', label: 'Microphone 1', kind: 'audioinput' },
      { deviceId: 'device2', label: 'Microphone 2', kind: 'audioinput' }
    ]),
    onLevelUpdate: vi.fn(),
    onStreamReady: vi.fn(),
    onStreamError: vi.fn(),
    cleanup: vi.fn(),
    initialize: vi.fn()
  };
}

export function createMockRealtimeService() {
  return {
    connectWithSession: vi.fn().mockResolvedValue(undefined),
    sendEvent: vi.fn(),
    send: vi.fn(),
    isConnected: vi.fn().mockReturnValue(true),
    getConnectionState: vi.fn().mockReturnValue('connected'),
    disconnect: vi.fn(),
    cleanup: vi.fn()
  };
}
```

### **Store Mocks**

```typescript
// Create mock stores for UI testing
export function createMockConversationStore() {
  return {
    status: 'idle',
    messages: [],
    error: null,
    audioLevel: 0,
    startConversation: vi.fn(),
    endConversation: vi.fn(),
    startStreaming: vi.fn(),
    stopStreaming: vi.fn(),
    sendMessage: vi.fn(),
    selectDevice: vi.fn(),
    clearError: vi.fn(),
    reset: vi.fn()
  };
}
```

---

## 📊 **Testing Coverage Goals**

### **Service Layer**
- **Target**: 95%+ coverage
- **Focus**: Business logic, error handling, edge cases
- **Speed**: &lt; 100ms per test

### **Store Layer**
- **Target**: 90%+ coverage
- **Focus**: State transitions, service orchestration, side effects
- **Speed**: &lt; 200ms per test

### **UI Layer**
- **Target**: 80%+ coverage
- **Focus**: User interactions, reactive updates, error states
- **Speed**: &lt; 500ms per test

### **Integration Tests**
- **Target**: Critical user journeys
- **Focus**: Service-store interactions, complete workflows
- **Speed**: &lt; 2s per test

### **E2E Tests**
- **Target**: Core user flows
- **Focus**: End-to-end user experience
- **Speed**: &lt; 30s per test

---

## 🚀 **Testing Best Practices**

### **1. Test in Isolation**

```typescript
// ✅ GOOD: Test service in isolation
describe('AudioService', () => {
  it('should get audio stream', async () => {
    const service = new AudioService();
    const stream = await service.getStream();
    expect(stream).toBeInstanceOf(MediaStream);
  });
});

// ❌ BAD: Testing service with real dependencies
describe('AudioService', () => {
  it('should get audio stream', async () => {
    const service = new AudioService();
    // This depends on real browser APIs and can fail
    const stream = await service.getStream();
    expect(stream).toBeInstanceOf(MediaStream);
  });
});
```

### **2. Use Descriptive Test Names**

```typescript
// ✅ GOOD: Descriptive test names
it('should transition from idle to connecting when starting conversation', async () => {
  // Test implementation
});

// ❌ BAD: Vague test names
it('should work', async () => {
  // Test implementation
});
```

### **3. Test Error Cases**

```typescript
// ✅ GOOD: Test error scenarios
it('should handle permission denied error gracefully', async () => {
  const mockAudioService = createMockAudioService();
  mockAudioService.getStream.mockRejectedValue(new Error('Permission denied'));
  
  const store = new ConversationStore(mockRealtimeService, mockAudioService);
  await store.startConversation();
  
  expect(store.status).toBe('error');
  expect(store.error).toBe('Permission denied');
});
```

### **4. Use Test Fixtures**

```typescript
// Create reusable test data
export const testMessages = [
  { 
    role: 'user', 
    content: 'Hello', 
    timestamp: new Date(), 
    id: '1', 
    conversationId: '1', 
    audioUrl: null,
    translatedContent: null,
    sourceLanguage: null,
    targetLanguage: null,
    grammarAnalysis: null,
    vocabularyAnalysis: null,
    pronunciationScore: null,
    audioDuration: null,
    difficultyLevel: null,
    learningTags: null
  },
  { 
    role: 'assistant', 
    content: 'Hi there!', 
    timestamp: new Date(), 
    id: '2', 
    conversationId: '1', 
    audioUrl: null,
    translatedContent: null,
    sourceLanguage: null,
    targetLanguage: null,
    grammarAnalysis: null,
    vocabularyAnalysis: null,
    pronunciationScore: null,
    audioDuration: null,
    difficultyLevel: null,
    learningTags: null
  }
];

export const testSessionData = {
  client_secret: { value: 'test-token', expires_at: Date.now() + 3600000 },
  session_id: 'test-session'
};
```

---

## 🔄 **Continuous Testing**

### **Pre-commit Hooks**

```json
// package.json
{
  "scripts": {
    "test:unit": "vitest run",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest"
  },
  "husky": {
    "hooks": {
      "pre-commit": "pnpm test:unit"
    }
  }
}
```

### **CI/CD Pipeline**

```yaml
# .github/workflows/test.yml
name: Test
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test:unit
      - run: pnpm test:e2e
      - run: pnpm test:coverage
```

---

## 💡 **Key Testing Insights**

1. **Test services in isolation** - they're pure and easy to test
2. **Mock dependencies** - don't test real external APIs in unit tests
3. **Test error cases** - they're often more important than success cases
4. **Use descriptive names** - tests should be self-documenting
5. **Keep tests fast** - slow tests discourage running them

---

_This testing strategy ensures each layer of our architecture is thoroughly tested, leading to reliable, maintainable code._
