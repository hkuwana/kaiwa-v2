# Kaiwa Feedback & Outreach Action Plan

## 1. Feedback Operating System

- Stand up a single **Feedback OS**: master tracking sheet + linked interview note docs.
- Expand the sheet with columns: `Segment`, `Use Case`, `Acquisition Source`, `Priority`, `Next Touch Date` (formula: `Last Contacted + cadence`).
- Create a reusable Google Docs template (outline below) and link each participant’s doc from their sheet row.
- Use consistent inline tags in notes (e.g., `#friction:audio-latency`, `#value:confidence`) to make search and COUNTIF formulas easy.
- Add a “Pattern Tracker” tab that auto-pulls mention counts from tags; color-code 1st/2nd/3rd occurrence to surface rising themes.
- After every session, write a one-line recap in the sheet (key quote, action number) and push each action item into a lightweight Kanban labeled `ship`, `test`, or `story`.

### Interview Doc Template

```markdown
# Participant Name — Kaiwa Feedback Session

- **Date:**
- **Context:**
- **Segment / Role:**
- **Current Practice Method:**
- **Why They’re Testing Kaiwa:**

## Three Critical Questions

- **Moment of Value:**
- **Point of Friction:**
- **Return Trigger:**

## Raw Observations

- Bullet observations with inline tags

## Verbatim Quotes

> “Quote”

## Action Items

- [ ] Action linked to Kanban card
```

## 2. Solo Founder Cadence

- Reserve two recurring blocks each week:
  - **Research Ops Hour:** update trackers, prep outreach, send follow-ups.
  - **Narrative Hour:** translate insights into copy, content, and product tweaks.
- Keep a running **Wins & Fixes changelog** (date, shipped tweak, credited participant) and reference it in follow-up messages.
- Automate reminders (Apps Script/Zapier): when `Call Completed = Yes`, trigger follow-up template + task to log insights.

## 3. Authentic Growth & Social Strategy

- Base every post on real sessions.
  - Weekly rhythm: `User breakthrough`, `Build-in-public tweak`, `Community prompt`.
- Write in first-person; highlight surprises, mistakes, and learnings to avoid AI-polish tone.
- Use AI only for outlines or hook variations, then rewrite manually. Apply a “human filter” checklist:
  1. Does it mention a real person or outcome?
  2. Does it reference what I’m shipping now?
  3. Would I say this to a friend?
- Cross-post insights: subreddit threads → LinkedIn/Twitter recaps with an invite to join the community or book sessions.
- Capture notable community comments back into the tracker as warm leads.

## 4. Community Flywheel (kaiwaJapanese & kaiwaLanguage)

- Host themed **Practice Labs / AMAs**; treat each as batch interviews. Record highlight clips and invite participants to deeper sessions.
- Publish transparent AI usage guidelines (`Draft with AI, publish in my voice`) to build trust.
- Collect community stories via a simple form; curate top submissions weekly to keep content authentic and reduce your load.

## 5. Immediate Actions

- [ ] Duplicate the interview doc template in Google Docs and link it from the master sheet.
- [ ] Add new columns + formulas (`Next Touch Date`) and tag-based COUNTIF rules to the sheet.
- [ ] Set up a Kanban for action items with `ship`, `test`, `story` labels.
- [ ] Draft a two-week social calendar covering breakthroughs, build updates, and community prompts.
- [ ] Schedule the first Practice Lab session on the subreddit and announce the format + incentive.
