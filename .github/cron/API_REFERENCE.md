# Cron API Reference

Complete API reference for all cron endpoints.

## Base URL

```
https://trykaiwa.com/api/cron
```

## Authentication

All requests require Bearer token authentication:

```
Authorization: Bearer {CRON_SECRET}
```

---

## Endpoint: Send Daily Reminders

### Request

```http
GET /send-reminders
Authorization: Bearer {CRON_SECRET}
```

### Query Parameters

| Parameter    | Type    | Description                                                              |
| ------------ | ------- | ------------------------------------------------------------------------ |
| `dryRun`     | boolean | (Optional) Preview emails without sending. Default: false                |
| `testEmails` | string  | (Optional) Comma-separated emails to send to. Overrides normal selection |

### Response

```json
{
	"success": true,
	"stats": {
		"total": 150,
		"sent": 42,
		"skipped": 108,
		"failed": 0,
		"segments": {
			"newUsers": 10,
			"recentActive": 50,
			"slightlyInactive": 25,
			"moderatelyInactive": 35,
			"highlyInactive": 28,
			"dormant": 2
		},
		"dryRun": false,
		"testMode": null,
		"emailsSent": [
			{ "email": "user1@example.com", "segment": "slightlyInactive" },
			{ "email": "user2@example.com", "segment": "moderatelyInactive" }
		]
	}
}
```

### Examples

**Normal run:**

```bash
curl -H "Authorization: Bearer sk_test_abc123" \
  https://trykaiwa.com/api/cron/send-reminders
```

**Dry run (preview):**

```bash
curl -H "Authorization: Bearer sk_test_abc123" \
  "https://trykaiwa.com/api/cron/send-reminders?dryRun=true"
```

**Test with specific emails:**

```bash
curl -H "Authorization: Bearer sk_test_abc123" \
  "https://trykaiwa.com/api/cron/send-reminders?testEmails=hiro@example.com,user2@example.com"
```

### User Segments

- **newUsers**: Signed up but never practiced
- **recentActive**: Practiced in last 24 hours (no reminder sent)
- **slightlyInactive**: Last practice 1-3 days ago
- **moderatelyInactive**: Last practice 3-7 days ago
- **highlyInactive**: Last practice 7-30 days ago
- **dormant**: Last practice 30+ days ago

### Behavior

- Only sends to users with email permissions enabled
- Maximum 1 reminder per user per 24 hours (rate limited)
- Skips recently active users
- Sends admin summary email with results
- 100ms delay between emails to prevent rate limiting

---

## Endpoint: Send Founder Emails

### Request

```http
GET /founder-emails
Authorization: Bearer {CRON_SECRET}
```

### Response

```json
{
	"success": true,
	"stats": {
		"total_eligible": 45,
		"day1_sent": 15,
		"day2_sent": 12,
		"day3_sent": 8,
		"skipped": 10,
		"failed": 0
	},
	"message": "Founder emails sent successfully"
}
```

### Email Sequence

- **Day 1** (after signup): Warm welcome email
- **Day 2** (if no practice): Check-in + offer help
- **Day 3** (if no practice): Personal offer to talk with calendar link

### Behavior

- Only sends to users aged 1-3 days since signup
- Requires email permissions enabled
- Only sends if user hasn't practiced yet
- Maximum 1 email per user per 20 hours
- Stops sending after day 3 (respects inbox)

### Testing with POST

You can also test individual emails:

```bash
curl -X POST -H "Authorization: Bearer {CRON_SECRET}" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id-here"}' \
  https://trykaiwa.com/api/cron/founder-emails
```

Response:

```json
{
	"success": true,
	"emailType": "day1_welcome",
	"daysSinceSignup": 1,
	"sentTo": "user@example.com"
}
```

---

## Endpoint: Send Weekly Digest

### Request

```http
GET /weekly-digest
Authorization: Bearer {CRON_SECRET}
```

### Response

```json
{
	"success": true,
	"sent": 287,
	"skipped": 45,
	"timestamp": "2025-01-20T10:15:30.123Z",
	"message": "Weekly digest emails sent successfully"
}
```

### Content Structure

The endpoint sends emails with these sections:

```json
{
	"updates": [
		{
			"title": "Feature title",
			"summary": "What it does and why it matters",
			"linkLabel": "Call to action",
			"linkUrl": "https://..."
		}
	],
	"productHighlights": [
		{
			"title": "Improvement title",
			"summary": "What improved"
		}
	],
	"upcoming": [
		{
			"title": "Feature coming soon",
			"summary": "What we're building"
		}
	]
}
```

### Configuration

The content is configured directly in the endpoint file:

