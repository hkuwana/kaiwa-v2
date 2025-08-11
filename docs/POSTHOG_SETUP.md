# PostHog Analytics Setup for SvelteKit

This guide explains how to set up PostHog analytics in your SvelteKit app with both client-side and server-side tracking.

## Overview

You'll be using **two PostHog libraries**:

- `posthog-js` - Client-side tracking (browser events, user interactions, session replay)
- `posthog-node` - Server-side tracking (SSR page views, API usage, server events)

## Installation

Both libraries are already installed:

```bash
pnpm add posthog-js posthog-node
```

## Environment Variables

Add these to your `.env` files:

```env
# .env.local (development)
POSTHOG_API_KEY=phc_your_actual_key_here
POSTHOG_HOST=https://us.i.posthog.com

# .env.production (production)
POSTHOG_API_KEY=phc_your_actual_key_here
POSTHOG_HOST=https://us.i.posthog.com
```

## Client-Side Setup

### 1. Initialize PostHog in your root layout

Following the [official PostHog Svelte guide](https://posthog.com/docs/libraries/svelte), we use `+layout.js` for client-side initialization:

```javascript
// src/routes/+layout.js
import posthog from 'posthog-js';
import { browser } from '$app/environment';

export const load = async () => {
	if (browser) {
		posthog.init('phc_your_actual_key_here', {
			api_host: 'https://us.i.posthog.com',
			defaults: '2025-05-24',
			// Enable session recording for conversion analysis
			disable_session_recording: false,
			session_recording: {
				maskAllInputs: true, // Mask sensitive inputs
				maskInputOptions: {
					password: true,
					email: false // We want to see email interactions for conversion
				}
			},
			// Privacy settings
			respect_dnt: true,
			opt_out_capturing_by_default: false,
			// Performance
			capture_pageview: false, // We'll handle this manually
			capture_pageleave: true
		});
	}

	return {};
};
```

### 2. Update your layout component

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{@render children?.()}
```

### 2. Track client-side events

```typescript
// In any component
import { track, identifyUser } from '$lib/analytics/posthog';

// Track user interaction
track('button_clicked', { button_name: 'start_conversation' });

// Identify user after login
identifyUser('user_123', {
	email: 'user@example.com',
	tier: 'pro'
});
```

## Server-Side Setup

### 1. Server-side PostHog in layout

Following the [official PostHog Svelte guide](https://posthog.com/docs/libraries/svelte), we use `+layout.server.ts` for server-side tracking:

```typescript
// src/routes/+layout.server.ts
import { PostHog } from 'posthog-node';
import { env } from '$env/dynamic/private';

const POSTHOG_KEY = env.POSTHOG_API_KEY || 'phc_your_key_here';
const POSTHOG_HOST = env.POSTHOG_HOST || 'https://us.i.posthog.com';

export const load = async ({ url, request, locals }) => {
	const posthog = new PostHog(POSTHOG_KEY, {
		host: POSTHOG_HOST,
		flushAt: 1,
		flushInterval: 0
	});

	try {
		// Track SSR page view
		const userId = locals.user?.id;

		posthog.capture(
			'$pageview',
			{
				$current_url: url.href,
				$pathname: url.pathname,
				server_side: true,
				timestamp: new Date().toISOString()
			},
			{
				distinctId: userId || 'anonymous',
				groups: {
					server: 'kaiwa-flyio',
					environment: env.NODE_ENV || 'production'
				}
			}
		);

		return { posthogInitialized: true, userId };
	} finally {
		await posthog.shutdown(); // Always flush events
	}
};
```

### 2. Server-side PostHog utilities

Additional server-side utilities are available in `src/lib/server/posthog.ts` for custom tracking:

### 2. Track custom server events

```typescript
// In any server-side code (API routes, hooks, etc.)
import { trackServerEvent, trackServerConversion } from '$lib/server/posthog';

// Track custom server event
trackServerEvent('user_action', userId, {
	action: 'database_query',
	table: 'conversations'
});

// Track conversion events
trackServerConversion.signUp(userId, 'google', 'free');
trackServerConversion.tierLimitReached(userId, 'conversations', 'free');
```

## Usage Examples

### Client-Side Events

```typescript
// Track feature usage
import { trackFeature } from '$lib/analytics/posthog';

trackFeature.realtimeUsed('japanese', 300); // 5 minutes
trackFeature.languageChanged('english', 'japanese');

// Track engagement
import { trackEngagement } from '$lib/analytics/posthog';

trackEngagement.sessionStart();
trackEngagement.conversationCompleted(10, 25, 'realtime');
```

### Server-Side Events

```typescript
// In API routes
import { trackServerEvent } from '$lib/server/posthog';

export const POST: RequestHandler = async ({ request, locals }) => {
	const userId = locals.user?.id;

	try {
		// Your API logic here

		// Track successful API call
		trackServerEvent('chat_message_sent', userId, {
			message_length: message.length,
			language: language
		});

		return json(result);
	} catch (error) {
		// Track API errors
		trackServerEvent('chat_api_error', userId, {
			error: error.message,
			endpoint: '/api/chat'
		});

		throw error;
	}
};
```

## What Gets Tracked Automatically

### Server-Side (via +layout.server.ts)

- ✅ SSR page views
- ✅ User identification
- ✅ Server-side events

### Client-Side (via +layout.js and posthog-js)

- ✅ User interactions
- ✅ Session replay
- ✅ Feature flags
- ✅ Custom events

## Testing

### Development

- Set `debug: true` in PostHog config to see events in console
- Use PostHog's debug mode: `?__posthog_debug=true` in URL

### Production

- Events are automatically sent to PostHog
- Check your PostHog dashboard for real-time data

## Best Practices

1. **User Identification**: Always identify users after login
2. **Event Naming**: Use consistent naming (e.g., `user_action`, `feature_used`)
3. **Properties**: Include relevant context in event properties
4. **Privacy**: Respect user privacy with proper opt-out mechanisms
5. **Performance**: Server-side tracking doesn't impact client performance

## Troubleshooting

### Common Issues

1. **Events not showing up**: Check API key and host configuration
2. **SSR errors**: Ensure PostHog is only initialized on client-side
3. **Duplicate events**: Avoid tracking the same event on both client and server

### Debug Mode

Enable debug mode in your PostHog config:

```typescript
posthog.init(POSTHOG_KEY, {
	api_host: POSTHOG_HOST,
	debug: true // Shows events in console
});
```

## Session Replay Configuration

For server-side rendered apps, PostHog requires absolute asset paths for session replay to work properly. This is already configured in your `svelte.config.js`:

```javascript
kit: {
 // ... other config
 paths: {
  relative: false, // Required for PostHog session replay with SSR
 },
},
```

## Next Steps

1. Replace `phc_your_key_here` with your actual PostHog API key
2. Customize event tracking based on your app's needs
3. Set up PostHog dashboards and funnels
4. Configure feature flags for A/B testing
5. Set up session recording (now properly configured for SSR)

## Resources

- [PostHog JavaScript Web Docs](https://posthog.com/docs/libraries/js)
- [PostHog Node.js Docs](https://posthog.com/docs/libraries/node)
- [PostHog SvelteKit Integration](https://posthog.com/docs/frameworks/svelte)
