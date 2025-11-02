# Kaiwa User Feedback Triage

**Last Updated**: November 2, 2025
**Total Sessions**: 7 (Scott Huson, Mark Natividad, akuwana3@gmail.com, Timothy Jones, Kazu, Brie, Martin)

**North Star**: Give users the specific, practiced skills to have a single, successful, high-stakes conversation with a loved one.

**Primary Persona**: Sofia (Bilingual Spouse) | Secondary: David (Heritage Speaker) | Tertiary: Jamie (Relocation Expat)

---

## 🔴 Critical Issues (3+ Mentions OR High Signal Plan Impact)

### Agent Verbosity / Conversation Flow
- **Mentions**: 3 (Timothy Jones, Martin, akuwana3@gmail.com)
- **Signal Plan Phase**: Onboarding → Critical (determines if user feels ready for real conversation)
- **Primary Personas Affected**: Sofia (beginner confidence), David (naturalness), Jamie (relationship feel)
- **Why Critical to North Star**: If agent feels like an interviewer, users won't believe they're practicing real conversation skills they can use with loved ones. Undermines the promise.
- **Description**: Agent responses are too long and unnatural, making users feel like passengers rather than participants. Multiple responses in one turn.
- **User Impact**: Beginners respond with 1-3 words; agent's response dwarfs input → conversation feels fake, not like practicing with a real person
- [ ] **Status**: Open
- **Notes**:
  - Martin described it as agent "spazzes out" with multiple prompts instead of one
  - Timothy Jones: App makes two requests instead of one
  - akuwana3: Reduce Chinese beginner response length to be more conversational

### Language/Scenario Persistence Issues
- **Mentions**: 2 (Timothy Jones, akuwana3@gmail.com)
- **Signal Plan Phase**: Onboarding → Critical (smooth setup = faster to "Moment of Value")
- **Primary Personas Affected**: Sofia (needs seamless language switch), David (heritage language memory), Jamie (language consistency)
- **Why Critical to North Star**: If users have to re-select language every session or see old conversations, it breaks flow and makes them doubt they can practice effectively. Kills momentum.
- **Description**: Selected language doesn't save locally after login; previous conversations show up; cookie reset issues
- **User Impact**: Users frustrated, confused about what they're supposed to practice; loses context between sessions
- [ ] **Status**: Potentially fixed (see commits from week of Nov 1)
- **Notes**:
  - akuwana3: "Fix the issue where the selected language does not save locally for the user after logging in"
  - Timothy Jones: "Make sure that the cookie resets and that we don't show the previous conversations messages"

### UX for Push-to-Talk Feature
- **Mentions**: 2 (Scott Huson, Timothy Jones)
- **Signal Plan Phase**: Onboarding → Critical (first friction point in actual practice)
- **Primary Personas Affected**: Sofia (anxiety about speaking), David (self-conscious about voice), Jamie (tech comfort)
- **Why Critical to North Star**: If users don't understand how to speak, they can't practice the conversation. Core blocker to "Moment of Value."
- **Description**: Push-to-talk functionality unclear/unintuitive; users confused about how it works
- **User Impact**: Users hesitate to record themselves; don't start speaking = no practice = no real-world skill transfer
- [ ] **Status**: Open
- **Notes**:
  - Scott Huson: "Push to talk is kind of confusing"; suggests slider to toggle or "Calm mode turn into conversation mode"
  - Timothy Jones: "The push to talk isn't intuitive since it doesn't show"
  - Martin: Friend suggests press once to start, press again to stop (instead of holding)

### Agent Stays in Scenario / Drift Prevention
- **Mentions**: 2 (Timothy Jones, Martin)
- **Signal Plan Phase**: Onboarding → Retention → Critical (scenario immersion = belief that skills transfer to real life)
- **Primary Personas Affected**: Sofia (family dynamics), David (cultural scenarios), Jamie (integration scenarios)
- **Why Critical to North Star**: If agent drifts from scenario, user doesn't practice the SPECIFIC conversation they're dreading. Scenario = practice container for real-world moment. Without it, no transfer.
- **Description**: Agent doesn't maintain scenario context; drifts to generic questions (e.g., "What's your favorite book?")
- **User Impact**: Users feel like they're doing generic language practice, not rehearsing the specific high-stakes conversation they came for. Doubt creeps in.
- [ ] **Status**: Open
- **Notes**:
  - Martin: "Agent generally maintained scenario at beginning but tended to drift away"
  - Timothy Jones: "Tim really likes the dialogue the most (and make it so that there's something like business scenarios or everyday)"

