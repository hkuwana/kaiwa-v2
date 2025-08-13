# 🚀 Feature Development Guide

> **Core Principle**: Build features in isolation using event-driven communication and comprehensive testing.

---

## 🎯 Feature Development Workflow

### 1. Feature Planning Phase

- **Define Requirements**: Clear user stories and acceptance criteria
- **Design Events**: Plan event contracts for feature communication
- **Architecture Review**: Ensure feature fits hexagonal architecture
- **Testing Strategy**: Plan unit, integration, and E2E tests

### 2. Development Phase

- **Port Definition**: Create input/output port interfaces
- **Domain Entities**: Build pure business objects
- **Use Cases**: Implement business logic
- **Adapters**: Create external system integrations
- **Event Implementation**: Define and emit events

### 3. Testing Phase

- **Unit Tests**: Test domain logic in isolation
- **Integration Tests**: Test port implementations
- **Feature Tests**: Test complete feature workflows
- **Performance Tests**: Ensure scalability

---

## 🏗️ Feature Structure Template

```text
src/features/{feature-name}/
├── index.ts                 # Feature public API
├── types.ts                 # Feature-specific types
├── events.ts                # Event definitions & schemas
├── ports/
│   ├── input/               # Input port interfaces
│   └── output/              # Output port interfaces
├── domain/
│   ├── entities/            # Domain objects
│   ├── value-objects/       # Immutable values
│   └── use-cases/           # Business logic
├── adapters/
│   ├── input/               # Input adapters (controllers)
│   └── output/              # Output adapters (repositories)
├── components/               # UI components (if applicable)
└── tests/                   # Feature tests
    ├── unit/
    ├── integration/
    └── fixtures/
```

---

## 🔄 Event-Driven Pattern Implementation

### Event Definition

```typescript
// events.ts
export interface FeatureEvents {
	'feature.action.completed': {
		featureId: string;
		result: any;
		timestamp: Date;
	};
	'feature.error.occurred': {
		featureId: string;
		error: string;
		context: Record<string, any>;
	};
}

// Event schemas for validation
export const FEATURE_ACTION_COMPLETED_EVENT: EventSchema<{
	featureId: string;
	result: any;
	timestamp: Date;
}> = {
	name: 'feature.action.completed',
	version: '1.0.0',
	description: 'Feature action successfully completed',
	payload: {
		featureId: 'string',
		result: 'any',
		timestamp: 'Date'
	}
};
```

### Event Emission

```typescript
// use-cases/feature-action.ts
export class FeatureActionUseCase {
	constructor(
		private eventBus: EventBus,
		private outputPort: FeatureOutputPort
	) {}

	async execute(input: FeatureActionInput): Promise<FeatureActionResult> {
		try {
			const result = await this.outputPort.performAction(input);

			// Emit success event
			this.eventBus.emit('feature.action.completed', {
				featureId: input.featureId,
				result,
				timestamp: new Date()
			});

			return result;
		} catch (error) {
			// Emit error event
			this.eventBus.emit('feature.error.occurred', {
				featureId: input.featureId,
				error: error.message,
				context: { input, timestamp: new Date() }
			});
			throw error;
		}
	}
}
```

### Event Consumption

```typescript
// In another feature or service
export class FeatureEventListener {
	constructor(private eventBus: EventBus) {
		this.setupEventListeners();
	}

	private setupEventListeners(): void {
		this.eventBus.on('feature.action.completed', this.handleFeatureCompleted.bind(this));
		this.eventBus.on('feature.error.occurred', this.handleFeatureError.bind(this));
	}

	private handleFeatureCompleted(event: FeatureActionCompletedEvent): void {
		// React to feature completion
		console.log(`Feature ${event.featureId} completed successfully`);
	}

	private handleFeatureError(event: FeatureErrorEvent): void {
		// Handle feature errors
		console.error(`Feature ${event.featureId} failed: ${event.error}`);
	}
}
```

---

## 🔌 Port Implementation Guide

### Input Port (Interface)

```typescript
// ports/input/feature-input-port.ts
export interface FeatureInputPort {
	performAction(input: FeatureActionInput): Promise<FeatureActionResult>;
	getFeatureStatus(featureId: string): Promise<FeatureStatus>;
}
```

