/**
 * Central Email Campaigns Configuration
 *
 * Single source of truth for all email campaigns in Kaiwa.
 * This file defines all campaigns, their schedules, and metadata.
 *
 * Benefits:
 * - Easy to see all campaigns at a glance
 * - Dashboard automatically shows all campaigns defined here
 * - Single place to update campaign settings
 */

export interface EmailCampaign {
	id: string;
	name: string;
	description: string;
	schedule: string; // Cron expression
	status: 'active' | 'paused' | 'draft';
	category: 'engagement' | 'onboarding' | 'content' | 'reports';
	endpoint: string; // API endpoint for triggering
	servicePath: string; // Path to service file
	estimatedRecipients?: string; // Description of who receives it
	frequency?: string; // Human-readable frequency
}

/**
 * All email campaigns configured in Kaiwa
 *
 * Organized by category for easy management
 */
export const EMAIL_CAMPAIGNS: EmailCampaign[] = [
	// ENGAGEMENT CAMPAIGNS
	{
		id: 'practice-reminders',
		name: 'Practice Reminders',
		description: 'Personalized reminders to practice based on user activity and preferences',
		schedule: '0 9 * * 1,4', // Mondays & Thursdays at 9:00 AM UTC
		status: 'active',
		category: 'engagement',
		endpoint: '/api/cron/send-reminders',
		servicePath: 'campaigns/reminders/reminder.service.ts',
		estimatedRecipients: 'Users who opted in for practice reminders',
		frequency: 'Twice weekly (Mon & Thu at 9 AM UTC)'
	},

	// ONBOARDING CAMPAIGNS
	{
		id: 'founder-sequence',
		name: 'Founder Welcome Sequence',
		description: 'Personal 2-email sequence: Day 1 welcome + Day 3 walkthrough offer',
		schedule: '0 14-16 * * *', // Every day 2-4 PM UTC
		status: 'active',
		category: 'onboarding',
		endpoint: '/api/cron/founder-emails',
		servicePath: 'campaigns/founder-sequence/founder.service.ts',
		estimatedRecipients: 'New users on Day 1 and Day 3 after signup',
		frequency: 'Day 1 (signup) + Day 3 (2 days later)'
	},

	// CONTENT CAMPAIGNS
	{
		id: 'weekly-digest',
		name: 'Weekly Product Updates',
		description:
			'Weekly digest of new features, improvements, and major announcements (sent manually)',
		schedule: 'manual', // Sent manually when ready
		status: 'active',
		category: 'content',
		endpoint: '/api/admin/send-weekly-update',
		servicePath: 'campaigns/product-updates/weekly-update-template.ts',
		estimatedRecipients: 'All users who opted in for product updates',
		frequency: 'Weekly (manual send, typically Monday)'
	},
	{
		id: 'scenario-inspiration',
		name: 'Scenario Inspiration',
		description: 'Curated scenario suggestions based on user goals and learning motivation',
		schedule: '0 11 * * 3', // Wednesdays at 11:00 AM UTC
		status: 'active',
		category: 'content',
		endpoint: '/api/cron/scenario-inspiration',
		servicePath: 'campaigns/scenario-inspiration/inspiration.service.ts',
		estimatedRecipients: 'Active users who completed at least one scenario',
		frequency: 'Weekly (Wednesday at 11 AM UTC)'
	},
	{
		id: 'community-stories',
		name: 'Community Success Stories',
		description: 'Inspiring stories from Kaiwa users achieving their language goals',
		schedule: '0 12 * * 5', // Fridays at 12:00 PM UTC
		status: 'active',
		category: 'content',
		endpoint: '/api/cron/community-stories',
		servicePath: 'campaigns/community-stories/story.service.ts',
		estimatedRecipients: 'Active users who opted in for community content',
		frequency: 'Weekly (Friday at 12 PM UTC)'
	},

	// REPORTS CAMPAIGNS
	{
		id: 'weekly-stats',
		name: 'Weekly Progress Reports',
		description: 'Personalized weekly stats showing practice progress and achievements',
		schedule: '0 9 * * 0', // Sundays at 9:00 AM UTC
		status: 'active',
		category: 'reports',
		endpoint: '/api/cron/weekly-stats',
		servicePath: 'campaigns/weekly-stats/stats.service.ts',
		estimatedRecipients: 'Users who practiced in the past week',
		frequency: 'Weekly (Sunday at 9 AM UTC)'
	},
	{
		id: 'progress-reports',
		name: 'Monthly Progress Reports',
		description: 'Comprehensive monthly learning reports with insights and trends',
		schedule: '0 10 1 * *', // First day of month at 10:00 AM UTC
		status: 'active',
		category: 'reports',
		endpoint: '/api/cron/progress-reports',
		servicePath: 'campaigns/progress-reports/progress.service.ts',
		estimatedRecipients: 'Active users with significant practice time',
		frequency: 'Monthly (1st of month at 10 AM UTC)'
	}
];

/**
 * Get campaigns by category
 */
export function getCampaignsByCategory(category: EmailCampaign['category']): EmailCampaign[] {
	return EMAIL_CAMPAIGNS.filter((campaign) => campaign.category === category);
}

/**
 * Get campaign by ID
 */
export function getCampaignById(id: string): EmailCampaign | undefined {
	return EMAIL_CAMPAIGNS.filter((campaign) => campaign.id === id);
}

/**
 * Get active campaigns
 */
export function getActiveCampaigns(): EmailCampaign[] {
	return EMAIL_CAMPAIGNS.filter((campaign) => campaign.status === 'active');
}

/**
 * Calculate next send time for a campaign
 * This is a placeholder - implement with cron-parser for actual calculation
 */
export function getNextSendTime(campaign: EmailCampaign): Date | null {
	// For manual campaigns, return null
	if (campaign.schedule === 'manual') {
		return null;
	}

	// TODO: Implement with cron-parser when needed for dashboard
	// For now, return a placeholder
	return new Date();
}

/**
 * Campaign categories with metadata
 */
export const CAMPAIGN_CATEGORIES = {
	engagement: {
		name: 'Engagement',
		description: 'Keep users active and practicing regularly',
		icon: '🔥'
	},
	onboarding: {
		name: 'Onboarding',
		description: 'Welcome and activate new users',
		icon: '👋'
	},
	content: {
		name: 'Content',
		description: 'Share updates, scenarios, and community content',
		icon: '📰'
	},
	reports: {
		name: 'Reports',
		description: 'Progress tracking and analytics',
		icon: '📊'
	}
} as const;
