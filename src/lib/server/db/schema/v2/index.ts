/**
 * 🚀 V2 Database Schemas - Advanced features planned for future implementation
 *
 * This directory contains enhanced schema definitions that extend beyond the MVP functionality.
 * These schemas are organized here to keep the main schema directory focused on core features
 * while providing a roadmap for future development. They include advanced learning analytics,
 * detailed conversation tracking, and enhanced user experience features.
 *
 * **Key Features:**
 * - 📊 Advanced learning analytics and progress tracking
 * - 🎯 Sophisticated vocabulary and spaced repetition systems
 * - 💬 Enhanced conversation session management
 * - 🔔 Advanced notification and user experience features
 * - 📈 Comprehensive usage analytics and reporting
 *
 * **Implementation Roadmap:**
 * 1. 🎯 **userLearningStats** - After basic progress tracking is stable
 * 2. 📚 **vocabularyProgress** - After conversation system is solid
 * 3. 💬 **conversationSessions** - After basic conversation tracking is stable
 * 4. 🔔 **userNotifications** - After core features are complete
 *
 * **Note**: Scenario tracking (attempts & outcomes) has been replaced with simplified
 * scenario-metadata.ts and user-scenario-progress.ts in the main schema directory.
 *
 * **Migration Strategy:**
 * - 🔄 Gradual migration from v1 to v2 schemas
 * - 📊 Data migration scripts will be provided
 * - 🧪 A/B testing support for new features
 * - 📈 Performance monitoring and optimization
 */

// 📊 Advanced Learning Analytics
export { userLearningStats } from './user-learning-stats';
export { vocabularyProgress } from './vocabulary-progress';

// 🎭 Scenario Management
// Moved to main schema: scenario-metadata.ts and user-scenario-progress.ts

// 🔔 User Experience & Notifications
export { userNotifications } from './user-notifications';
export { userUsage } from './user-usage';

// 📋 Implementation Priority:
// 1. 🎯 userLearningStats - After basic progress tracking is stable
// 2. 📚 vocabularyProgress - After conversation system is solid
// 3. 💬 conversationSessions - After basic conversation tracking is stable
// 4. 🔔 userNotifications - After core features are complete
