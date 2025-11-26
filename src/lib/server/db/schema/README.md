# Database Schema Documentation

## Overview

This document provides a comprehensive overview of all database schemas in the Kaiwa application, organized for easy understanding by both developers and LLMs.

## 📊 Schema Types

### Core User Management

#### `users`

**Purpose**: Central user account management

- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `email` (unique identifier)
  - `googleId` (OAuth integration)
  - `displayName`, `username`, `avatarUrl`
  - `stripeCustomerId` (billing integration)
  - `nativeLanguageId`, `preferredUILanguageId` (language preferences)
- **Usage**: Stores basic user information, authentication data, and billing references

#### `userPreferences`

**Purpose**: User learning preferences and skill tracking

- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `targetLanguageId` (language being learned)
  - `learningGoal` (enum: Connection, Career, Travel, Academic, Culture, Growth)
  - `speakingLevel`, `listeningLevel`, `readingLevel`, `writingLevel` (1-100 scale)
  - `challengePreference` (comfortable/moderate/challenging)
  - `correctionStyle` (immediate/gentle/end_of_session)
  - `specificGoals` (JSON array of learning objectives)
- **Usage**: Tracks user skill levels, learning preferences, and adaptive learning settings

#### `session`

**Purpose**: User authentication sessions

- **Primary Key**: `id` (text)
- **Key Fields**: `userId`, `expiresAt`
- **Usage**: Manages user login sessions and authentication state

### Language & Content

#### `languages`

**Purpose**: Supported language definitions

- **Primary Key**: `id` (text, e.g., 'ja')
- **Key Fields**:
  - `code` (ISO 639-1, e.g., 'ja')
  - `name` (English name, e.g., 'Japanese')
  - `nativeName` (native script, e.g., '日本語')
  - `writingSystem` (latin/chinese/etc.)
  - `supportedScripts` (JSON array of scripts)
- **Usage**: Defines available languages and their characteristics

#### `speakers`

**Purpose**: Voice/speaker definitions for text-to-speech

- **Primary Key**: `id` (text, e.g., 'ja-jp-male')
- **Key Fields**:
  - `languageId` (references languages)
  - `region`, `dialectName`, `bcp47Code`
  - `gender` (male/female)
  - `voiceName`, `voiceProviderId`, `openaiVoiceId`
- **Usage**: Manages available voices for different languages and regions

### Conversations & Messages

#### `conversations`

**Purpose**: Core conversation sessions

- **Primary Key**: `id` (text)
- **Key Fields**:
  - `userId` (nullable for guest users)
  - `targetLanguageId`, `mode` (traditional/realtime)
  - `scenarioId` (optional scenario context)
  - `isOnboarding` (first-time user flag)
  - `durationSeconds`, `messageCount`, `audioSeconds`
  - `comfortRating`, `engagementLevel`
- **Usage**: Tracks conversation sessions, usage metrics, and user engagement

#### `messages`

**Purpose**: Individual messages within conversations

- **Primary Key**: `id` (text)
- **Key Fields**:
  - `conversationId`, `role` (assistant/user/system)
  - `content`, `translatedContent`
  - Multi-language script support: `romanization`, `pinyin`, `hiragana`, `katakana`, `kanji`
  - `translationConfidence`, `translationProvider`
  - `grammarAnalysis`, `vocabularyAnalysis` (JSON)
- **Usage**: Stores conversation content with comprehensive translation and analysis support

### Learning Scenarios

#### `scenarios`

**Purpose**: Structured learning situations and personas

- **Primary Key**: `id` (text)
- **Key Fields**:
  - `title`, `description`
  - `role` (enum: tutor/character/friendly_chat/expert)
  - `difficulty` (beginner/intermediate/advanced), `difficultyRating`, `cefrLevel`
  - `instructions`, `context`, `learningGoal`, `cefrRecommendation`
  - `persona` (JSON: title, nameTemplate, setting, introPrompt, stakes)
  - `expectedOutcome`
  - `learningObjectives` (JSON array)
  - `comfortIndicators` (JSON with confidence/engagement/understanding scores)
  - Discovery fields: `categories`, `tags`, `primarySkill`, `searchKeywords`
  - UX metadata: `thumbnailUrl`, `estimatedDurationSeconds`
  - Publishing & usage: `createdByUserId`, `visibility`, `usageCount`, `isActive`
- **Usage**: Defines the canonical catalog of scenarios for onboarding, browsing, and practice, including persona, pedagogy, and discovery metadata.

#### `scenarioMetadata`

**Purpose**: Aggregated engagement and quality metrics per scenario

