# 🏗️ Kaiwa v2 Architecture

> **Core Principle**: Hexagonal Architecture with Feature Isolation for maintainable, scalable language learning platform.

---

## 🎯 Architecture Overview

Kaiwa v2 adopts **Hexagonal Architecture** (Ports and Adapters) to create clear separation between core business logic and external concerns. This pattern ensures our application core remains independent of databases, APIs, and UI frameworks.

### 🏛️ Architecture Layers

```text
┌─────────────────────────────────────────────────────────────┐
│                    External World                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │   Web UI    │  │   Mobile    │  │   Third-party APIs  │ │
│  │ (SvelteKit) │  │   (Future)  │  │   (OpenAI, Stripe)  │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Adapters Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ API Routes  │  │ Repositories│  │   External Services │ │
│  │ (Controllers)│  │ (Database)  │  │   (HTTP Clients)   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Ports Layer                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Input Ports │  │ Output Ports│  │   Event Ports       │ │
│  │ (Interfaces)│  │ (Interfaces)│  │   (Contracts)       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Application Core                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Use Cases   │  │ Domain      │  │   Event System      │ │
│  │ (Features)  │  │ Entities    │  │   (Communication)   │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Feature Isolation Strategy

### Core Principle

Each feature is a **self-contained use case** that communicates with other features exclusively through the event system. No direct imports between features are allowed.

## 🗄️ Data Access Layer

### Repository Pattern

All database operations go through **repository classes** that implement CRUD principles:

```typescript
// src/lib/server/repositories/user.repository.ts
export const userRepository = {
  // CREATE
  async createUser(newUser: NewUser): Promise<User>,

  // READ
  async findUserById(id: string): Promise<User | undefined>,
  async findUserByEmail(email: string): Promise<User | undefined>,

  // UPDATE
  async updateUser(id: string, data: Partial<NewUser>): Promise<User | undefined>,

  // DELETE
  async deleteUser(id: string): Promise<{ success: boolean }>
};
```

### Repository Benefits

- **Consistent data access** across all features
- **Type-safe operations** with proper interfaces
- **Centralized business logic** for data operations
- **Easy testing** with mock repositories
- **Database agnostic** - can swap implementations

### Feature Structure

```text
src/features/
├── auth/                    # Authentication & user management
│   ├── use-cases/          # Business logic
│   ├── adapters/           # External integrations
│   ├── ports/              # Interface definitions
│   └── events.ts           # Event definitions
├── conversation/            # Core conversation logic
├── audio/                  # Audio processing & playback
├── vocabulary/             # Word learning & tracking
├── subscription/            # Billing & tier management
└── scenarios/              # Learning scenario management
```

### Event-Driven Communication

```typescript
// ❌ NEVER: Direct feature imports
import { authService } from '../auth/services';

// ✅ ALWAYS: Event-based communication
authFeature.events.emit('user.authenticated', { userId, email });
conversationFeature.events.on('user.authenticated', handleNewUser);
```

---

## 🔌 Ports & Adapters

### Input Ports (Driving Adapters)

**Definition**: Interfaces that external actors use to interact with the application.

**Examples**:

- `AuthenticationPort` - Login, logout, user management
- `ConversationPort` - Start, pause, end conversations
- `AudioPort` - Record, play, process audio

### Output Ports (Driven Adapters)

**Definition**: Interfaces that the application uses to interact with external systems.

**Examples**:

- `UserRepositoryPort` - User data persistence
- `AudioServicePort` - External audio processing
- `PaymentServicePort` - Stripe integration

### Adapter Implementation

```typescript
// Input Port (Interface)
export interface AuthenticationPort {
 login(credentials: LoginCredentials): Promise&lt;AuthResult&gt;;
 logout(userId: string): Promise&lt;void&gt;;
}

// Input Adapter (Implementation)
export class SvelteKitAuthAdapter implements AuthenticationPort {
 async login(credentials: LoginCredentials): Promise&lt;AuthResult&gt; {
  // SvelteKit-specific implementation
 }
}

// Output Port (Interface)
export interface UserRepositoryPort {
 saveUser(user: User): Promise&lt;void&gt;;
 findUserById(id: string): Promise&lt;User | null&gt;;
}

// Output Adapter (Implementation)
export class PostgresUserRepository implements UserRepositoryPort {
 async saveUser(user: User): Promise&lt;void&gt; {
  // Database-specific implementation
 }
}
```

---

## 🧠 Application Core

### Domain Entities

Pure business objects that represent core concepts:

```typescript
export class User {
	constructor(
		public readonly id: string,
		public readonly email: string,
		public readonly tier: UserTier,
		public readonly nativeLanguage: Language,
		public readonly targetLanguage: Language
	) {}

	canStartConversation(): boolean {
		return this.tier.hasConversationAccess();
	}

	hasRealtimeAccess(): boolean {
		return this.tier.hasRealtimeAccess();
	}
}
```

### Use Cases

Business logic that orchestrates domain entities:

```typescript
export class StartConversationUseCase {
 constructor(
  private userRepository: UserRepositoryPort,
  private conversationRepository: ConversationRepositoryPort,
  private eventBus: EventBus
 ) {}

