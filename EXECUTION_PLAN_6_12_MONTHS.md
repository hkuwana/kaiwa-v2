# Kaiwa: 6-12 Month Execution Plan to $30K MRR

**Goal**: Build a profitable lifestyle business with validated retention and optionality to raise VC

**Target**: $30K MRR | 1,200 paying users | <10% monthly churn | LTV >$250

**Timeline**: Months 1-12 (Starting from current state)

**Decision Gate at Month 12**: Stay lifestyle or raise seed round

---

## How This Maps to Global Time Horizons

Across all Kaiwa strategy docs, use these shared horizons:

- **Now (0–6 months)** – Bridge + validation phase: organic acquisition, reach $3–5K MRR, prove retention.
- **Next (6–18 months)** – Scale phase: execute toward $30K MRR and build core moats.

This execution plan mostly covers:

- **Now (0–6 months)** → Phases 1–2
- **Next (6–12 months subset)** → Phases 3–4

## Executive Summary

This plan takes Kaiwa from early validation (current state: <$1K MRR) to **$30K MRR** in 12 months through:

1. **Product focus**: iOS app, retention features, scenario expansion
2. **Marketing strategy**: Content-led growth + paid acquisition scaling from $0 → $20K/month
3. **Monetization**: Optimize pricing, reduce churn, increase LTV
4. **Operations**: Solo → small team by Month 6
5. **Validation**: Prove multi-year retention across 3+ personas

**Monthly revenue targets**:

- Month 3: $3K MRR (120 users)
- Month 6: $10K MRR (400 users)
- Month 9: $20K MRR (800 users)
- Month 12: $30K MRR (1,200 users)

**Required growth rate**: ~30% MoM for first 6 months, ~20% MoM for months 7-12

---

## Core Early-Stage KPIs (Manual-First)

Before worrying about scaled acquisition, track how a small number of real people actually use Kaiwa:

- **Weekly Active Conversation Users (WACU)**  
  Unique users who complete at least one full conversation from start → analysis in the last 7 days. This is your primary “are people really using this?” health metric.

- **Weekly Conversation Sessions (WCS)**  
  Total number of completed conversations (start → analysis) in the last 7 days. Use alongside WACU to see depth of use.

- **Conversations per Active User (CpAU)**  
  `CpAU = WCS / WACU`. Target ≥ 2 conversations/week for your core personas once they’re onboarded.

- **First-Week Repeat Rate (FWR)**  
  Of users who complete their first conversation this week, % who come back for at least one more conversation within 7 days. Early retention leading indicator.

- **Manual Touchpoints per Week (MTPW)**  
  Number of high-touch interactions you personally have with users (PAB calls, Loom reviews, 1:1 Zooms, async feedback threads). Target 5–10/week at this stage.

These KPIs should be visible in one simple weekly dashboard before you optimize for MRR or paid acquisition.

---

## This Week: Manual Advisory Sprint (Do Things That Don’t Scale)

For the next 7 days, the priority is to apply the “Do Things That Don’t Scale” mindset with your Product Advisory Board and early users:

- **Recruit & host**
  - Personally invite PAB members in WhatsApp to run one full conversation (start → analysis) and share a recording or Loom.
  - Offer a 20–30 minute casual Zoom follow-up to debrief how the conversation felt and where the UX was confusing.

- **Observe & annotate**
  - Watch every recording end-to-end, take notes on: conversation balance, tone, language difficulty, and any confusing screens.
  - Tag each session by persona (Sofia/David/etc.) and scenario.

- **Close the loop**
  - Send each participant a short summary: what you heard, what you’re changing, and when they can retest.
  - Log 2–3 “shipped fixes” per week that came directly from these calls.

- **Measure manually**
  - At the end of the week, fill in: WACU, WCS, CpAU, FWR, and MTPW by hand in a simple sheet or Notion page.
  - Use this to decide next week’s focus (conversation quality vs UX clarity).

This manual sprint should be considered **part of Phase 1**, not a detour: it gives you the qualitative and quantitative foundation to make the rest of this 6–12 month plan worth executing.

---

## Phase 1: Foundation & Validation (Months 1-3, **Now**)

**Goal**: $3K MRR | 120 paying users | Validate retention hypothesis

### Month 1: Content Machine + iOS Foundation

#### Week 1-2: Marketing Infrastructure Setup

**Objective**: Build systems to scale content production

**Tasks**:

- [ ] Set up content calendar (Google Docs/SHeets)
- [ ] Create 10 "before/after" case file templates
- [ ] Set up TikTok, Instagram Reels, YouTube Shorts accounts
- [ ] Design 5 reusable video templates (CapCut/Canva)
- [ ] Write 20 Reddit response templates for common questions
- [ ] Set up email nurture sequences (3 sequences: trial → paid, onboarding, retention)