- **Primary Key**: `scenarioId` (text, references `scenarios.id`)
- **Key Fields**:
  - `amountSavedCount`, `totalTimesUsed`, `totalAttempts`
  - `averageRating`, `ratingsCount`
  - `completionRate`, `averageTimeSpent`
  - `createdAt`, `updatedAt`
- **Usage**: Stores app-wide aggregated metrics for each scenario to power "trending", "most saved", and "top rated" queries without expensive aggregation joins.

#### `userScenarioProgress`

**Purpose**: Per-user progress and relationship to scenarios

- **Primary Key**: Composite (`userId`, `scenarioId`)
- **Key Fields**:
  - `isSaved`, `savedAt`
  - `timesCompleted`, `timesAttempted`, `lastAttemptAt`, `lastCompletedAt`
  - `totalTimeSpentSeconds`
  - `userRating`, `userNotes`
  - `createdAt`, `updatedAt`
- **Usage**: Tracks each user's engagement, saves, completions, and ratings for scenarios; replaces the earlier `scenarioAttempts` and `scenarioOutcomes` designs.

### Billing & Subscriptions

#### `tiers`

**Purpose**: Subscription tier definitions and limits

- **Primary Key**: `id` (text, e.g., 'free', 'plus', 'premium')
- **Key Fields**:
  - `monthlyConversations`, `monthlySeconds`, `monthlyRealtimeSessions`
  - `maxSessionLengthSeconds`, `sessionBankingEnabled`
  - Feature flags: `hasRealtimeAccess`, `hasAdvancedVoices`, `hasAnalytics`
  - `monthlyPriceUsd`, `annualPriceUsd`
  - `stripeProductId`, `stripePriceIdMonthly`, `stripePriceIdAnnual`
- **Usage**: Defines subscription tiers, usage limits, and feature access

#### `subscriptions`

**Purpose**: Active user subscriptions

- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `userId`, `tierId`
  - `stripeSubscriptionId`, `stripeCustomerId`, `stripePriceId`
  - `status` (active/canceled/past_due/trialing)
  - `currentPeriodStart`, `currentPeriodEnd`
  - `isActive` (computed field)
- **Usage**: Tracks active Stripe subscriptions and billing status

#### `payments`

**Purpose**: Payment transaction history

- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `userId`, `subscriptionId`
  - `stripePaymentIntentId`, `stripeInvoiceId`
  - `amount`, `currency`, `status`
- **Usage**: Records payment transactions for analytics and billing history

### Usage Tracking

#### `userUsage`

**Purpose**: Monthly usage tracking per user

- **Primary Key**: Composite (`userId`, `period`)
- **Key Fields**:
  - `period` (YYYY-MM format)
  - `conversationsUsed`, `secondsUsed`, `realtimeSessionsUsed`
  - `bankedSeconds`, `bankedSecondsUsed` (rollover from previous month)
- **Usage**: Tracks monthly usage against tier limits and manages session banking

#### `conversationSessions`

**Purpose**: Detailed conversation session analytics

- **Primary Key**: `id` (text)
- **Key Fields**:
  - `userId`, `language`, `startTime`, `endTime`
  - `durationSeconds`, `secondsConsumed`, `inputTokens`
  - `wasExtended`, `extensionsUsed`
- **Usage**: Tracks per-session conversation metrics (duration, usage, tokens, extensions) for advanced analytics and usage reconciliation.

### Analytics

#### `analyticsEvents`

**Purpose**: User behavior and conversion tracking

- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `userId` (nullable for anonymous events)
  - `sessionId` (PostHog session ID)
  - `eventName`, `properties` (JSON)
  - `userAgent`, `ipAddress`, `referrer`
- **Usage**: Tracks user events for analytics, conversion tracking, and behavior analysis

### Learning Paths & Curriculum

#### `learningPaths`

**Purpose**: Structured 4-week learning curricula and templates

- **Primary Key**: `id` (text, slug-like)
- **Key Fields**:
  - `userId` (nullable for anonymous templates)
  - `title`, `description` (scrubbed for public templates)
  - `targetLanguage` (e.g., 'ja', 'es', 'fr')
  - `schedule` (JSON array of day entries with themes, difficulty, scenarioId)
  - `isTemplate`, `isPublic` (template vs user-specific, SEO visibility)
  - `shareSlug` (SEO-friendly public URL slug)
  - `status` (enum: draft/active/archived)
  - `createdByUserId` (creator for authored courses)
  - `metadata` (JSON: cefrLevel, primarySkill, estimatedMinutesPerDay, category, tags)
