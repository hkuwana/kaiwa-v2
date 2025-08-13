# 🔌 API Reference

> **Specification**: OpenAPI 3.0 for comprehensive API documentation and client generation.

---

## 📋 API Overview

Kaiwa v2 provides a RESTful API built on OpenAPI 3.0 specification. All endpoints follow consistent patterns for authentication, error handling, and response formatting.

### Base URL

```text
Production: https://api.kaiwa.com/v2
Staging: https://staging-api.kaiwa.com/v2
Development: http://localhost:3000/v2
```

### API Versioning

- **Current Version**: v2
- **Version Header**: `X-API-Version: 2.0`
- **Deprecation Policy**: 6 months notice for breaking changes

---

## 🔐 Authentication

### Google OAuth 2.0 Flow

```typescript
// 1. Redirect user to Google OAuth
GET /auth/google/authorize

// 2. Google redirects back with authorization code
GET /auth/google/callback?code={authorization_code}

// 3. Exchange code for access token
POST /auth/google/token
{
  "code": "authorization_code",
  "redirect_uri": "https://kaiwa.com/auth/callback"
}

// 4. Use access token in subsequent requests
Authorization: Bearer {access_token}
```

### Session Management

```typescript
// Create session after OAuth
POST /auth/session
{
  "googleToken": "google_access_token"
}

// Refresh session
POST /auth/session/refresh
{
  "refreshToken": "session_refresh_token"
}

// Invalidate session
DELETE /auth/session
Authorization: Bearer {access_token}
```

---

## 📊 OpenAPI 3.0 Specification

### OpenAPI Document Structure

```yaml
openapi: 3.0.3
info:
  title: Kaiwa v2 API
  description: Language learning platform API
  version: 2.0.0
  contact:
    name: Kaiwa Team
    email: api@kaiwa.com
servers:
  - url: https://api.kaiwa.com/v2
    description: Production server
  - url: https://staging-api.kaiwa.com/v2
    description: Staging server
  - url: http://localhost:3000/v2
    description: Development server
```

---

## 🔌 Core Service Interfaces

### 1. Authentication Service

#### Port Interface

```typescript
export interface AuthenticationPort {
	loginWithGoogle(googleToken: string): Promise<AuthResult>;
	refreshSession(refreshToken: string): Promise<AuthResult>;
	logout(sessionId: string): Promise<void>;
	validateSession(sessionId: string): Promise<User | null>;
}

export interface AuthResult {
	user: User;
	session: Session;
	accessToken: string;
	refreshToken: string;
}
```

#### API Endpoints

```typescript
// POST /auth/google/login
export interface GoogleLoginRequest {
	googleToken: string;
	redirectUri?: string;
}

export interface GoogleLoginResponse {
	success: boolean;
	data: AuthResult;
	message?: string;
}

// POST /auth/session/refresh
export interface RefreshSessionRequest {
	refreshToken: string;
}

export interface RefreshSessionResponse {
	success: boolean;
	data: AuthResult;
	message?: string;
}
```

### 2. User Management Service

#### Port Interface

```typescript
export interface UserManagementPort {
	createUser(userData: CreateUserData): Promise<User>;
	updateUser(userId: string, updates: Partial<User>): Promise<User>;
	getUserById(userId: string): Promise<User | null>;
	getUserByEmail(email: string): Promise<User | null>;
	deleteUser(userId: string): Promise<void>;
}

export interface CreateUserData {
	email: string;
	googleId?: string;
	displayName?: string;
	nativeLanguage: string;
	preferredUILanguage: string;
}
```

#### API Endpoints

```typescript
// GET /users/{userId}
export interface GetUserResponse {
	success: boolean;
	data: User;
}

// PUT /users/{userId}
export interface UpdateUserRequest {
	displayName?: string;
	nativeLanguage?: string;
	preferredUILanguage?: string;
	avatarUrl?: string;
}

export interface UpdateUserResponse {
	success: boolean;
	data: User;
	message?: string;
}
```

### 3. Conversation Service

#### Port Interface

```typescript
export interface ConversationPort {
	startConversation(
		userId: string,
		targetLanguage: string,
		mode: ConversationMode
	): Promise<Conversation>;
	sendMessage(conversationId: string, content: string, role: MessageRole): Promise<Message>;
	endConversation(conversationId: string): Promise<Conversation>;
	getConversationHistory(userId: string, limit?: number): Promise<Conversation[]>;
	getConversationById(conversationId: string): Promise<Conversation | null>;
}

export type ConversationMode = 'traditional' | 'realtime';
export type MessageRole = 'user' | 'assistant' | 'system';
```

#### API Endpoints