**Deliverables**:

- Content calendar with 30 days of planned posts
- 10 video templates ready to customize
- 20 Reddit response templates
- Email sequences in Resend

**Metrics**:

- 0 → 500 followers across TikTok/Instagram
- 10-15 pieces of content published

#### Week 3-4: Content Production Blitz

**Daily Content Schedule**:

- **Monday**: 1 "Meet the Parents" case file (blog post + Reddit crosspost)
- **Tuesday**: 2 TikTok/Instagram Reels (30-45 sec scenario reenactments)
- **Wednesday**: 1 "How to" guide (e.g., "How to apologize in Japanese to your girlfriend")
- **Thursday**: 2 Reels + Reddit engagement (10 meaningful comments)
- **Friday**: 1 long-form YouTube video (5-10 min: "I practiced meeting my Japanese girlfriend's parents")
- **Saturday**: Practice Lab event (live Zoom: 60 min group practice session)
- **Sunday**: Weekly changelog + founder update

**Content Themes**:

- Week 1: Meeting partner's parents (Japanese focus)
- Week 2: Apologies & reconciliation (Spanish focus)
- Week 3: Family dinner conversations (multiple languages)
- Week 4: Sharing big news (pregnancy, engagement, etc.)

**Deliverables**:

- 4 blog posts / case files
- 8 TikTok/Reels videos
- 4 YouTube videos
- 4 Practice Lab events
- 40+ Reddit comments

**Metrics**:

- 500 → 2,000 social followers
- 50-100 new signups
- 10-20 new paying users
- Target: $500-1,000 MRR

#### iOS App Foundation

**Week 1-2**: Design & prototype

- [ ] Design mobile UI/UX in Figma (reuse web components)
- [ ] Set up React Native or native Swift project
- [ ] Implement core conversation flow (simplified)

**Week 3-4**: MVP implementation

- [ ] Audio recording + playback
- [ ] Scenario selection
- [ ] Basic conversation interface
- [ ] User authentication (reuse backend)

**Deliverable**: iOS TestFlight beta ready for Month 2

See the full [Mobile Development Plan](./docs/4-technical/mobile-development-plan.md).

---

### Month 2: Scale Content + iOS Beta

#### Content Scaling (Week 5-8)

**New tactics**:

- Start **paid partnerships** with micro-influencers (1K-10K followers)
  - Budget: $500/month
  - Target: Bilingual couple accounts on Instagram/TikTok
  - Structure: $50-100 per post, 5-10 partners

- Launch **referral program**
  - Give: 1 month free for referrer + referee
  - Goal: 20% of new signups from referrals

- **SEO content strategy**
  - Write 10 long-tail keyword posts:
    - "How to meet Japanese girlfriend's parents"
    - "Apology phrases in Spanish for relationships"
    - "What to say when meeting Korean in-laws"
  - Target: 100-500 monthly organic visitors by Month 3

**Content volume**:

- 15-20 short-form videos/week (up from 8)
- 3-4 blog posts/week
- 2 Practice Lab events/week (different time zones)
- Daily Reddit/community engagement (15-20 comments/day)

**Metrics**:

- 2,000 → 5,000 social followers
- 100-200 new signups
- 25-40 new paying users
- Target: $1,500-2,000 MRR (cumulative)

#### iOS Beta Launch (Week 6-8)

**Week 6**: Internal testing

- [ ] Fix critical bugs
- [ ] Test on 5-10 devices
- [ ] Optimize performance

**Week 7-8**: TestFlight beta

- [ ] Launch to 50 beta testers (existing users)
- [ ] Collect feedback via in-app surveys
- [ ] Fix top 10 issues
- [ ] Prepare App Store submission

**Deliverable**: App Store submission ready for Month 3

---

### Month 3: iOS Launch + Paid Ads Testing

#### iOS App Store Launch

**Week 9**:

- [ ] Submit to App Store
- [ ] Create launch assets (screenshots, preview videos)
- [ ] Write App Store description optimized for ASO
- [ ] Prepare launch announcement

**Week 10**:

- [ ] Launch announcement (email, social, Reddit)
- [ ] App Store featuring pitch (submit to Apple)
- [ ] Monitor reviews, fix critical bugs immediately
- [ ] Start Android planning

**Metrics**:

- 500-1,000 iOS downloads in first 2 weeks
- 20-30% activation rate (download → first conversation)
- 10-15% conversion rate (activated → paying)

#### Paid Acquisition Testing

**Week 11-12**: Facebook/Instagram Ads MVP

**Budget**: $2,000/month ($67/day)

**Campaign structure**:

- **Campaign 1**: "Meet the Parents" (Japanese market)
  - Creative: 3 video ads (15-30 sec testimonial-style)
  - Audience: 25-35, female, in relationship, interest in Japan/Japanese language
  - Budget: $800/month