- **Usage**: Stores 4-week learning path definitions that can be user-specific (generated from preferences), creator-authored (custom courses), or anonymous templates (public, SEO-friendly). Each path contains a schedule of daily lessons with themes, difficulty progression, and linked scenarios.

#### `learningPathAssignments`

**Purpose**: User enrollment and progress tracking in learning paths

- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `pathId` (references learningPaths)
  - `userId` (user enrolled in this path)
  - `role` (enum: tester/learner - for early testers vs regular users)
  - `status` (enum: invited/active/completed/archived)
  - `startsAt` (when this course starts for this user)
  - `currentDayIndex` (0 = not started, 1-28 = current day)
  - `completedAt` (completion timestamp)
  - `emailRemindersEnabled` (opt-in for daily reminder emails)
  - `lastEmailSentAt` (email tracking)
  - `metadata` (JSON: invitedBy, inviteNote, feedbackRequested, customStartTime)
- **Usage**: Tracks which users are following which learning paths, supporting both testers (early users testing creator-authored courses) and learners (regular users). Enables email automation, progress tracking, cohort management, and tester feedback loops. Unique constraint: one assignment per user-path combination.

#### `learningPathPreviews`

**Purpose**: Temporary preview sessions for instant path creation

- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `userId` (user creating this preview)
  - `sessionId` (short ID for URL, e.g., 'abc123', unique)
  - `intent` (original user intent text)
  - `title`, `description` (generated path metadata)
  - `targetLanguage`, `sourceLanguage`
  - `schedule` (complete 30-day schedule, same format as learningPaths)
  - `previewScenarios` (JSON: embedded scenario data for days 1-3)
  - `status` (enum: generating/ready/committed)
  - `committedPathId` (link to created learning_path if committed)
  - `expiresAt` (auto-delete after 24h)
  - `metadata` (JSON: parsedIntent, refinementHistory, regeneratedDays)
- **Usage**: Stores temporary preview sessions (8-12 second generation) when users create learning paths through dashboard. Previews show first 3 scenarios before committing, support natural language refinement and individual scenario regeneration. Auto-cleanup cron deletes expired/committed previews.

#### `scenarioGenerationQueue`

**Purpose**: Background job queue for async scenario generation

- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `pathId` (references learningPaths)
  - `dayIndex` (1-based day number: 1, 2, 3, ..., 28)
  - `targetGenerationDate` (when scenario should be ready, timezone-aware)
  - `status` (enum: pending/processing/ready/failed)
  - `lastError` (error message for debugging)
  - `retryCount` (for exponential backoff)
  - `lastProcessedAt` (timeout detection)
- **Usage**: Acts as job queue for background scenario generation. When a learning path is created, queue entries are created for each day needing a scenario. Background workers process these jobs, generate scenarios via LLM, and link them back to the learning path schedule. Supports both JIT and pre-generation strategies.

## 🔄 Schema Relationships

### Primary Relationships

- `users` → `userPreferences` (1:1)
- `users` → `conversations` (1:many)
- `users` → `subscriptions` (1:many)
- `users` → `learningPathAssignments` (1:many)
- `users` → `learningPathPreviews` (1:many)
- `users` → `learningPaths` (1:many, as creator via createdByUserId)
- `conversations` → `messages` (1:many)
- `languages` → `speakers` (1:many)
- `scenarios` → `userScenarioProgress` (1:many)
- `scenarios` → `scenarioMetadata` (1:1)
- `tiers` → `subscriptions` (1:many)
- `learningPaths` → `learningPathAssignments` (1:many)
- `learningPaths` → `scenarioGenerationQueue` (1:many)

### Key Design Patterns

- **Guest Support**: Conversations can exist without users (guestId field)
- **Multi-language**: Comprehensive script support (romanization, pinyin, hiragana, etc.)
- **Flexible Analytics**: JSON fields for extensible event properties and analysis
- **Usage Banking**: Session time can roll over between months
- **Progressive Enhancement**: MVP schemas with v2 folder for advanced features
- **Curriculum Management**: Learning paths support user-specific, creator-authored, and anonymous public templates
- **Preview & Commit**: Temporary preview sessions allow refinement before committing to full learning paths
- **Async Generation**: Background job queue for scenario generation with retry logic and error handling
- **PII Protection**: Public templates scrub user data for SEO and sharing

## 📁 V2 Schemas (Future)

Advanced schemas in `/v2` folder for future implementation:

- `userLearningStats` - Detailed progress tracking
- `vocabularyProgress` - Word mastery and spaced repetition
- `userNotifications` - Complex notification system
- Enhanced versions of existing schemas with additional features
