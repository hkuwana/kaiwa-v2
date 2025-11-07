import {
	pgTable,
	uuid,
	boolean as pgBoolean,
	integer,
	timestamp,
	jsonb,
	pgEnum
} from 'drizzle-orm/pg-core';
import { users } from './users';

/**
 * Audio interaction mode enumeration
 */
export const audioModeEnum = pgEnum('audio_mode', ['toggle', 'push_to_talk']);

/**
 * Press behavior enumeration for audio controls
 */
export const pressBehaviorEnum = pgEnum('press_behavior', ['tap_toggle', 'press_hold']);

/**
 * Greeting mode enumeration
 */
export const greetingModeEnum = pgEnum('greeting_mode', ['scenario', 'generic']);

/**
 * Theme enumeration
 */
export const themeEnum = pgEnum('theme', ['light', 'dark', 'system']);

/**
 * Practice reminder frequency enumeration
 */
export const practiceReminderFrequencyEnum = pgEnum('practice_reminder_frequency', [
	'never',
	'daily',
	'weekly'
]);

/**
 * Day of week enumeration for weekly reminders
 */
export const dayOfWeekEnum = pgEnum('day_of_week', [
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
	'sunday'
]);

/**
 * ⚙️ User Settings table - Stores global user interface and communication preferences
 *
 * This table contains user preferences that apply across all languages and scenarios,
 * such as audio interaction settings (push-to-talk vs toggle), email preferences
 * (marketing, daily reminders), UI preferences (theme, notifications), and
 * real-time conversation behavior settings. Unlike user-preferences which are
 * language-specific, these settings are global to the user's account.
 *
 * **Key Features:**
 * - 🎙️ Audio interaction customization
 * - 📧 Email communication preferences
 * - 🎨 UI theme and notification settings
 * - 🌍 Global settings (not language-specific)
 * - 🔧 Real-time conversation behavior
 * - 📊 Usage tracking and analytics
 *
 * @example
 * ```typescript
 * // Create user settings
 * await db.insert(userSettings).values({
 *   userId: 'user-123',
 *   audioSettings: {
 *     mode: 'push_to_talk',
 *     pressBehavior: 'press_hold',
 *     autoGreet: true,
 *     greetingMode: 'scenario'
 *   },
 *   receiveMarketingEmails: true,
 *   receiveDailyReminderEmails: true,
 *   theme: 'dark',
 *   notificationsEnabled: true
 * });
 * ```
 */
export const userSettings = pgTable('user_settings', {
	userId: uuid('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),

	audioSettings: jsonb('audio_settings').$type<{
		mode?: 'toggle' | 'push_to_talk';
		pressBehavior?: 'tap_toggle' | 'press_hold';
		autoGreet?: boolean;
		greetingMode?: 'scenario' | 'generic';
	}>(),

	// Core engagement emails
	receivePracticeReminders: pgBoolean('receive_practice_reminders').default(true).notNull(),

	// Practice reminder frequency preference
	practiceReminderFrequency: practiceReminderFrequencyEnum('practice_reminder_frequency')
		.default('weekly')
		.notNull(),

	// Preferred day for weekly reminders (defaults to Friday)
	preferredReminderDay: dayOfWeekEnum('preferred_reminder_day').default('friday').notNull(),

	receiveFounderEmails: pgBoolean('receive_founder_emails').default(true).notNull(),

	// Track if founder email was sent on signup (sent once, immediately)
	receivedFounderEmail: pgBoolean('received_founder_email').default(false).notNull(),

	// Product communication
	receiveProductUpdates: pgBoolean('receive_product_updates').default(true).notNull(),

	receiveProgressReports: pgBoolean('receive_progress_reports').default(true).notNull(),

	// Administrative
	receiveSecurityAlerts: pgBoolean('receive_security_alerts').default(true).notNull(),

	dailyReminderSentCount: integer('daily_reminder_sent_count').default(0).notNull(),

	lastReminderSentAt: timestamp('last_reminder_sent_at'),

	theme: themeEnum('theme').default('system').notNull(),

	notificationsEnabled: pgBoolean('notifications_enabled').default(true).notNull(),

	createdAt: timestamp('created_at').defaultNow().notNull(),

	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});
