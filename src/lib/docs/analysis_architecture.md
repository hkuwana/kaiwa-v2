# 🏗️ Analysis Feature Architecture

Following Kaiwa's **3-Layer Architecture**, the analysis system implements language level assessment and confidence tracking to enable fluency-focused learning. This feature adheres to the Service → Store → UI pattern established in `src/lib/docs/02_core_architecture.md`.

## 📁 Folder Structure Explained

```
features/analysis/                    # Analysis Feature (follows 3-layer pattern)
├── services/                         # Service Layer (Pure business logic)
│   ├── analysis-pipeline.service.ts  # Core analysis orchestration
│   ├── level-detector.service.ts     # Seamless level assessment
│   ├── confidence-tracker.service.ts # Confidence measurement
│   └── scenario-adapter.service.ts   # ZPD-based scenario selection
├── stores/                           # Store Layer (State + orchestration)
│   ├── analysis.store.svelte        # Manages analysis state/actions
│   └── confidence.store.svelte       # Tracks confidence progress
├── components/                       # UI Layer (Feature-specific components)
│   ├── ConfidenceTracker.svelte     # Confidence visualization
│   └── AnalysisResults.svelte       # Analysis results display
├── processors/                       # Analysis modules (called by services)
│   ├── grammar.processor.ts         # Basic grammar hints
│   ├── advanced-grammar.processor.ts # Detailed grammar analysis
│   └── fluency-analysis.processor.ts # Speech flow analysis
├── config/                          # Configuration files
│   ├── levels.config.ts             # CEFR-to-practical mapping
│   └── usage-limits.config.ts       # Tier-based limits
└── types/                           # Feature-specific types
    └── analysis.types.ts            # Analysis interfaces
```

## 🎯 Core Design Principles

### 1. **Confidence-First Architecture**

Every component prioritizes building user confidence over technical accuracy:

- **Level Detection**: Seamless, never feels like testing
- **Progress Tracking**: Celebrates growth, not deficiencies
- **Scenario Adaptation**: Gradually increases difficulty (ZPD principle)

### 2. **Minimal Type Complexity**

Using existing types where possible:

- Reuse `Message` from database schema
- Extend `UserPreferences` for level tracking
- Simple interfaces for core functionality

### 3. **Modular Processing Pipeline**

Each processor is independent and composable:

- **Input**: Array of conversation messages
- **Output**: Standardized analysis result
- **Isolation**: No cross-dependencies between processors

### 4. **Fluency Over Testing**

- No formal assessments or test-like experiences
- Continuous background analysis during natural conversation
- Progress measured by confidence and practical abilities

## 🔄 Data Flow

```
Conversation Messages
        ↓
Analysis Pipeline Service
        ↓
Individual Processors (parallel)
        ↓
Results Aggregation
        ↓
Level Detection (if needed)
        ↓
User Preferences Update
        ↓
Scenario Recommendations
```

## 🧩 Component Responsibilities

### **Core Components**

- **`pipeline.service.ts`**: Orchestrates analysis, manages processor execution
- **`level-detector.ts`**: Seamlessly updates user level based on conversation patterns
- **`confidence-tracker.ts`**: Measures and tracks speaking confidence over time

### **Processors**

- **Grammar Processors**: Detect patterns, suggest improvements (not corrections)
- **Fluency Processor**: Measures conversation flow, confidence indicators
- **Stats Processor**: Conversation length, participation, estimated level

### **Adapters**

- **Scenario Adapter**: Selects appropriate conversations based on user level + interests
- Implements Zone of Proximal Development (i+1 difficulty)

### **Configuration**

- **Levels Config**: CEFR-to-practical mapping ("B1.1" → "converse-strangers")
- **Usage Limits**: Tier-based analysis limitations

## 🎨 User Experience Philosophy

### **Invisible Assessment**

Users never feel "tested" - level detection happens during natural conversation:

```typescript
// After every conversation
const levelUpdate = await levelDetector.checkForProgress(userId, messages);
if (levelUpdate.hasProgressed) {
	showCelebration(levelUpdate.newCapabilities);
}
```

### **Confidence Celebration**

Progress is celebrated in practical terms:

- ❌ "You're now B1.2"
- ✅ "You're ready to chat confidently with strangers!"

### **Adaptive Difficulty**

Scenarios automatically adjust to user level:

- **Too Easy**: Boring, no growth
- **Just Right**: Engaging, builds confidence (ZPD sweet spot)
- **Too Hard**: Frustrating, reduces confidence

## 🔧 Integration Points

### **With User Preferences**

```typescript
// New fields in userPreferences table
currentLanguageLevel: 'B1.1';
practicalLevel: 'converse-strangers';
confidenceScore: 75;
levelProgression: [{ level: 'A2.2', achievedAt: '2024-01-15', confidence: 60 }];
```

### **With Conversation System**

```typescript
// After conversation ends
await analysisCore.processConversation(conversationId, userId);
// Automatically updates level, suggests next scenarios
```

### **With Scenario Selection**

```typescript
// Scenarios adapt to user level
const scenarios = await scenarioAdapter.recommendForUser(userId);
// Returns conversations slightly above current level (i+1)
```

## 🚀 Future Audio Integration

The architecture is designed for easy audio integration:

- Audio processors follow same interface pattern
- Pronunciation analysis slots into existing pipeline
- Speech rhythm data enhances confidence scoring

This design ensures the analysis system grows naturally with the product while maintaining simplicity and user focus.
