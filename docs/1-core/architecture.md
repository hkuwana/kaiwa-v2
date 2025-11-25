# 🏗️ Kaiwa Architecture

> **Quick Summary**: Kaiwa uses a clean 3-layer architecture (UI → Store → Service) transitioning to Feature-Sliced Design for better scalability.

## 🎯 Core Philosophy

**Mission**: Personalized conversation partner to learn languages

### The Anti-Language-Learning App

- ❌ Not for: B2 proficiency, 2000 vocab words, grammar drills
- ✅ For: Connecting with loved ones, real conversations that matter
- 🎯 Goal: Prepare you for messy, real-world language situations

### The Signal Plan

Four-phase strategy centered on **emotional outcomes**:

1. **User Acquisition** → Market emotional solutions, not features
2. **User Onboarding** → Prove instant value with specific conversation needs
3. **User Retention** → Encourage deeper practice of high-stakes conversations
4. **Real-World Bridge** → Track and celebrate real conversation success

---

## 🏛️ System Architecture

### The 3-Layer Model

```text
┌─────────────────────────────────────┐
│         UI Layer                    │
│   (Svelte Components + Pages)       │
│   - Thin, declarative               │
│   - Calls store actions             │
│   - Reacts to state changes         │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│       Store Layer                   │
│   (State Management + Orchestration)│
│   - Svelte 5 runes                  │
│   - Coordinate services             │
│   - Implement features              │
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│       Service Layer                 │
│   (Business Logic + External APIs)  │
│   - Pure TypeScript classes         │
│   - No UI knowledge                 │
│   - Never import other services     │
└─────────────────────────────────────┘
```

### Layer Responsibilities

| Layer       | Purpose                          | Rules                                  |
| ----------- | -------------------------------- | -------------------------------------- |
| **Service** | Pure business logic & API calls  | No UI imports, no service dependencies |
| **Store**   | State management & orchestration | Uses runes, coordinates services       |
| **UI**      | User interface                   | Thin & declarative, calls stores only  |

---

## 📂 Directory Structure (Current)

```text
src/lib/
├── components/      # Shared UI components
├── services/        # Shared client services
├── stores/          # Shared state stores
├── utils/           # Shared utilities
│
└── server/
    ├── services/    # Server-side services
    └── database/
        ├── repositories/  # Data access layer
        └── schema.ts      # Database schema
```

---

## 🚚 Architectural Evolution: Feature-Sliced Design

**Status**: 🚧 In Progress

### Target Structure

```text
src/lib/
├── components/      # Shared components (feature-agnostic)
├── services/        # Shared services
├── stores/          # Shared stores
├── utils/           # Shared utils
│
├── features/        # ✨ NEW: Feature isolation
│   ├── realtime-conversation/
│   │   ├── components/
│   │   ├── services/
│   │   └── stores/
│   ├── analysis/
│   └── [feature-name]/
│
└── server/
    ├── services/
    └── database/
        ├── repositories/
        └── schema.ts
```

### Feature-Sliced Principles

✅ **Shared code at root**: Feature-agnostic code in `src/lib/`
✅ **Feature encapsulation**: Features are self-contained in `features/`
✅ **No cross-imports**: Features never import from each other
✅ **Server separation**: All server code in `src/lib/server/`
✅ **Repository pattern**: Only repositories touch the database

### Migration Strategy

**Phase 1**: Prepare

- ✅ Create `features/` directory
- ✅ Define feature boundaries

**Phase 2**: Extract

- 🚧 Move `realtime-conversation` feature
- 🚧 Move `analysis` feature
- 🚧 Move remaining features

**Phase 3**: Bridge

- Implement `FeatureBridge` for necessary cross-feature communication

**Phase 4**: API Reorganization

- Restructure to resource-oriented APIs (`api/users`, `api/conversations`)

---

## 🗄️ Data Access: Repository Pattern

**Core Principle**: All database operations go through repository classes.

### Why Repositories?

- ✅ Consistent data access across features
- ✅ Type-safe interfaces
- ✅ Centralized business rules
- ✅ Easy mocking for tests
- ✅ Database-agnostic (can swap implementations)

### Example

```typescript
// ✅ CORRECT: Use repository
import { conversationRepository } from '$lib/server/repositories';

const conversation = await conversationRepository.findById(id);
```

```typescript
// ❌ INCORRECT: Direct database access
import { db } from '$lib/server/db';
import { conversations } from '$lib/server/db/schema';

const conversation = await db.query.conversations.findFirst(...);
```

**See**: [repositories.md](repositories.md) for full implementation guide

---

## 🔌 Key Subsystems

### Realtime Conversation System

- **WebSocket** connection to OpenAI Realtime API
- **Audio streaming** with Web Audio API
- **State management** via stores
- **Error recovery** and reconnection logic

**See**: [../3-features/realtime.md](../3-features/realtime.md)

### Analysis System