- **Campaign 2**: Heritage Speakers (Spanish market)
  - Creative: 3 video ads (emotional, family-focused)
  - Audience: 25-40, Hispanic/Latino diaspora, interest in family, Spanish language
  - Budget: $800/month

- **Campaign 3**: Retargeting
  - Audience: Website visitors, video viewers (25%+)
  - Budget: $400/month

**Success metrics**:

- CAC <$100 (will improve over time)
- Signup conversion >15%
- Trial → paid conversion >20%

**Deliverables**:

- 9 ad creatives (3 per campaign)
- Landing pages for each campaign
- Ad account setup + pixel tracking

#### End of Month 3 Checkpoint

**Targets**:

- **Revenue**: $3,000 MRR (120 paying users)
- **Users**: 500-800 total signups, 120 paying
- **Retention**: <15% monthly churn
- **Content**: 150+ pieces published (videos, blogs, posts)
- **iOS**: 1,000+ downloads
- **Paid ads**: CAC <$100, testing validated

**Decision**: If you hit $2K+ MRR with <20% churn, proceed to Phase 2. If not, double down on content + organic for another month.

---

## Phase 2: Scale & Optimize (Months 4-6, **Now**)

**Goal**: $10K MRR | 400 paying users | Hire first team member

### Month 4: Scenario Expansion + Content Hire

#### Product: Scenario Library 2.0

**Goal**: 50 → 150 scenarios across more personas

**New scenario categories**:

- **Professional**: Job interviews, client meetings, difficult manager conversations
- **Medical**: Doctor visits, therapy sessions, explaining symptoms
- **Daily life**: Making friends, joining clubs, navigating bureaucracy
- **Heritage speakers**: Cultural events, elder care conversations, teaching kids

**Implementation**:

- Week 13-14: Research + write 50 new scenarios
- Week 15: User testing with 20 beta testers
- Week 16: Launch "Scenario Library 2.0" update

**Metrics**:

- 50 → 150 scenarios
- Average scenarios per user: 2 → 4
- Session frequency: 1x/week → 2x/week

#### Hire #1: Part-Time Content Creator

**Role**: Video editor + content creator (20 hours/week)

**Responsibilities**:

- Edit 15-20 short-form videos/week from raw footage
- Design thumbnails, captions, hooks
- Schedule and post content across TikTok, Instagram, YouTube
- Monitor comments and engagement

**Budget**: $2,000-3,000/month (contractor)

**How to find**:

- Upwork, Contra, or Fiverr for bilingual creators
- Look for creators with language learning experience
- Portfolio requirement: 10+ short-form videos with >10K views each

**Deliverable**: Hired by Week 14, ramped up by Week 16

#### Marketing: Content Volume 2x

With content creator hired:

- **30-40 short-form videos/week** (up from 15-20)
- **5-7 blog posts/week** (SEO focus)
- **3 Practice Lab events/week** (different personas)
- **Daily community engagement** (Reddit, Discord, Instagram DMs)

**New channels**:

- Launch **YouTube long-form** (weekly 10-15 min videos)
  - "I practiced meeting my partner's parents in Japanese for 30 days"
  - "Can AI help me reconnect with my heritage language?"

- Start **LinkedIn** (B2B seed planting for future)
  - Share founder journey, transparency, learning

**Metrics**:

- 5,000 → 12,000 social followers
- 300-500 new signups/month
- 80-120 new paying users/month
- Target: $5,000 MRR (cumulative)

#### Paid Ads: Scale to $5K/month

**Budget**: $5,000/month ($167/day)

**Optimization**:

- Kill underperforming campaigns
- Scale winning campaigns 2x
- Add Google Search ads ($1,500/month)
  - Target: "how to speak Japanese with in-laws", "practice Spanish for family"
- Add TikTok ads ($1,000/month) (if testing shows promise)

**Targets**:

- CAC: $100 → $75
- ROAS: 1.5x → 2.5x (3-month LTV basis)

---

### Month 5: Retention Features + Android Planning

#### Product: Retention & Engagement Features

**Goal**: Reduce churn from 15% → 10%

**New features**:

1. **Milestone Journeys** (Week 17-18)
   - Map user's multi-year journey (e.g., Sofia: meet parents → engagement → wedding)
   - Show progress toward next milestone
   - Celebrate completions with badges

2. **Smart Reminders 2.0** (Week 19)
   - Predictive: "Your partner's parents visit is in 2 weeks. Practice now?"
   - Personalized: Based on user's stated goals and timeline
   - Multi-channel: Email, SMS, push notifications

3. **Social Proof** (Week 20)
   - "500+ people practiced this scenario this week"
   - Success stories: Before/after conversation transcripts
   - Community wall: Share wins

