# Kaiwa 30-Day Validation Roadmap

**Timeline:** October 7 - November 6, 2025
**Goal:** Validate ONE specific use case with evidence-based decision making
**Success Criteria:** 3+ users with 3+ sessions each, or pivot with clarity

---

## Guiding Principles

1. **Validation Over Scaling:** Prove demand before optimizing distribution
2. **One Thing Done Well:** Better than ten things half-built
3. **Evidence-Based Decisions:** Data or user quotes, not founder intuition
4. **Honesty Over Optimism:** Call out unproven assumptions
5. **30-Day Cycles:** Ship, measure, decide. No 6-month roadmaps

---

## Week 0: Foundation Fix (Oct 7-9, 3 days)

**Goal:** Remove unfounded claims, fix credibility issues, prepare for interviews

### Day 1 (Oct 7): Credibility Cleanup

**Priority 1: Remove Fake Social Proof**

File: `src/routes/+page.svelte`

**Remove (lines 354-365):**

```svelte
<div class="text-2xl font-bold text-primary md:text-3xl">95%</div>
<div class="text-xs opacity-70 md:text-sm">Report Improved Confidence</div>
```

**Replace with honest early adopter messaging:**

```svelte
<section class="py-8 text-center md:py-12">
 <div class="container mx-auto max-w-4xl">
  <h3 class="mb-6 text-xl font-semibold">Early Access</h3>
  <p class="mb-4 text-base opacity-90">
   We're working with the first 100 users to build conversation scenarios that actually matter.
  </p>
  <div class="grid gap-4 md:grid-cols-2">
   <div class="rounded-lg bg-base-200 p-6">
    <div class="mb-2 text-3xl">🎯</div>
    <div class="font-semibold">Honest Feedback Welcome</div>
    <div class="mt-2 text-sm opacity-80">
     Tell us what works and what doesn't. We're building this with you, not for you.
    </div>
   </div>
   <div class="rounded-lg bg-base-200 p-6">
    <div class="mb-2 text-3xl">💬</div>
    <div class="font-semibold">Focus: Cross-Language Relationships</div>
    <div class="mt-2 text-sm opacity-80">
     Especially if you're preparing to talk with your partner's family in their language.
    </div>
   </div>
  </div>
 </div>
</section>
```

**Estimated Time:** 1 hour
**Deploy:** Immediately after testing

---

**Priority 2: Add Exit Survey**

File: `src/lib/features/conversation/components/ConversationReviewableState.svelte`

**Add modal component:**

```svelte
<script lang="ts">
 let showExitSurvey = $state(false);
 let exitReason = $state('');
 let exitComment = $state('');

 function handleSessionEnd() {
  if (!conversationStore.completedSuccessfully) {
   showExitSurvey = true;
  }
 }

 async function submitExitSurvey() {
  await fetch('/api/feedback/exit-survey', {
   method: 'POST',
   headers: { 'Content-Type': 'application/json' },
   body: JSON.stringify({
    sessionId: conversationStore.sessionId,
    reason: exitReason,
    comment: exitComment,
    timestamp: new Date().toISOString()
   })
  });
  showExitSurvey = false;
 }
</script>

{#if showExitSurvey}
 <dialog class="modal-open modal">
  <div class="modal-box">
   <h3 class="mb-4 text-lg font-bold">Quick Question Before You Go</h3>
   <p class="mb-4">What conversation were you hoping to practice?</p>

   <div class="mb-4 space-y-2">
    <label class="flex cursor-pointer items-center gap-2">
     <input
      type="radio"
      name="reason"
      value="partner_family"
      bind:group={exitReason}
      class="radio"
     />
     <span>Meeting my partner's family</span>
    </label>
    <label class="flex cursor-pointer items-center gap-2">
     <input
      type="radio"
      name="reason"
      value="heritage"
      bind:group={exitReason}
      class="radio"
     />
     <span>Talking with heritage relatives</span>
    </label>
    <label class="flex cursor-pointer items-center gap-2">
     <input type="radio" name="reason" value="travel" bind:group={exitReason} class="radio" />
     <span>Travel/survival conversations</span>
    </label>
    <label class="flex cursor-pointer items-center gap-2">
     <input
      type="radio"
      name="reason"
      value="business"
      bind:group={exitReason}
      class="radio"
     />
     <span>Business/work scenarios</span>
    </label>
    <label class="flex cursor-pointer items-center gap-2">
     <input type="radio" name="reason" value="general" bind:group={exitReason} class="radio" />
     <span>General practice</span>
    </label>
    <label class="flex cursor-pointer items-center gap-2">
     <input type="radio" name="reason" value="other" bind:group={exitReason} class="radio" />
     <span>Something else</span>
    </label>
   </div>

   <textarea
    class="textarea-bordered textarea mb-4 w-full"
    placeholder="Anything else we should know? (optional)"
    bind:value={exitComment}
   ></textarea>

   <div class="modal-action">
    <button class="btn btn-ghost" onclick={() => (showExitSurvey = false)}>Skip</button>
    <button class="btn btn-primary" onclick={submitExitSurvey} disabled={!exitReason}>
     Submit
    </button>
   </div>
  </div>
 </dialog>
{/if}
```