 async execute(userId: string, targetLanguage: string): Promise&lt;Conversation&gt; {
  const user = await this.userRepository.findById(userId);
  if (!user.canStartConversation()) {
   throw new Error('User cannot start conversation');
  }

  const conversation = new Conversation(userId, targetLanguage);
  await this.conversationRepository.save(conversation);

  this.eventBus.emit('conversation.started', { conversationId: conversation.id });
  return conversation;
 }
}
```

---

## 🔄 Event System Architecture

### Event Bus Implementation

```typescript
export interface EventBus {
 emit&lt;T&gt;(eventName: string, payload: T): void;
 on&lt;T&gt;(eventName: string, handler: EventHandler&lt;T&gt;): void;
 off(eventName: string, handler: EventHandler&lt;any&gt;): void;
}

// MVP: In-memory event bus
export class InMemoryEventBus implements EventBus {
 private handlers = new Map&lt;string, EventHandler&lt;any&gt;[]&gt;();

 emit&lt;T&gt;(eventName: string, payload: T): void {
  const handlers = this.handlers.get(eventName) || [];
  handlers.forEach((handler) => handler(payload));
 }

 on&lt;T&gt;(eventName: string, handler: EventHandler&lt;T&gt;): void {
  const handlers = this.handlers.get(eventName) || [];
  handlers.push(handler);
  this.handlers.set(eventName, handlers);
 }
}
```

### Event Schema Definition

```typescript
export interface EventSchema&lt;T&gt; {
 name: string;
 version: string;
 description: string;
 payload: T;
}

// Example: User authentication event
export const USER_AUTHENTICATED_EVENT: EventSchema&lt;{
 userId: string;
 email: string;
 tier: string;
}> = {
 name: 'user.authenticated',
 version: '1.0.0',
 description: 'User successfully authenticated',
 payload: {
  userId: 'string',
  email: 'string',
  tier: 'string'
 }
};
```

---

## 🧪 Testing Strategy

### Testing Pyramid

```text
        /\
       /  \     E2E Tests (Few)
      /____\     Integration Tests (Some)
     /      \    Unit Tests (Many)
    /________\
```

### Unit Tests (Foundation)

- **Target**: Domain entities, use cases, pure functions
- **Framework**: Vitest
- **Coverage**: 90%+ for core business logic
- **Speed**: &lt; 100ms per test

### Integration Tests (Middle)

- **Target**: Port implementations, adapter interactions
- **Framework**: Vitest + test database
- **Coverage**: Critical user journeys
- **Speed**: &lt; 1s per test

### E2E Tests (Top)

- **Target**: Complete user workflows
- **Framework**: Playwright
- **Coverage**: Core conversion paths
- **Speed**: &lt; 30s per test

---

## 🚀 Performance & Scalability

### Current Architecture Benefits

- **Feature Isolation**: Independent scaling of features
- **Event-Driven**: Asynchronous processing capabilities
- **Port Contracts**: Easy to swap implementations

### Future Scaling Considerations

- **Event Bus**: Migrate to Redis Streams for multi-instance support
- **Database**: Read replicas for analytics queries
- **Caching**: Redis for session and frequently accessed data
- **CDN**: Static assets and audio files

---

## 📚 Implementation Guidelines

### 1. Start with Ports

Always define interfaces before implementations:

```typescript
// Define the port first
export interface AudioProcessingPort {
 transcribe(audio: AudioData): Promise&lt;Transcription&gt;;
}

// Then implement the adapter
export class OpenAIAudioAdapter implements AudioProcessingPort {
 async transcribe(audio: AudioData): Promise&lt;Transcription&gt; {
  // Implementation details
 }
}
```

### 2. Use Dependency Injection

```typescript
export class ConversationService {
	constructor(
		private audioPort: AudioProcessingPort,
		private eventBus: EventBus
	) {}
}
```

### 3. Emit Events for Side Effects

```typescript
// Instead of direct calls
await this.userRepository.updateLastLogin(userId);

// Emit events
this.eventBus.emit('user.last_login_updated', { userId, timestamp });
```

### 4. Keep Domain Logic Pure

```typescript
// ✅ Good: Pure domain logic
export class Conversation {
 canContinue(): boolean {
  return this.duration < this.maxDuration && !this.isEnded;
 }
}

// ❌ Bad: Infrastructure concerns in domain
export class Conversation {
 async canContinue(): Promise&lt;boolean&gt; {
  const user = await this.userRepository.findById(this.userId);
  return user.hasActiveSubscription();
 }
}
```

---

## 🔧 Development Workflow

### 1. Feature Development

1. Define feature requirements
2. Design event contracts
3. Implement domain entities
4. Create use cases
5. Build adapters
6. Write comprehensive tests

### 2. Integration Testing

1. Test feature in isolation
2. Test feature interactions via events
3. Test complete user journeys
4. Performance testing

### 3. Deployment

1. Feature flag implementation
2. Gradual rollout
3. Monitoring and alerting
4. Rollback procedures

---

## 📊 Success Metrics

### Code Quality

- **Test Coverage**: &gt; 90% for core business logic
- **Cyclomatic Complexity**: &lt; 10 for use cases
- **Dependency Depth**: &lt; 3 levels

### Performance

- **Response Time**: &lt; 200ms for API calls
- **Audio Processing**: &lt; 2s for transcription
- **Event Processing**: &lt; 100ms for internal events

### Maintainability

- **Feature Isolation**: 0 direct cross-feature imports
- **Event Contracts**: 100% typed event schemas
- **Port Implementation**: Easy to swap adapters

---

_This architecture ensures Kaiwa v2 is maintainable, scalable, and follows industry best practices for complex applications._
