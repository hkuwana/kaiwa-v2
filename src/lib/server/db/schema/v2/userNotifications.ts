import { pgTable, uuid, text,  timestamp, json, index } from 'drizzle-orm/pg-core';
import { users } from '../users';

// User notification and communication preferences
export const userNotifications = pgTable(
	'user_notifications',
	{
		id: uuid('id').primaryKey().defaultRandom(),
		userId: uuid('user_id')
			.notNull()
			.references(() => users.id),

		// Email notifications
		emailNotifications: json('email_notifications')
			.$type<{
				marketing: boolean;
				productUpdates: boolean;
				learningReminders: boolean;
				achievements: boolean;
				streakAlerts: boolean;
				subscriptionUpdates: boolean;
			}>()
			.default({
				marketing: false,
				productUpdates: true,
				learningReminders: true,
				achievements: true,
				streakAlerts: true,
				subscriptionUpdates: true
			}),

		// Push notifications
		pushNotifications: json('push_notifications')
			.$type<{
				enabled: boolean;
				learningReminders: boolean;
				achievements: boolean;
				streakAlerts: boolean;
				scenarioSuggestions: boolean;
			}>()
			.default({
				enabled: true,
				learningReminders: true,
				achievements: true,
				streakAlerts: true,
				scenarioSuggestions: true
			}),

		// In-app notifications
		inAppNotifications: json('in_app_notifications')
			.$type<{
				enabled: boolean;
				showBanners: boolean;
				showToasts: boolean;
				soundEnabled: boolean;
			}>()
			.default({
				enabled: true,
				showBanners: true,
				showToasts: true,
				soundEnabled: true
			}),

		// Communication frequency
		communicationFrequency: text('communication_frequency')
			.$type<'daily' | 'weekly' | 'monthly' | 'never'>()
			.default('weekly'),

		// Quiet hours
		quietHours: json('quiet_hours')
			.$type<{
				enabled: boolean;
				startTime: string; // HH:MM format
				endTime: string; // HH:MM format
				timezone: string;
			}>()
			.default({
				enabled: false,
				startTime: '22:00',
				endTime: '08:00',
				timezone: 'UTC'
			}),

		// Metadata
		createdAt: timestamp('created_at').defaultNow(),
		updatedAt: timestamp('updated_at').defaultNow()
	},
	(table) => [
		// Performance indexes
		index('user_notifications_user_id_idx').on(table.userId),
		index('user_notifications_updated_at_idx').on(table.updatedAt)
	]
);
