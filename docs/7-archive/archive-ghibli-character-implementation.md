# Ghibli Character Implementation Plan

**Status**: READY TO EXECUTE
**Existing System**: `/dev/animated` (fully functional)
**Goal**: Add Ghibli-style character faces to increase paid conversion (1% → 8-10%)

---

## ✅ What Already Exists

### 1. **Complete Generation System** (`/dev/animated`)

- Full UI for generating character images
- OpenAI DALL-E 3 & GPT-Image-1 integration
- Studio Ghibli-style prompts for all 25+ speakers
- Batch generation capability
- Live preview and download

### 2. **Conversation Ending Flow**

- "End conversation" button in ConversationFab (line 89-100)
- Transitions to ConversationReviewableState
- Shows summary → **"Get Learning Analysis" button**
- User can press button to end and go to analysis ✅

### 3. **Transcript Toggle**

- Transcript is controllable via UI settings
- Can be shown/hidden based on user preference
- No need to remove completely ✅

---

## 📋 Implementation Tasks

### **PHASE 1: Generate Character Images** (Week 1)

#### Task 1.1: Generate Initial Characters (2-3 hours)

**Priority**: CRITICAL (Justin validated this increases conversion)

**Steps:**

1. Go to http://localhost:5173/dev/animated (or your dev URL)
2. Select model: **DALL-E 3** (most consistent for Ghibli style)
3. Generate these characters first:
   - **Yuki** (Tokyo woman, ja-jp-female) - warm, friendly
   - **Hiro** (Tokyo man, ja-jp-male) - casual, relaxed
   - **Minami** (Osaka woman, ja-jp-female-kansai) - energetic
   - **Korean female character** (for K-drama scenarios)
   - **Korean male character** (for K-drama scenarios)
4. Download images from generated results
5. Review for quality and cultural sensitivity

**Cost**: ~$0.40 (5 images × $0.08)
**Time**: 30 minutes (with 2-second delays between requests)

**Validation Checklist:**

- [ ] Character looks friendly and approachable
- [ ] Ghibli aesthetic (soft watercolors, expressive eyes)
- [ ] Culturally respectful representation
- [ ] Works at 40x40px size (avatar display)
- [ ] No multiple people in single image

#### Task 1.2: Batch Generate Remaining Characters (Optional)

**Priority**: MEDIUM (do after validating Task 1.1)

**Steps:**

1. Click "Generate All 3 Japanese Speakers" button
2. Wait for batch to complete (includes 2-second delays)
3. Review and download all images
4. Repeat for Korean, Spanish speakers if needed

**Cost**: ~$2-3 for 25-30 characters
**Time**: 1-2 hours

---

### **PHASE 2: Optimize & Store Images** (Week 1)

#### Task 2.1: Process Images

**Tools needed**: Image optimization tool (e.g., Squoosh, ImageMagick, Sharp)

**Steps:**

1. Resize all images to 256x256px (source resolution)
2. Convert to WebP format
3. Optimize to <20KB per image
4. Rename with consistent naming:
   ```
   yuki-tokyo-female.webp
   hiro-tokyo-male.webp
   minami-osaka-female.webp
   korean-female-seoul.webp
   korean-male-seoul.webp
   ```

**Image Optimization Script** (if needed):

```bash
# Install Sharp (Node.js)
npm install sharp

# Batch optimize script
node scripts/optimize-characters.js
```

#### Task 2.2: Store Images

**Directory**: `/src/lib/assets/characters/`

**Steps:**

1. Create directory: `mkdir -p src/lib/assets/characters`
2. Copy optimized images to directory
3. Add to git (these are art assets, should be committed)

**File structure:**

```
src/lib/assets/characters/
├── yuki-tokyo-female.webp
├── hiro-tokyo-male.webp
├── minami-osaka-female.webp
├── korean-female-seoul.webp
├── korean-male-seoul.webp
└── ... (more characters)
```

