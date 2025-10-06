# Kaiwa User Interview Guide

**Purpose:** Uncover actual use cases, pain points, and PMF signals from your first 5 users
**Timeline:** Complete all 5 interviews within 48 hours
**Duration:** 30 minutes per interview

---

## Pre-Interview Preparation

### 1. Identify Your 5 Users

Pull from database:

```sql
SELECT id, email, displayName, createdAt, lastUsage
FROM users
WHERE id != 'guest'
ORDER BY createdAt DESC
LIMIT 10;
```

For each user, research:

- When did they sign up?
- Have they completed any sessions?
- What language did they select?
- Did they share Kaiwa with anyone?

### 2. Reach Out (Email Template)

**Subject:** Quick chat about your Kaiwa experience? (30 min + $50 gift card)

**Body:**

```
Hi [Name],

I'm Hiro, the founder of Kaiwa. I noticed you signed up [time ago] and wanted to understand your experience — both what worked and what didn't.

Would you be open to a 30-minute video call this week? I'll send you a $50 Amazon gift card as thanks for your time.

I'm genuinely trying to understand if Kaiwa is solving a real problem or if I'm building something no one needs. Your honest feedback (even if it's "this isn't useful") is incredibly valuable.

Available times: [Calendar link]

Thanks,
Hiro
```

