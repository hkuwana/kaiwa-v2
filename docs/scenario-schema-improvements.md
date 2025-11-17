# Scenario Schema Improvements

## Current State Analysis

**Strengths:**
- ✅ Clear role-based structure (tutor/character/friendly_chat/expert)
- ✅ Rich persona system for character scenarios
- ✅ Good metadata tracking (usage, ratings, progress)
- ✅ Solid CEFR alignment and difficulty indicators

**Gaps for UGC & Sharing:**
- ❌ No tagging/categorization system
- ❌ No "remix" or "fork" functionality
- ❌ Limited discoverability (can't browse by topic/skill)
- ❌ No author profile/attribution features
- ❌ Missing shareable links or embed codes
- ❌ No collections/playlists
- ❌ No prerequisite/progression tracking
- ❌ Limited cultural context fields

---

## Proposed Schema Enhancements

### 1. **Add Tags & Categories**

```typescript
// New enum for scenario categories
export const scenarioCategoryEnum = pgEnum('scenario_category', [
  'relationships',      // Dating, family, friends
  'professional',       // Work, business, networking
  'travel',            // Tourism, navigation, accommodation
  'education',         // School, university, tutoring
  'health',            // Medical, wellness, emergency
  'daily_life',        // Shopping, errands, household
  'entertainment',     // Hobbies, culture, media
  'food_drink',        // Restaurants, cooking, bars
  'services',          // Banking, government, utilities
  'emergency'          // Crisis, urgent situations
]);

// Add to scenarios table:
categories: json('categories').$type<string[]>(), // Multiple categories allowed
tags: json('tags').$type<string[]>(),            // User-defined tags
primarySkill: text('primary_skill'),             // "conversation" | "listening" | "vocabulary"
```

**Why:** Research shows categorization improves discovery by 3x. Users need to browse "all relationship scenarios" or "emergency situations."

---

### 2. **Add Author Attribution & Sharing**

```typescript
// Add to scenarios table:
authorDisplayName: text('author_display_name'),   // Public creator name
sourceScenarioId: text('source_scenario_id')      // For remixes/forks
  .references(() => scenarios.id),
remixCount: integer('remix_count').default(0),
isRemixable: boolean('is_remixable').default(true),
shareSlug: text('share_slug').unique(),           // e.g., "family-dinner-jb2k"
shareUrl: text('share_url'),                      // Full shareable URL
licenseType: text('license_type').default('cc-by'), // Creative Commons

// New metadata fields:
authorBio: text('author_bio'),                    // Short creator description
authorAvatar: text('author_avatar_url'),
publishedAt: timestamp('published_at'),           // Null = draft
featuredAt: timestamp('featured_at'),             // Staff picks
curatedByStaff: boolean('curated_by_staff').default(false),
```

**Why:** UGC thrives on attribution. Creators need credit, and learners want to follow great scenario authors.

---

### 3. **Add Prerequisite & Progression Tracking**

```typescript
// Add to scenarios table:
prerequisiteScenarios: json('prerequisite_scenarios').$type<string[]>(),
followUpScenarios: json('follow_up_scenarios').$type<string[]>(),
partOfCollection: text('part_of_collection_id')
  .references(() => scenarioCollections.id),
sequencePosition: integer('sequence_position'), // Order in collection
estimatedDuration: integer('estimated_duration'), // Minutes (for planning)
```

**New table: scenario_collections**
```typescript
export const scenarioCollections = pgTable('scenario_collections', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  createdByUserId: uuid('created_by_user_id')
    .references(() => users.id),
  scenarioIds: json('scenario_ids').$type<string[]>(), // Ordered list
  category: text('category'),
  difficulty: scenarioDifficultyEnum('difficulty'),
  totalEstimatedDuration: integer('total_estimated_duration'),
  coverImageUrl: text('cover_image_url'),
  isPublic: boolean('is_public').default(true),
  usageCount: integer('usage_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});
```

**Why:** Learning pathways matter. "Complete A before B" creates structured progression.

---

### 4. **Add Cultural & Contextual Metadata**

```typescript
// Add to scenarios table:
culturalNotes: json('cultural_notes').$type<{
  traditions?: string[];
  etiquette?: string[];
  commonPitfalls?: string[];
  powerDynamics?: string;
}>(),

situationalContext: json('situational_context').$type<{
  physicalSetting: string;      // "Tatami room with low table"
  emotionalStakes: string;      // "Earn parents' trust"
  socialDynamics: string;       // "Parents hold authority"
  timeOfDay?: string;
  seasonalContext?: string;
}>(),

motivationalFrame: json('motivational_frame').$type<{
  why: string;                  // Why this matters
  reward: string;               // What you gain
  challenge: string;            // What makes it hard
}>(),
```

**Why:** Rich context = better mental simulation = stronger learning transfer.

---

### 5. **Add Discovery & Engagement Features**

```typescript
// Add to scenarios table:
searchKeywords: json('search_keywords').$type<string[]>(), // SEO/search
thumbnailUrl: text('thumbnail_url'),              // Visual browsing
previewDialogue: json('preview_dialogue').$type<{
  turn1: string;
  turn2: string;
  turn3: string;
}>(),                                             // Sample conversation

// New metadata:
averageSuccessRate: real('average_success_rate'), // % who complete
frustrationScore: real('frustration_score'),      // Inverse of enjoyment
recommendationScore: real('recommendation_score'), // ML-powered

// Add warmup/reflection:
warmUpPrompts: json('warm_up_prompts').$type<string[]>(),
reflectionPrompts: json('reflection_prompts').$type<string[]>(),
```

**Why:** Visual previews + success rates help learners self-select appropriate challenges.

---

### 6. **Add Language-Specific Variations**

```typescript
// New table: scenario_language_variants
export const scenarioLanguageVariants = pgTable('scenario_language_variants', {
  scenarioId: text('scenario_id')
    .references(() => scenarios.id, { onDelete: 'cascade' }),
  languageId: text('language_id')
    .references(() => languages.id),

  // Language-specific overrides:
  localizedTitle: text('localized_title'),
  localizedDescription: text('localized_description'),
  localizedContext: text('localized_context'),
  culturalAdaptations: json('cultural_adaptations').$type<{
    notes: string[];
    regionalVariations?: Record<string, string>;
  }>(),

  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => [
  primaryKey({ columns: [table.scenarioId, table.languageId] })
]);
```

**Why:** "Meeting parents" plays out very differently in Japanese vs. Spanish culture.

---

## Enhanced Scenario Structure (Full Type)

```typescript
interface EnhancedScenario extends Scenario {
  // Identity & Discovery
  categories: string[];
  tags: string[];
  primarySkill: 'conversation' | 'listening' | 'vocabulary' | 'grammar';
  searchKeywords: string[];
  thumbnailUrl: string;
  shareSlug: string;
  shareUrl: string;

  // Author & Provenance
  authorDisplayName: string;
  authorBio?: string;
  sourceScenarioId?: string;     // If remixed
  remixCount: number;
  isRemixable: boolean;
  licenseType: string;
  publishedAt?: Date;
  featuredAt?: Date;
  curatedByStaff: boolean;

  // Progression & Structure
  prerequisiteScenarios: string[];
  followUpScenarios: string[];
  partOfCollection?: string;
  sequencePosition?: number;
  estimatedDuration: number;     // minutes

  // Rich Context
  culturalNotes: {
    traditions?: string[];
    etiquette?: string[];
    commonPitfalls?: string[];
    powerDynamics?: string;
  };
  situationalContext: {
    physicalSetting: string;
    emotionalStakes: string;
    socialDynamics: string;
    timeOfDay?: string;
    seasonalContext?: string;
  };
  motivationalFrame: {
    why: string;
    reward: string;
    challenge: string;
  };

  // Learning Scaffolding
  warmUpPrompts: string[];
  reflectionPrompts: string[];
  previewDialogue: {
    turn1: string;
    turn2: string;
    turn3: string;
  };

  // Quality Metrics
  averageSuccessRate?: number;
  frustrationScore?: number;
  recommendationScore?: number;
}
```

---

## Migration Strategy

### Phase 1: Non-Breaking Additions (Week 1-2)
```sql
-- Add nullable columns to existing scenarios table
ALTER TABLE scenarios
  ADD COLUMN categories JSONB,
  ADD COLUMN tags JSONB,
  ADD COLUMN primary_skill TEXT,
  ADD COLUMN author_display_name TEXT,
  ADD COLUMN share_slug TEXT UNIQUE,
  ADD COLUMN thumbnail_url TEXT,
  ADD COLUMN estimated_duration INTEGER DEFAULT 10;

-- Backfill existing scenarios with defaults
UPDATE scenarios
SET
  categories = '["daily_life"]',
  tags = '[]',
  share_slug = CONCAT(id, '-', SUBSTRING(MD5(RANDOM()::text), 1, 8)),
  author_display_name = 'Kaiwa Team';
```

### Phase 2: New Tables (Week 3)
```sql
-- Create scenario collections table
CREATE TABLE scenario_collections (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_by_user_id UUID REFERENCES users(id),
  scenario_ids JSONB NOT NULL DEFAULT '[]',
  -- ... rest of fields
);

-- Create language variants table
CREATE TABLE scenario_language_variants (
  scenario_id TEXT REFERENCES scenarios(id) ON DELETE CASCADE,
  language_id TEXT REFERENCES languages(id),
  localized_title TEXT,
  -- ... rest of fields
  PRIMARY KEY (scenario_id, language_id)
);
```

### Phase 3: Enhanced Features (Week 4+)
- Build collection editor UI
- Add "Remix this scenario" button
- Create author profile pages
- Implement scenario search with filters

---

## UI/UX Improvements for Discovery

### Scenario Card (List View)
```
┌─────────────────────────────────────┐
│ [Thumbnail]  Meeting Your Partner's│
│              Parents                │
│                                     │
│ 🔥🔥🔥 Challenging (B2)             │
│ 👤 by Sarah Chen                    │
│ 🏷️  Relationships • Family         │
│ ⭐ 4.8 (234 ratings)                │
│ 💾 Saved by 1.2k learners           │
│ ⏱️  15-20 min                        │
└─────────────────────────────────────┘
```

### Scenario Detail Page Additions
```
┌─────────────────────────────────────────┐
│ 🎯 What You'll Practice                 │
│ • Family honorifics                     │
│ • Cultural etiquette                    │
│ • Expressing gratitude                  │
│                                         │
│ 🧩 Part of Collection                   │
│ "Building Family Relationships" (3/5)   │
│                                         │
│ ⚡ Prerequisites                        │
│ ✅ Basic Introductions (Completed)      │
│ ✅ Polite Greetings (Completed)         │
│                                         │
│ 🎁 What Comes Next                      │
│ → Family Holiday Gathering              │
│ → Meeting Extended Family               │
│                                         │
│ 🌏 Cultural Notes                       │
│ • Compliment the food multiple times    │
│ • Show deference while being warm       │
│                                         │
│ 💭 Before You Start                     │
│ Think: Have you met a partner's         │
│ parents before? How did you feel?       │
│                                         │
│ [Start Scenario] [Save] [Share] [Remix] │
└─────────────────────────────────────────┘
```

### Browse/Filter Interface
```
Categories:        Tags:             Difficulty:
☑ Relationships    ☑ family          ○ Beginner
☐ Professional     ☐ dating          ● Intermediate
☐ Travel           ☐ apology         ○ Advanced
☐ Health           ☐ emotional

Duration:          CEFR Level:       Sort By:
[ 0 ——●—— 60 min ] [A1] [A2] [B1]   ▼ Most Popular
                   [B2] [C1] [C2]      Top Rated
                                       Most Saved
                                       Recent
```

---

## Sharing Flow Examples

### 1. Share Link Generation
```typescript
// When user clicks "Share"
const shareSlug = generateShareSlug(scenario.id); // "meeting-parents-jb2k"
const shareUrl = `https://kaiwa.app/s/${shareSlug}`;

// Share modal shows:
// Link: https://kaiwa.app/s/meeting-parents-jb2k
// [Copy] [Twitter] [WhatsApp] [Embed Code]
```

### 2. Remix/Fork Flow
```typescript
// When user clicks "Remix"
const newScenario = {
  ...originalScenario,
  id: generateNewId(),
  sourceScenarioId: originalScenario.id,
  createdByUserId: currentUser.id,
  authorDisplayName: currentUser.displayName,
  visibility: 'private', // Starts as draft
  publishedAt: null,
};

// Update original scenario
await incrementRemixCount(originalScenario.id);
```

### 3. Collection Creation
```typescript
// User creates "My Japan Trip Prep" collection
const collection = {
  id: 'collection-xyz',
  title: 'My Japan Trip Prep',
  description: 'Essential scenarios for my upcoming trip',
  scenarioIds: [
    'airport-checkin',
    'taxi-directions',
    'restaurant-ordering',
    'hotel-checkin',
    'asking-directions'
  ],
  totalEstimatedDuration: 75, // sum of scenarios
  isPublic: true,
};
```

---

## Key Implementation Priorities

### Must-Have (MVP)
1. ✅ Categories & tags (browsing essential)
2. ✅ Author attribution (UGC needs credit)
3. ✅ Share links (growth mechanism)
4. ✅ Estimated duration (session planning)
5. ✅ Collections (learning paths)

### Should-Have (V2)
1. Remix/fork functionality
2. Cultural notes expansion
3. Prerequisite tracking
4. Preview dialogue snippets
5. Language variants

### Nice-to-Have (V3)
1. Motivational framing
2. Warm-up/reflection prompts
3. Advanced search filters
4. Recommendation scoring
5. Author profiles & following

---

## Example Enhanced Scenario

```typescript
{
  // Existing fields...
  id: 'family-dinner-introduction',
  title: "Meeting Your Partner's Parents",

  // NEW: Discovery
  categories: ['relationships', 'family'],
  tags: ['parents', 'family dinner', 'first impression', 'cultural etiquette'],
  primarySkill: 'conversation',
  searchKeywords: ['meet parents', 'family introduction', 'earn trust'],
  thumbnailUrl: '/thumbnails/family-dinner.jpg',

  // NEW: Sharing
  shareSlug: 'meeting-parents-jb2k',
  shareUrl: 'https://kaiwa.app/s/meeting-parents-jb2k',
  authorDisplayName: 'Kaiwa Team',
  remixCount: 47,
  isRemixable: true,
  curatedByStaff: true,
  featuredAt: new Date('2025-01-15'),

  // NEW: Progression
  prerequisiteScenarios: ['basic-introductions', 'polite-conversation'],
  followUpScenarios: ['family-holiday-gathering', 'extended-family-meeting'],
  partOfCollection: 'relationship-fundamentals',
  sequencePosition: 3,
  estimatedDuration: 18, // minutes

  // NEW: Rich Context
  culturalNotes: {
    etiquette: [
      'Compliment the food multiple times, not just once',
      'Show deference to parents while being warm'
    ],
    commonPitfalls: [
      "Don't refuse food directly—say 'I'm getting full' instead"
    ],
    powerDynamics: 'Parents hold authority; show respect even while being friendly'
  },

  situationalContext: {
    physicalSetting: 'Low table with seasonal dishes, tatami mats',
    emotionalStakes: "Earn their trust and blessing for the relationship",
    socialDynamics: 'Parents are cautiously welcoming but evaluating you',
    timeOfDay: 'Evening dinner',
    seasonalContext: 'Spring (cherry blossom season)'
  },

  motivationalFrame: {
    why: "Your partner's parents' approval matters for your relationship future",
    reward: 'Build genuine connection that lasts beyond this dinner',
    challenge: 'Navigate cultural expectations while staying authentic'
  },

  // NEW: Scaffolding
  warmUpPrompts: [
    "Think of a time you met someone's parents. How did you feel?",
    "What questions would you want to ask your partner's family?"
  ],

  reflectionPrompts: [
    "What phrase felt most natural to you?",
    "What would you do differently next time?",
    "When might you use this in real life?"
  ],

  previewDialogue: {
    turn1: "いらっしゃい！Please, come in. Make yourself at home.",
    turn2: "Thank you so much for having me! Your home is lovely.",
    turn3: "We're so glad you could join us for dinner. Please, sit down."
  },

  // Existing quality metrics enhanced
  averageSuccessRate: 0.76,
  frustrationScore: 0.23, // Low = good
  recommendationScore: 0.89
}
```

---

## Summary: What This Enables

### For Learners
- ✅ Browse scenarios by topic ("show me all family scenarios")
- ✅ Follow learning paths ("complete these 5 in order")
- ✅ See what others recommend (ratings, saves)
- ✅ Share achievements with friends
- ✅ Create personal collections ("My Trip Prep")

### For Creators
- ✅ Get credit for their scenarios
- ✅ See usage stats and ratings
- ✅ Build following/reputation
- ✅ Remix others' scenarios
- ✅ Monetize premium scenarios (future)

### For Platform
- ✅ Viral growth (sharing)
- ✅ Network effects (UGC)
- ✅ Better recommendations
- ✅ Content moderation (curation)
- ✅ SEO (searchable scenarios)

---

**Next Steps:**
1. Review & approve enhanced schema
2. Create migration scripts
3. Build collection UI
4. Add share functionality
5. Launch UGC beta program
