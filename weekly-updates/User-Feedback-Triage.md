# Kaiwa User Feedback Triage

**Last Updated**: November 10, 2025
**Total Sessions**: 10+ (Scott, Mark, akuwana3, Timothy, Kazu, Brie, Martin, Thomas Clarke, Austrian User, Dad)

**North Star**: Give users the specific, practiced skills to have a single, successful, high-stakes conversation with a loved one.

**Primary Persona**: Sofia (Bilingual Spouse) | Secondary: David (Heritage Speaker) | Tertiary: Jamie (Relocation Expat)

---

## 🎯 Design Principle: "Does This Serve The Magic Moment?"

**The Magic Moment**: When Sofia finishes practicing "Meeting partner's family" and thinks: *"I can actually do this."*

Every issue below is evaluated through this lens:
- **🔴 Critical** = Breaks the magic moment entirely
- **🟡 High** = Blocks users from reaching the magic moment
- **🟠 Medium** = Dilutes the magic moment
- **⚪ Low** = Polish that doesn't affect core experience

---

## 🔴 CRITICAL: Breaks The Magic Moment

### 1. AI Responds to Itself (Conversation Killer)

**NEW** 🚨 **SHOWSTOPPER**

- **Mentions**: 2 (Thomas Clarke, Martin implied with "three responses")
- **Why Critical**: If Lily talks to herself, the entire illusion collapses. User can't practice. Session dead.
- **Impact**: ~2% of conversations become unusable
- **User Quote**: "Responded to itself so conversation couldn't continue" (Thomas Clarke)
- **Fix Priority**: **TODAY**
- [ ] **Status**: Open

**Root Cause**: Likely audio stream not closed properly or agent thinking user responded when they didn't.

---

### 2. Agent Verbosity (The Interview Problem)

- **Mentions**: 5+ (Timothy, Martin, akuwana3, Thomas Clarke, Mark)
- **Why Critical**: If agent dominates, user never speaks → no practice → no confidence gained
- **User Quotes**:
  - "Talking too long, verbosity of length of turns" (Thomas Clarke)
  - "Text still pretty long, needs to be less verbose" (Martin)
  - "Agent spazzes out with multiple responses" (Martin)
  - "Three different responses going on instead of one" (Martin)
- **Design Insight**: Real conversations = 50/50 speaking time. Agent should speak LESS than user, not more.
- [ ] **Status**: Open

**Fix**:
- Hard limit: 2-3 sentences max per agent turn
- If beginner responds with 5 words, agent responds with 7-10 words (not 50)
- NEVER send 3 responses in one turn

---

### 3. No Natural Speech Patterns (Uncanny Valley)

**NEW** 🎨 **HUMAN TOUCH**

- **Mentions**: 1 (Thomas Clarke)
- **Why Critical**: Without "uhms" and "uhhs," Lily doesn't sound human → breaks belief that this prepares you for real people
- **User Quote**: "No uhms or uhhs" (Thomas Clarke)
- **Design Insight**: Perfection is inhuman. Real people hesitate. Lily should too.
- [ ] **Status**: Open

**Fix**: Add natural disfluencies based on conversation context:
- "Hmm, that's interesting..."
- "Oh, let me think..."
- "Uh, well..."

---

### 4. Scenario Drift (Generic Questions Kill Specificity)

- **Mentions**: 3 (Martin, Timothy, Mark)
- **Why Critical**: If user came to practice "ordering food" but agent asks "what's your favorite book," they didn't practice what they came for
- **User Quote**: "Glitch where role-play goes back to analysis of previous conversation" (Martin)
- [ ] **Status**: Open

**Fix**: System prompt must LOCK IN scenario context. Every turn should reference the scenario.

---

### 5. Lost Scenario When Switching Language

**NEW** ⚠️ **FLOW KILLER**

- **Mentions**: 2 (Martin, general persistence issues)
- **Why Critical**: User picks scenario → switches language → scenario disappears = broken flow, have to start over
- **User Quotes**:
  - "Switched out of scenario when it was role-play; lost scenario when language switched" (Martin)
  - "Spanish came up after pressing Russian" (Martin)
