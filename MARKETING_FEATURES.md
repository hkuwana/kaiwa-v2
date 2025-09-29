# Marketing & Email Features

This document outlines the marketing automation and email reminder features implemented for Kaiwa.

## 🎯 Overview

The marketing system includes:

- **Email Reminder System**: Personalized practice reminders with scenario suggestions
- **Marketing Automation**: Content generation for multiple platforms
- **Japanese Phrasing Helper**: Authentic phrases for marketing content
- **Bulk Operations**: Automated email campaigns

## 📧 Email Reminder System

### Features

- **Personalized Recommendations**: Suggests scenarios based on user history
- **Streak Tracking**: Motivates users with streak information
- **Smart Timing**: Sends reminders based on last practice date
- **Direct Links**: One-click access to practice scenarios

### API Endpoints

#### Send Practice Reminder

```http
POST /api/marketing/reminder
Content-Type: application/json

{
  "userId": "user-id"
}
```

#### Send Bulk Reminders

```http
POST /api/marketing/bulk-reminder
```

### Email Template Features

- Responsive design
- Personalized greeting
- Last practice date awareness
- Streak motivation
- Scenario recommendations with direct links
- Japanese phrasing integration

## 🤖 Marketing Automation

### Supported Platforms

- **Reddit**: Founder stories, practical guides, progress updates
- **Instagram**: Scenario demos, motivation posts, tips, behind-the-scenes
- **Twitter/X**: Quick tips, questions, updates, thread starters
- **LinkedIn**: Professional insights, personal stories, industry discussions
- **TikTok**: Video scripts for demos, tips, stories, challenges

### Content Types by Platform

#### Reddit

- `founder-story`: Personal journey and app creation story
- `practical-guide`: How-to content with practical tips
- `progress-update`: User success stories and progress
- `question`: Community engagement posts

#### Instagram

- `scenario-demo`: Visual demonstration of scenarios
- `motivation`: Inspirational content and progress
- `tips`: Quick language learning tips
- `behind-scenes`: Development and personal content

#### Twitter/X

- `quick-tip`: Bite-sized language learning advice
- `question`: Engagement-focused questions
- `update`: Progress and feature updates
- `thread-starter`: Multi-tweet content series

#### LinkedIn

- `professional`: Industry insights and analysis
- `insight`: Technical and business learnings
- `story`: Personal journey and lessons
- `question`: Professional community engagement

#### TikTok

- `scenario-demo`: Video demonstrations
- `quick-tip`: Short educational content
- `story`: Personal narrative content
- `challenge`: Community engagement challenges

### API Endpoints

#### Generate Content

```http
POST /api/marketing/content
Content-Type: application/json

{
  "platform": "reddit",
  "type": "founder-story"
}
```

#### Get Content Types

```http
GET /api/marketing/content?platform=reddit
```

#### Get Japanese Phrases

```http
GET /api/marketing/japanese-phrases
```

## 🇯🇵 Japanese Phrasing Helper

### Features

- **Contextual Phrases**: Real conversation scenarios
- **Formality Levels**: Casual, polite, and formal variations
- **Romaji Support**: Pronunciation assistance
- **Cultural Context**: Appropriate usage guidance

### Sample Phrases

- Meeting the parents
- Apologizing for misunderstandings
- Expressing gratitude
- Asking for patience
- Cultural learning appreciation

## 🛠️ Usage

### Development Interface

Access the marketing automation tools at `/dev/marketing-automation`:

1. **Content Generator**: Select platform and type to generate content
2. **Japanese Phrases**: Browse and copy authentic phrases
3. **Strategy Tips**: Platform-specific best practices

### Automated Reminders

Set up a cron job to send daily reminders:

```bash
# Daily at 9 AM
0 9 * * * cd /path/to/kaiwa && pnpm tsx scripts/send-reminders.ts
```

### Manual Operations

- **Test Reminder**: Send a test reminder to yourself
- **Bulk Reminders**: Send to all eligible users
- **Content Generation**: Create platform-specific content

## 📊 Analytics & Tracking

### Email Metrics

- Reminders sent vs failed
- User engagement rates
- Scenario click-through rates
- Streak maintenance rates

### Marketing Metrics

- Content generation usage
- Platform performance
- Japanese phrase usage
- User feedback and engagement

## 🔧 Configuration

### Environment Variables

```bash
# Required for email functionality
RESEND_API_KEY=re_...

# Optional for enhanced features
PUBLIC_APP_URL=https://kaiwa.fly.dev
```

### Database Requirements

The system uses existing tables:

- `users`: User information and email verification
- `scenario_attempts`: Practice history and recommendations
- `conversation_sessions`: Session tracking and streaks
- `scenarios`: Available practice scenarios

## 🚀 Deployment

### Prerequisites

1. Resend API key configured
2. Database with user and scenario data
3. Email verification system active

### Setup Steps

1. Configure environment variables
2. Run database migrations
3. Test email functionality
4. Set up cron job for automated reminders
5. Access marketing tools at `/dev/marketing-automation`

## 📈 Best Practices

### Email Reminders

- Send during peak engagement hours (9 AM, 6 PM)
- Personalize based on user history
- Include clear call-to-action buttons
- Respect user preferences and frequency

### Marketing Content

- Focus on value-first content
- Use authentic Japanese phrases
- Engage with community genuinely
- Track performance and iterate
- Maintain consistent posting schedule

### Platform-Specific Tips

- **Reddit**: Disclose self-promo, engage genuinely
- **Instagram**: Use stories and reels effectively
- **Twitter**: Respond quickly to engagement
- **LinkedIn**: Share professional insights
- **TikTok**: Create authentic, engaging content

## 🔍 Troubleshooting

### Common Issues

1. **Email not sending**: Check Resend API key and user email verification
2. **Content generation failing**: Verify platform and type parameters
3. **Japanese phrases not loading**: Check API endpoint and authentication
4. **Bulk reminders failing**: Verify user data and email configuration

### Debug Steps

1. Check server logs for error messages
2. Verify database connectivity
3. Test individual API endpoints
4. Check environment variable configuration
5. Validate user authentication

## 📝 Future Enhancements

### Planned Features

- **A/B Testing**: Email template variations
- **Advanced Scheduling**: Timezone-aware reminders
- **Content Calendar**: Visual scheduling interface
- **Analytics Dashboard**: Performance metrics
- **User Segmentation**: Targeted campaigns
- **Multi-language Support**: Beyond Japanese phrases

### Integration Opportunities

- **Social Media APIs**: Direct posting capabilities
- **Analytics Platforms**: Enhanced tracking
- **CRM Integration**: User relationship management
- **Content Management**: Advanced content organization
