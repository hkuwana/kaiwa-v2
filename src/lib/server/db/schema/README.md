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
**Purpose**: Learning scenario definitions
- **Primary Key**: `id` (text)
- **Key Fields**:
  - `category` (onboarding/comfort/basic/intermediate)
  - `difficulty` (beginner/intermediate/advanced)
  - `instructions`, `context`, `expectedOutcome`
  - `learningObjectives` (JSON array)
  - `comfortIndicators` (JSON with confidence/engagement/understanding scores)
- **Usage**: Defines structured learning scenarios for user onboarding and practice

#### `scenarioAttempts`
**Purpose**: Track multiple attempts at scenarios
- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `userId`, `scenarioId`
  - `attemptNumber`, `startedAt`, `completedAt`
  - `completedSteps` (JSON array)
  - `timeSpentSeconds`, `hintsUsed`, `translationsUsed`
- **Usage**: Tracks user progress through scenario attempts and learning analytics

#### `scenarioOutcomes`
**Purpose**: Detailed scenario completion results
- **Primary Key**: `id` (UUID)
- **Key Fields**:
  - `userId`, `conversationId`, `scenarioId`
  - `wasGoalAchieved`, `goalCompletionScore`
  - `grammarUsageScore`, `vocabularyUsageScore`, `pronunciationScore`
  - `usedTargetVocabulary`, `missedTargetVocabulary` (JSON arrays)
  - `aiFeedback`, `suggestions` (JSON array)
- **Usage**: Stores detailed assessment results and AI feedback from scenario completions

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
**Purpose**: Detailed conversation session analytics (DEPRECATED - moved to v2)
- **Primary Key**: `id` (text)
- **Key Fields**:
  - `userId`, `language`, `startTime`, `endTime`
  - `durationMinutes`, `minutesConsumed`
  - `wasExtended`, `extensionsUsed`
- **Usage**: Legacy detailed session tracking (use v2 version for new development)

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

## 🔄 Schema Relationships

### Primary Relationships
- `users` → `userPreferences` (1:1)
- `users` → `conversations` (1:many)
- `users` → `subscriptions` (1:many)
- `conversations` → `messages` (1:many)
- `languages` → `speakers` (1:many)
- `scenarios` → `scenarioAttempts` (1:many)
- `tiers` → `subscriptions` (1:many)

### Key Design Patterns
- **Guest Support**: Conversations can exist without users (guestId field)
- **Multi-language**: Comprehensive script support (romanization, pinyin, hiragana, etc.)
- **Flexible Analytics**: JSON fields for extensible event properties and analysis
- **Usage Banking**: Session time can roll over between months
- **Progressive Enhancement**: MVP schemas with v2 folder for advanced features

## 📁 V2 Schemas (Future)

Advanced schemas in `/v2` folder for future implementation:
- `userLearningStats` - Detailed progress tracking
- `vocabularyProgress` - Word mastery and spaced repetition
- `userNotifications` - Complex notification system
- Enhanced versions of existing schemas with additional features
