/**
 * V2 Database Schemas - Advanced features planned for future implementation
 *
 * This directory contains enhanced schema definitions that extend beyond the MVP functionality.
 * These schemas are organized here to keep the main schema directory focused on core features
 * while providing a roadmap for future development. They include advanced learning analytics,
 * detailed conversation tracking, sophisticated scenario management, and enhanced user experience features.
 */

// Advanced Learning Analytics
export { userLearningStats } from './user-learning-stats';
export { vocabularyProgress } from './vocabulary-progress';

// Conversation Analytics (Moved from MVP for simplicity)
export { conversationSessions } from './conversation-sessions';

// Scenario Management
export { scenarioAttempts } from './scenario-attempts';
export { scenarioOutcomes } from './scenario-outcomes';

// User Experience & Notifications
export { userNotifications } from './user-notifications';
export { userUsage } from './user-usage';

// Implementation Priority:
// 1. userLearningStats - After basic progress tracking is stable
// 2. vocabularyProgress - After conversation system is solid
// 3. conversationSessions - After basic conversation tracking is stable
// 4. scenarioAttempts - After basic scenarios are working
// 5. userNotifications - After core features are complete