---

## 🟡 High Priority Issues (2+ Mentions OR Medium Signal Plan Impact)

### Search/Discovery for Languages and Scenarios

- **Mentions**: 2 (Timothy Jones, Martin implied)
- **Signal Plan Phase**: Acquisition → Onboarding (first impression + friction)
- **Primary Personas Affected**: Sofia (quick setup), David (language browsing), Jamie (scenario discovery)
- **Why Important**: If users can't find their language/scenario quickly, they bounce before experiencing "Moment of Value." Slows acquisition-to-practice conversion.
- **Description**: Too many languages displayed by default; difficult to find specific scenarios
- **User Impact**: Users overwhelmed; gives impression of disorganization; slower to start first practice
- [ ] **Status**: Open
- **Notes**:
  - Timothy Jones: "Finding languages is a lot since there's quite a bit showing"; "Make a search chart for the languages and also scenario"

### Audio/Speech Playback Features Missing

- **Mentions**: 2 (Timothy Jones, Brie)
- **Signal Plan Phase**: Retention → Real-World Bridge (practice improvement requires listening feedback)
- **Primary Personas Affected**: Sofia (accuracy), David (accent improvement), Brie (listening confidence)
- **Why Important**: Without ability to replay, users can't identify what they said wrong or compare to native speaker. Blocks improvement loop; erodes confidence in ability to apply skills to real conversation.
- **Description**: No playback button for audio; can't replay what AI said; can't slow down AI's speech
- **User Impact**: Users resort to transcripts (reading, not listening); don't build listening skills needed for real conversations
- [ ] **Status**: Open
- **Notes**:
  - Timothy Jones: "Playback audio button"; "Make the audio feedback better"
  - Brie: "Would love if I could replay what was said or perhaps slow down her talking"

### Account Creation / Authentication

- **Mentions**: 2 (Brie, Timothy Jones)
- **Signal Plan Phase**: Acquisition (friction before they experience app)
- **Primary Personas Affected**: All (varied email/auth preferences)
- **Why Important**: Authentication friction = lost acquisition. User comes with intent, can't sign up → churn before trying. Email signup is expected baseline.
- **Description**: Cannot create account with email (Google sign-in works); password/email management issues
- **User Impact**: Some users completely blocked from trying; forced into secondary auth method they didn't choose
- [ ] **Status**: Open
- **Notes**:
  - Brie: "I wasn't able to create an account using an email address"
  - Timothy Jones: "Need to remove the email password"

### Chinese Language-Specific Issues

- **Mentions**: 3 (Scott Huson, Timothy Jones, akuwana3@gmail.com)
- **Signal Plan Phase**: Onboarding (language-specific friction)
- **Primary Personas Affected**: Sofia-type (Chinese partner), David-type (heritage Chinese), Jamie-type (China relocation)
- **Why Important**: Chinese learners are a high-value segment; pinyin errors = broken learning experience for a language with unique script. Even one broken language erodes trust in product.
- **Description**: Pinyin display wrong (showing Japanese pinyin instead of Chinese)
- **User Impact**: Confusion for Chinese learners; incorrect learning content; feels like product wasn't tested for their language
- [ ] **Status**: Partial (Kazu informed pinyin issue is fixed)
- **Notes**:
  - akuwana3: "Correct the pinyin display to show Chinese pinyin instead of Japanese"
  - Scott Huson: "Voice recognition spanish tries to recognize the correct spanish and autocorrects"

### Conversation Continuity