- [src/routes/api/cron/weekly-digest/+server.ts](../../src/routes/api/cron/weekly-digest/+server.ts)
- Update the `thisWeeksContent` variable before each Monday 10 AM send
- Changes require a new deployment or code update

### Behavior

- Sends to all users with weekly email preference enabled
- Runs every Monday at 10 AM UTC
- Typically followed by Weekly Stats at 11 AM UTC
- No per-user rate limiting (sends once per week maximum by design)

---

## Endpoint: Send Weekly Stats

### Request

```http
GET /weekly-stats
Authorization: Bearer {CRON_SECRET}
```

### Response

```json
{
	"success": true,
	"sent": 312,
	"skipped": 20,
	"errors": 0,
	"timestamp": "2025-01-20T11:15:30.123Z",
	"message": "Weekly stats emails sent successfully"
}
```

### Stats Included

Each user receives personalized stats:

- Total practice minutes this week
- Number of practice sessions
- Days active (out of 7)
- Most practiced language
- Comparison to previous week
- Achievements/milestones

### Behavior

- Sends to all users with weekly email preference enabled
- Personalizes content for each user
- Runs every Monday at 11 AM UTC (after Weekly Digest)
- Only sends if user has practice data to show
- Skips users with no activity in the past week

---

## Error Responses

### 401 Unauthorized

```json
{
	"error": "Unauthorized"
}
```

**Cause:** Missing or invalid Authorization header / CRON_SECRET

**Fix:**

- Verify header format: `Authorization: Bearer {CRON_SECRET}`
- Check CRON_SECRET value in GitHub secrets
- Ensure the secret hasn't changed

### 500 Server Error

```json
{
	"success": false,
	"error": "Failed to send weekly digest",
	"message": "Detailed error message"
}
```

**Common causes:**

- Database connection failed
- Email service (Resend) is down
- Invalid email addresses in database
- Missing required environment variables

**Debug:**

- Check application logs in deployment
- Verify database connectivity
- Check Resend dashboard for service status
- Review email permission configurations

---

## Monitoring

### Success Indicators

- Endpoint returns `"success": true`
- `sent` count is &gt; 0
- `failed` or `errors` count is 0 or low
- Admin receives summary email

### Warning Signs

- High `skipped` count might indicate permission/rate-limiting issues
- `failed` &gt; 0 means some emails weren't sent
- Missing `emailsSent` data suggests selective sending

### Debugging Tips

**Check what would be sent:**

```bash
# Dry run to preview
curl -H "Authorization: Bearer {CRON_SECRET}" \
  "https://trykaiwa.com/api/cron/send-reminders?dryRun=true"
```

**Test with single user:**

```bash
# Only send to specific email
curl -H "Authorization: Bearer {CRON_SECRET}" \
  "https://trykaiwa.com/api/cron/send-reminders?testEmails=test@example.com"
```

**Check logs:**

- GitHub Actions workflow logs for job execution
- Application logs in deployment dashboard
- Resend dashboard for email delivery status

---

## Rate Limits

| Endpoint       | Per User   | Per Job |
| -------------- | ---------- | ------- |
| send-reminders | 1 per 24h  | ~50/sec |
| founder-emails | 1 per 20h  | ~50/sec |
| weekly-digest  | 1 per week | ~50/sec |
| weekly-stats   | 1 per week | ~50/sec |

**Note:** 100ms delay between emails is hardcoded to prevent hitting service rate limits.

---

## Common Tasks

### Update Weekly Digest Content

1. Edit [src/routes/api/cron/weekly-digest/+server.ts](../../src/routes/api/cron/weekly-digest/+server.ts)
2. Update `thisWeeksContent` variable with new content
3. Deploy or wait for auto-deployment
4. Verify with test call before 10 AM Monday

### Test an Endpoint

```bash
# Basic test
curl -H "Authorization: Bearer YOUR_SECRET" \
  https://trykaiwa.com/api/cron/{endpoint}

# With query params
curl -H "Authorization: Bearer YOUR_SECRET" \
  "https://trykaiwa.com/api/cron/{endpoint}?param=value"

# View response with formatting
curl -H "Authorization: Bearer YOUR_SECRET" \
  https://trykaiwa.com/api/cron/{endpoint} | jq
```

### Manually Trigger from GitHub

1. Go to GitHub Actions
2. Select "Scheduled Cron Jobs" workflow
3. Click "Run workflow"
4. Choose which job(s) to run
5. Monitor the run in real-time

---

## Related Documentation

- [Main README](./README.md) - Overview and setup
- [Cron Jobs Workflow](./cron-jobs.yml) - GitHub Actions configuration
- [Email Services](../../src/lib/server/email/) - Service implementations
