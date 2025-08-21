# 🎯 Kaiwa Core Philosophy

> **Mission**: Create magical, real-time language learning conversations through clean, scalable architecture.

---

## 🏗️ Architectural Principles

### 1. **3-Layer Architecture**
We follow a clean, predictable pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                            │
│              (Svelte Components + Pages)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Store Layer                            │
│              (State Management + Orchestration)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                           │
│              (Pure Business Logic + External APIs)         │
└─────────────────────────────────────────────────────────────┘
```

### 2. **Service Independence**
- **Services never import other services**
- **Services have zero knowledge of Svelte or UI**
- **Services are pure TypeScript classes**
- **Services can be tested in isolation**

### 3. **Store Orchestration**
- **Stores coordinate between services**
- **Stores manage application state**
- **Stores handle side effects**
- **Stores use Svelte 5 runes for reactivity**

### 4. **UI Simplicity**
- **UI components are thin and declarative**
- **UI uses `$derived` for reactive values**
- **UI calls store actions, never services directly**
- **UI focuses on presentation, not logic**

---

## 🎯 Design Decisions

### **Why This Architecture?**

1. **Maintainability**: Clear separation of concerns
2. **Testability**: Each layer can be tested independently
3. **Scalability**: Easy to add new features without breaking existing ones
4. **Developer Experience**: Predictable patterns across the codebase

### **What We Don't Do**

- ❌ **Feature-based organization** (leads to circular dependencies)
- ❌ **Direct service-to-service imports** (creates tight coupling)
- ❌ **UI logic in services** (makes testing impossible)
- ❌ **Complex event buses** (adds unnecessary complexity)

### **What We Do Instead**

- ✅ **Service isolation** (each service is independent)
- ✅ **Store orchestration** (stores coordinate services)
- ✅ **Clean interfaces** (well-defined contracts)
- ✅ **Progressive enhancement** (core works, features enhance)

---

## 🚀 MVP-First Approach

### **Phase 1: Core MVP (Current)**
- Real-time conversation with AI
- Audio input/output
- Basic conversation flow
- Clean, working foundation

### **Phase 2: Progressive Enhancement**
- User authentication
- Conversation persistence
- Analytics and tracking
- Advanced features

### **The Rule**: **Core must work before adding features**

---

## 🔧 Implementation Guidelines

### **Service Layer Rules**

```typescript
// ✅ Good: Pure service with clear interface
export class AudioService {
  async getStream(): Promise<MediaStream> {
    // Pure business logic
  }
}

// ❌ Bad: Service that knows about UI
export class AudioService {
  async getStream(): Promise<MediaStream> {
    // Don't do this
    this.updateUI();
    this.showNotification();
  }
}
```

### **Store Layer Rules**

```typescript
// ✅ Good: Store orchestrates services
export class ConversationStore {
  async startConversation() {
    // 1. Get audio stream from audio service
    const stream = await this.audioService.getStream();
    
    // 2. Get session from realtime service
    const session = await this.realtimeService.connect(stream);
    
    // 3. Update state
    this.status = 'connected';
  }
}
```

### **UI Layer Rules**

```typescript
// ✅ Good: UI uses store, not services
<script>
  import { conversationStore } from '$lib/stores/conversation.store.svelte';
  
  const status = $derived(conversationStore.status);
  
  function handleStart() {
    conversationStore.startConversation();
  }
</script>
```

---

## 🧪 Testing Philosophy

### **Service Testing**
- Test in isolation
- Mock external dependencies
- Focus on business logic
- Fast execution (< 100ms per test)

### **Store Testing**
- Test service orchestration
- Mock services
- Test state transitions
- Verify side effects

### **UI Testing**
- Test user interactions
- Test reactive updates
- Use Playwright for E2E
- Focus on user experience

---

## 📚 Code Organization

### **File Structure**
```
src/lib/
├── services/           # Pure business logic
│   ├── audio.service.ts
│   ├── realtime.service.ts
│   └── analytics.service.ts
├── stores/            # State management
│   ├── conversation.store.svelte.ts
│   └── settings.store.svelte.ts
├── components/        # Reusable UI
├── types/            # Type definitions
└── utils/            # Helper functions
```

### **Naming Conventions**
- **Services**: `*.service.ts`
- **Stores**: `*.store.svelte.ts`
- **Components**: `*.svelte`
- **Types**: `*.types.ts`

---

## 🎯 Success Metrics

### **Code Quality**
- **Zero circular dependencies**
- **Services are pure and testable**
- **Stores handle all orchestration**
- **UI is declarative and simple**

### **Developer Experience**
- **Clear patterns to follow**
- **Easy to add new features**
- **Fast test execution**
- **Intuitive file organization**

### **User Experience**
- **Core conversation works reliably**
- **Features enhance, don't break**
- **Performance is consistent**
- **Errors are handled gracefully**

---

## 🔄 Evolution Strategy

### **Current State**
- ✅ 3-layer architecture implemented
- ✅ Services are independent
- ✅ Stores orchestrate services
- ✅ UI is clean and simple

### **Next Steps**
- 🔄 Add authentication service
- 🔄 Add persistence service
- 🔄 Add analytics service
- 🔄 Enhance conversation features

### **Long-term Vision**
- **Multi-language support**
- **Advanced conversation modes**
- **Social features**
- **Mobile applications**

---

## 💡 Key Insights

1. **Start simple, enhance progressively**
2. **Services should be pure and focused**
3. **Stores should handle complexity**
4. **UI should be declarative**
5. **Test each layer independently**
6. **Keep the core working**

---

_This philosophy ensures Kaiwa remains maintainable, scalable, and delightful to use while providing a solid foundation for future growth._
