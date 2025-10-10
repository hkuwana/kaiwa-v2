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

	receiveMarketingEmails: pgBoolean('receive_marketing_emails').default(true).notNull(),

	receiveDailyReminderEmails: pgBoolean('receive_daily_reminder_emails').default(true).notNull(),

	receiveProductUpdates: pgBoolean('receive_product_updates').default(true).notNull(),

	receiveWeeklyDigest: pgBoolean('receive_weekly_digest').default(true).notNull(),

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