**Backend endpoint:** `src/routes/api/feedback/exit-survey/+server.ts`

```typescript
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { analyticsEvents } from '$lib/server/db/schema';

export const POST: RequestHandler = async ({ request, locals }) => {
 const { sessionId, reason, comment, timestamp } = await request.json();

 await db.insert(analyticsEvents).values({
  userId: locals.user?.id,
  sessionId,
  eventName: 'exit_survey_submitted',
  properties: { reason, comment },
  createdAt: new Date(timestamp)
 });

 return json({ success: true });
};
```

**Estimated Time:** 2 hours
**Deploy:** After testing, immediately

---

### Day 2 (Oct 8): Interview Preparation

**Tasks:**

1. ✅ Pull list of 5 users from database
2. ✅ Draft outreach emails (use template from `user-interview-template.md`)
3. ✅ Set up calendly/scheduling link
4. ✅ Prepare $50 gift cards (Amazon)
5. ✅ Create Google Doc for interview notes

**Deliverable:** 5 interviews scheduled for Week 1

---

### Day 3 (Oct 9): Dogfood Your Product

**Goal:** Use Kaiwa yourself intensively to find what's broken

**Tasks:**

1. **Morning:** Complete "Meet the Parents (Japanese)" scenario
   - Time it. Is it actually 3 minutes?
   - Note any awkward AI responses
   - Check if cultural tips are accurate

2. **Afternoon:** Test 5 different scenarios
   - Onboarding
   - Coffee Planning
   - Conflict Resolution
   - Job Interview
   - Izakaya Ordering

3. **Evening:** Get your girlfriend to test
   - Ask her to try learning Japanese for YOUR family
   - Observe where she gets stuck
   - Would she use this without you asking?

**Deliverable:** Google Doc with "Dogfooding Notes" - brutally honest assessment

**Check OpenAI Costs:**

```bash
# Check today's API usage
curl https://api.openai.com/v1/usage \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Content-Type: application/json"
```

Calculate: Cost per session, projected monthly burn at 100 users

---

## Week 1: Truth-Seeking (Oct 10-16)

**Goal:** Understand why 5 users isn't 50. Validate or invalidate core assumptions.

### Oct 10-14: Conduct 5 User Interviews

**Schedule:**

- Monday: Users 1-2
- Tuesday: User 3
- Wednesday: User 4
- Thursday: User 5
- Friday: Synthesis

**During Each Interview:**

1. Use script from `user-interview-template.md`
2. Record (with permission) and transcribe
3. Take real-time notes in Google Doc
4. Immediately after: Write 1-sentence summary

**Questions to Answer:**

- Did 3+ users share the same use case?
- Did anyone have a "holy shit" moment?
- Would anyone be upset if Kaiwa disappeared?
- What's the biggest reason people didn't return?

**Deliverable:** `docs/user-research-oct-2025.md` by Oct 14 EOD

---

### Oct 15-16: Analysis & Decision

**Friday (Oct 15): Interview Synthesis**

Create synthesis document with:

1. **Use Case Breakdown**

   ```
   Partner's family: 3 users (60%)
   Heritage learning: 1 user (20%)
   General curiosity: 1 user (20%)
   ```

2. **Drop-off Funnel**

   ```
   Signed up:        5 users (100%)
   Started session:  ? users (?%)
   Completed session: ? users (?%)
   Returned Day 2:   ? users (?%)
   Would pay:        ? users (?%)
   ```

3. **Key Insights (Top 5)**
   - What surprised you?
   - What validated assumptions?
   - What contradicted beliefs?