### Input Adapter (Implementation)

```typescript
// adapters/input/sveltekit-feature-adapter.ts
export class SvelteKitFeatureAdapter implements FeatureInputPort {
	constructor(
		private useCase: FeatureActionUseCase,
		private statusUseCase: FeatureStatusUseCase
	) {}

	async performAction(input: FeatureActionInput): Promise<FeatureActionResult> {
		return await this.useCase.execute(input);
	}

	async getFeatureStatus(featureId: string): Promise<FeatureStatus> {
		return await this.statusUseCase.execute(featureId);
	}
}
```

### Output Port (Interface)

```typescript
// ports/output/feature-output-port.ts
export interface FeatureOutputPort {
	performAction(input: FeatureActionInput): Promise<FeatureActionResult>;
	saveFeatureData(data: FeatureData): Promise<void>;
	findFeatureData(id: string): Promise<FeatureData | null>;
}
```

### Output Adapter (Implementation)

```typescript
// adapters/output/postgres-feature-adapter.ts
export class PostgresFeatureAdapter implements FeatureOutputPort {
	constructor(private db: Database) {}

	async performAction(input: FeatureActionInput): Promise<FeatureActionResult> {
		// Database-specific implementation
		const result = await this.db.query('SELECT perform_feature_action($1, $2)', [
			input.actionType,
			input.parameters
		]);
		return this.mapToResult(result);
	}

	async saveFeatureData(data: FeatureData): Promise<void> {
		await this.db.query('INSERT INTO features (id, data, created_at) VALUES ($1, $2, $3)', [
			data.id,
			JSON.stringify(data),
			new Date()
		]);
	}

	async findFeatureData(id: string): Promise<FeatureData | null> {
		const result = await this.db.query('SELECT * FROM features WHERE id = $1', [id]);
		return result.rows[0] ? this.mapToFeatureData(result.rows[0]) : null;
	}
}
```

---

## 🧪 Testing Strategy Implementation

### Unit Tests (Foundation)

```typescript
// tests/unit/feature-action-use-case.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FeatureActionUseCase } from '../../domain/use-cases/feature-action';
import { MockEventBus } from '../fixtures/mock-event-bus';
import { MockFeatureOutputPort } from '../fixtures/mock-feature-output-port';

describe('FeatureActionUseCase', () => {
	let useCase: FeatureActionUseCase;
	let mockEventBus: MockEventBus;
	let mockOutputPort: MockFeatureOutputPort;

	beforeEach(() => {
		mockEventBus = new MockEventBus();
		mockOutputPort = new MockFeatureOutputPort();
		useCase = new FeatureActionUseCase(mockEventBus, mockOutputPort);
	});

	it('should execute feature action successfully', async () => {
		// Arrange
		const input = { featureId: 'test-123', actionType: 'test' };
		const expectedResult = { success: true, data: 'test-data' };
		mockOutputPort.performAction.mockResolvedValue(expectedResult);

		// Act
		const result = await useCase.execute(input);

		// Assert
		expect(result).toEqual(expectedResult);
		expect(mockEventBus.emit).toHaveBeenCalledWith('feature.action.completed', {
			featureId: input.featureId,
			result: expectedResult,
			timestamp: expect.any(Date)
		});
	});

	it('should emit error event when action fails', async () => {
		// Arrange
		const input = { featureId: 'test-123', actionType: 'test' };
		const error = new Error('Action failed');
		mockOutputPort.performAction.mockRejectedValue(error);

		// Act & Assert
		await expect(useCase.execute(input)).rejects.toThrow('Action failed');
		expect(mockEventBus.emit).toHaveBeenCalledWith('feature.error.occurred', {
			featureId: input.featureId,
			error: 'Action failed',
			context: { input, timestamp: expect.any(Date) }
		});
	});
});
```

### Integration Tests (Middle)