- [ ] **Status**: Open

**Fix**: Scenario + Language should be locked together once selected. Don't reset on language change.

---

### 6. Analysis Page Freezes on Mobile

**NEW** 📱 **PROOF MOMENT BROKEN**

- **Mentions**: 1 (Austrian user)
- **Why Critical**: Analysis = proof user improved. If it freezes, user never gets validation → no belief in progress
- **User Quote**: "Problem with analysis page on mobile where it freezes"
- [ ] **Status**: Open

**Fix**: Debug mobile-specific issue. This is the "you got better" moment.

---

### 7. Push-to-Talk Hidden/Confusing

- **Mentions**: 3 (Scott, Timothy, Martin)
- **Why Critical**: If user doesn't know HOW to speak, they can't practice at all
- **User Quotes**:
  - "Press and hold to talk should go above audio visualizer instead of below" (Martin)
  - "Push to talk isn't intuitive since it doesn't show" (Timothy)
- [ ] **Status**: Open

**Design Fix**: Primary action = most obvious element. Make it HUGE and BEAUTIFUL.

---

## 🟡 HIGH: Blocks Path to Magic Moment

### 8. Paid Conversion Not Working (1% → Need 8-10%)

**NEW** 💰 **MONETIZATION BLOCKER**

- **Mentions**: 2 (Martin dad feedback, Justin's advice)
- **Why High**: Can't fund development if users won't pay
- **User Quote**: "Dad's feedback: paid conversion isn't that good" (Martin)
- **Justin's Insight**: Analysis feature needs to be "beefed up" to be payworthy
- [ ] **Status**: Open

**Hypothesis**: Users don't believe they improved enough to justify $15/month

**Fix**: Make the value OBVIOUS:
- Show clear before/after improvement
- Make Lily memorable (Ghibli art, personality)
- Add conversation continuity (relationship with Lily)

---

### 9. Transcript Shown by Default (Reading > Speaking Trap)

**NEW** 🎨 **DESIGN PHILOSOPHY**

- **Mentions**: Multiple (Thomas Clarke, Brie falls back on transcript, Austrian user feedback)
- **Why High**: Every pixel of text = pixel away from listening practice
- **User Quotes**:
  - "Advanced users find transcript distracting while speaking" (Austrian)
  - "Falls back on transcript instead of listening practice" (Brie)
  - "Hide show transcript under conversation mode active" (Martin)
- [ ] **Status**: Open

**Jony Ive Fix**: DEFAULT = no transcript. Add tiny "show text" button for anxious beginners.

---

### 10. Overwhelming Language/Scenario Selection

- **Mentions**: 2 (Timothy, implied by conversion issues)
- **Why High**: 40 scenarios + 8 languages = analysis paralysis → users bounce before trying
- **User Quote**: "Finding languages is a lot since there's quite a bit showing" (Timothy)
- [ ] **Status**: Open

**Steve Jobs Fix**: Start with ONE question:
- "What conversation are you dreading?"
- Three buttons: Family | Partner | Work
- Done. Pick language second.

---

### 11. No Conversation Continuity (No Relationship with Lily)

- **Mentions**: 2 (Brie, Scott memory loss)
- **Why High**: Users want to practice with same partner repeatedly. Starting fresh every time = cognitive load + transactional feel
- **User Quote**: "Wants to continue previous conversations with Lily; would pay for feature" (Brie)
- **Monetization Signal**: Brie said she'd PAY for this
- [ ] **Status**: Open

**Fix**: "Continue with Lily" button. Persistent memory. Lily remembers you.

---

### 12. Audio Instructions for Different Browsers

**NEW** 🔧 **ACTIVATION BLOCKER**

- **Mentions**: 1 (Martin)
- **Why High**: If user can't figure out how to enable audio, they can't use the app at all
- **User Quote**: "Show better instructions for turning on audio for different browsers" (Martin)
- [ ] **Status**: Open

**Fix**: Browser-specific onboarding modals (Safari vs Chrome vs Firefox)

---

### 13. Menu UX Issues (Hamburger Icon, Doesn't Close)

**NEW** 🎨 **IVE HATED HAMBURGERS**

- **Mentions**: 2 (Scott, Martin)
- **Why High**: Hidden navigation = hidden features = users miss value
- **User Quotes**:
  - "Show options menu more prominently instead of hamburger icon" (Martin)
  - "Menu doesn't close when touched outside" (Scott)
- [ ] **Status**: Open

**Jony Ive Fix**: Kill the hamburger. 3 big beautiful buttons for core actions.

---

## 🟠 MEDIUM: Dilutes Magic Moment

### 14. Confusing Scenario Names

**NEW** 📝 **CLARITY**

- **Mentions**: 1 (Martin)
- **Why Medium**: "Midnight pain triage visit" → user thinks "what?" Naming matters.
- **User Quote**: "Midnight pain triage visit is confusing (maybe Doctor's visit)" (Martin)
- [ ] **Status**: Open

**Fix**: Rename to human-understandable labels: "Emergency Room Visit"

---

### 15. Calm Mode vs Conversation Mode Confusion

**NEW** 🤔 **MODE COMPLEXITY**

- **Mentions**: 2 (Scott, Martin)
- **Why Medium**: Why are there modes? Just adapt UI based on what's happening.
- **User Quote**: "Maybe make calm mode default and have show transcript on the side" (Martin)
- [ ] **Status**: Open

**Fix**: Remove "modes" concept. Just have one flow that adapts.

---

### 16. Scenario Dots Don't Navigate Back

**NEW** 🧭 **PROGRESS INDICATOR**

- **Mentions**: 1 (Martin)
- **Why Medium**: If user sees progress dots, they should be tappable to go back
- **User Quote**: "Make dots of scenario lead you back" (Martin)
- [ ] **Status**: Open

**Fix**: Make dots interactive breadcrumb navigation.

---

### 17. Create Scenario Feature Buggy

- **Mentions**: 2 (Martin, Timothy)
- **Why Medium**: Custom scenarios = personalization, but not core to first experience
- [ ] **Status**: Open

---

### 18. Analysis Depth (Monetization Feature)

- **Mentions**: 3 (Martin, Timothy, Brie)
- **Why Medium**: Analysis exists and works, but needs depth for premium tier justification
- **User Quote**: "Found analysis good but needs to be 'beefed up' to be payworthy" (Martin)
- [ ] **Status**: Open

**Fix**: Add vocabulary alternatives, pronunciation feedback, grammar depth

---

### 19. Screen Size/Scrolling Issues

**NEW** 📱 **MOBILE POLISH**

- **Mentions**: 1 (Thomas Clarke)
- **Why Medium**: UI polish issue, not blocker
- **User Quote**: "Screen seems to be larger than screen in conversationMode Active when it should not be scrollable"
- [ ] **Status**: Open

---

### 20. No Audio Playback/Slow Down

- **Mentions**: 2 (Timothy, Brie)
- **Why Medium**: Nice to have for learning, but not core to first magic moment
- **User Quote**: "Can't replay AI speech or slow down" (Brie)
- [ ] **Status**: Open

---

## ⚪ LOW: Polish (Don't Do Until PMF)

### Dialect Support
- Austrian German, Swiss German (Austrian user)
- Egyptian Arabic, Moroccan Arabic (Martin)
- Colombian vs Spain Spanish (Martin)
- [ ] **Status**: Backlog (do AFTER core magic works)

### Language-Specific Issues
- Portuguese too easy (Mark)
- Taiwan flag wrong (Timothy)
- Chinese pinyin (partially fixed)

### UI Polish
- Stars system confusing (Scott)
- Hover functionality (Timothy)
- Scenario difficulty legend (Martin)
- "Start new conversation" navigation (Timothy)

---

## 💚 What's Working (DO NOT BREAK)

- ✅ **Voice quality very clear** (Martin)
- ✅ **Pace/speed of speech really good** (Martin)
- ✅ **"Dynamism vs busy work"** (Timothy) ← This is your soul
- ✅ **Dialogue mode most liked** (Timothy)
- ✅ **Lily as conversation partner** (Brie) ← This is your moat
- ✅ **Agent intelligence; doesn't hallucinate** (Martin)

---

## 🎯 This Week's Ruthless Priorities

### Must Fix (Breaks Magic)
1. **AI responding to itself** - Debug TODAY
2. **Agent verbosity** - Hard limit 2-3 sentences
3. **Natural speech patterns** - Add "uhms" and hesitations
4. **Analysis freezing on mobile** - Test and fix

### Should Fix (Blocks Conversion)
5. **Transcript default OFF** - Hide by default, show button
6. **Scenario + Language persistence** - Lock together
7. **Push-to-talk positioning** - Make it OBVIOUS

### Test & Learn (Conversion Hypothesis)
8. **Simplify first screen** - One question: "What conversation are you dreading?"
9. **Make Lily memorable** - Add Ghibli-style avatar
10. **"Continue with Lily" button** - Test if continuity increases retention

---

## 📊 Key Metrics to Track

1. **Magic Moment Completion Rate**: % of users who finish first scenario
2. **Conversation Quality**: Average speaking time (user vs agent)
3. **Return Rate**: % who come back next day
4. **Conversion Rate**: 1% → 8-10% target
5. **"Lily Love"**: % who mention AI partner by name in feedback

---

## 💭 Strategic Questions to Answer

### Billing Metric Decision
- **Current**: Minutes spoken
- **Proposed**: Words spoken (or hybrid)
- **User Insight**: "People prefer evaluating based on how much THEY talk" (Thomas Clarke)
- **Recommendation**: Test "words YOU spoke" vs "minutes of practice"

### First Page Simplification
- **Current**: Full landing page with features
- **Proposed**: Move to about page, simplify entry
- **Recommendation**: A/B test minimal entry point vs full explainer

### Native App Timing
- **Justin's Advice**: Eventually, but not now
- **Your Instinct**: After PMF or fundraising
- **Recommendation**: Improve PWA first (push notifications, home screen presence)

---

## 📝 Individual User Snapshot Updates

### Austrian User (NEW)
**Language**: German
**Key Insight**: Real-world immersion (3 weeks in Germany) taught more than app
**Implication**: App should feel like immersion, not lessons

### Thomas Clarke (NEW)
**Status**: Active tester
**Key Problems**:
- AI responds to itself (blocker)
- Agent talks too long (verbosity)
- No natural speech patterns (uhms/uhhs)
- Screen scrolling issue

### Martin Munoz (NEW - Expanded)
**Status**: Multilingual power user
**Key Problems**: (See critical issues above)
**Key Insight**: Dad says paid conversion not working

---

## 🔗 How to Use This Doc

### Daily
- Check 🔴 Critical section. If any are open, prioritize fixing.
- Test one fix per day with real scenario.

### Weekly
- Review 🟡 High section. Pick 1-2 to fix.
- Update conversion rate metric.

### Monthly
- Review 🟠 Medium section. Pick polish items if PMF trending up.
- Ignore ⚪ Low section until you hit $5K MRR.

---

## 🎨 The Jony Ive Test

Before building any feature, ask:

1. **Does this serve the magic moment?** (Sofia feeling "I can do this")
2. **Does this make Lily more memorable?** (Your moat)
3. **Does this reduce cognitive load?** (Remove, don't add)

If answer is "no" to all three → Don't build it.

---

## 📌 Action Items

### Immediate
- [ ] Debug AI responding to itself
- [ ] Test agent verbosity fix (2-3 sentence limit)
- [ ] Add natural speech patterns to agent prompt

### This Week
- [ ] Hide transcript by default
- [ ] Fix analysis freezing on mobile
- [ ] Make push-to-talk more obvious

### This Sprint
- [ ] Test simplified first screen (one question entry)
- [ ] Add "Continue with Lily" feature
- [ ] Commission Ghibli-style avatar for Lily

### Backlog (Post-PMF)
- [ ] Dialect support
- [ ] Audio playback features
- [ ] Advanced analysis depth
- [ ] Native app consideration

---

**Last Review**: November 10, 2025
**Next Review**: November 17, 2025
**Owner**: Hiro Kuwana