4. **Competitive Position**
   - How does Kaiwa stack up vs. ChatGPT Voice?
   - Why would someone choose Kaiwa?

**Saturday (Oct 16): Go/No-Go Decision**

Based on interviews, choose ONE path:

#### **PATH A: Beachhead Found (3+ users, same ICP, high motivation)**

**Signal:** 3+ users preparing for partner's family, all found scenarios useful, would pay $10/mo

**Next Action:** Proceed to Week 2-4 roadmap (double down on this ICP)

#### **PATH B: Super User Found (1 user loves it, others lukewarm)**

**Signal:** 1 user has used 5+ times, would pay $20/mo, told friends

**Next Action:** Spend Week 2 finding 10 more people like that super user

#### **PATH C: No Signal (Low engagement, no clear use case, won't pay)**

**Signal:** Users tried once out of curiosity, prefer ChatGPT Voice, wouldn't pay

**Next Action:** Pivot decision

- Interview 20 MORE people BEFORE building anything
- Or: Gracefully sunset and apply learnings elsewhere

---

## Week 2: Hypothesis Testing (Oct 17-23)

**Assumption:** You found a beachhead in Week 1 (PATH A or B). If not, pause here and interview 20 more people.

**Goal:** Build ONE scenario exceptionally well, test with 10 new users

### Oct 17-19: Build the Perfect Scenario

Based on Week 1 insights, choose THE scenario:

**Example: "First Dinner with Partner's Family"**

**Tasks:**

1. Create 5 difficulty variations:
   - Level 1: Meeting for first time, basic greetings
   - Level 2: Small talk over meal, answering questions about yourself
   - Level 3: Discussing relationship intentions, handling cultural differences
   - Level 4: Offering help, complimenting host, handling language gaps
   - Level 5: Complex family dynamics, managing expectations

2. Add cultural context:
   - Gift-giving etiquette (per language)
   - Formality levels (Japanese keigo, Spanish usted/tú)
   - Common conversational topics
   - Topics to avoid

3. Personalization prompts:
   - "What's your partner's name?"
   - "How long have you been together?"
   - "What's a hobby you can talk about?"
   - "What dish are they likely to serve?"

4. Success page with share CTA:

   ```svelte
   <div class="success-modal">
    <h2>Great Practice!</h2>
    <p>You've practiced this scenario {count} times.</p>
    <p>Ready for the real thing? Share your progress:</p>
    <button>"Send to [Partner Name]"</button>
    <button>"Share on WhatsApp"</button>
   </div>
   ```

**Estimated Time:** 3 days (20-30 hours)

**Code Changes:**

- File: `src/lib/data/scenarios.ts` - Add 5 new scenario variations
- File: `src/lib/services/instructions.service.ts` - Add personalization logic
- File: `src/lib/features/scenarios/components/ScenarioSuccess.svelte` - New component

---

### Oct 20-22: Distribution Experiment

**Goal:** Get 10 new people to try your perfect scenario

**Channel 1: Reddit (Founder Story) - Oct 20**

**Subreddits:**

- r/languagelearning (2.3M members)
- r/JapaneseLanguage (150K members, if Japanese is your focus)
- r/Spanish (130K members, if Spanish)
- r/relationships (9M members - risky but high upside)

**Post Title:**

> "I built an AI partner to practice conversations with my girlfriend's family in [Language]. Here's what I learned."

**Post Body (350-500 words):**

```
For the past year, I've been dreading this moment: meeting my girlfriend's Japanese parents.

I've been "learning Japanese" for 3 years. I can read hiragana, know 500 kanji, passed JLPT N4. But when it came time to actually *talk* — to introduce myself, to answer questions about my job, to compliment her mom's cooking without sounding like a textbook — I froze.

Duolingo taught me "the apple is red." HelloTalk connected me with people, but I was too anxious to message. ChatGPT conversations felt aimless. I needed to practice THE conversation that mattered: first dinner with her family.

So I built Kaiwa. It's an AI conversation partner focused on one thing: practicing high-stakes scenarios before they happen.

**What I learned building this:**

1. **Most language learners have ONE specific conversation they're scared of**
   - Meeting in-laws
   - First day at international job
   - Ordering food at wedding (true story from user)

2. **The anxiety isn't about grammar—it's about getting the *vibe* right**
   - Using formal vs. casual speech
   - Knowing what topics are safe
   - Cultural context (gift-giving, when to offer help, etc.)

3. **Practice with AI ≠ replacement for real humans**
   - It's like rehearsal before a play
   - Low-stakes reps to build confidence
   - You still need the real conversation

**What Kaiwa does:**
- Voice conversations in 8 languages
- Scenarios like "First Dinner with In-Laws," "Business Meeting," "Market Haggling"
- Cultural tips embedded (e.g., Japanese keigo, Spanish formality)
- Free to try, no signup needed: [link]

**What Kaiwa doesn't do:**
- Replace language classes
- Teach grammar from scratch
- Match you with human tutors

I'm sharing this because I want honest feedback. Does this solve a real problem? Or am I building something only I wanted?

If you've ever been anxious about a specific conversation in another language, I'd love to hear your story in the comments.

---

**Demo:** [30-second screen recording showing one scenario]

**Try it:** [trykaiwa.com/?ref=reddit_founder_story]

(Disclosure: I'm the founder. This is self-promo, but I genuinely want to know if this is useful to you.)
```

