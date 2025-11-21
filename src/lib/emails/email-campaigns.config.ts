/**
 * Email Campaigns Configuration
 *
 * Central registry for all email campaigns.
 * This is the single source of truth for the email system.
 */

export interface EmailCampaign {
	id: string;
	name: string;
	description: string;
	schedule: string; // Cron format
	status: 'active' | 'scheduled' | 'disabled' | 'manual';
	templatePath: string;
	servicePath: string;
	endpoint: string;
	category: 'engagement' | 'onboarding' | 'marketing' | 'transactional';
}

export const EMAIL_CAMPAIGNS: EmailCampaign[] = [
	{
		id: 'practice-reminders',
		name: 'Practice Reminders',
		description: 'Weekly reminder to practice for inactive users',
		schedule: '0 9 * * 5', // Fridays at 9 AM UTC
		status: 'active',
		templatePath: 'campaigns/reminders/reminder.service.ts',
		servicePath: 'campaigns/reminders/reminder.service.ts',
		endpoint: '/api/cron/send-reminders',
		category: 'engagement'
	},
	{
		id: 'founder-sequence',
		name: 'Founder Welcome Sequence',
		description: 'Personal emails from founder to new users',
		schedule: '0 10 * * *', // Daily at 10 AM UTC
		status: 'active',
		templatePath: 'campaigns/founder-sequence/founder.service.ts',
		servicePath: 'campaigns/founder-sequence/founder.service.ts',
		endpoint: '/api/cron/founder-emails',
		category: 'onboarding'
	},
	{
		id: 'weekly-stats',
		name: 'Weekly Stats',
		description: 'Personalized weekly progress stats for users',
		schedule: '0 10 * * 1', // Mondays at 10 AM UTC
		status: 'active',
		templatePath: 'campaigns/weekly-stats/stats.service.ts',
		servicePath: 'campaigns/weekly-stats/stats.service.ts',
		endpoint: '/api/cron/weekly-stats',
		category: 'engagement'
	},
	{
		id: 'weekly-digest',
		name: 'Weekly Product Updates',
		description: 'Weekly digest of product updates and improvements',
		schedule: '0 9 * * 1', // Mondays at 9 AM UTC
		status: 'active',
		templatePath: 'campaigns/weekly-digest/digest.service.ts',
		servicePath: 'campaigns/weekly-digest/digest.service.ts',
		endpoint: '/api/cron/weekly-digest',
		category: 'marketing'
	},
	{
		id: 'scenario-inspiration',
		name: 'Scenario Inspiration',
		description: 'Bi-weekly scenario suggestions based on user progress',
		schedule: '0 10 * * 2,5', // Tuesday and Friday at 10 AM UTC
		status: 'active',
		templatePath: 'campaigns/scenario-inspiration/inspiration.service.ts',
		servicePath: 'campaigns/scenario-inspiration/inspiration.service.ts',
		endpoint: '/api/cron/scenario-inspiration',
		category: 'engagement'
	},
	{
		id: 'community-stories',
		name: 'Community Stories',
		description: 'Monthly community success stories',
		schedule: '0 9 1 * *', // First day of month at 9 AM UTC
		status: 'active',
		templatePath: 'campaigns/community-stories/story.service.ts',
		servicePath: 'campaigns/community-stories/story.service.ts',
		endpoint: '/api/cron/community-stories',
		category: 'marketing'
	},
	{
		id: 'progress-reports',
		name: 'Progress Reports',
		description: 'Monthly progress reports with achievements',
		schedule: '0 10 1 * *', // First day of month at 10 AM UTC
		status: 'active',
		templatePath: 'campaigns/progress-reports/progress.service.ts',
		servicePath: 'campaigns/progress-reports/progress.service.ts',
		endpoint: '/api/cron/progress-reports',
		category: 'engagement'
	},
	{
		id: 'product-updates',
		name: 'Product Announcements',
		description: 'Manual product update announcements',
		schedule: '', // Manual only
		status: 'manual',
		templatePath: 'campaigns/product-updates/update.service.ts',
		servicePath: 'campaigns/product-updates/update.service.ts',
		endpoint: '/api/cron/product-updates',
		category: 'marketing'
	}
];

/**
 * Get campaign by ID
 */
export function getCampaignById(id: string): EmailCampaign | undefined {
	return EMAIL_CAMPAIGNS.find((c) => c.id === id);
}

/**
 * Get campaigns by category
 */
export function getCampaignsByCategory(category: EmailCampaign['category']): EmailCampaign[] {
	return EMAIL_CAMPAIGNS.filter((c) => c.category === category);
}

/**
 * Get active campaigns
 */
export function getActiveCampaigns(): EmailCampaign[] {
	return EMAIL_CAMPAIGNS.filter((c) => c.status === 'active');
}