---

### **PHASE 3: Code Integration** (Week 1-2)

#### Task 3.1: Update Speaker Schema

**File**: `/src/lib/server/db/schema/speakers.ts`

**Change**: Add optional character image fields

```typescript
export const speakers = pgTable('speakers', {
	// ... existing fields ...
	characterImageUrl: text('character_image_url'), // NEW
	characterImageAlt: text('character_image_alt') // NEW
});
```

**Migration needed**: Yes (add columns to speakers table)

#### Task 3.2: Update Speakers Data

**File**: `/src/lib/data/speakers.ts`

**Change**: Add image URLs to speaker objects

```typescript
{
  id: 'ja-jp-female',
  voiceName: 'Yuki',
  // ... existing fields ...
  characterImageUrl: '/src/lib/assets/characters/yuki-tokyo-female.webp',
  characterImageAlt: 'Yuki, a warm and friendly woman from Tokyo'
}
```

**Repeat for all generated characters**

#### Task 3.3: Update MessageBubble Component

**File**: `/src/lib/features/conversation/components/MessageBubble.svelte`
**Lines to modify**: 200-218 (avatar display section)

**Current code** (simplified):

```svelte
{#if isUser && userManager.user.avatarUrl}
	<img alt={avatarAlt} src={userManager.user.avatarUrl} />
{:else if isUser}
	<!-- User initials -->
{:else}
	<!-- AI avatar - currently shows kitsune.webp -->
	<img alt={avatarAlt} src={kitsune} />
{/if}
```

**New code** (add character image support):

```svelte
{#if isUser && userManager.user.avatarUrl}
	<img alt={avatarAlt} src={userManager.user.avatarUrl} />
{:else if isUser}
	<!-- User initials -->
{:else}
	<!-- AI avatar - show character image if available, fallback to kitsune -->
	{#if speaker?.characterImageUrl}
		<img alt={speaker.characterImageAlt || avatarAlt} src={speaker.characterImageUrl} />
	{:else}
		<img alt={avatarAlt} src={kitsune} />
	{/if}
{/if}
```

**Testing**: Verify character images display correctly in conversation

---

### **PHASE 4: A/B Test & Validate** (Week 2)

#### Task 4.1: Deploy Character Images

**Steps:**

1. Commit changes to git
2. Push to production
3. Verify images load correctly
4. Check performance (image load times)

#### Task 4.2: Track Metrics

**Measure** (over 2 weeks):

- Conversation completion rate
- User return rate (next day)
- Paid conversion rate (baseline: 1%, target: 3%+)
- User feedback: "Do you remember the character's name?"

**Analytics to add**:

```typescript
track('character_face_displayed', {
	characterName: speaker.voiceName,
	scenarioType: scenario.role,
	hasCustomImage: !!speaker.characterImageUrl
});
```

#### Task 4.3: Collect Feedback

**Questions to ask users**:

- "What did you think of [Character Name]?"
- "Did the character's appearance make the conversation feel more real?"
- "Would you come back to practice with [Character Name] again?"

**Success Criteria**:

- If paid conversion increases by 2%+ → Commission professional art
- If users mention character by name → Strong emotional connection
- If return rate increases → Characters increase stickiness

---

### **PHASE 5: Professional Commission** (If Validated)

#### Task 5.1: Only If Phase 4 Shows Success

**Trigger**: Paid conversion increases to 3%+ (2% lift)

**Budget**: $300-1000 for 10-15 characters
**Timeline**: 2-4 weeks
**Where to hire**: Fiverr, ArtStation, Coconala (Japanese freelance)

**Style Guidelines for Artist**:

- Studio Ghibli aesthetic (provide reference images)
- Soft watercolors, warm tones
- Friendly, approachable expressions
- Headshots, simple backgrounds
- 256x256px minimum, WebP format
- Consistent style across all characters

---

## 🎯 Quick Start (This Week)