**Expected Response:**

- 50-200 upvotes (organic, value-first post)
- 10-30 comments
- 5-15 trial signups

**Measure:**

- UTM tracking: `?utm_source=reddit&utm_medium=founder_story&utm_campaign=oct_validation`
- PostHog event: `reddit_founder_story_visit`

---

**Channel 2: Personal Outreach - Oct 21-22**

**Goal:** 1-to-1 messages to people in your network

**Target List (20 people):**

- Friends in cross-language relationships
- People you know learning Japanese/Spanish
- Expat friends
- Former coworkers who mentioned language learning

**Message Template:**

```
Hey [Name],

I remember you mentioning you were learning [Language]. I'm building something and would love your feedback (no pressure to like it, I need honesty).

It's called Kaiwa — lets you practice specific conversations before they happen (like "meeting partner's family" or "job interview in [Language]").

Would you try it for 3 minutes and tell me if it's useful or pointless?

[Link with tracking: trykaiwa.com/?ref=hiro_outreach]

Thanks,
Hiro

P.S. If it's not useful, even better — tell me why so I can fix it or kill it.
```

**Measure:**

- Track who clicks, who signs up, who completes session
- Follow up with phone call if they try it

---

### Oct 23: Analyze Week 2 Data

**Metrics to Check:**

```
Reddit Post:
├─ Upvotes: ?
├─ Comments: ?
├─ Clicks: ?
└─ Signups: ?

Personal Outreach:
├─ Messages sent: 20
├─ Responses: ?
├─ Tried product: ?
└─ Completed session: ?

Overall Week 2:
├─ New users: ?
├─ Sessions completed: ?
├─ Avg session length: ?
├─ Cost per session: $?
```

**Decision Point:**

- If 5+ new users completed session → Continue to Week 3
- If 0-2 new users completed → Pause, interview 10 more prospects BEFORE building

---

## Week 3: Dogfooding & Iteration (Oct 24-30)

**Goal:** Use Kaiwa yourself daily, get girlfriend + 3 friends to test, polish based on feedback

### Oct 24-26: Personal Challenge

**Your Commitment:**

> "I will use Kaiwa every day this week to prepare for my girlfriend's family dinner."

**Daily Log:**

```
Day 1 (Oct 24):
- Scenario: First Meeting (Level 1)
- Duration: ? minutes
- Cost: $?
- Did it help? What was missing?

Day 2 (Oct 25):
- Scenario: Family Dinner Small Talk (Level 2)
- Duration: ? minutes
- Cost: $?
- Observations:

Day 3 (Oct 26):
- Scenario: Discussing Relationship (Level 3)
- Duration: ? minutes
- Cost: $?
- Breakthrough or frustration?
```

**Hypothesis to Test:**

- Does practicing 3x in a row build confidence?
- Do you notice improvement in fluency?
- Would you use this even if you didn't build it?

**Key Question:**

> If this doesn't help YOU prep for your girlfriend's family, why would it help anyone else?

---

### Oct 27-29: Friends & Family Testing

**Goal:** Get 3 people close to you to complete full scenario

**Recruits:**

1. **Your girlfriend** (learning Japanese for your family)
2. **Friend in cross-language relationship**
3. **Expat friend** (preparing for work conversations)

**Test Protocol:**

1. Send them link with specific scenario
2. Ask them to screen record (with permission)
3. Don't help them — observe where they get stuck
4. 30-min follow-up interview after they try

**Questions:**