```typescript
// tests/integration/feature-integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTestDatabase } from '../fixtures/test-database';
import { FeatureActionUseCase } from '../../domain/use-cases/feature-action';
import { PostgresFeatureAdapter } from '../../adapters/output/postgres-feature-adapter';
import { InMemoryEventBus } from '../../infrastructure/event-bus';

describe('Feature Integration Tests', () => {
	let testDb: any;
	let useCase: FeatureActionUseCase;
	let outputPort: PostgresFeatureAdapter;
	let eventBus: InMemoryEventBus;

	beforeAll(async () => {
		testDb = await createTestDatabase();
		outputPort = new PostgresFeatureAdapter(testDb);
		eventBus = new InMemoryEventBus();
		useCase = new FeatureActionUseCase(eventBus, outputPort);
	});

	afterAll(async () => {
		await testDb.end();
	});

	it('should perform complete feature workflow', async () => {
		// Arrange
		const input = { featureId: 'integration-test', actionType: 'test' };
		let capturedEvent: any = null;
		eventBus.on('feature.action.completed', (event) => {
			capturedEvent = event;
		});

		// Act
		const result = await useCase.execute(input);

		// Assert
		expect(result).toBeDefined();
		expect(capturedEvent).toBeDefined();
		expect(capturedEvent.featureId).toBe(input.featureId);
	});
});
```

### E2E Tests (Top)

```typescript
// tests/e2e/feature-workflow.test.ts
import { test, expect } from '@playwright/test';

test.describe('Feature Complete Workflow', () => {
	test('should complete full feature journey', async ({ page }) => {
		// Navigate to feature
		await page.goto('/features/test-feature');

		// Start feature action
		await page.click('[data-testid="start-feature"]');

		// Wait for completion
		await page.waitForSelector('[data-testid="feature-completed"]');

		// Verify success state
		const successMessage = await page.textContent('[data-testid="success-message"]');
		expect(successMessage).toContain('Feature completed successfully');
	});
});
```

---

## 🔧 Development Best Practices

### 1. Feature Isolation

```typescript
// ❌ NEVER: Import from other features
import { authService } from '../../auth/services';

// ✅ ALWAYS: Use events for cross-feature communication
this.eventBus.emit('auth.user.login', { userId, email });
```

### 2. Error Handling

```typescript
// Always emit error events for debugging
try {
	const result = await this.performAction(input);
	this.eventBus.emit('feature.success', { result });
	return result;
} catch (error) {
	this.eventBus.emit('feature.error', {
		error: error.message,
		context: { input, stack: error.stack }
	});
	throw error;
}
```

### 3. Type Safety

```typescript
// Use strict typing for all interfaces
export interface FeatureActionInput {
	readonly featureId: string;
	readonly actionType: 'create' | 'update' | 'delete';
	readonly parameters: Record<string, unknown>;
}

// Use branded types for IDs
export type FeatureId = string & { readonly __brand: 'FeatureId' };
```

### 4. Performance Considerations

```typescript
// Use async/await consistently
export class FeatureService {
	async processFeature(input: FeatureInput): Promise<FeatureResult> {
		// Process in parallel when possible
		const [data, config] = await Promise.all([
			this.loadFeatureData(input.id),
			this.loadFeatureConfig(input.type)
		]);

		return this.processData(data, config);
	}
}
```

---

## 📊 Feature Metrics & Monitoring

### Success Metrics

- **Feature Usage**: How often is the feature used?
- **Success Rate**: What percentage of actions succeed?
- **Performance**: Response times and error rates
- **User Engagement**: Time spent and completion rates

### Event Tracking

```typescript
// Track feature usage for analytics
this.eventBus.emit('analytics.feature.used', {
	featureId: 'conversation.start',
	userId: user.id,
	timestamp: new Date(),
	context: { language: targetLanguage, tier: user.tier }
});
```

---

## 🚀 Feature Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (unit, integration, E2E)
- [ ] Performance benchmarks met
- [ ] Error handling tested
- [ ] Event contracts documented
- [ ] Feature flags implemented

### Deployment

- [ ] Feature flag enabled
- [ ] Gradual rollout (10%, 50%, 100%)
- [ ] Monitoring alerts configured
- [ ] Rollback plan ready

### Post-Deployment

- [ ] Monitor error rates
- [ ] Track performance metrics
- [ ] Gather user feedback
- [ ] Plan iteration improvements

---

_Follow this guide to build maintainable, testable features that integrate seamlessly with Kaiwa v2's hexagonal architecture._