**Metrics**:

- Churn: 15% → 12% → 10%
- Session frequency: 2x/week → 3x/week
- User NPS: 30 → 50

#### Marketing: SEO Ramp-Up

**Goal**: 1,000 → 5,000 monthly organic visitors

**Tactics**:

- Publish 100+ long-tail keyword pages
  - Template: "How to [scenario] in [language]"
  - Example: "How to apologize to your boyfriend in Spanish"

- Build backlinks:
  - Guest posts on language learning blogs
  - Partnerships with expat/dating/immigration sites
  - PR: Pitch to journalists covering relationships, language, tech

**Deliverables**:

- 100 SEO-optimized pages
- 10 backlinks from DR 40+ sites
- 2-3 PR mentions

#### Android App: Start Development

**Week 17-20**:

- [ ] Port iOS app to Android (React Native path makes this easier)
- [ ] Test on 5-10 Android devices
- [ ] Prepare Play Store assets
- [ ] Beta test with 25 users

**Deliverable**: Android beta ready for Month 6 launch

See the full [Mobile Development Plan](./docs/4-technical/mobile-development-plan.md).

---

### Month 6: Android Launch + $10K MRR Milestone

#### Android Launch (Week 21-22)

- [ ] Submit to Play Store
- [ ] Launch announcement
- [ ] Monitor reviews and fix bugs
- [ ] Cross-promote iOS ↔ Android

**Metrics**:

- 500-1,000 Android downloads in first 2 weeks
- Mobile now represents 60%+ of new signups

#### Pricing Optimization Test

**Hypothesis**: Raising Plus from $15 → $19 won't hurt conversion but will increase ARPU

**Test structure** (Week 23-24):

- A/B test: 50% see $15, 50% see $19
- Run for 2 weeks
- Measure: Conversion rate, churn, revenue per cohort

**Expected outcome**:

- If conversion drops <10% but revenue increases 20%+, roll out $19 to all

#### End of Month 6 Checkpoint

**Targets**:

- **Revenue**: $10,000 MRR (400 paying users)
- **Growth rate**: 30-40% MoM average
- **Churn**: <10% monthly
- **LTV**: >$200 (8+ months average tenure)
- **CAC**: <$75
- **Team**: 1 part-time content creator
- **Content**: 500+ pieces published
- **Apps**: iOS + Android live

**Decision**: If you hit $8K+ MRR with <12% churn, proceed to Phase 3. If not, diagnose (acquisition problem vs retention problem) and adjust.

---

## Phase 3: Acceleration (Months 7-9, **Next**)

**Goal**: $20K MRR | 800 paying users | Build small team

### Month 7: Team Expansion + Community Build

#### Hire #2: Customer Success / Community Manager (Part-Time)

**Role**: Onboarding, retention, community building (20 hours/week)

**Responsibilities**:

- Onboard new users (1-on-1 welcome calls for Premium users)
- Run Practice Lab events (3-5/week)
- Manage Discord/community
- Send personalized retention emails to at-risk users
- Collect user feedback and testimonials

**Budget**: $2,500-3,500/month

#### Community Launch: Kaiwa Discord

**Why**: Community creates retention, social proof, and UGC

**Structure**:

