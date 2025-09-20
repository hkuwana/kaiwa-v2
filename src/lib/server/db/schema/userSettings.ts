import {
	pgTable,
	uuid,
	boolean as pgBoolean,
	integer,
	timestamp,
	jsonb,
	text
} from 'drizzle-orm/pg-core';
import { users } from './users';

export const userSettings = pgTable('user_settings', {
	userId: uuid('user_id')
		.primaryKey()
		.references(() => users.id, { onDelete: 'cascade' })
		.notNull(),

	// Realtime audio interaction settings (client UX preferences)
	audioSettings: jsonb('audio_settings').$type<{
		mode?: 'toggle' | 'push_to_talk';
		pressBehavior?: 'tap_toggle' | 'press_hold';
		autoGreet?: boolean;
		greetingMode?: 'scenario' | 'generic';
	}>(),

	// Email marketing preferences (global, not language-specific)
	receiveMarketingEmails: pgBoolean('receive_marketing_emails').default(true).notNull(),
	receiveDailyReminderEmails: pgBoolean('receive_daily_reminder_emails').default(true).notNull(),
	dailyReminderSentCount: integer('daily_reminder_sent_count').default(0).notNull(),
	lastReminderSentAt: timestamp('last_reminder_sent_at'),

	// UI preferences (global)
	theme: text('theme').$type<'light' | 'dark' | 'system'>().default('system').notNull(),
	notificationsEnabled: pgBoolean('notifications_enabled').default(true).notNull(),

	// Metadata
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at')
		.defaultNow()
		.$onUpdate(() => new Date())
		.notNull()
});
