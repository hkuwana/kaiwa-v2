# Conversation & Message Management API

This API provides flat endpoints for managing conversations and messages in the language learning application with **standardized response formats**.

## API Structure

All endpoints are flat (no nested folders) for better maintainability:

- `/api/conversations` - Main conversation management
- `/api/conversation-end` - End conversations
- `/api/conversation-messages` - Manage conversation messages
- `/api/conversation-message` - Manage individual messages

## Standardized Response Format

All API endpoints return responses in a consistent format:

### Success Response
```json
{
  "success": true,
  "data": { /* response data */ },
  "message": "Optional success message",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Endpoints

### 1. Start a New Conversation
**POST** `/api/conversations`

Creates a new conversation and conversation session.

**Request Body:**
```json
{
  "userId": "uuid",                    // Optional: User ID if authenticated
  "guestId": "string",                 // Optional: Guest ID for anonymous users
  "targetLanguageId": "string",        // Required: Language ID to practice
  "title": "string",                   // Optional: Conversation title
  "mode": "traditional" | "realtime",  // Optional: Default "traditional"
  "voice": "string",                   // Optional: Voice preference
  "scenarioId": "string",              // Optional: Scenario ID for guided practice
  "isOnboarding": true,                // Optional: Default true
  "deviceType": "desktop"              // Optional: Default "desktop"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation": { /* conversation object */ },
    "sessionId": "string"
  },
  "message": "Conversation started successfully",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 2. Get Conversations
**GET** `/api/conversations?userId=uuid&guestId=string&limit=50&offset=0`

Retrieves conversations for a user or guest.

