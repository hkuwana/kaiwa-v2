# PAB Final 2 Slots - Selective Outreach Strategy

**Context**: You have 2 remaining slots in your Product Advisory Board and want to fill them from existing signups in the next 24 hours.

---

## 🎯 Strategy: Make It Feel Selective (Not Mass Email)

### Key Principles:

1. **Segment your list** - Don't email everyone, email your best matches
2. **Personalize the subject line** - Use their name or situation
3. **Create artificial scarcity** - "Last 2 spots" + 24-hour deadline
4. **Make them feel chosen** - "Based on your signup, I thought you'd be perfect"
5. **Low friction ask** - Just reply to express interest

---

## 📋 Step 1: Who to Email (Segmentation)

### Don't email everyone on your platform. Email only:

**Tier 1 (Email first - 5-10 people):**

- Signed up in last 30 days
- Have completed onboarding or used the app at least once
- Match your ICP personas (Bilingual Spouse or Heritage Speaker)
- Have NOT been invited to PAB yet

**Tier 2 (If Tier 1 doesn't fill slots - another 5-10 people):**

- Signed up more than 30 days ago but recently active
- Engaged with your emails or product in last 2 weeks
- Close ICP match even if not perfect

**DO NOT email:**

- People who already declined PAB
- People who haven't verified email
- People who signed up but never logged in
- People outside your ICP (test takers, casual learners)

---

## 💻 Technical Implementation

### Option A: Manual Email (Recommended for 5-10 people)

**Pros**: Most personal, highest conversion
**Cons**: Takes 30-60 min to send individually
**Best for**: When you have 5-10 strong candidates

**Steps**:

1. Query your database to get email list (see query below)
2. Use your personal email (not automated from platform)
3. Send individually with personalization
4. BCC yourself to track

### Option B: Using Your Platform Email (For larger list)

**Pros**: Faster, can reach more people
**Cons**: Feels less personal, might trigger spam filters
**Best for**: When you have 15-20 candidates

**Steps**:

1. Create a simple admin page to send custom emails
2. Use Resend (you already have it set up)
3. Still personalize with merge tags
4. Send from noreply@trykaiwa.com but reply-to your personal email

---

## 🗄️ Step 2: Get Your Email List

### Database Query (Run in psql or your admin panel):

```sql
-- Get recent, active users who match ICP
SELECT
  email,
  display_name,
  created_at,
  last_usage,
  native_language_id,
  preferred_ui_language_id
FROM users
WHERE
  email_verified IS NOT NULL  -- Only verified users
  AND created_at > NOW() - INTERVAL '60 days'  -- Signed up in last 2 months
  AND last_usage > NOW() - INTERVAL '30 days'  -- Active in last month
  AND id NOT IN (
    -- Exclude existing PAB members (you'll need to track this separately)
    -- For now, manually exclude
  )
ORDER BY last_usage DESC
LIMIT 20;
```

### Export to CSV:

```bash
# Connect to your database
fly postgres connect -a kaiwa-db

# Run query and save
\copy (SELECT email, display_name, created_at FROM users WHERE email_verified IS NOT NULL AND created_at > NOW() - INTERVAL '60 days' ORDER BY last_usage DESC LIMIT 20) TO '/tmp/pab-candidates.csv' CSV HEADER;
```

### Review manually:

- Open CSV
- Look at each person's activity
- Pick your top 5-10 who seem like best ICP matches
- Note any context you have about them (scenarios they tried, languages they're learning)

---

## ✉️ Email Template: "You're One of My Top Picks for PAB"

### Subject Line Options (Pick one):

**Option 1 (Personalized):**
`[Name], I have 2 PAB spots left - interested?`

**Option 2 (Situation-based):**
`[Name], this might be perfect for your [Japanese/Spanish] learning`

**Option 3 (Direct):**
`Quick question about Kaiwa's Product Advisory Board`

**Option 4 (Scarcity):**
`Last 2 PAB spots - you came to mind`

### Email Body:

```
Subject: [Name], I have 2 PAB spots left - interested?

Hi [Name],

Quick reach-out because I'm finalizing Kaiwa's Product Advisory Board and you immediately came to mind.

**Here's the situation:**

I have 10 people already committed, but I have 2 final spots and I want to make sure they go to the right people.

I looked back at your signup [mention specific detail: "and saw you're learning Japanese to connect with family" or "and noticed you completed the onboarding scenario"] and thought this might be perfect for you.

**What PAB members get:**

✅ Free unlimited access to Kaiwa (while in PAB)
✅ Monthly 1-hour video meetings with me + other members
✅ Direct influence on what features we build
✅ Early access to everything
✅ A community of people with similar language learning goals

**Time commitment:**
- 1 hour/month for meetings
- Light async feedback as you use the app

**The catch:**
I need to finalize the roster in the next 24 hours so we can kick off next week.

**Interested?**
Just reply "I'm in" and I'll send the details.

If it's not the right time, totally understand - just let me know and I'll keep you in the loop for future opportunities.

Thanks,
[Your name]
Kaiwa Founder

P.S. Even if PAB isn't for you right now, I'd love to hear how your language learning is going. Reply and let me know!
```

---

## 🎯 Alternative Version: More Casual/Friendly

### For people you've interacted with before:

```
Subject: Hey [Name] - got a sec for a Kaiwa thing?

Hey [Name],

Hope your [language] learning is going well!

Random question: I'm wrapping up invites for Kaiwa's Product Advisory Board and have 2 spots left.

Basically, it's a small group (12 people total) who get:
- Free access
- Monthly meetings where we shape what gets built
- Early access to new stuff
- A community of other learners

I remembered you [specific detail about them] and thought you might be a good fit.

It's ~1 hour/month commitment for meetings, plus light feedback as you use the app.

We're kicking off next week, so I need to lock in the final roster in the next 24 hours.

Interested? Just reply and I'll send details.

No worries if not - I know timing doesn't always work out!

[Your name]

P.S. Regardless of PAB, how's your experience with Kaiwa been so far? Always curious to hear.
```

---

## ⏰ Timing Strategy for 24-Hour Urgency

### Send Schedule:

**Today (T+0 hours):**

- 9-10am: Send to Tier 1 candidates (5-10 people)
- Subject: "Last 2 PAB spots - you came to mind"
- Deadline: "Need to know by tomorrow 10am"

**Today Evening (T+8 hours):**

- 6-7pm: If no responses, send gentle nudge to non-responders
- Subject: "Re: PAB spots"
- Body: "Just bumping this - finalizing tomorrow morning. LMK if interested!"

**Tomorrow Morning (T+24 hours):**

- 10am: Deadline hits
- If you got 2+ interested: Pick your top 2, send acceptance emails
- If you got 0-1 interested: Send to Tier 2 candidates, extend deadline 24 hours

---

## 🎨 Why This Works Psychologically

### 1. **Feels Selective**

- "You came to mind" = I specifically thought of you
- Not "I'm emailing everyone on my list"
- Specific detail about them = I remember you

### 2. **Creates Urgency**

- 24-hour deadline = need to decide now
- "Finalizing roster" = train is leaving
- "2 spots left" = scarcity

### 3. **Low Friction**

- Just reply "I'm in" = super easy
- Not "fill out this form" or "schedule a call first"
- Can ask questions before committing

### 4. **Value is Clear**

- Free access (normally $19-29/mo)
- Influence on product
- Community

### 5. **No Pressure Exit**

- "Totally understand if not" = not pushy
- "Keep you in the loop" = relationship maintained
- P.S. asks about their experience = genuine interest

---

## 📧 Sample Follow-Up After They Reply

### If they say "I'm in":

```
Subject: Re: PAB spots

Amazing! You're in 🎉

Here are your first 3 tasks to get started:

1️⃣ **Fill out this quick poll** (2 min, due tomorrow):
[Calendly link for first meeting]

2️⃣ **Join our PAB group**:
[Slack/Discord/WhatsApp link]

3️⃣ **Try your first scenario** (this week):
[Beta access link]
Login: [credentials]

I'll send more details in the PAB group, but wanted to get you the links ASAP.

Welcome to the team!

[Your name]
```

### If they say "Not right now":

```
Subject: Re: PAB spots

Totally understand - thanks for letting me know!

I'll keep you on the early access list and reach out when we officially launch.

In the meantime, if anything changes or you have feedback on Kaiwa, just reply - I'm always around.

[Your name]
```

---

## 🚀 Quick Start Checklist

### Tonight (30 min):

- [ ] Query database for candidate emails (use query above)
- [ ] Export to CSV
- [ ] Review list, pick top 5-10 Tier 1 candidates
- [ ] Note any personalization details for each

### Tomorrow Morning (60 min):

- [ ] Customize email template for each person (5 min each)
- [ ] Send emails individually from your personal email
- [ ] Set reminder for evening follow-up
- [ ] Set deadline for 24 hours from now

### Tomorrow Evening (15 min):

- [ ] Check responses
- [ ] Send gentle nudge to non-responders if needed

### Day 3 Morning (30 min):

- [ ] Close at deadline
- [ ] Accept top 2 respondents
- [ ] Send welcome emails with 3 tasks
- [ ] Add to PAB group

---

## 💡 Pro Tips

### 1. **Send from your personal email, not automated**

- Use your @gmail.com or whatever you normally use
- Feel like a personal note, not marketing automation
- Include your signature

### 2. **Personalize every single email**

- Mention specific detail about them
- Reference their language or goal
- Show you remember them

### 3. **Use your personal voice**

- Write like you're texting a friend
- No marketing jargon
- Be human

### 4. **Track in a simple spreadsheet**

- Name | Email | Sent Date | Response | Status
- Mark as "Interested" / "Declined" / "No Response"

### 5. **Don't oversell**

- They already signed up for your product
- You're offering an exclusive opportunity
- Let the value speak for itself

---

## 🎯 Expected Results

### Realistic Conversion Rates:

**Tier 1 candidates (5-10 emails):**

- 40-60% open rate (they already know you)
- 20-40% response rate (engaged users)
- 10-30% acceptance rate (1-3 people say yes)

**Translation:**

- Email 5-10 people → 2-4 respond → 1-2 accept
- **You need to email ~10 people to fill 2 spots**

### If you're not hitting these numbers:

- Your list isn't targeted enough (too many cold signups)
- Not enough personalization
- Value isn't clear
- Timing is off (weekend, late night, etc.)

---

## 🆘 Troubleshooting

### "What if NO ONE responds in 24 hours?"

**Option 1: Extend deadline**

- Send to Tier 2 candidates
- Give another 24 hours
- Mention "Extended deadline due to scheduling"

**Option 2: Lower the barrier**

- Change from "monthly meetings" to "quarterly"
- Offer "Pilot Program" instead of "Core PAB"
- Make time commitment lighter

**Option 3: Reassess**

- Maybe you don't need 12 people
- 10 engaged members > 12 lukewarm members
- Quality over quantity

### "What if MORE than 2 people say yes?"

**Good problem to have!**

**Option 1: Accept the best 2**

- Based on ICP alignment, urgency, diversity
- Offer others "USJC Pilot" or "Next Cohort"

**Option 2: Expand to 13-14 people**

- If they're all strong candidates, take them
- Better to have backups in case of dropouts

**Option 3: Create waitlist**

- "All spots filled, but I'll add you to priority list for next cohort"

---

## 📝 Copy-Paste Summary

### Your action plan for tonight:

1. **Run this query** to get candidates:

```sql
SELECT email, display_name, created_at
FROM users
WHERE email_verified IS NOT NULL
  AND created_at > NOW() - INTERVAL '60 days'
ORDER BY last_usage DESC
LIMIT 20;
```

2. **Pick top 5-10** who match ICP best

3. **Customize this email** for each:

```
Subject: [Name], I have 2 PAB spots left - interested?

Hi [Name],

I'm finalizing Kaiwa's Product Advisory Board and you came to mind.

I have 10 people committed, but 2 final spots. Saw you [specific detail] and thought this might be perfect.

PAB members get:
✅ Free unlimited access
✅ Monthly meetings with me + others
✅ Direct influence on features
✅ Early access to everything

~1 hour/month commitment.

Need to finalize in 24 hours.

Interested? Reply "I'm in" and I'll send details.

No worries if not!

[Your name]

P.S. How's your [language] learning going?
```

4. **Send individually** from your personal email tomorrow morning

5. **Follow up** tomorrow evening if no responses

6. **Close deadline** and accept top 2

---

**Total time investment**: 2-3 hours spread over 2 days
**Expected result**: 2 new PAB members in 48 hours
**Success rate**: 80%+ if you email 10 targeted candidates

Good luck! 🚀