### **Day 1: Generate & Review** (3 hours)

1. Open `/dev/animated`
2. Generate 5 characters (Yuki, Hiro, Minami, 2 Korean)
3. Review quality
4. Download images

### **Day 2: Optimize & Store** (2 hours)

1. Resize to 256x256px
2. Convert to WebP, optimize to <20KB
3. Copy to `/src/lib/assets/characters/`
4. Commit to git

### **Day 3: Code Integration** (3 hours)

1. Update Speaker schema (add characterImageUrl field)
2. Run migration
3. Update speakers.ts data
4. Modify MessageBubble.svelte
5. Test locally

### **Day 4-5: Deploy & Monitor** (2 hours)

1. Push to production
2. Verify images display
3. Set up analytics tracking
4. Monitor for 2 weeks

---

## 📊 Success Metrics

### **Target Outcomes**:

- Paid conversion: 1% → 3%+ (2% lift = success)
- Return rate: Increase by 10%+
- User mentions character by name: 30%+ of feedback
- "Magic moment" completion rate: Increase by 5%+

### **If Successful**:

- Commission professional Ghibli art ($300-1000)
- Expand to 20-30 characters (all languages)
- Add character personality variations per scenario
- Implement "Continue with [Character Name]" feature

### **If Not Successful**:

- Keep system for future use
- Focus on other conversion factors (AI persona, backgrounds, etc.)
- Cost: <$10 invested, minimal technical debt

---

## 🔧 Technical Implementation Details

### **Files to Modify**:

```
/src/lib/server/db/schema/speakers.ts       - Add image fields
/src/lib/data/speakers.ts                   - Add image URLs
/src/lib/features/conversation/components/MessageBubble.svelte  - Display logic
/src/lib/assets/characters/                 - New directory (images)
```

### **Dependencies**:

- None (uses existing OpenAI API key)
- Optional: Sharp or ImageMagick for optimization

### **Database Migration**:

```sql
ALTER TABLE speakers
ADD COLUMN character_image_url TEXT,
ADD COLUMN character_image_alt TEXT;
```

### **Rollback Plan**:

If character images cause issues:

1. Set `speaker.characterImageUrl = null` in speakers.ts
2. Falls back to kitsune.webp automatically
3. No code changes needed (graceful fallback)

---

## 💡 Steve Jobs / Jony Ive Design Principles Applied

### **"Does This Serve The Magic Moment?"** ✅

- Users connect emotionally with characters → practice feels real
- Characters have names and personalities → "I practiced with Yuki"
- Differentiates from generic competitors (Pingo.AI lacks personality)

### **"Remove Everything That Doesn't Matter"** ✅

- Focus on 5-10 key characters first, not all 25+ speakers
- Simple implementation: just image URL, no complex system
- Graceful fallback: if no image, show kitsune (no breaking changes)

### **"Make It Memorable"** ✅

- Ghibli style = warm, nostalgic, instantly recognizable
- Each character has personality (not just "Tokyo woman voice")
- Users remember "Yuki" not "Japanese female speaker"

---

## 📝 Next Steps

**Immediate (This Week)**:

1. [ ] Go to `/dev/animated` and generate 5 characters
2. [ ] Download and optimize images
3. [ ] Store in `/src/lib/assets/characters/`
4. [ ] Update code (schema, data, component)
5. [ ] Test locally

**Short-term (Week 2)**:

1. [ ] Deploy to production
2. [ ] Track conversion metrics
3. [ ] Collect user feedback
4. [ ] Decide: Commission professional art or iterate?

**Long-term (Month 2+)**:

1. [ ] Expand to 20-30 characters if successful
2. [ ] Add character personality variations
3. [ ] Implement "Continue with [Character]" feature
4. [ ] Add character-specific scenarios

---

**Last Updated**: November 12, 2025
**Owner**: Hiro Kuwana
**Status**: READY TO START (system already built, just needs execution)