**Why $50?** Shows respect for their time. Signals this is important. Reduces selection bias (you'll get critical feedback, not just fans).

---

## Interview Structure (30 minutes)

### Part 1: Discovery & Context (10 minutes)

**Goal:** Understand who they are and their language learning journey BEFORE they found Kaiwa.

#### Opening (Warm-up)

"Thanks for taking the time. I'm going to ask you about your experience with Kaiwa, but first I want to understand your language learning journey more broadly. There are no right or wrong answers — I'm genuinely trying to learn."

#### Questions

**1. Tell me about your relationship with [Language].**

- [ ] Why are you learning this language?
- [ ] How long have you been learning?
- [ ] What's your current level (self-assessment)?

_Listen for: Intrinsic motivation vs. extrinsic pressure. Urgency level. Emotional stakes._

**2. What's the specific situation you're preparing for?**

- [ ] Is there a real upcoming event? (e.g., meeting family, trip, job requirement)
- [ ] Or is it a general desire to improve?

_Listen for: Concrete use case vs. vague aspiration. High-stakes scenarios = more motivation._

**3. Before Kaiwa, how were you practicing conversation?**

- [ ] With native speakers? (partner, tutor, exchange partners)
- [ ] With apps? (Duolingo, Babbel, Pimsleur, etc.)
- [ ] Self-study? (textbooks, podcasts, YouTube)
- [ ] Not at all?

_Listen for: What's their "job to be done"? What alternatives have they tried? What failed?_

**4. What was frustrating about those methods?**

- [ ] Anxiety speaking with real people?
- [ ] Lack of conversation practice in apps?
- [ ] No feedback on pronunciation?
- [ ] Something else?

_Listen for: Pain severity. Is this a vitamin (nice-to-have) or painkiller (urgent need)?_

**5. On a scale of 1-10, how motivated are you to get better at speaking [Language]?**

- [ ] 1-3: Casual interest
- [ ] 4-6: Would like to improve
- [ ] 7-8: Important to me
- [ ] 9-10: Critical, willing to pay and commit time

_Listen for: If they're below 7, PMF will be harder. High motivation = better early adopter._

---

### Part 2: Kaiwa Experience (12 minutes)

**Goal:** Understand actual behavior, not stated preferences.

#### Discovery & First Impression

**6. How did you first hear about Kaiwa?**

- [ ] Google search? (What did you search for?)
- [ ] Reddit post?
- [ ] Referral from friend?
- [ ] Instagram/TikTok?
- [ ] Other?

_Listen for: Organic discovery vs. forced traffic. Can they remember the context?_

**7. What made you sign up?**

- [ ] Specific promise? (e.g., "3-minute onboarding", "Meet the Parents scenario")
- [ ] Free to try?
- [ ] Curiosity?
- [ ] Something else?

_Listen for: What value proposition resonated? What was the "hook"?_

**8. Walk me through your first session. What happened?**

- [ ] Did you complete the onboarding scenario?
- [ ] Did you start a practice conversation?
- [ ] Did you get stuck somewhere?
- [ ] How long did you spend?

_Listen for: Where did they drop off? What was confusing? What felt good?_

**9. On a scale of 1-10, how useful was your first session?**

- [ ] 1-3: Waste of time
- [ ] 4-6: Somewhat useful
- [ ] 7-8: Pretty helpful
- [ ] 9-10: This is exactly what I needed

_Listen for: If below 7, dig into WHY. What was missing? What felt off?_

#### Retention & Value

**10. Have you used Kaiwa more than once?**

- If **YES:**
  - [ ] How many times?
  - [ ] What brought you back?
  - [ ] What scenarios did you try?

- If **NO:**
  - [ ] Why not? What stopped you?
  - [ ] Was it lack of time, lack of value, or something else?

_Listen for: Retention signal. If they didn't return, is it a product issue or life issue?_

**11. Which scenario(s) did you find most useful?**

- [ ] Onboarding (Meet Your Tutor)
- [ ] Relationship scenarios (Meet the Parents, Date Planning, Conflict Resolution)
- [ ] Daily life (Coffee Planning, City Day, Food Ordering)
- [ ] Business/Travel (Job Interview, Hotel Issue, Apartment Viewing)
- [ ] Cultural (Izakaya, Dim Sum, Market Haggling)
- [ ] None of them really resonated

_Listen for: Pattern detection. Is there ONE category that's working?_

**12. What was missing? What did you expect that wasn't there?**

- [ ] More feedback on pronunciation?
- [ ] Progress tracking?
- [ ] More realistic/personalized scenarios?
- [ ] Human conversation partner, not AI?
- [ ] Something else?

_Listen for: Gap between expectation and reality. Feature requests vs. fundamental misfit._

---

### Part 3: Willingness to Pay (5 minutes)

**Goal:** Understand pricing sensitivity and value perception.

#### Pricing Discovery

**13. If you had to pay for Kaiwa, would you?**

- If **YES:**
  - [ ] What's the maximum you'd pay per month?
  - [ ] What would make it worth paying for?

- If **NO:**
  - [ ] Why not? What's missing?
  - [ ] Is there a free alternative that's good enough?

_Listen for: Price anchoring. Willingness to pay = PMF signal. If they won't pay, why?_

**14. How does Kaiwa compare to these alternatives?**

Show them this list:

- **ChatGPT Voice** ($20/mo) - Can do open-ended conversations in any language
- **HelloTalk/Tandem** (Free) - Connect with real native speakers for language exchange
- **Practicing with partner/friend** (Free, but anxiety-inducing)
- **Traditional tutor** ($30-50/hour)

Ask: "If you had to rank these by value, where does Kaiwa fit?"

_Listen for: Competitive positioning. Is Kaiwa actually differentiated, or is it a commodity?_

**15. Would you recommend Kaiwa to a friend?**

- If **YES:**
  - [ ] What would you say to them?
  - [ ] What type of person is this perfect for?

- If **NO:**
  - [ ] Why not?
  - [ ] What would need to change for you to recommend it?

_Listen for: NPS signal. Word-of-mouth = strongest PMF indicator._

---

### Part 4: Future Use & Validation (3 minutes)

**Goal:** Gauge future intent and potential use cases.

**16. Do you plan to use Kaiwa again?**

- If **YES:**
  - [ ] When? What's the next scenario you'd practice?
  - [ ] How often would you ideally use it? (daily, weekly, before specific events)

- If **NO:**
  - [ ] What would bring you back?

_Listen for: Habit potential. Is this a "use once" product or repeat use case?_

**17. If I could wave a magic wand and make Kaiwa perfect for you, what would change?**

- [ ] More scenarios?
- [ ] Better AI?
- [ ] Human tutors?
- [ ] Social/community features?
- [ ] Progress tracking?
- [ ] Something else entirely?

_Listen for: Big swings vs. incremental improvements. What's the 10x feature?_

**18. Last question: If Kaiwa disappeared tomorrow, what would you do instead?**

- [ ] ChatGPT Voice
- [ ] Nothing, go back to old methods
- [ ] Find a tutor
- [ ] Just practice with partner/friends

_Listen for: Substitutability. If they'd be fine without it, you don't have PMF._

---

## Post-Interview: Synthesis Framework

### Immediate Notes (Right After Call)

**Headline Summary (1 sentence):**

> "User is [demographic] learning [language] for [reason]. They [did/didn't] find value because [core insight]."

**Example:**

> "User is 28yo software engineer learning Japanese for girlfriend's family. He tried Kaiwa once, found scenarios generic, went back to ChatGPT Voice which is cheaper and more flexible."

**Key Quotes (3-5 verbatim):**

- Record exact words that reveal pain points, value perception, or emotional stakes
- Example: "I felt stupid speaking to an AI. I'd rather embarrass myself with her family directly."

**Insights (What did you learn?):**

- What surprised you?
- What validated your assumptions?
- What contradicted your beliefs?

**Action Items:**

- What should you build/change based on this?
- What hypothesis to test next?

---

## Synthesis Across All 5 Interviews

### Patterns to Look For

#### 1. **Use Case Clustering**

After 5 interviews, fill out this matrix:

| User | Use Case | Motivation (1-10) | Completed Session? | Would Pay? | Would Recommend? |
| ---- | -------- | ----------------- | ------------------ | ---------- | ---------------- |
| 1    |          |                   |                    |            |                  |
| 2    |          |                   |                    |            |                  |
| 3    |          |                   |                    |            |                  |
| 4    |          |                   |                    |            |                  |
| 5    |          |                   |                    |            |                  |

**Look for:**

- Do 3+ users share the same use case?
- Is there a "super user" who loves it? What's different about them?
- Is there a user who tried it and hated it? Why?

#### 2. **Drop-off Analysis**

```
Signed up:        5 users (100%)
Started session:  ? users (?%)
Completed session: ? users (?%)
Returned Day 2:   ? users (?%)
Would pay:        ? users (?%)
```

**Key Question:** Where's the biggest drop-off?

- If it's signup → first session: Onboarding is broken
- If it's first session → completion: Experience isn't compelling
- If it's completion → return: No retention hook
- If it's return → pay: Pricing/value mismatch

#### 3. **Competitive Position**

Rank how users perceive Kaiwa vs. alternatives:

| Alternative             | Better Than Kaiwa? | Why? |
| ----------------------- | ------------------ | ---- |
| ChatGPT Voice           |                    |      |
| HelloTalk               |                    |      |
| Human tutor             |                    |      |
| Partner/friend practice |                    |      |

**If Kaiwa isn't clearly better than ChatGPT Voice, you have a problem.**

#### 4. **Beachhead Market Validation**

Count how many users fit each ICP:

- [ ] **Couples learning partner's language:** \_\_\_ users
- [ ] **Heritage learners reconnecting:** \_\_\_ users
- [ ] **Business/career need:** \_\_\_ users
- [ ] **Travel prep:** \_\_\_ users
- [ ] **General curiosity:** \_\_\_ users

**Decision Rule:**

- If 3+ users share the same ICP → **Focus there for 90 days**
- If everyone is different → **You don't have a market yet**

---

## Critical Questions to Answer

After all 5 interviews, you should be able to answer:

### Question 1: Is there ONE use case that's working?

**Good Answer:** "3 out of 5 users are learning their partner's language to prep for family interactions. They all found the 'Meet the Parents' scenario useful."

**Bad Answer:** "Everyone wants something different. No clear pattern."

### Question 2: Did anyone have a "holy shit" moment?

**Good Answer:** "User #2 said: 'This is exactly what I needed. I've been too scared to practice with my boyfriend's mom, and this lets me screw up privately.'"

**Bad Answer:** "People thought it was 'interesting' and 'cool' but no one was blown away."

### Question 3: Would anyone be upset if Kaiwa disappeared?

**Good Answer:** "User #4 would be disappointed. They've used it 3 times this week and it's helping their confidence."

**Bad Answer:** "No one would care. They'd just use ChatGPT Voice or nothing."

### Question 4: What's the biggest reason people didn't return?

**Good Answer:** "They completed one session, found value, but forgot to come back. We need reminder emails."

**Bad Answer:** "They tried it, didn't see the point, and left. ChatGPT Voice is better."

### Question 5: What's the ONE feature that would turn users into champions?

**Good Answer:** "Progress tracking + streak system. Users want to see improvement over time."

**Bad Answer:** "Everyone wants different things. No clear winning feature."

---

## What to Do with These Insights

### Scenario A: You Find a Beachhead (3+ users, same use case, 7+ motivation)

**Example:** "3 users are preparing to meet partner's parents, all found scenarios useful, would pay $10/mo"

**Action Plan:**

1. Double down on that ONE scenario
2. Build 5 variations (formal dinner, casual lunch, video call, gift-giving, follow-up visit)
3. Create laser-focused landing page
4. Interview 10 MORE people in cross-language relationships
5. Launch on Reddit r/relationships with founder story

### Scenario B: You Find a Super User (1 user LOVES it, others are lukewarm)

**Example:** "User #2 has used it 5 times, told 2 friends, would pay $20/mo"

**Action Plan:**

1. Spend 2 hours with that super user
2. Understand: What's different about them? What job is Kaiwa doing?
3. Find 10 more people like them
4. Build specifically for that profile
5. Ignore everyone else for 60 days

### Scenario C: No One Really Cares (No use case, low engagement, wouldn't pay)

**Example:** "All 5 users tried once out of curiosity, didn't return, prefer ChatGPT Voice"

**Action Plan:**

1. **Pivot or Persevere Decision:**
   - Do you believe the vision strongly enough to keep searching for PMF?
   - Or is this a solution looking for a problem?
2. If **Persevere:**
   - Interview 20 more people in target segment BEFORE building anything
   - Validate pain point exists and is severe
3. If **Pivot:**
   - Ask yourself: What did I learn? What would I build instead?
   - Consider: Is there a different use case for the Realtime API tech?

---

## Red Flags (Kill Signals)

If you hear these across multiple interviews, you may not have PMF:

1. **"It's interesting, but..."** → Curiosity, not urgency
2. **"I'd use the free version"** → No willingness to pay = no business
3. **"ChatGPT Voice is cheaper and does this already"** → Commodity, not differentiated
4. **"I tried it once, forgot about it"** → No retention hook
5. **"I'd rather practice with real people"** → AI isn't the right solution

---

## Green Flags (PMF Signals)

If you hear these, you're on the right track:

1. **"I've used this 3 times this week"** → Habit forming
2. **"I told my girlfriend about this"** → Word of mouth
3. **"I'd pay $15/mo, this saves me from hiring a tutor"** → Clear value vs. alternative
4. **"The 'Meet the Parents' scenario was exactly what I needed"** → Scenario-market fit
5. **"Can you add [specific feature]? I'd use this every day"** → Engaged user, clear need

---

## Final Deliverable: Interview Summary Document

After all 5 interviews, create this document:

### `user-research-oct-2025.md`

**Structure:**

1. **Summary:** One paragraph describing what you learned
2. **Use Case Breakdown:** Pie chart of user types
3. **Key Quotes:** 10 verbatim quotes that capture insights
4. **Drop-off Funnel:** Where users are leaving
5. **Competitive Position:** How Kaiwa stacks up
6. **Beachhead Decision:** Which ICP to focus on (or "none yet")
7. **Action Items:** Top 3 things to build/test next
8. **Go/No-Go:** Should you keep building this product?

---

## Appendix: Interview Best Practices

### Do's

- ✅ Record the call (with permission) and transcribe
- ✅ Ask "why" 3 times to get to root cause
- ✅ Listen more than you talk (80/20 rule)
- ✅ Follow up on vague answers: "Can you give me an example?"
- ✅ Thank them genuinely and send gift card immediately

### Don'ts

- ❌ Lead the witness: "Isn't scenario X useful?"
- ❌ Pitch features: "We're building Y, would you like that?"
- ❌ Defend your product: "Actually, we do have that feature..."
- ❌ Skip users who didn't return (they're the most valuable!)
- ❌ Only talk to friends/family (bias alert)

---

**Document Version:** 1.0
**Next Step:** Schedule 5 interviews within 48 hours
**Owner:** Founder (Hiro)
