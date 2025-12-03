# AI Module Migration Changelog

## Overview

This document describes the migration from a single-provider (OpenAI) AI integration to a multi-provider architecture supporting OpenAI, Anthropic (Claude), and Google (Gemini).

## Migration Date
December 2025

## Summary of Changes

### New Files Created

| File | Purpose |
|------|---------|
| `src/lib/server/ai/types.ts` | Common interfaces for multi-provider AI abstraction |
| `src/lib/server/ai/config/providers.config.ts` | Provider and model configurations |
| `src/lib/server/ai/config/task-routing.config.ts` | Task-to-provider routing configuration |
| `src/lib/server/ai/providers/index.ts` | Provider factory and lazy initialization |
| `src/lib/server/ai/ai.service.ts` | Unified AI service with task-based routing |
| `src/lib/server/ai/index.ts` | Public API exports |
| `src/lib/server/ai/ai.service.test.ts` | Unit tests for AI service |
| `src/lib/server/ai/config/providers.config.test.ts` | Unit tests for provider config |
| `src/lib/server/ai/config/task-routing.config.test.ts` | Unit tests for task routing |

### Files Modified

| File | Changes |
|------|---------|
| `src/lib/server/services/openai.service.ts` | Refactored to use new AI module; backward-compatible API |
| `src/lib/server/services/conversation-memory.service.ts` | Updated imports to use new AI module |
| `src/lib/server/services/conversation-summary.service.ts` | Updated imports to use new AI module |
| `src/lib/features/analysis/services/module-registry.ts` | Updated to use task-based routing |
| `src/lib/features/learning-path/services/PathGeneratorService.server.ts` | Updated to use task-based routing |
| `src/lib/features/learning-path/services/PathGeneratorService.unit.test.ts` | Updated mocks for new AI module |
| `package.json` | Added AI SDK dependencies |

### Dependencies Added

```json
{
  "ai": "^5.0.106",
  "@ai-sdk/openai": "^2.0.76",
  "@ai-sdk/anthropic": "^2.0.53",
  "@ai-sdk/google": "^2.0.44"
}
```

## Architecture

### Directory Structure

```
src/lib/server/ai/
├── types.ts                    # Common interfaces (AIMessage, AIResponse, etc.)
├── config/
│   ├── providers.config.ts     # Provider + model definitions
│   └── task-routing.config.ts  # Task → provider/tier mapping
├── providers/
│   └── index.ts                # Provider factory (lazy init)
├── ai.service.ts               # Main service entry point
├── index.ts                    # Public exports
└── *.test.ts                   # Unit tests
```

### Task Routing

Tasks are automatically routed to optimal providers:

| Task | Provider | Model Tier | Rationale |
|------|----------|------------|-----------|
| `grammarCorrection` | Anthropic | Fast | Claude Haiku is fast & accurate |
| `jsonGeneration` | Anthropic | Fast | Reliable structured output |
| `structuredExtraction` | Anthropic | Fast | Good at following schemas |
| `simpleTranslation` | Google | Fast | Gemini excels at translation |
| `scenarioGeneration` | Anthropic | Fast | Creative yet structured |
| `pathwaySyllabus` | Anthropic | Fast | Fast curriculum generation |
| `detailedAnalysis` | OpenAI | Balanced | Complex reasoning |
| `conversationSummary` | OpenAI | Balanced | Nuanced understanding |
| `nuancedFeedback` | OpenAI | Balanced | Quality feedback |
| `complexReasoning` | OpenAI | Balanced | Advanced reasoning |
| `voiceConversation` | OpenAI | Realtime | Only option with full support |
| `realtimeChat` | OpenAI | Realtime | WebRTC support |

### Provider Models

**OpenAI:**
- Fast: `gpt-5-nano-2025-08-07`
- Balanced: `gpt-5-mini-2025-08-07`
- Realtime: `gpt-5-nano-realtime-preview-2024-12-17`