- What was confusing?
- What felt natural?
- Would you use this again?
- What's missing?

**Deliverable:** Notes doc with quotes and observations

---

### Oct 30: Feature Polish

Based on Week 3 feedback, make 3 quick improvements:

**Example Improvements:**

1. Add "pronunciation hint" button for tricky phrases
2. Improve AI response naturalness (adjust temperature/prompts)
3. Add progress indicator: "You've practiced this scenario 3 times"

**Code Sprint:** 1 day, ship EOD

---

## Week 4: Decision Point (Oct 31 - Nov 6)

**Goal:** Decide whether to scale this scenario or pivot

### Oct 31 - Nov 2: Success Criteria Check

**After 30 days, evaluate these metrics:**

#### Engagement Metrics

```
Total Users (excluding founder): ?
├─ Week 1 (interviews): 5
├─ Week 2 (Reddit + outreach): ?
├─ Week 3 (friends/family): 3
└─ Week 4 (organic): ?

Sessions Completed: ?
├─ One-time users: ?
├─ 2-3 sessions: ?
└─ 4+ sessions: ? ← Key metric

Return Rate:
├─ D1 return: ?%
├─ D7 return: ?%
└─ D30 return: ?%
```

#### Qualitative Signals

```
"Holy Shit" Moments: ? (quotes from users)
Would Pay: ? users
Told a Friend: ? users
Upset if disappeared: ? users
```

#### Unit Economics

```
Avg session length: ? minutes
Cost per session: $?
Monthly burn at 100 users: $?
Revenue needed to break even: $?
```

---

### Nov 3-4: The Honest Assessment

**Schedule:** 2-hour session with yourself (and co-founder if applicable)

**Questions to Answer:**

#### 1. **Do we have a beachhead?**

- [ ] 3+ users with same use case? Yes / No
- [ ] High motivation (7+ out of 10)? Yes / No
- [ ] Would pay $10/mo? Yes / No

**If 3 YES:** You have a beachhead. Proceed to "Scale Plan."

**If 1-2 YES:** Weak signal. Interview 10 MORE people in that segment.

**If 0 YES:** No PMF yet. Proceed to "Pivot Decision."

---

#### 2. **What did we learn about our users?**

Fill out this profile:

**Beachhead User Profile:**

