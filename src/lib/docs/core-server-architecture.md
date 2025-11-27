# 🗄️ Repository Pattern Implementation

> **Core Principle**: All database operations go through repository classes that implement CRUD principles, ensuring consistent data access across features.

[![Pattern](https://img.shields.io/badge/Pattern-Repository%20Pattern-blue?style=for-the-badge)]()
[![Architecture](https://img.shields.io/badge/Architecture-Data%20Access%20Layer-green?style=for-the-badge)]()
[![Benefits](https://img.shields.io/badge/Benefits-Consistency%20%26%20Type%20Safety-purple?style=for-the-badge)]()

---

## 🎯 Repository Pattern Overview

The repository pattern provides a **clean abstraction layer** between your business logic and data access code. In Kaiwa, all database operations go through repository classes that implement consistent CRUD operations.

### 🏗️ Architecture Benefits

- **✅ Consistent Data Access** - Same patterns across all features
- **✅ Type Safety** - Proper interfaces and return types
- **✅ Centralized Logic** - Business rules in one place
- **✅ Easy Testing** - Mock repositories for unit tests
- **✅ Database Agnostic** - Can swap implementations

---

## 📁 Repository Structure

```text
src/lib/server/repositories/
├── index.ts                 # Main export file
├── user.repository.ts       # User management
├── conversation.repository.ts # Conversations & messages
├── scenario.repository.ts   # Learning scenarios
└── language.repository.ts   # Languages & speakers
```

---

## 🔧 Repository Implementation

### 1. User Repository

```typescript
// src/lib/server/repositories/user.repository.ts
export const userRepository = {
	// CREATE
	async createUser(newUser: NewUser): Promise<User> {
		const [createdUser] = await db.insert(users).values(newUser).returning();
		return createdUser;
	},

	// READ
	async findUserById(id: string): Promise<User | undefined> {
		return db.query.users.findFirst({ where: eq(users.id, id) });
	},

	async findUserByEmail(email: string): Promise<User | undefined> {
		return db.query.users.findFirst({ where: eq(users.email, email) });
	},

	// UPDATE
	async updateUser(id: string, data: Partial<NewUser>): Promise<User | undefined> {
		const [updatedUser] = await db.update(users).set(data).where(eq(users.id, id)).returning();
		return updatedUser;
	},

	// DELETE
	async deleteUser(id: string): Promise<{ success: boolean }> {
		const result = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
		return { success: result.length > 0 };
	}
};
```

### 2. Conversation Repository

```typescript
// src/lib/server/repositories/conversation.repository.ts
export const conversationRepository = {
	// CREATE
	async createConversation(newConversation: NewConversation): Promise<Conversation> {
		const [createdConversation] = await db
			.insert(conversations)
			.values({
				...newConversation,
				id: crypto.randomUUID(),
				startedAt: new Date()
			})
			.returning();
		return createdConversation;
	},

	// READ with pagination
	async findConversationsByUserId(
		userId: string,
		limit: number = 50,
		offset: number = 0
	): Promise<Conversation[]> {
		return db.query.conversations.findMany({
			where: eq(conversations.userId, userId),
			orderBy: [desc(conversations.startedAt)],
			limit,
			offset
		});
	},

	// Complex queries
	async getConversationStats(userId: string): Promise<{
		totalConversations: number;
		totalMessages: number;
		totalDuration: number;
	}> {
		// Implementation with aggregations
	}
};
```

---

## 🚀 Usage in Features

### ✅ Correct Usage

```typescript
// In a conversation feature
import { conversationRepository, userRepository } from '$lib/server/repositories';

export class ConversationService {
	async startConversation(userId: string, languageId: string): Promise<Conversation> {
		// Use repository for data access
		const user = await userRepository.findUserById(userId);
		if (!user) throw new Error('User not found');

		const conversation = await conversationRepository.createConversation({
			userId,
			targetLanguageId: languageId,
			mode: 'traditional'
		});

		return conversation;
	}
}
```

### ❌ Incorrect Usage

```typescript
// ❌ DON'T: Direct database access in features
import { db } from '$lib/server/db';
import { conversations } from '$lib/server/db/schema';

export class ConversationService {
	async startConversation(userId: string, languageId: string): Promise<Conversation> {
		// ❌ Direct database access - breaks abstraction
		const [conversation] = await db
			.insert(conversations)
			.values({ userId, targetLanguageId: languageId })
			.returning();
		return conversation;
	}
}
```

---

## 🧪 Testing with Repositories

### Mock Repository Implementation

```typescript
// src/lib/server/repositories/__mocks__/user.repository.mock.ts
export const mockUserRepository = {
	createUser: vi.fn(),
	findUserById: vi.fn(),
	findUserByEmail: vi.fn(),
	updateUser: vi.fn(),
	deleteUser: vi.fn()
};

// In tests
beforeEach(() => {
	vi.clearAllMocks();
	mockUserRepository.findUserById.mockResolvedValue(mockUser);
});
```

### Testing Business Logic

```typescript
// Test the service, not the database
describe('ConversationService', () => {
	it('should start conversation for valid user', async () => {
		const mockUser = { id: 'user-1', tier: 'plus' };
		mockUserRepository.findUserById.mockResolvedValue(mockUser);

		const service = new ConversationService(mockUserRepository);
		const result = await service.startConversation('user-1', 'en');

		expect(result.userId).toBe('user-1');
		expect(mockUserRepository.findUserById).toHaveBeenCalledWith('user-1');
	});
});
```

---

## 🔄 Repository Lifecycle

### 1. **Create Operations**

- Generate unique IDs (using `crypto.randomUUID()`)
- Set timestamps (`createdAt`, `updatedAt`)
- Validate required fields
- Return created entity

### 2. **Read Operations**

- Support pagination (`limit`, `offset`)
- Implement filtering and sorting
- Handle complex queries with joins
- Return typed results

### 3. **Update Operations**

- Partial updates with `Partial<T>`
- Update timestamps automatically
- Validate business rules
- Return updated entity

### 4. **Delete Operations**

- Soft deletes when possible
- Cascade deletes for related data
- Return success status
- Handle cleanup operations

---

## 📊 Advanced Repository Features

### Pagination Support

```typescript
async findWithPagination<T>(
  query: QueryBuilder<T>,
  page: number = 1,
  limit: number = 20
): Promise<{
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}> {
  const offset = (page - 1) * limit;
  const data = await query.limit(limit).offset(offset);
  const total = await query.count();

  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
```

### Complex Queries

```typescript
async findActiveUsersWithStats(): Promise<UserWithStats[]> {
  return db
    .select({
      id: users.id,
      email: users.email,
      tier: users.tier,
      conversationCount: sql<number>`count(${conversations.id})`,
      lastActivity: sql<Date>`max(${conversations.startedAt})`
    })
    .from(users)
    .leftJoin(conversations, eq(users.id, conversations.userId))
    .where(eq(users.subscriptionStatus, 'active'))
    .groupBy(users.id, users.email, users.tier);
}
```

---

## 🚨 Common Pitfalls

### 1. **Business Logic in Repositories**

```typescript
// ❌ DON'T: Put business logic in repositories
async createUser(newUser: NewUser): Promise<User> {
  // ❌ Business logic doesn't belong here
  if (newUser.tier === 'premium' && !newUser.subscriptionId) {
    throw new Error('Premium users must have subscription');
  }

  const [user] = await db.insert(users).values(newUser).returning();
  return user;
}
```

```typescript
// ✅ DO: Keep repositories focused on data access
async createUser(newUser: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(newUser).returning();
  return user;
}
```

### 2. **Error Handling**

```typescript
// ❌ DON'T: Generic error handling
async findUserById(id: string): Promise<User> {
  const user = await db.query.users.findFirst({ where: eq(users.id, id) });
  if (!user) throw new Error('User not found'); // ❌ Generic error
  return user;
}
```

```typescript
// ✅ DO: Specific error handling
async findUserById(id: string): Promise<User | undefined> {
  return db.query.users.findFirst({ where: eq(users.id, id) });
}
```

### 3. **Transaction Management**

```typescript
// ❌ DON'T: Handle transactions in repositories
async createUserWithProfile(userData: NewUser, profileData: NewProfile): Promise<User> {
  // ❌ Transaction logic doesn't belong here
  await db.transaction(async (tx) => {
    const user = await tx.insert(users).values(userData).returning();
    await tx.insert(profiles).values({ ...profileData, userId: user[0].id });
  });
}
```

```typescript
// ✅ DO: Let services handle transactions
async createUser(userData: NewUser): Promise<User> {
  const [user] = await db.insert(users).values(userData).returning();
  return user;
}
```

---

## 🔮 Future Enhancements

### 1. **Caching Layer**

```typescript
export class CachedUserRepository {
	constructor(
		private userRepository: UserRepository,
		private cache: Cache
	) {}

	async findUserById(id: string): Promise<User | undefined> {
		const cached = await this.cache.get(`user:${id}`);
		if (cached) return cached as User;

		const user = await this.userRepository.findUserById(id);
		if (user) await this.cache.set(`user:${id}`, user, 300); // 5 min TTL

		return user;
	}
}
```

### 2. **Audit Logging**

```typescript
export class AuditedUserRepository {
	constructor(
		private userRepository: UserRepository,
		private auditLogger: AuditLogger
	) {}

	async createUser(newUser: NewUser): Promise<User> {
		const user = await this.userRepository.createUser(newUser);
		await this.auditLogger.log('user.created', { userId: user.id, data: newUser });
		return user;
	}
}
```

### 3. **Validation Layer**

```typescript
export class ValidatedUserRepository {
	constructor(
		private userRepository: UserRepository,
		private validator: Validator
	) {}

	async createUser(newUser: NewUser): Promise<User> {
		const validated = await this.validator.validate(newUser, UserSchema);
		return this.userRepository.createUser(validated);
	}
}
```

---

## 📚 Best Practices Summary

1. **✅ Keep repositories focused on data access only**
2. **✅ Implement consistent CRUD operations**
3. **✅ Use proper TypeScript interfaces**
4. **✅ Support pagination and filtering**
5. **✅ Handle complex queries with joins**
6. **✅ Return appropriate types (undefined vs throwing)**
7. **✅ Use transactions in services, not repositories**
8. **✅ Implement proper error handling**
9. **✅ Write comprehensive tests with mocks**
10. **✅ Document complex query methods**

---

_The repository pattern is the foundation of Kaiwa's data access layer. Follow these patterns to build maintainable, testable, and consistent data access code across all features._