- **Channels**:
  - #introductions
  - #practice-partners (find speaking partners by language)
  - #wins (share successful real-world conversations)
  - #scenarios (request custom scenarios)
  - Language-specific channels (#japanese, #spanish, etc.)

- **Events**:
  - 5 Practice Labs/week (live group practice by language)
  - Monthly "Real Conversation Challenge" (practice → report back)
  - AMAs with bilingual couples, polyglots, etc.

**Growth target**:

- Month 7: 100 members
- Month 9: 500 members
- Month 12: 2,000+ members

#### Product: Conversation Intelligence

**Goal**: Give users objective proof they're improving

**Features**:

1. **Fluency Score** (0-100)
   - Pronunciation + grammar + vocabulary + naturalness
   - Track score over time (show improvement graph)

2. **Readiness Check**
   - "You're 82% ready to meet your partner's parents"
   - Based on practice sessions + speech analysis

3. **Personalized Recommendations**
   - "Practice these 10 words to improve pronunciation by 15%"
   - "You hesitate on questions. Practice asking follow-ups."

**Metrics**:

- Users who see improvement score have 30% lower churn
- Readiness check increases session frequency 2x

---

### Month 8: Paid Ads Scale + Content Partnerships

#### Paid Ads: Scale to $10K/month

**Budget**: $10,000/month ($333/day)

**Channel mix**:

- Facebook/Instagram: $5,000
- Google Search: $2,500
- TikTok: $1,500
- YouTube: $1,000

**New campaign types**:

- **Video testimonials** (real users)
- **Before/after** conversation clips
- **Founder story** (authentic, vulnerable)

**Targets**:

- CAC: $75 → $60
- ROAS: 2.5x → 3.5x (3-month LTV)
- New paying users: 150-200/month from paid

#### Content Partnerships

**Goal**: Reach 100K+ people through partners

**Partnership types**:

1. **Language YouTubers** (10K-100K subs)
   - Offer free Premium in exchange for review video
   - Target: 5 partnerships

2. **Bilingual couple influencers** (50K-500K followers)
   - Sponsored posts ($500-2,000 per post)
   - Target: 3 partnerships

3. **Expat communities**
   - Guest posts on expat blogs/newsletters
   - Free workshops for expat groups
   - Target: 5 partnerships

**Budget**: $5,000/month for partnerships

**Expected ROI**:

- 100-200 signups from partnerships
- 20-40 paying users
- CAC: $125-250 (higher than ads but builds brand)

---

### Month 9: B2B Exploration + Premium Features

#### Product: Premium Tier Upgrades

**Goal**: Increase ARPU from $20 → $25

**New Premium features** ($35/month tier):

1. **1-on-1 Live Coaching** (30 min/month with bilingual coach)
2. **Custom Scenario Creation** (unlimited AI-generated scenarios)
3. **Family Plan** (add partner/family member for $10/month)
4. **Priority Support** (24-hour response time)

**Expected adoption**:

- 10% of Plus users upgrade to Premium
- ARPU: $20 → $23

#### B2B Exploration (Future Seed Prep)

**Goal**: Plant seeds for B2B revenue (validates TAM expansion for VCs)

**Test markets**:

1. **HR / L&D teams** (international companies)
   - Pitch: "Help relocating employees integrate faster"
   - Pricing: $500-1,000/month for 10-50 seats
   - Target: 3 pilot customers

2. **Language Schools / Universities**
   - Pitch: "Supplement classroom learning with AI practice"
   - Pricing: $300-500/month for 20-100 students
   - Target: 2 pilot customers

**Deliverable**: 3-5 B2B pilots by Month 12 (doesn't need to be profitable, just validates demand)

#### End of Month 9 Checkpoint

**Targets**:

- **Revenue**: $20,000 MRR (800 paying users)
- **Growth rate**: 20-25% MoM
- **Churn**: <8%
- **LTV**: >$250
- **CAC**: $60-75
- **Team**: 2 part-time contractors
- **Community**: 500+ Discord members

---

## Phase 4: Validation & Decision (Months 10-12, **Next**)

**Goal**: $30K MRR | Prove retention | Decide: Stay lifestyle or raise VC

### Month 10-11: Retention Validation

#### Critical Metric: Multi-Year Retention

**What to prove**:

- Users stay for **multiple milestones**, not one-and-done
- Track cohorts by persona:
  - Sofia (partner): Month 0 → Month 6 → Month 12
  - David (heritage): Usage spikes around family events, but returns
  - Jamie (expat): Active for 6-12 months post-relocation

**Data to collect**:

- **Cohort retention curves** (Month 1 → Month 12)
- **Reactivation rates** (churned users who return)
- **Milestone tracking** (users hitting 2nd, 3rd milestone)
- **Real conversation reports** (users sharing successful real-world convos)

**Target**:

- Month 6 retention: >60%
- Month 12 retention: >40%
- Average lifetime: >12 months
- LTV: >$250

#### Product: Real Conversation Bridge

**Goal**: Keep users engaged AFTER their first big milestone

**Feature**: "Real Conversation Journal"

- Users report back after real-world conversation
- Voice memo or transcript of how it went
- AI analyzes and suggests next practice scenarios
- Community celebrates wins

**Why this matters**:

- Validates that practice → real conversation → continued practice loop works
- Proves users don't churn after event
- Creates UGC for marketing

**Metrics**:

- 30% of users report back after real conversation
- Users who report have 50% lower churn

---

### Month 12: $30K MRR Milestone + Strategic Decision

#### Final Push: Growth Tactics

**Marketing blitz**:

- Double content output (80+ videos/week)
- Scale ads to $15K/month
- Launch referral contest ("Bring 3 friends, get 3 months free")
- PR push (pitch to NYT, WSJ, TechCrunch)

**Product polish**:

- Fix top 20 user-reported issues
- Ship "most requested feature" (user voting)
- Improve onboarding (increase trial → paid conversion)

**Targets**:

- **Revenue**: $30,000 MRR (1,200 paying users)
- **New users**: 300+ paying users/month
- **Organic**: 50% of signups from organic (SEO, social, referral)
- **Paid**: 50% from paid ads (CAC <$70)

---

## Decision Gate: Month 12 Assessment

### If You Hit These Metrics:

✅ **$30K+ MRR** (1,200+ paying users)
✅ **<8% monthly churn**
✅ **LTV >$250** (10+ month average lifetime)
✅ **CAC <$70** (sustainable unit economics)
✅ **Proven multi-year retention** (users stay for 2+ milestones)
✅ **40%+ Month 12 retention**
✅ **3-5 B2B pilots** (validates TAM expansion)

### You Have Two Options:

---

## Option A: Stay Lifestyle Business

**Projection**: $30K → $100K MRR over 24 months

**Strategy**:

- Maintain 15-20% MoM growth
- Keep team small (3-5 people max)
- Focus on profitability (>50% net margin)
- Organic-first growth, modest paid ads ($10-20K/month)
- You own 90%+ of the company

**Your life**:

- $600K-1.2M/year in personal income
- Full control, no board, no investor pressure
- Slow, sustainable growth
- Time for other projects, life, family
- Build a beautiful, profitable business

**When to choose this**:

- You value freedom and control over maximum scale
- You're happy with $1-3M/year personal income
- You don't want to manage a large team
- You believe slow and steady wins for your personality

---

## Option B: Raise Seed Round ($2-4M)

**Projection**: $30K MRR → $1M+ ARR in 12 months → $10M ARR in 36 months

**What you'd do with the money**:

- **Hire team** (10-15 people by Month 18)
  - 2 engineers (ship 3x faster)
  - 1 head of growth (paid acquisition expert)
  - 2 content creators
  - 1 designer
  - 1 customer success manager
  - 1 data analyst

- **Scale paid acquisition** ($50-100K/month)

- **Expand TAM** (professional scenarios, B2B, international)

- **Build proprietary AI** (fine-tuned models, better than OpenAI)

- **Mobile-first** ([see Mobile Development Plan](./docs/4-technical/mobile-development-plan.md) for world-class iOS/Android apps)

**What you'd give up**:

- 20-30% equity (you'd own 70-80% post-seed)
- Control (board seat, investor input)
- Optionality (growth-at-all-costs pressure)
- Freedom (you're now managing a team, fundraising, etc.)

**Your life**:

- High stress, high stakes
- 60-80 hour weeks
- Managing people, investors, board
- Potential outcome: $10-50M+ if you win, $0 if you lose
- 5-7 year commitment minimum

**When to choose this**:

- You want to build a $100M+ company
- You're willing to bet 5-7 years on this
- You thrive under pressure and scale
- You believe Kaiwa can be the category winner

---

## My Recommendation:

**Hit $30K MRR first, then decide.**

You don't have to choose now. Execute this 12-month plan, hit the milestones, and **the right path will become obvious**.

If at Month 12:

- You're exhausted → Stay lifestyle
- You're energized and see 10x potential → Raise VC
- You're unsure → Give it another 6 months

**The worst decision is raising VC before you're ready.** Build revenue and validation first.

---

## Financial Model & Projections

### Revenue Build-Up (Months 1-12)

| Month | Paying Users | ARPU | MRR     | Growth Rate | Churn | CAC | LTV  | LTV:CAC |
| ----- | ------------ | ---- | ------- | ----------- | ----- | --- | ---- | ------- |
| 1     | 30           | $20  | $600    | -           | 20%   | $50 | $100 | 2.0x    |
| 2     | 60           | $20  | $1,200  | 100%        | 18%   | $75 | $120 | 1.6x    |
| 3     | 120          | $20  | $2,400  | 100%        | 15%   | $90 | $150 | 1.7x    |
| 4     | 200          | $20  | $4,000  | 67%         | 15%   | $85 | $160 | 1.9x    |
| 5     | 300          | $20  | $6,000  | 50%         | 12%   | $80 | $180 | 2.3x    |
| 6     | 400          | $22  | $8,800  | 47%         | 10%   | $75 | $220 | 2.9x    |
| 7     | 520          | $22  | $11,440 | 30%         | 10%   | $70 | $230 | 3.3x    |
| 8     | 660          | $23  | $15,180 | 33%         | 9%    | $65 | $250 | 3.8x    |
| 9     | 800          | $23  | $18,400 | 21%         | 8%    | $65 | $260 | 4.0x    |
| 10    | 950          | $24  | $22,800 | 24%         | 8%    | $60 | $270 | 4.5x    |
| 11    | 1,100        | $24  | $26,400 | 16%         | 7%    | $60 | $280 | 4.7x    |
| 12    | 1,250        | $25  | $31,250 | 18%         | 7%    | $60 | $300 | 5.0x    |

**Key assumptions**:

- ARPU increases from $20 → $25 via pricing optimization + Premium tier
- Churn decreases from 20% → 7% via retention features
- CAC improves from $90 → $60 via organic growth + ad optimization
- LTV increases from $100 → $300 via lower churn + higher ARPU

---

### Cost Structure (Monthly at $30K MRR)

| Category                    | Month 1 | Month 6 | Month 12 |
| --------------------------- | ------- | ------- | -------- |
| **Revenue**                 | $600    | $8,800  | $31,250  |
|                             |         |         |          |
| **COGS**                    |         |         |          |
| OpenAI API                  | $180    | $2,640  | $9,375   |
| Infrastructure (Fly.io, DB) | $100    | $300    | $800     |
| **Total COGS**              | $280    | $2,940  | $10,175  |
|                             |         |         |          |
| **Gross Profit**            | $320    | $5,860  | $21,075  |
| **Gross Margin**            | 53%     | 67%     | 67%      |
|                             |         |         |          |
| **Operating Expenses**      |         |         |          |
| Team (contractors)          | $0      | $6,000  | $10,000  |
| Marketing (paid ads)        | $2,000  | $5,000  | $15,000  |
| Tools & Software            | $200    | $400    | $800     |
| Content partnerships        | $500    | $2,000  | $5,000   |
| Misc                        | $300    | $500    | $1,200   |
| **Total OpEx**              | $3,000  | $13,900 | $32,000  |
|                             |         |         |          |
| **Net Profit**              | -$2,680 | -$8,040 | -$10,925 |
| **Net Margin**              | -447%   | -91%    | -35%     |

**Notes**:

- You'll be **operating at a loss** until Month 15-18 as you invest in growth
- This is NORMAL for fast-growing SaaS
- At $50K MRR, you'd be profitable (if you cut ad spend to $10K/month)
- At $100K MRR, you'd have $30-40K/month net profit

**Funding requirement**:

- **Months 1-12**: ~$80K cash burn (save this before you start OR raise small angel round)
- **Months 13-24**: Break-even to profitable (depending on growth vs profitability choice)

---

## Weekly Operating Rhythm (Solo Founder + Small Team)

### Your Weekly Schedule (Founder)

**Monday** (Product & Strategy Day)

- 9-11am: Review metrics (MRR, churn, CAC, LTV, engagement)
- 11am-1pm: Product work (ship 1 feature or fix 3 bugs)
- 2-4pm: Team sync (content creator, CS manager)
- 4-5pm: Plan week ahead

**Tuesday** (Content & Community)

- 9-11am: Create 1 long-form piece (blog post, YouTube video)
- 11am-1pm: Reddit/community engagement (20+ comments)
- 2-4pm: Practice Lab event (host live practice session)
- 4-5pm: User interviews (talk to 2-3 users)

**Wednesday** (Growth & Marketing)

- 9-11am: Review ad performance, adjust campaigns
- 11am-1pm: Content partnerships outreach (5-10 emails)
- 2-4pm: SEO content (write or edit 2 blog posts)
- 4-5pm: Social media engagement

**Thursday** (Product & Engineering)

- 9am-1pm: Deep work (code features, fix bugs)
- 2-4pm: User testing (watch 3-5 users use the product)
- 4-5pm: Support queue (answer top 5 user questions)

**Friday** (Wrap-Up & Reflection)

- 9-11am: Finish outstanding tasks from week
- 11am-1pm: Weekly changelog (ship updates, email users)
- 2-4pm: Founder update (Twitter/LinkedIn transparency post)
- 4-5pm: Week review + plan next week

**Saturday** (Flexible)

- Practice Lab events (different time zones)
- Catch-up on async work
- Content creation

**Sunday** (Rest or Async)

- Light community engagement
- Reading, learning, strategizing
- Mostly OFF

**Total**: ~50 hours/week (sustainable for 12 months)

---

## Key Metrics Dashboard (Track Weekly)

### North Star Metric

**Monthly Recurring Revenue (MRR)**

### Primary Metrics

1. **MRR** (goal: $30K by Month 12)
2. **Paying users** (goal: 1,200 by Month 12)
3. **Monthly churn** (goal: <8%)
4. **LTV** (goal: >$250)
5. **CAC** (goal: <$70)

### Secondary Metrics

6. **New signups** (goal: 400+/month by Month 12)
7. **Trial → paid conversion** (goal: >25%)
8. **ARPU** (goal: $25)
9. **Session frequency** (goal: 3+ sessions/week per active user)
10. **NPS** (goal: >50)

### Leading Indicators

11. **Social followers** (goal: 20K+ by Month 12)
12. **SEO traffic** (goal: 10K+ monthly visitors)
13. **Discord members** (goal: 2,000+ by Month 12)
14. **Content published** (goal: 2,000+ pieces in 12 months)
15. **Ad ROAS** (goal: >3.5x on 3-month LTV basis)

### Retention Cohorts (Track by Month)

- **Month 1 → Month 3 retention** (goal: >70%)
- **Month 1 → Month 6 retention** (goal: >60%)
- **Month 1 → Month 12 retention** (goal: >40%)

---

## Risk Mitigation

### Top 5 Risks & Mitigation Strategies

**Risk 1: ChatGPT adds scenario practice**

- **Mitigation**: Build community moat (Discord, Practice Labs), superior speech analysis, emotional brand
- **Early warning**: Monitor OpenAI product announcements
- **Pivot**: Emphasize human coaching, B2B, or niche down further

**Risk 2: Retention collapses after life events**

- **Mitigation**: Milestone journeys, real conversation bridge, community engagement
- **Early warning**: Track cohort retention monthly
- **Pivot**: If Month 6 retention <40%, shift to professional scenarios (longer lifecycle)

**Risk 3: CAC keeps rising (paid ads saturate)**

- **Mitigation**: Invest in organic (SEO, community, referrals, partnerships)
- **Early warning**: CAC >$100 consistently
- **Pivot**: Cut paid ads, go organic-only, extend timeline

**Risk 4: Solo founder burnout**

- **Mitigation**: Hire contractors early (Month 4), maintain 50-hour weeks max, take 1 week off per quarter
- **Early warning**: Missing weekly goals, feeling exhausted
- **Pivot**: Slow down growth, prioritize health, consider co-founder or exit

**Risk 5: Can't raise VC when you want to**

- **Mitigation**: Build profitable lifestyle business, don't depend on fundraising
- **Early warning**: VCs pass due to competitive landscape or unit economics
- **Pivot**: Stay lifestyle, bootstrap to profitability, grow slowly

---

## Success Criteria: How to Know It's Working

### By Month 3:

✅ $2,000+ MRR
✅ <20% monthly churn
✅ 5,000+ social followers
✅ iOS app live
✅ 50-100 new signups/month organic

### By Month 6:

✅ $8,000+ MRR
✅ <12% monthly churn
✅ LTV >$180
✅ CAC <$80
✅ iOS + Android apps live
✅ 1 contractor hired

### By Month 9:

✅ $18,000+ MRR
✅ <10% monthly churn
✅ LTV >$240
✅ CAC <$70
✅ 500+ Discord members
✅ 2 contractors hired

### By Month 12:

✅ $30,000+ MRR
✅ <8% monthly churn
✅ LTV >$250
✅ CAC <$70
✅ Month 12 retention >40%
✅ 2,000+ Discord members
✅ 3-5 B2B pilots
✅ Clear decision: Stay lifestyle or raise VC

---

## Next Steps: First 30 Days

### Week 1: Planning & Setup

- [ ] Review this plan with critical eye
- [ ] Set up metrics dashboard (spreadsheet or tool like ChartMogul)
- [ ] Set up content calendar for Month 1
- [ ] Design 10 video templates
- [ ] Write 20 Reddit response templates
- [ ] Set up email sequences

### Week 2: Content Blitz Begins

- [ ] Publish 4 TikTok/Reels
- [ ] Write 1 blog post / case file
- [ ] Host 1 Practice Lab
- [ ] Reddit engagement (30+ comments)
- [ ] Start iOS app design in Figma

### Week 3: Paid Ads Setup

- [ ] Create 9 ad creatives (video + static)
- [ ] Set up Facebook/Instagram ad account
- [ ] Build 3 landing pages
- [ ] Install tracking pixels
- [ ] Launch first campaigns ($2K budget)

### Week 4: iOS Development + Evaluation

- [ ] Complete iOS app prototype
- [ ] Start implementation
- [ ] Publish 8 pieces of content (videos, blogs, posts)
- [ ] Review Month 1 metrics
- [ ] Adjust plan based on learnings

**After Week 4**: Continue executing monthly plans above.

---

## Final Thoughts

This plan is **aggressive but achievable** for a focused founder. Key success factors:

1. **Consistency** > Perfection
   - Ship daily, even if it's imperfect
   - Compounding works if you don't quit

2. **Focus** on revenue, not vanity metrics
   - MRR is the only metric that matters
   - Everything else is a leading indicator

3. **Learn fast** from users
   - Talk to 2-3 users every week
   - Ship features users actually want

4. **Don't burn out**
   - This is a 12-month sprint, not a 1-month sprint
   - Take care of yourself or you'll fail

5. **Be flexible** with tactics, rigid with strategy
   - The goal is $30K MRR
   - How you get there will change monthly

**You've got this.** The plan is solid. Now it's execution.

Let me know when you want to dive deeper into any specific area (marketing tactics, product roadmap, fundraising prep, etc.).

---

**Last updated**: November 2025
**Next review**: End of Month 3 (February 2026)
