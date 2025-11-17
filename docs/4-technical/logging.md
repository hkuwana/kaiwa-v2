# Structured Logging Guide

## Overview

Kaiwa uses structured logging to provide better debugging in production while reducing noise in development.

## Logger APIs

### Server-Side Logger (`$lib/server/logger`)

Use this for server-side code (API routes, services, repositories, hooks).

```typescript
import { logger } from '$lib/server/logger';

// Debug - verbose logging for development only
logger.debug('Processing user request', { userId: user.id, action: 'checkout' });

// Info - general information
logger.info('Payment processed successfully', {
	paymentId: payment.id,
	amount: payment.amount
});

// Warning - something unexpected but not critical
logger.warn('Rate limit approaching', {
	userId: user.id,
	requestCount: 95,
	limit: 100
});

// Error - something went wrong
logger.error('Failed to create subscription', {
	userId: user.id,
	error: error.message
});

// Error with full exception details
logger.logError(error, 'Stripe API call failed', {
	operation: 'createCustomer',
	userId: user.id
});
```

### Client-Side Logger (`$lib/logger`)

Use this for client-side code (Svelte components, stores, client utilities).

```typescript
import { logger } from '$lib/logger';

// Same API as server logger
logger.debug('Audio stream started', { deviceId: device.id });
logger.info('User clicked button', { buttonId: 'start-conversation' });
logger.warn('Microphone permission denied');
logger.error('WebSocket connection failed');
```

## Log Levels

### Development Mode

- **Debug**: All verbose logs for debugging
- **Info**: General information
- **Warn**: Warnings
- **Error**: Errors with stack traces

All logs are displayed in a pretty, colored format with timestamps.

### Production Mode

**Server (Node.js)**:

- **Debug**: Hidden
- **Info**: JSON structured logs
- **Warn**: JSON structured logs
- **Error**: JSON structured logs with stack traces

**Client (Browser)**:

- **Debug**: Hidden
- **Info**: Hidden
- **Warn**: JSON structured logs
- **Error**: JSON structured logs with stack traces

This reduces console noise for end users while preserving error visibility.

## Output Format

### Development

```
🔍 [10:30:45] DEBUG: Processing payment
   Context: { userId: '123', amount: 1500 }
```

### Production (Server)

```json
{
	"timestamp": "2025-11-16T10:30:45.123Z",
	"level": "info",
	"message": "Payment processed",
	"context": { "userId": "123", "amount": 1500 },
	"environment": "production"
}
```

### Production (Client)

Only warnings and errors are shown:

```json
{
	"timestamp": "2025-11-16T10:30:45.123Z",
	"level": "error",
	"message": "Payment failed",
	"context": { "error": "Insufficient funds" },
	"environment": "production"
}
```

## Best Practices

### 1. Use Appropriate Log Levels

```typescript
// ❌ Bad - using info for debug details
logger.info('User object:', user);

// ✅ Good - using debug for verbose details
logger.debug('User authenticated', { userId: user.id, email: user.email });
```

### 2. Add Context Objects

```typescript
// ❌ Bad - string concatenation loses structure
logger.info(`Payment ${paymentId} processed for user ${userId}`);

// ✅ Good - structured context
logger.info('Payment processed', { paymentId, userId, amount });
```

### 3. Don't Log Sensitive Data

```typescript
// ❌ Bad - logging passwords, tokens, etc.
logger.debug('User login', { email, password, apiKey });

// ✅ Good - omit sensitive fields
logger.debug('User login attempt', { email, userAgent: request.headers.get('user-agent') });
```

### 4. Use logError for Exceptions

```typescript
// ❌ Bad - losing stack trace
logger.error('Failed to save user', error.message);

// ✅ Good - preserving stack trace and context
logger.logError(error, 'Failed to save user', { userId, operation: 'update' });
```

### 5. Avoid Logging in Hot Paths

```typescript
// ❌ Bad - logging in a loop
users.forEach((user) => {
	logger.debug('Processing user', { userId: user.id }); // Called 1000 times!
	processUser(user);
});

// ✅ Good - log summary instead
logger.debug('Processing users', { count: users.length });
users.forEach(processUser);
logger.info('Users processed', { count: users.length });
```

## Migration from console.log

When replacing console statements:

```typescript
// Old
console.log('User logged in:', userId);
console.error('Payment failed:', error);

// New
logger.info('User logged in', { userId });
logger.logError(error, 'Payment failed');
```

## Integration with Log Aggregation

Production logs are JSON-formatted for easy ingestion into log aggregation tools like:

- **Datadog**: Parse JSON logs and index by `level`, `environment`, `context.*`
- **Elasticsearch**: Index JSON logs with timestamp and context fields
- **CloudWatch**: Send logs via AWS SDK with structured metadata
- **Sentry**: Use `logger.logError()` which includes stack traces

Example Datadog integration:

```typescript
// Future: Send structured logs to Datadog
import { logger } from '$lib/server/logger';

// Logs automatically include context for filtering
logger.info('Payment processed', {
	userId: user.id,
	tier: user.tier,
	amount: payment.amount,
	currency: 'USD'
});
```

Query in Datadog: `level:info context.tier:premium`

## Files

- **Server logger**: `/src/lib/server/logger.ts`
- **Client logger**: `/src/lib/logger.ts`

Both provide the same API for consistency.

## Future Enhancements

- [ ] Add request ID tracking across async operations
- [ ] Send error logs to Sentry automatically
- [ ] Add performance timing logs
- [ ] Create dashboard for production log metrics