```typescript
// POST /conversations
export interface StartConversationRequest {
	targetLanguage: string;
	mode: ConversationMode;
	scenarioId?: string;
}

export interface StartConversationResponse {
	success: boolean;
	data: Conversation;
}

// POST /conversations/{conversationId}/messages
export interface SendMessageRequest {
	content: string;
	role: MessageRole;
	audioId?: string;
}

export interface SendMessageResponse {
	success: boolean;
	data: Message;
}

// GET /conversations
export interface GetConversationsQuery {
	limit?: number;
	offset?: number;
	status?: 'active' | 'completed';
}

export interface GetConversationsResponse {
	success: boolean;
	data: {
		conversations: Conversation[];
		total: number;
		hasMore: boolean;
	};
}
```

### 4. Audio Service

#### Port Interface

```typescript
export interface AudioPort {
	startRecording(sessionId: string, userId?: string): Promise<RecordingSession>;
	stopRecording(sessionId: string): Promise<AudioData>;
	transcribeAudio(audioData: AudioData): Promise<Transcription>;
	playAudio(audioId: string): Promise<AudioStream>;
	getAudioById(audioId: string): Promise<AudioData | null>;
}

export interface AudioData {
	id: string;
	sessionId: string;
	userId?: string;
	audioUrl: string;
	duration: number;
	size: number;
	format: string;
	createdAt: Date;
}

export interface Transcription {
	text: string;
	confidence: number;
	language: string;
	segments: TranscriptionSegment[];
}

export interface TranscriptionSegment {
	start: number;
	end: number;
	text: string;
	confidence: number;
}
```

#### API Endpoints

```typescript
// POST /audio/recording/start
export interface StartRecordingRequest {
	sessionId: string;
	userId?: string;
}

export interface StartRecordingResponse {
	success: boolean;
	data: RecordingSession;
}

// POST /audio/recording/stop
export interface StopRecordingRequest {
	sessionId: string;
}

export interface StopRecordingResponse {
	success: boolean;
	data: AudioData;
}

// POST /audio/transcribe
export interface TranscribeRequest {
	audioId: string;
	language?: string;
}

export interface TranscribeResponse {
	success: boolean;
	data: Transcription;
}
```

### 5. Vocabulary Service

#### Port Interface

```typescript
export interface VocabularyPort {
	trackWordEncounter(
		userId: string,
		word: string,
		language: string,
		context: string
	): Promise<void>;
	updateWordMastery(userId: string, word: string, masteryLevel: MasteryLevel): Promise<void>;
	getVocabularyProgress(userId: string, language: string): Promise<VocabularyProgress[]>;
	getRecommendedWords(userId: string, language: string, count: number): Promise<string[]>;
}

export type MasteryLevel = 'new' | 'learning' | 'practicing' | 'mastered';

export interface VocabularyProgress {
	word: string;
	encounterCount: number;
	successfulUsageCount: number;
	masteryLevel: MasteryLevel;
	lastReviewed: Date;
	nextReview: Date;
}
```

#### API Endpoints

```typescript
// POST /vocabulary/encounter
export interface TrackWordEncounterRequest {
	word: string;
	language: string;
	context: string;
}

// PUT /vocabulary/mastery
export interface UpdateMasteryRequest {
	word: string;
	language: string;
	masteryLevel: MasteryLevel;
}

// GET /vocabulary/progress
export interface GetVocabularyProgressQuery {
	language: string;
	masteryLevel?: MasteryLevel;
}

export interface GetVocabularyProgressResponse {
	success: boolean;
	data: VocabularyProgress[];
}
```

### 6. Subscription Service

#### Port Interface

```typescript
export interface SubscriptionPort {
	createSubscription(
		userId: string,
		tierId: string,
		paymentMethod: PaymentMethod
	): Promise<Subscription>;
	cancelSubscription(subscriptionId: string, reason?: string): Promise<Subscription>;
	updateSubscription(subscriptionId: string, updates: Partial<Subscription>): Promise<Subscription>;
	getSubscriptionById(subscriptionId: string): Promise<Subscription | null>;
	getUserSubscription(userId: string): Promise<Subscription | null>;
}

export interface PaymentMethod {
	type: 'stripe' | 'paypal';
	token: string;
}

export interface Subscription {
	id: string;
	userId: string;
	tierId: string;
	status: SubscriptionStatus;
	currentPeriodStart: Date;
	currentPeriodEnd: Date;
	cancelAtPeriodEnd: boolean;
	stripeSubscriptionId?: string;
	stripeCustomerId?: string;
}
```

#### API Endpoints

```typescript
// POST /subscriptions
export interface CreateSubscriptionRequest {
	tierId: string;
	paymentMethod: PaymentMethod;
}

export interface CreateSubscriptionResponse {
	success: boolean;
	data: Subscription;
}

// DELETE /subscriptions/{subscriptionId}
export interface CancelSubscriptionRequest {
	reason?: string;
}

export interface CancelSubscriptionResponse {
	success: boolean;
	data: Subscription;
	message: string;
}
```

---

## 📝 Standard Response Formats

### Success Response

```typescript
export interface SuccessResponse<T> {
	success: true;
	data: T;
	message?: string;
	timestamp: string;
	requestId: string;
}
```

### Error Response