**Anthropic (Claude):**
- Fast: `claude-3-5-haiku-20241022`
- Balanced: `claude-sonnet-4-20250514`
- Premium: `claude-opus-4-20250514`

**Google (Gemini):**
- Fast: `gemini-2.0-flash`
- Balanced: `gemini-1.5-pro`

## Environment Variables

Add these to `.env.development` and `.env.production`:

```bash
# Required (existing)
OPENAI_API_KEY=sk-...

# New providers (optional but recommended)
ANTHROPIC_API_KEY=sk-ant-...    # Get from: https://console.anthropic.com/
GOOGLE_AI_API_KEY=...           # Get from: https://aistudio.google.com/apikey
```

## Usage Examples

### Basic Completion with Task Routing

```typescript
import { createCompletion } from '$lib/server/ai';

// Automatically routes to Claude Haiku
const response = await createCompletion(
  [{ role: 'user', content: 'Check this grammar' }],
  { task: 'grammarCorrection' }
);

console.log(response.content);
console.log(response.provider); // 'anthropic'
console.log(response.model);    // 'claude-3-5-haiku-...'
```

### Structured Output with Schema

```typescript
import { createStructuredCompletion } from '$lib/server/ai';
import { z } from 'zod';

const schema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']),
  score: z.number().min(0).max(100)
});

const result = await createStructuredCompletion(
  [{ role: 'user', content: 'Analyze this text' }],
  schema,
  { task: 'structuredExtraction' }
);

console.log(result.data); // { sentiment: 'positive', score: 85 }
```

### Tool/Function Calling (Future Use)

```typescript
import { createCompletionWithTools } from '$lib/server/ai';

const response = await createCompletionWithTools(
  [{ role: 'user', content: 'What events are happening today?' }],
  {
    task: 'realtimeChat',
    tools: [{
      name: 'getCurrentEvents',
      description: 'Get current news events',
      parameters: { topic: { type: 'string' } },
      execute: async ({ topic }) => fetchNews(topic)
    }],
    maxSteps: 3
  }
);
```

## Backward Compatibility

The existing `openai.service.ts` API remains unchanged:

```typescript
// Still works (deprecated but functional)
import { createCompletion } from '$lib/server/services/openai.service';

const response = await createCompletion(messages, options);
```

However, we recommend migrating to the new API with task-based routing:

```typescript
// Recommended
import { createCompletion } from '$lib/server/ai';

const response = await createCompletion(messages, { task: 'grammarCorrection' });
```

## Testing

Run tests to verify the migration:

```bash
# Run all unit tests
pnpm test:unit

# Run AI module tests specifically
pnpm test:unit -- src/lib/server/ai

# Run with watch mode
pnpm test:unit:watch -- src/lib/server/ai
```

## Fallback Behavior

When a provider is unavailable:

1. System checks if requested provider has API key configured
2. If not available, uses fallback chain:
   - OpenAI → Anthropic → Google
   - Anthropic → OpenAI → Google
   - Google → Anthropic → OpenAI
3. Logs warning when using fallback
4. Throws error if no provider available

## Performance Notes

- **Lazy initialization**: Provider clients only created when first used
- **No breaking changes**: Existing code continues to work
- **Logging**: All requests/responses logged for debugging
- **Token tracking**: Usage statistics included in responses

## Future Enhancements

1. **Real-time events**: Tool calling for current events in voice conversations
2. **Cost tracking**: Per-provider cost analytics
3. **A/B testing**: Route percentage of traffic to different providers
4. **Caching**: Response caching for identical requests
5. **Rate limiting**: Per-provider rate limit handling

## Rollback Instructions

If issues arise, revert the changes:

1. Remove AI SDK dependencies from `package.json`
2. Restore `openai.service.ts` from git history
3. Update imports in affected services
4. Run `pnpm install`

```bash
git checkout HEAD~1 -- src/lib/server/services/openai.service.ts
git checkout HEAD~1 -- src/lib/server/services/conversation-memory.service.ts
git checkout HEAD~1 -- src/lib/server/services/conversation-summary.service.ts
# ... etc
```
