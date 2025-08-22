# Database Schema - MVP Focused

## Overview

This schema is designed for the MVP (Minimum Viable Product) of Kaiwa, focusing on essential features while keeping the door open for future expansion.

## 🎯 MVP Philosophy

**"Try before you commit"** - Users can experience the core conversation feature without creating a profile, then decide if they want to save their progress and preferences.

## 📊 Current Schema Structure

### Core Tables (Essential for MVP)

- `users` - Basic user management
- `userPreferences` - Essential learning preferences + basic progress tracking
- `conversations` - Core conversation feature with basic scenario support
- `messages` - Conversation history
- `languages` - Language support
- `scenarios` - Simplified onboarding/comfort scenarios
- `session` - Authentication
- `tiers`, `subscriptions`, `payments` - Basic billing

### What's in userPreferences (Consolidated)

- **Learning preferences**: target language, learning goal, voice preference
- **Basic progress**: study time, conversation count, streak
- **UI preferences**: theme
- **Future expansion**: room for more preferences as needed

## 🚀 User Journey

1. **First Visit**: User lands on conversation page
2. **Comfort Session**: Starts with onboarding scenario (no profile needed)
3. **Experience**: Has a conversation to test the system
4. **Decision Point**: After session, asked if they want to save progress
5. **Profile Creation**: If yes, creates profile with collected data

## 🔄 Scenario System (MVP)

### Purpose

- **Onboarding**: Help users feel comfortable with AI conversation
- **Comfort Building**: Gauge user engagement and confidence
- **Learning Framework**: Collect basic preferences and goals

### Implementation

- Simple scenario structure focused on user comfort
- Basic engagement tracking (confidence, engagement, understanding)
- No complex scoring or mastery tracking yet

## 📁 V2 Schemas (Future)

Advanced schemas are moved to `/v2` folder:

- `userLearningStats` - Detailed progress tracking
- `vocabularyProgress` - Word mastery and spaced repetition
- `scenarioAttempts` - Multiple attempts and detailed analytics
- `analyticsEvents` - User behavior tracking
- `userNotifications` - Complex notification system

## 🎯 Benefits of This Approach

1. **Faster Development**: Focus on core features
2. **Better Testing**: Simpler schema = easier to debug
3. **User Validation**: Users can try before committing
4. **Future Ready**: Easy to add advanced features later
5. **Performance**: Fewer tables and indexes initially

## 🔧 Migration Strategy

When ready to add V2 features:

1. Add schemas back to main index
2. Create migration scripts
3. Gradually populate with data
4. Update application logic

## 📝 Notes

- All comfort/engagement data is stored in conversations table
- Basic progress is in userPreferences for simplicity
- Scenarios focus on user experience, not complex learning paths
- Easy to expand without breaking existing functionality