```typescript
export interface ErrorResponse {
	success: false;
	error: {
		code: string;
		message: string;
		details?: Record<string, any>;
	};
	timestamp: string;
	requestId: string;
}
```

### Paginated Response

```typescript
export interface PaginatedResponse<T> {
	success: true;
	data: {
		items: T[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			totalPages: number;
			hasNext: boolean;
			hasPrev: boolean;
		};
	};
	timestamp: string;
	requestId: string;
}
```

---

## 🚨 Error Handling

### HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request
- **401**: Unauthorized
- **403**: Forbidden
- **404**: Not Found
- **422**: Validation Error
- **429**: Rate Limited
- **500**: Internal Server Error

### Error Codes

```typescript
export enum ErrorCode {
	// Authentication
	INVALID_CREDENTIALS = 'AUTH_001',
	TOKEN_EXPIRED = 'AUTH_002',
	INSUFFICIENT_PERMISSIONS = 'AUTH_003',

	// Validation
	VALIDATION_ERROR = 'VAL_001',
	REQUIRED_FIELD_MISSING = 'VAL_002',
	INVALID_FORMAT = 'VAL_003',

	// Business Logic
	CONVERSATION_LIMIT_EXCEEDED = 'BIZ_001',
	SUBSCRIPTION_REQUIRED = 'BIZ_002',
	FEATURE_NOT_AVAILABLE = 'BIZ_003',

	// System
	INTERNAL_ERROR = 'SYS_001',
	SERVICE_UNAVAILABLE = 'SYS_002',
	RATE_LIMIT_EXCEEDED = 'SYS_003'
}
```

### Error Response Examples

#### 400 Bad Request

```json
{
	"success": false,
	"error": {
		"code": "VAL_001",
		"message": "Validation failed",
		"details": {
			"targetLanguage": "Target language is required",
			"mode": "Mode must be 'traditional' or 'realtime'"
		}
	},
	"timestamp": "2025-01-15T10:30:00Z",
	"requestId": "req_123456789"
}
```

#### 401 Unauthorized

```json
{
	"success": false,
	"error": {
		"code": "AUTH_002",
		"message": "Access token has expired",
		"details": {
			"expiredAt": "2025-01-15T10:00:00Z"
		}
	},
	"timestamp": "2025-01-15T10:30:00Z",
	"requestId": "req_123456789"
}
```

#### 429 Rate Limited

```json
{
	"success": false,
	"error": {
		"code": "SYS_003",
		"message": "Rate limit exceeded",
		"details": {
			"limit": 100,
			"resetAt": "2025-01-15T11:00:00Z",
			"retryAfter": 1800
		}
	},
	"timestamp": "2025-01-15T10:30:00Z",
	"requestId": "req_123456789"
}
```

---

## 🔒 Rate Limiting

### Rate Limit Headers

```text
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642233600
Retry-After: 60
```

### Rate Limit Rules

- **Anonymous Users**: 10 requests per minute
- **Free Tier**: 100 requests per minute
- **Pro Tier**: 1000 requests per minute
- **Premium Tier**: 10000 requests per minute

---

## 📊 Request/Response Examples

### Start Conversation

```typescript
// Request
POST /conversations
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "targetLanguage": "ja",
  "mode": "traditional",
  "scenarioId": "cafe-ordering"
}

// Response
{
  "success": true,
  "data": {
    "id": "conv_123456789",
    "userId": "user_987654321",
    "targetLanguage": "ja",
    "mode": "traditional",
    "scenarioId": "cafe-ordering",
    "status": "active",
    "startedAt": "2025-01-15T10:30:00Z",
    "messages": []
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

### Send Message

```typescript
// Request
POST /conversations/conv_123456789/messages
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "content": "コーヒーを一つお願いします",
  "role": "user"
}

// Response
{
  "success": true,
  "data": {
    "id": "msg_123456789",
    "conversationId": "conv_123456789",
    "role": "user",
    "content": "コーヒーを一つお願いします",
    "timestamp": "2025-01-15T10:30:00Z"
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

---

## 🧪 Testing & Development

### Postman Collection

Download our Postman collection for easy API testing:

```text
https://api.kaiwa.com/v2/docs/postman-collection.json
```

### OpenAPI Specification

View the complete OpenAPI specification:

```text
https://api.kaiwa.com/v2/docs/openapi.json
```

### Interactive Documentation

Explore the API interactively:

```text
https://api.kaiwa.com/v2/docs
```

---

## 🔄 API Versioning

### Versioning Strategy

- **URL Versioning**: `/v2/endpoint`
- **Header Versioning**: `X-API-Version: 2.0`
- **Backward Compatibility**: Maintained for 6 months
- **Deprecation Notice**: 6 months advance warning

### Migration Guide

When migrating from v1 to v2:

1. Update base URL to include `/v2`
2. Add `X-API-Version: 2.0` header
3. Update response handling for new format
4. Handle new error codes and messages

---

_This API reference provides comprehensive documentation for all Kaiwa v2 services. For additional support, contact our developer relations team._