**Query Parameters:**
- `userId` (string): User ID for authenticated users
- `guestId` (string): Guest ID for anonymous users
- `limit` (number): Maximum number of conversations to return (default: 50)
- `offset` (number): Number of conversations to skip (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations": [ /* array of conversation objects */ ]
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 3. Get Individual Conversation
**GET** `/api/conversations?id={conversationId}`

Retrieves a specific conversation with all its messages.

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation": { /* conversation object */ },
    "messages": [ /* array of message objects */ ]
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 4. Update Conversation
**PUT** `/api/conversations?id={conversationId}`

Updates conversation metadata.

**Request Body:**
```json
{
  "title": "string",                   // Optional: New title
  "mode": "traditional" | "realtime",  // Optional: New mode
  "voice": "string",                   // Optional: New voice
  "scenarioId": "string",              // Optional: New scenario
  "isOnboarding": true,                // Optional: Onboarding status
  "endedAt": "2024-01-01T00:00:00Z",  // Optional: End timestamp
  "durationSeconds": 300,              // Optional: Duration in seconds
  "messageCount": 10,                  // Optional: Message count
  "audioSeconds": "5.5",               // Optional: Audio duration
  "comfortRating": 4,                  // Optional: 1-5 comfort rating
  "engagementLevel": "high"            // Optional: "low" | "medium" | "high"
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated conversation object */ },
  "message": "Conversation updated successfully",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 5. Delete Conversation
**DELETE** `/api/conversations?id={conversationId}`

Deletes a conversation and all its messages.

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Conversation deleted successfully",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 6. End Conversation
**POST** `/api/conversation-end`

Ends a conversation and updates session tracking.

**Request Body:**
```json
{
  "conversationId": "string",          // Required: Conversation ID
  "durationSeconds": 300,              // Required: Total duration in seconds
  "audioSeconds": 240.5,               // Optional: Audio duration in seconds
  "comfortRating": 4,                  // Optional: 1-5 comfort rating
  "engagementLevel": "high",           // Optional: Engagement level
  "sessionId": "string",               // Optional: Session ID for tracking
  "wasExtended": false,                // Optional: Whether session was extended
  "extensionsUsed": 0                  // Optional: Number of extensions used
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversation": { /* updated conversation object */ },
    "durationSeconds": 300,
    "audioSeconds": 240.5
  },
  "message": "Conversation ended successfully",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 7. Add Message to Conversation
**POST** `/api/conversation-messages`

Adds a new message to a conversation.

**Request Body:**
```json
{
  "conversationId": "string",          // Required: Conversation ID
  "role": "user" | "assistant" | "system",  // Required: Message role
  "content": "string",                       // Required: Message content
  "audioUrl": "string"                       // Optional: Audio file URL
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": { /* message object */ },
    "messageCount": 11
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 8. Get Messages from Conversation
**GET** `/api/conversation-messages?conversationId={id}&limit=100&offset=0&role=user`

Retrieves messages from a conversation.

**Query Parameters:**
- `conversationId` (string): Required: Conversation ID
- `limit` (number): Maximum messages to return (default: 100)
- `offset` (number): Number of messages to skip (default: 0)
- `role` (string): Filter by message role (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "messages": [ /* array of message objects */ ],
    "conversationId": "string"
  },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 9. Get Individual Message
**GET** `/api/conversation-message?id={messageId}`

Retrieves a specific message.

**Response:**
```json
{
  "success": true,
  "data": { /* message object */ },
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 10. Update Message
**PUT** `/api/conversation-message?id={messageId}`

Updates a specific message.

**Request Body:**
```json
{
  "content": "string",     // Required: New message content
  "audioUrl": "string"     // Optional: New audio URL
}
```

**Response:**
```json
{
  "success": true,
  "data": { /* updated message object */ },
  "message": "Message updated successfully",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

### 11. Delete Message
**DELETE** `/api/conversation-message?id={messageId}`

Deletes a specific message.

**Response:**
```json
{
  "success": true,
  "data": null,
  "message": "Message deleted successfully",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Data Models

### Conversation Object
```typescript
{
  id: string;
  userId: string | null;
  guestId: string | null;
  targetLanguageId: string;
  title: string | null;
  mode: 'traditional' | 'realtime';
  voice: string | null;
  scenarioId: string | null;
  isOnboarding: string; // 'true' | 'false'
  startedAt: Date;
  endedAt: Date | null;
  durationSeconds: number | null;
  messageCount: number | null;
  audioSeconds: string | null;
  comfortRating: number | null;
  engagementLevel: 'low' | 'medium' | 'high' | null;
}
```

### Message Object
```typescript
{
  id: string;
  conversationId: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: Date;
  audioUrl: string | null;
}
```

## Usage Examples

### Starting a Conversation
```javascript
const response = await fetch('/api/conversations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targetLanguageId: 'ja',
    title: 'Japanese Practice Session',
    mode: 'realtime',
    deviceType: 'mobile'
  })
});

const result = await response.json();
if (result.success) {
  const { conversation, sessionId } = result.data;
  console.log('Conversation started:', conversation.id);
} else {
  console.error('Error:', result.error);
}
```

### Adding Messages
```javascript
const response = await fetch('/api/conversation-messages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: 'conversation-uuid',
    role: 'user',
    content: 'こんにちは、お元気ですか？'
  })
});

const result = await response.json();
if (result.success) {
  const { message, messageCount } = result.data;
  console.log('Message added:', message.id);
} else {
  console.error('Error:', result.error);
}
```

### Ending a Conversation
```javascript
const response = await fetch('/api/conversation-end', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    conversationId: 'conversation-uuid',
    durationSeconds: 300,
    audioSeconds: 240.5,
    comfortRating: 4,
    engagementLevel: 'high',
    sessionId: sessionId
  })
});

const result = await response.json();
if (result.success) {
  const { conversation, durationSeconds } = result.data;
  console.log('Conversation ended:', durationSeconds);
} else {
  console.error('Error:', result.error);
}
```

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `400`: Bad Request (missing required fields)
- `404`: Not Found (conversation/message doesn't exist)
- `500`: Internal Server Error

Error responses follow the standardized format:
```json
{
  "success": false,
  "error": "Descriptive error message",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## Authentication

- For authenticated users, include `userId` in requests
- For guest users, use `guestId` instead
- Some endpoints may require authentication depending on your app's security model

## Benefits of Flat Structure

- **Easier Maintenance**: No nested folder complexity
- **Clear Endpoints**: Each endpoint has a single responsibility
- **Better Organization**: Related functionality grouped logically
- **Simpler Routing**: SvelteKit routing is more straightforward
- **Standardized Responses**: Consistent response format across all endpoints
- **Better Error Handling**: Structured error responses with timestamps
- **Type Safety**: Full TypeScript support with standardized interfaces