- **Mentions**: 2 (Brie, Mark Natividad implied)
- **Signal Plan Phase**: Retention → Real-World Bridge (relationship building = longer LTV)
- **Primary Personas Affected**: Sofia (ongoing relationship), David (cyclical practice), Brie (high-engagement signal)
- **Why Important**: Continuity between sessions = belief in long-term relationship with AI partner = recurring engagement + belief skills compound over time. Without it, feels episodic and transactional.
- **Description**: Each new conversation starts fresh; can't continue from previous conversations; no follow-up with same AI partner
- **User Impact**: Users lose momentum; can't build relationship with favorite AI partner; learning feels episodic, not progressive
- [ ] **Status**: Open
- **Notes**:
  - Brie: "It would be cool if I could pick up the conversation from the last time and ask follow up questions to get to know Lily more"
  - Brie signal: "Loves Lily as conversation partner; would pay for feature" (monetization + engagement indicator)

### Analysis/Grammar Feedback Quality

- **Mentions**: 3 (Timothy Jones, Martin, Brie)
- **Signal Plan Phase**: Retention → Real-World Bridge (feedback enables skill transfer)
- **Primary Personas Affected**: Sofia (confidence to speak to partner's family), David (cultural correctness), Martin/Timothy (advanced learners)
- **Why Important**: Feedback quality is the difference between "I practiced" and "I improved." Without actionable feedback, users don't believe their mistakes matter or know how to fix them. Blocks Retention and monetization.
- **Description**: Grammar analysis exists but needs to be deeper; should include vocabulary alternatives and pronunciation guidance
- **User Impact**: Users unsure if they actually improved; analysis feels incomplete; advanced users can't justify paying for premium tier
- [ ] **Status**: Open
- **Notes**:
  - Martin: "Found analysis feature good but needs to be 'beefed up' to be payworthy" (monetization blocker)
  - Timothy Jones: "Increasing vocab and proper grammar structures" (wants depth)
  - Brie: "Feedback about AI simplifying too much" (wants challenge level adjustment)

---

## 🟠 Medium Priority Issues (1-2 Mentions OR Low-Medium Signal Impact)

### UI/UX Polish Issues

**Signal Plan Phase**: Onboarding (smooth flow)
**Primary Personas Affected**: Sofia (confidence building), David (cultural sensitivity), Jamie (tech comfort)
**Why Important**: Polished UX = signal that app is professional and worth their time. Polish issues chip away at trust.

- [ ] **Stars system confusing** (Scott Huson) — Unclear rating semantics; impacts feedback collection
- [ ] **Menu doesn't close when touched outside** (Scott Huson) — Basic UX bug; feels unpolished
- [ ] **Hover functionality detracts from interaction** (Timothy Jones) — Accessibility issue; breaks flow for some users
- [ ] **Flag for Taiwan incorrect; need regional dialects** (Timothy Jones, Mark Natividad) — Cultural accuracy matters; shows product wasn't tested with regional users
- [ ] **Scenario difficulty indicators (colors) need legend/tooltip** (Martin) — Users confused about color meaning; needs clarity
- [ ] **Unclear which process step user is in** (Timothy Jones) — Navigation confusion; users unsure where they are in journey
- [ ] **"Start new conversation" on analysis page doesn't return to home** (Timothy Jones) — Navigation bug; breaks expected flow

### Language/Dialect Support

**Signal Plan Phase**: Onboarding + Product-Market Fit
**Primary Personas Affected**: David (heritage dialects), Martin (regional Spanish), Sofia (family accent)
**Why Important**: Each language/dialect is potential new market segment. A broken dialect erodes trust; supporting dialects = reaching deeper into existing personas' needs.

- [ ] **Only MSA Arabic; need other dialects (Moroccan, Egyptian, etc.)** (Martin) — High-value segment (heritage + immersion); one-size-fits-all is wrong signal
- [ ] **Portuguese marked as too easy (one-worded questions)** (Mark Natividad) — Difficulty calibration broken; signals product wasn't tested thoroughly
- [ ] **Agent uses gender incorrectly** (Mark Natividad's friend) — Fundamental language error; confuses learning
- [ ] **Colombian accent inconsistent** (Martin) — Accent authenticity matters; breaks immersion for users practicing with specific regional partner
- [ ] **Spanish has glitch** (Timothy Jones) — Technical debt in major language
- [ ] **Chinese beginner responses too long** (akuwana3) — Part of larger agent verbosity issue; language-specific manifestation

### AI Agent Issues

**Signal Plan Phase**: Onboarding → Retention
**Primary Personas Affected**: Sofia (beginner anxiety), David (intermediate challenges), Brie (advanced learner)
**Why Important**: Agent behavior is core to believability. Repetitive questions, difficulty mismatch = user doubts they're practicing real conversation skills.

- [ ] **Agent asks same question repeatedly** (Mark Natividad) — Breaks engagement; users notice pattern
- [ ] **Agent responses sometimes advanced for beginners** (Brie) — Creates "I can't do this" moment; kills confidence for Sofia persona
- [ ] **Agent doesn't adjust difficulty based on user level** (Mark Natividad) — One-size-fits-all agent = misses the adaptive tutor promise
- [ ] **Failed to fetch connection errors** (Scott Huson) — Technical reliability issue; breaks session mid-flow

### Feature Gaps

**Signal Plan Phase**: Retention → Real-World Bridge
**Primary Personas Affected**: Timothy Jones (power user), Martin (content creator), Brie (deep engagement)
**Why Important**: Feature completeness = belief that app handles all angles of learning. Gaps = user has to supplement with other tools.

- [ ] **No transcript-less mode** (Martin) — Some advanced users want pure listening challenge; missing option
- [ ] **No pronunciation feature for improving own voice** (Timothy Jones) — Critical for tonal languages and accent work; limits practice depth
- [ ] **Free Talk mode mislabeled as "scenario"** (Timothy Jones) — UX clarity; confuses mode selection
- [ ] **Create Scenario feature buggy** (Martin) — Custom scenarios broken; blocks personalization path
- [ ] **Advanced options hard to find** (Timothy Jones) — Power users can't access depth they want

### Missing Content/Scenarios

**Signal Plan Phase**: Onboarding → Retention → Real-World Bridge
**Primary Personas Affected**: Sofia (family contexts), David (cultural ceremonies), Jamie (local integration), Timothy Jones (business)
**Why Important**: Scenario library = practice container library. Generic scenarios don't serve specific personas. Rich scenarios = higher "Moment of Value" likelihood.

- [ ] **Need business scenarios** (Timothy Jones) — Jamie + expat professionals need work language; missing segment
- [ ] **Need airport/travel-specific terminology** (Scott Huson) — Practical high-stakes scenario; high practice ROI
- [ ] **Need contextually aware content for natural conversation** (Mark Natividad) — Generic scenarios feel unnatural; need cultural/contextual depth
- [ ] **Scenario needs to feel like casual conversation (Paris, Rio, etc.)** (Mark Natividad) — Immersion quality; feels like rehearsing real moment vs. practicing language

---

## 💚 Most Valued Features (Positive Feedback)

- ✅ **Voice quality is very clear** (Martin, general feedback)
- ✅ **Pace/speed of speech is really good** (Martin)
- ✅ **AI's ability to adapt to user's dialect/accent** (Mark Natividad - agent responds well to dialect)
- ✅ **Agent intelligence; doesn't hallucinate** (Martin)
- ✅ **Transcript feature with click-to-translate** (Martin praised clarity)
- ✅ **Focus/non-focus setting** (Martin appreciated the distinction)
- ✅ **Post-conversation analysis** (Martin: "very good tips"; emphasis on register distinction in French)
- ✅ **AI acts as good conversation partner and explains well** (Brie - Lily)
- ✅ **Voice impressions impressive** (Scott Huson)
- ✅ **"Dynamism" vs. busy work approach** (Timothy Jones: "Duolingo was busy work. Kaiwa is just dynamic")
- ✅ **Dialogue mode is most liked feature** (Timothy Jones)

---

## 📊 Issue Priority Matrix: Mentions × Signal Plan Impact

| Issue | Mentions | Signal Phase | Impact on North Star | Priority | Status |
|-------|----------|--------------|----------------------|----------|--------|
| Agent verbosity | 3 | Onboarding | Blocks belief in realistic practice | 🔴 Critical | Open |
| Push-to-talk UX | 2 | Onboarding | First friction to practice | 🔴 Critical | Open |
| Scenario drift | 2 | Retention | Breaks "specific conversation" promise | 🔴 Critical | Open |
| Language/scenario persistence | 2 | Onboarding | Kills momentum mid-setup | 🔴 Critical | Open |
| Chinese pinyin errors | 3 | Onboarding | Language-specific blocker | 🔴 Critical | Partial fix |
| Audio playback features | 2 | Retention | Blocks improvement feedback loop | 🟡 High | Open |
| Account creation | 2 | Acquisition | Loses users before trying | 🟡 High | Open |
| Analysis/feedback depth | 3 | Real-World Bridge | Monetization blocker + confidence | 🟡 High | Open |
| Conversation continuity | 2 | Retention | Kills long-term engagement + LTV | 🟡 High | Open |
| Language/dialect support | 6+ | PMF | New segment expansion + trust | 🟠 Medium | Open |
| UI polish issues | 7+ | Onboarding | Erodes professionalism signal | 🟠 Medium | Open |
| AI agent quality (adaptive) | 4+ | Onboarding/Retention | Difficulty mismatch breaks confidence | 🟠 Medium | Open |
| Missing content/scenarios | 4 | Retention | Generic scenarios don't serve personas | 🟠 Medium | Open |

**Key Insight**: Issues with 3+ mentions AND high Signal Plan impact (Onboarding/Real-World Bridge) = **Do First**. Language/dialect support is scattered (6+ mentions) but lower Signal phase = **Do Second**.

---

## 📝 Individual Feedback Sessions

### Scott Huson - Oct 21, 2025
**Status**: Paid user
**Key Problems**:
- [ ] Stars system confusing
- [ ] Push to talk unclear; needs prompts/slider
- [ ] Need thinking time before response
- [ ] Menu doesn't close outside
- [ ] Spanish voice recognition autocorrects
- [ ] Need weekly email with stats
- [ ] Privacy settings unclear
- [ ] Connection errors ("Failed to fetch")
- [ ] Conversation memory loss
- [ ] Voice impressions impressive ✅

**Follow-up Needed**: Request conversation logs for memory testing

---

### Mark Natividad - Oct 21, 2025
**Status**: Multilingual user (Spanish, French, Japanese, Bulgarian)
**Key Problems**:
- [ ] UX created false confidence
- [ ] Portuguese too easy (one-worded questions)
- [ ] Rough transitions in conversation
- [ ] Agent repeats same question
- [ ] Agent uses gender incorrectly
- [ ] Agent responses too verbose
- [ ] Vocabulary differences frustrating
- [ ] App "feeds" user's problems instead of letting them solve
- [ ] Needs contextually aware content

**Feedback**: Prefers casual conversation style, not interview format

---

### akuwana3@gmail.com - Oct 21, 2025
**Status**: Chinese learner
**Key Problems**:
- [ ] Chinese responses too long for beginners
- [ ] Need vocabulary word feature
- [ ] Pinyin display incorrect (showing Japanese)
- [ ] Language selection not saved locally
- [ ] Rough transition from conversation to Kaiwa mode

---

### Timothy Jones - Oct 21, 2025
**Status**: Paid user
**Key Problems**:
- [ ] Need email/password removal
- [ ] Lack of transparency
- [ ] Hover takes away person (UX issue)
- [ ] Taiwan flag wrong; need regional dialects
- [ ] App too fast
- [ ] Makes two requests instead of one
- [ ] No playback audio button
- [ ] Audio feedback quality poor
- [ ] Finding languages overwhelming
- [ ] Push to talk not intuitive
- [ ] Advanced options hard to find
- [ ] Spanish glitch
- [ ] Cookie not reset on home return
- [ ] Unclear process step indicator
- [ ] "Start new conversation" doesn't return to home
- [ ] Missing business/everyday scenarios
- [ ] Free Talk mislabeled

**Positive**: Loves dialogue mode, appreciates "dynamic" vs. "busy work"

---

### Kazu - Oct 21, 2025
**Status**: Chinese learner
- ✅ Chinese issue marked as fixed

---

### Brie - Oct 21, 2025
**Status**: Active user (Japanese)
**Key Problems**:
- [ ] Email account creation failed (Google sign-in works)
- [ ] Overwhelming to start conversation with new partner
- [ ] Wants to continue previous conversations with Lily
- [ ] Wants "calls" with AI partner
- [ ] Can't replay AI speech
- [ ] Can't slow down AI speech
- [ ] Falls back on transcript instead of listening practice
- [ ] AI responses sometimes too advanced for beginner

**Positive**: Loves Lily as conversation partner; would pay for feature

---

### Martin - Oct 21, 2025
**Status**: Multilingual user (Spanish, French, Russian) + App Demo
**Key Problems**:
- [ ] Agent too verbose (one-sided conversation)
- [ ] Agent "spazzes out" with multiple responses
- [ ] Scenario drift (shifts to generic questions)
- [ ] Colombian accent inconsistent (between Spain/Colombia)
- [ ] Create Scenario feature buggy
- [ ] Scenario colors need legend
- [ ] Only MSA Arabic supported (need dialects)
- [ ] Agent asks same question repeatedly
- [ ] Need deeper grammar/vocabulary analysis
- [ ] Need pronunciation improvement features
- [ ] Need vocabulary alternatives feature

**Positive**:
- ✅ Voice quality very clear
- ✅ Pace really good
- ✅ Agent intelligence high
- ✅ Analysis feature helpful

**Feedback Target**: 500 paid customers by Jan/Feb

---

## 🔍 Deep Dive: Multi-Layer Feedback Analysis

### 1. Agent Verbosity (3 mentions) - Root Causes & Solutions

#### Layer 1: Response Length

- **Problem**: Single agent response is too long (multiple sentences/paragraphs)
- **Root Cause**: Prompt engineering includes instruction to provide detailed responses
- **Impact**: Beginners respond with 1-3 words, agent's response dwarfs user input → feels unnatural
- **Solution Approach**: Reduce response length target; use shorter, punchier responses

#### Layer 2: Multiple Responses in One Turn

- **Problem**: Agent gives 3+ responses/prompts in a single turn (spazzes out)
- **Root Cause**: Possibly dual-turn generation (question + follow-up) or prompt chaining
- **Impact**: User overwhelmed, doesn't know which to respond to
- **Solution Approach**: Ensure single response per turn; if asking follow-up, make it part of one cohesive response

#### Layer 3: Conversation Flow Mismatch

- **Problem**: Feels like user is a "passenger" taking an interview
- **Root Cause**: Agent-driven conversation (agent asks questions, user responds) instead of collaborative
- **Impact**: Doesn't feel like natural dialogue or peer conversation
- **Solution Approach**: Encourage more agent responses that aren't questions; incorporate statements, reactions, sharing

#### Layer 4: Proficiency-Aware Responses

- **Problem**: Response length/complexity not adjusted for beginner vs. advanced users
- **Root Cause**: Single response template regardless of proficiency level or user response length
- **Impact**: Beginners frustrated by long responses; advanced users may find it patronizing
- **Solution Approach**: Adapt response complexity to match user's proficiency level and response length

---

### 2. UX Creates False Confidence (Mark Natividad) - Multi-Layer Issue

#### Layer 1: Difficulty Assessment Misalignment

- **Problem**: User perceives tasks as easier than they should be
- **Root Cause**: Possible issues with difficulty calibration; one-worded questions (Portuguese); limited error correction
- **Impact**: User completes exercise feeling confident but hasn't actually practiced the hard parts
- **Solution Approach**: Review difficulty settings; add challenge elements that require more complex responses

#### Layer 2: Feedback Not Highlighting Gaps

- **Problem**: Analysis/feedback doesn't show user what they got wrong or struggled with
- **Root Cause**: Analysis might be celebrating correct answers without pointing out missed opportunities
- **Impact**: User leaves session thinking they're more proficient than they actually are
- **Solution Approach**: Reframe analysis to highlight "areas for improvement" and "next challenges"

#### Layer 3: Scenario Difficulty ≠ Language Difficulty

- **Problem**: A simple scenario (e.g., greeting) doesn't require complex language, even if marked "intermediate"
- **Root Cause**: Mismatch between scenario complexity and language proficiency required
- **Impact**: User completes "intermediate" scenario but only used beginner-level language
- **Solution Approach**: Separate scenario difficulty from language difficulty; create more cognitively demanding tasks

#### Layer 4: Agent Accommodates Too Much

- **Problem**: Agent adapts to user so well that it never challenges them
- **Root Cause**: Agent prioritizes user comfort over pushing user to improve
- **Impact**: Users feel good but don't grow; confidence inflates faster than ability
- **Solution Approach**: Add setting for "challenge mode" where agent pushes back, asks follow-ups, requires more complex responses

---

### 3. Scenario Drift → Feels Like Interview (2 mentions) - Breakdown

#### Layer 1: Loss of Scenario Context

- **Problem**: Agent stops referencing the scenario after initial setup
- **Example**: "Family celebration speech" scenario shifts to "What's your favorite book?"
- **Root Cause**: Agent prompt may not have strong enough constraint; context window dilution over turns
- **Impact**: User feels like they're in a generic Q&A, not practicing scenario
- **Solution Approach**: Strengthen scenario grounding in system prompt; include scenario context in every turn

#### Layer 2: Generic Questions Replace Contextual Ones

- **Problem**: Agent asks universal questions (hobbies, favorites) instead of scenario-specific ones
- **Example in scenario**: Should ask "What will you say in your speech?" not "What's your favorite movie?"
- **Root Cause**: Agent defaulting to safe, universal prompts instead of generating scenario-aware prompts
- **Impact**: Feels like interview mode, not role-play; user can't practice scenario-specific language
- **Solution Approach**: Fine-tune agent to generate contextually-aware follow-up questions; give examples of good scenario questions

#### Layer 3: Interview-Style Interaction Pattern

- **Problem**: Turns feel like question → answer → question → answer (interview format)
- **Root Cause**: Agent optimized for information gathering, not natural conversation
- **Impact**: Doesn't feel like real conversation; also doesn't feel like practicing a real scenario
- **Solution Approach**: Vary response types; include statements, reactions, corrections, additional context

#### Layer 4: Transition Smoothness

- **Problem**: When scenario drifts, transition is jarring and unnatural
- **Root Cause**: Agent shifts topics without bridge or explanation
- **Impact**: Breaks immersion; confuses user about what they should be practicing
- **Solution Approach**: If scenario changes, do it intentionally with user agreement or natural narrative progression

---

### 4. Conversation Continuity (2 mentions) - Layered Problem

#### Layer 1: No Memory Between Sessions

- **Problem**: Each conversation starts fresh; can't reference prior topics
- **Root Cause**: Conversations treated as isolated; no persistent memory system
- **Impact**: Users can't build deeper relationships; have to re-establish context each time
- **Solution Approach**: Implement persistent conversation history; allow AI partner to reference past conversations

#### Layer 2: Relationship Building Blocked

- **Problem**: Can't ask follow-up questions to deepen relationship with same AI partner (e.g., Lily)
- **Root Cause**: No "favorites" or "personality" system that carries between conversations
- **Impact**: Feels transactional; users want to know the AI and have AI know them
- **Solution Approach**: Create character profiles for AI partners that persist; allow them to remember user preferences

#### Layer 3: Cognitive Load of Starting Over

- **Problem**: Overwhelming to meet new AI partner, decide on scenario, and start new conversation each time
- **Root Cause**: Every conversation requires full setup/ramp-up
- **Impact**: Users get tired; momentum is lost; learning feels episodic not progressive
- **Solution Approach**: Add "resume conversation" or "continue with [Partner]" quick-start options

#### Layer 4: Loss of Progress Tracking

- **Problem**: Can't see growth trajectory across conversations with same partner
- **Root Cause**: No unified progress tracking across sessions
- **Impact**: Users don't feel sense of progression; can't see they're improving
- **Solution Approach**: Add cumulative progress dashboard; show growth over time with each partner/language

---

### 5. Analysis/Grammar Feedback (3 mentions) - Feature Depth Layers

#### Layer 1: Breadth vs. Depth

- **Problem**: Analysis exists but is shallow; doesn't go deep enough
- **Root Cause**: Current analysis might only highlight obvious errors or general strengths
- **Impact**: Users want more detailed guidance; feature feels incomplete
- **Solution Approach**: Expand analysis to cover multiple dimensions (grammar, vocabulary, pronunciation, register)

#### Layer 2: Actionability Gap

- **Problem**: Analysis tells user WHAT they did wrong but not HOW to fix it
- **Root Cause**: Analysis is diagnostic, not prescriptive
- **Impact**: Users know they made an error but don't know path to improvement
- **Solution Approach**: Add "how to improve" section; suggest alternative phrases; explain grammar rules

#### Layer 3: Vocabulary Expansion Missing

- **Problem**: Analysis doesn't suggest synonyms or alternative word choices
- **Root Cause**: Not built into current analysis feature
- **Impact**: Users can't expand vocabulary; analysis feels incomplete
- **Solution Approach**: Add vocabulary suggestions; show "more natural ways to say this"

#### Layer 4: Pronunciation Guidance Absent

- **Problem**: No feedback on user's actual pronunciation; no tools to improve it
- **Root Cause**: Not captured or analyzed from user input
- **Impact**: Users can't improve accent/pronunciation; some languages (Chinese tones, Spanish) critical for this
- **Solution Approach**: Add pronunciation analysis; compare user audio to native speaker; suggest improvements

#### Layer 5: Monetization/Premium Potential

- **Problem**: Analysis feature is good but Martin says it needs enhancement to justify paid tier
- **Root Cause**: Current analysis not comprehensive enough to justify premium tier
- **Impact**: Can't monetize advanced learners; missing revenue opportunity
- **Solution Approach**: Make analysis comprehensive, actionable, and visually rich; position as premium feature

---

## 🔗 How This Feeds Your Solo Founder Action Plan

This triage document informs your **four daily execution blocks**:

### Block 1: Morning Practice & Signal Testing

**What to prioritize**: Test fixes for 🔴 Critical issues first

- Practice the scenario that exposes the friction
- Document the "Moment of Value" when issue is fixed
- Example: If testing push-to-talk UX, practice "Meeting partner's family" with new flow

### Block 2: Content & Narrative

**What to share with your ICPs**: Breakthrough stories tied to fixes

- "We heard from Sofia-type users that push-to-talk was confusing. Here's what we built."
- "Mark told us scenarios felt generic. We added [specific solution]. Here's why it matters."
- Use these layered problems to craft narrative about how you're solving for real behavior

### Block 3: Outreach & Growth

**What to ask in conversations**: Probe deeper into these layered issues

- When asking "Return Trigger": "What would make you trust the app is solving for YOUR conversation?"
- When asking "Point of Friction": Reference one of these findings (e.g., "Some users said the agent felt like an interviewer. Is that your experience?")
- Tag new feedback by Signal Phase so you see if fixes move the needle

### Block 4: Reflection & Planning

**What to track in Pattern Tracker**: Tag by priority

- Critical issues (🔴) = **must** test next week; impacts your Moment of Value claim
- High issues (🟡) = test if time allows; impacts retention metrics
- Medium issues (🟠) = backlog; capture feedback but don't let polish issues block core fixes
- Update Kanban with persona tags so you see which fixes matter most to Sofia, David, Jamie

---

## 🎯 Next Steps for Triage

### Immediate (This Week)
- [ ] Contact Scott Huson for conversation logs (memory issue)
- [ ] Review agent verbosity in prompt engineering
- [ ] Test push-to-talk feature usability

### This Sprint
- [ ] Fix language/scenario persistence (if not already done)
- [ ] Implement audio playback/slow-down feature
- [ ] Add scenario adherence guardrails to agent
- [ ] Review and fix account creation flow
- [ ] Implement search for languages/scenarios

### Next Sprint
- [ ] Improve analysis feature depth (grammar, vocabulary, pronunciation)
- [ ] Add conversation continuity features
- [ ] Implement scenario-specific content library
- [ ] Support additional language dialects

---

## 📌 Notes

- **Quick wins**: Audio playback, scenario search, legend for difficulty colors
- **High effort/High value**: Agent verbosity fix, conversation continuity, scenario adherence
- **Nice to have**: Additional dialects, advanced scenario content, pronunciation features