- **Speech analysis** with phonetics feedback
- **Conversation metrics** (duration, turn-taking, vocabulary)
- **AI-powered insights** via GPT-4
- **Progress tracking** over time

**See**: [../3-features/analysis.md](../3-features/analysis.md)

### Cron Job System

- **GitHub Actions** as scheduler (free, precise timing)
- **HTTP endpoints** on Fly.io for execution
- **Email automation** (reminders, stats, digests)
- **Zero cost** architecture

**See**: [cron-jobs.md](cron-jobs.md)

### Database Schema

- **PostgreSQL** via Drizzle ORM
- **Typed schema** with TypeScript
- **Migration system** with `drizzle-kit`
- **Repository access** only

**See**: [database-schema.md](database-schema.md)

---

## 🛡️ Architectural Principles

### 1. Separation of Concerns

- Each layer has a single responsibility
- Clear boundaries between layers
- No circular dependencies

### 2. Pure Business Logic

- Services are pure functions/classes
- No side effects in stores (use actions)
- Testable without UI

### 3. Type Safety

- TypeScript everywhere
- Zod for runtime validation
- Typed database queries

### 4. Feature Independence

- Features don't import from each other
- Shared code extracted to root
- Communication via events or bridges

### 5. Database Abstraction

- Only repositories touch the database
- Consistent CRUD operations
- Easy to mock for testing

---

## 🚀 Development Workflow

### Adding a New Feature

1. **Plan**: Define feature boundaries
2. **Structure**: Create in `features/` (or shared if appropriate)
3. **Service**: Write pure business logic
4. **Store**: Add state management with runes
5. **UI**: Create thin components
6. **Test**: Write tests at each layer
7. **Document**: Update feature docs

### Modifying Existing Code

1. **Identify layer**: UI, Store, or Service?
2. **Check dependencies**: What else is affected?
3. **Update tests**: Keep coverage high
4. **Update docs**: Keep architecture docs current

### Common Patterns

**Service → Store → UI**:

```typescript
// Service (pure logic)
export class ConversationService {
  async startConversation() { ... }
}

// Store (state + orchestration)
export function createConversationStore() {
  let state = $state({ ... });

  async function start() {
    const result = await service.startConversation();
    state = { ...state, conversation: result };
  }

  return { get state() { return state }, start };
}

// UI (declarative)
<script>
  const store = getConversationStore();
</script>

<button onclick={() => store.start()}>
  Start Conversation
</button>
```

---

## 📊 Architecture Decisions

### Why Svelte 5 Runes?

- Simpler mental model than stores
- Better TypeScript support
- Easier testing
- Performance improvements

### Why Repository Pattern?

- Consistent data access
- Easy to test with mocks
- Centralized query logic
- Database-agnostic

### Why Feature-Sliced Design?

- Better scalability
- Clear feature boundaries
- Easier to onboard developers
- Reduced merge conflicts

### Why GitHub Actions for Cron?

- Free (within limits)
- Precise scheduling
- Easy testing
- Built-in monitoring

---

## 🔍 Quick Reference

### Finding Code

| I need to...         | Look in                                                |
| -------------------- | ------------------------------------------------------ |
| Add UI component     | `src/lib/components/` or `features/[name]/components/` |
| Add business logic   | `src/lib/services/` or `features/[name]/services/`     |
| Add state management | `src/lib/stores/` or `features/[name]/stores/`         |
| Query database       | `src/lib/server/repositories/`                         |
| Define schema        | `src/lib/server/db/schema/`                            |
| Add API endpoint     | `src/routes/api/`                                      |
| Add page             | `src/routes/`                                          |

### Related Docs

- [Database Schema](database-schema.md) - Data models and relationships
- [Repositories](repositories.md) - Data access patterns
- [Cron Jobs](cron-jobs.md) - Scheduled task architecture
- [Scenario Metadata](scenario-metadata.md) - Scenario data model
- [Dev Setup](../2-guides/dev-setup.md) - Getting started guide

---

## 📈 Future Considerations

### Planned Improvements

- ✅ Complete Feature-Sliced migration
- 🔜 Add event bus for cross-feature communication
- 🔜 Implement caching layer
- 🔜 Add telemetry and monitoring
- 🔜 GraphQL API layer (if needed)

### Scaling Strategies

**Current (0-10k users)**:

- Single Fly.io machine
- PostgreSQL on Fly
- GitHub Actions cron

**Next (10k-100k users)**:

- Multiple Fly.io machines
- Read replicas for database
- Redis caching
- Background job queue

**Future (100k+ users)**:

- Dedicated database cluster
- CDN for static assets
- Microservices for heavy features
- Kafka for event streaming

---

**Last Updated**: 2025-11-13
**Status**: Living document - update as architecture evolves
**Questions?** See [HOW_DOCS_ARE_ORGANIZED.md](../HOW_DOCS_ARE_ORGANIZED.md)