- **Age:** ?
- **Life Stage:** ? (e.g., 25-35, in serious relationship)
- **Use Case:** ? (e.g., preparing to meet partner's family)
- **Pain Severity:** ? (1-10, how urgent is this?)
- **Current Alternatives:** ? (What do they use now?)
- **Willingness to Pay:** $?
- **Discovery Channel:** ? (How did they find us?)

**If you can't fill this out clearly, you don't have a beachhead yet.**

---

#### 3. **Is the solution differentiated enough?**

Compare Kaiwa vs. ChatGPT Voice:

| Feature          | Kaiwa         | ChatGPT Voice    | Winner  |
| ---------------- | ------------- | ---------------- | ------- |
| Scenario Library | 30+ pre-built | User must prompt | ?       |
| Cultural Context | Embedded      | Generic          | ?       |
| Personalization  | User inputs   | None             | ?       |
| Voice Quality    | OpenAI        | Same (OpenAI)    | Tie     |
| Price            | $10/mo        | $20/mo           | Kaiwa   |
| Flexibility      | Structured    | Open-ended       | ChatGPT |

**Honest Answer:** Is Kaiwa clearly better for ONE specific job?

- If **YES:** What is that job? (Write it in one sentence.)
- If **NO:** Why would anyone pay for Kaiwa?

---

### Nov 5-6: Decision Day

Based on the assessment, make ONE of three choices:

---

## PATH 1: SCALE (Found PMF Signal)

**Criteria:**

- 3+ users with 3+ sessions each
- Same use case (e.g., partner's family)
- Would pay $10/mo
- Told friends about it

**Next 90 Days (Nov 7 - Feb 7):**

### Month 2: Build the Habit Loop

1. **Retention Features:**
   - Email reminder: "You haven't practiced in 3 days"
   - Streak tracking: "5-day practice streak!"
   - Progress visualization: "You've improved X phrases"

2. **Expand Scenario Depth:**
   - 10 variations of beachhead scenario
   - Difficulty progression (beginner → advanced)
   - Personalization engine (user context memory)

3. **Distribution:**
   - Launch paid ads ($300/week) targeting exact ICP
   - Create 12 short videos (TikTok/Instagram) showing scenarios
   - Guest post on r/languagelearning (value-first content)

**Goal:** 50 total users, 10 paying customers by Month 2 end

---

### Month 3: Monetize Early Adopters

1. **Pricing Experiment:**
   - Launch "Early Backer" tier: $5/mo for first 100 users
   - A/B test pricing page: $10 vs. $15 vs. $20
   - Implement usage limits on free tier

2. **Referral Loop:**
   - "Give 1 month free, get 1 month free"
   - Track viral coefficient: Each user brings ? new users

3. **Content Marketing:**
   - Weekly blog post targeting ICP keywords
   - SEO for "how to meet partner's parents in [Language]"
   - YouTube: Founder story + scenario walkthroughs

**Goal:** $500 MRR, 20 paying customers by Month 3 end

---

### Month 4: Validate Repeatability

- Can you acquire customers at predictable CAC?
- Do they stay for 3+ months? (LTV:CAC > 3)
- Are they referring friends?

**If YES:** You have a business. Raise pre-seed, hire.

**If NO:** Revisit pricing or ICP.

---

## PATH 2: PIVOT (No Clear PMF)

**Criteria:**

- No use case with 3+ users
- Low engagement (users don't return)
- Won't pay ("ChatGPT Voice is better")

**Next Steps:**

### Option A: Find Different ICP

"The tech works, but we're targeting the wrong people."

**Actions:**

1. Interview 20 people in DIFFERENT segment
   - Example: Business professionals need role-play practice
   - Example: Heritage learners want family connection
   - Example: Travelers need survival phrases

2. Test with 3 different landing pages (1 per ICP)
3. 2-week experiment to see which converts

**Commit:** If none work after 60 days, move to Option B or C

---

### Option B: Rebuild Around Super User

"One person LOVES this. Find 10 more like them."

**Actions:**

1. Interview super user for 2 hours
   - What's different about them?
   - What job is Kaiwa doing?
   - Where do people like them hang out?

2. Build hyper-specific landing page for that profile
3. Find 10 more people in that niche

**Example:**

> "Super user is 2nd-gen Japanese American reconnecting with heritage. They use Kaiwa to practice with grandparents."

**Action:** Target 2nd-gen communities, build grandparent-specific scenarios.

---

### Option C: Graceful Sunset

"This isn't the right problem to solve."

**Accept These Truths:**

- 5 users after 6 months = no demand
- ChatGPT Voice is good enough for most use cases
- People prefer practicing with real humans

**What You Learned:**

1. OpenAI Realtime API implementation
2. SvelteKit + Drizzle production app
3. PMF validation process
4. User interview skills

**What's Next:**

- Apply learnings to a new problem
- Join a startup with traction
- Take a break, reflect, try again

**This is not failure. This is validated learning.**

---

## PATH 3: PERSIST (Weak Signal, Need More Data)

**Criteria:**

- 1-2 users engaged, but not enough data
- Some value, but unclear if it's repeatable
- Mixed feedback, no clear pattern

**Next Steps:**

### Action: Interview 20 More People (30-day sprint)

**Goal:** Find 3 people who would be upset if Kaiwa disappeared

**Plan:**

1. Post in 5 niche communities per week
   - r/JapaneseLanguage (if JP focus)
   - Cross-language relationship Facebook groups
   - Discord servers for language learners
   - Expat forums

2. Test 3 different positioning messages:
   - **Version A:** "Practice before high-stakes conversations"
   - **Version B:** "AI conversation partner for language anxiety"
   - **Version C:** "Scenario library for real-world language use"

3. Track which message resonates

**Decision Point (30 days):**

- If you find 3 users with strong signal → Move to PATH 1 (Scale)
- If you find 0 users with strong signal → Move to PATH 2 (Pivot)

---

## Weekly Rituals (All 4 Weeks)

### Monday Morning: Weekly Planning

- Review last week's metrics
- Set 3 goals for this week
- Update roadmap if needed

### Wednesday: User Check-in

- Email or DM 5 users
- Ask: "How's it going? Using Kaiwa this week?"
- Capture qualitative feedback

### Friday Afternoon: Reflection

- What did we learn this week?
- What surprised us?
- What should we change next week?

### Sunday Evening: Founder Journal

- Honest assessment: Are we making progress?
- Energy check: Am I still excited about this?
- Pivot signals: Am I ignoring evidence?

---

## Metrics Dashboard (Track Daily)

### Core Metrics

```
Users:
├─ Total signups: ?
├─ Active (7-day): ?
└─ Retained (30-day): ?

Engagement:
├─ Sessions today: ?
├─ Avg session length: ?
└─ Completion rate: ?%

Conversion:
├─ Free → Trial: ?%
├─ Trial → Paid: ?%
└─ MRR: $?

Word-of-Mouth:
├─ Shares: ?
├─ Referrals: ?
└─ Organic signups: ?
```

**Where to Track:**

- PostHog dashboard (daily login)
- Google Sheet (manual updates)
- Stripe dashboard (revenue)

**Red Flag:** If you're not checking these daily, you don't care enough.

---

## Cost Budget (30 Days)

```
OpenAI API: $? (depends on usage)
Stripe: $0 (no revenue yet)
Hosting (Fly.io): ~$20/month
PostHog: Free tier
Tools: $0
Ads (Week 2): $300
Gift cards (interviews): $250

Total: ~$570 for 30 days
```

**Burn Rate:** ~$19/day

**Runway at Current Pace:** Check personal finances. Can you afford 6 months of this?

---

## Success Criteria (30-Day Outcomes)

### **GREEN LIGHT: Continue Building (Found PMF Signal)**

- ✅ 3+ users with 3+ sessions each
- ✅ Same use case identified (beachhead)
- ✅ Would pay $10/mo
- ✅ At least 1 user told a friend
- ✅ Unit economics look reasonable (~$1 per session)

**Action:** Execute Month 2-4 plan (Habit Loop → Monetize → Scale)

---

### **YELLOW LIGHT: Pivot or Persist (Weak Signal)**

- ⚠️ 1-2 engaged users, but not enough data
- ⚠️ Some value, but unclear if repeatable
- ⚠️ Willing to experiment for 60 more days

**Action:** Interview 20 more people, test different ICPs

---

### **RED LIGHT: Sunset or Major Pivot (No PMF)**

- ❌ No users with 3+ sessions
- ❌ No clear use case
- ❌ Won't pay ("ChatGPT Voice is better")
- ❌ Founder losing conviction

**Action:** Graceful shutdown or complete pivot (different market/product)

---

## Appendix A: Code Changes Summary

### Week 0: Foundation

- Remove fake social proof from homepage
- Add exit survey modal
- Add backend endpoint for feedback
- Deploy immediately

### Week 2: Perfect Scenario

- Create 5 difficulty variations of beachhead scenario
- Add personalization prompts
- Build success page with share CTA
- Test with 10 new users

### Week 3: Retention Hooks

- Add session count display
- Add email reminder system (if not already built)
- Add progress tracking

### Week 4: Analytics

- Add dashboard for founder (PostHog or custom)
- Track cohort retention (D1, D7, D30)
- Calculate unit economics

---

## Appendix B: Resources & Templates

### Interview Outreach Email

See `user-interview-template.md` Section: "Pre-Interview Preparation"

### Reddit Post Template

See Week 2, Channel 1

### Personal Outreach Message

See Week 2, Channel 2

### Weekly Reflection Template

```markdown
## Week [X] Reflection (Date)

### Wins

- What went well this week?
- Any user success stories?

### Challenges

- What's blocking progress?
- What surprised us negatively?

### Learnings

- What did we learn about users?
- What did we learn about the product?

### Next Week Priorities

1.
2.
3.

### Energy Check (1-10)

Founder motivation: ?/10
Product conviction: ?/10
```

---

## Final Notes: The Honest Founder Conversation

### This roadmap assumes you want PMF validation, not feature building

If you find yourself saying:

- "I'll just add one more feature before talking to users"
- "The product isn't ready for distribution yet"
- "I need to polish the UI before showing people"

**Stop. You're avoiding the hard truth: validation is scary.**

### The only way to know if Kaiwa has PMF is to

1. Talk to users (interviews)
2. Watch them use it (dogfooding)
3. Measure if they return (retention)
4. See if they'll pay (monetization)

### If after 30 days you don't have a clear answer, you need to

- Interview 20 MORE people, or
- Pivot to a different ICP, or
- Accept that this might not be the right problem

### Building in a vacuum is comfortable. Validation is uncomfortable. Choose discomfort

---

**Document Version:** 1.0
**Review Cadence:** End of each week
**Owner:** Founder (Hiro)
**Next Document:** `code-refactor-recommendations.md` (specific file changes)
