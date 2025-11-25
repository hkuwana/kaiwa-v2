# PR #4 Testing Guide

This guide provides multiple methods for testing the PathGeneratorService and API endpoints.

---

## 🎯 Testing Methods

### Method 1: Direct Service Testing (Recommended)

**Advantages:**
- ✅ No dev server required
- ✅ Direct database verification
- ✅ Tests core service logic
- ✅ Fast and isolated

**How to run:**

```bash
# Run the test script
pnpm tsx scripts/test-pr4-path-generator.ts
```

**What it tests:**
1. Path creation from user preferences (7-day course)
2. Path creation from creator brief (7-day course)
3. Database persistence verification
4. Queue job creation verification
5. Queue statistics

**Expected output:**
```
🚀 PR #4 Testing Suite
============================================================
Testing PathGeneratorService and related functionality

🧪 TEST 1: Creating path from user preferences
============================================================
✅ SUCCESS: Path created from preferences
💾 Database verification:
  - Path exists in DB: true
  - Title: [Generated title]
  - Days: 7
  - Status: draft
📋 Queue verification:
  - Jobs created: 7
  - Expected jobs: 7
  - Match: ✅

🧪 TEST 2: Creating path from creator brief
============================================================
✅ SUCCESS: Path created from creator brief
[... similar output ...]

🧪 TEST 3: Checking queue statistics
============================================================
📊 Queue Statistics:
  - Pending: 14
  - Processing: 0
  - Ready: 0
  - Failed: 0
  - Total: 14

============================================================
📊 TEST SUMMARY
============================================================
Test 1 (Preferences): ✅ PASS
Test 2 (Creator Brief): ✅ PASS
Test 3 (Queue Stats): ✅ PASS

🎉 ALL TESTS PASSED!
```

---

### Method 2: API Testing via curl (If dev server is running)

**Prerequisites:**
- Dev server running on HTTPS (`pnpm dev`)
- Valid OpenAI API key configured

#### Test 1: Create path from preferences

```bash
curl -X POST https://localhost:5173/api/learning-paths/from-preferences \
  -H "Content-Type: application/json" \
  -d '{
    "userPreferences": {
      "targetLanguageId": "ja",
      "currentLanguageLevel": "A2",
      "practicalLevel": "intermediate beginner",
      "learningGoal": "Connection",
      "specificGoals": ["Have meaningful conversations"],
      "challengePreference": "moderate",
      "correctionStyle": "gentle"
    },
    "presetName": "Test Course",
    "presetDescription": "A test learning path",
    "duration": 7
  }' -k
```

**Expected response:**
```json
{
  "success": true,
  "data": {
    "pathId": "lp-abc123...",
    "path": {
      "id": "lp-abc123...",
      "title": "Mastering Japanese Conversation",
      "description": "7-day journey to meaningful connections",
      "targetLanguage": "ja",
      "totalDays": 7,
      "status": "draft"
    },
    "queuedJobs": 7
  },
  "message": "Learning path created successfully",
  "timestamp": "2025-11-25T..."
}
```

#### Test 2: Create path from creator brief

```bash
curl -X POST https://localhost:5173/api/learning-paths/from-brief \
  -H "Content-Type: application/json" \
  -d '{
    "brief": "Create a 7-day intensive course for preparing to meet your Japanese partner'\''s parents. Focus on formal greetings, gift-giving etiquette, and keigo.",
    "targetLanguage": "ja",
    "duration": 7,
    "difficultyRange": {
      "start": "A2",
      "end": "B1"
    },
    "primarySkill": "conversation",
    "metadata": {
      "category": "relationships",
      "tags": ["family", "formal", "culture"]
    }
  }' -k
```

#### Test 3: List all paths

```bash
# List all paths (requires authentication)
curl https://localhost:5173/api/learning-paths -k

# List public templates
curl https://localhost:5173/api/learning-paths?isPublic=true -k
```

#### Test 4: Get specific path

```bash
# Replace {pathId} with actual path ID from creation response
curl https://localhost:5173/api/learning-paths/{pathId} -k
```

#### Test 5: Update path

```bash
curl -X PATCH https://localhost:5173/api/learning-paths/{pathId} \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Title",
    "status": "active"
  }' -k
```

#### Test 6: Delete path

```bash
curl -X DELETE https://localhost:5173/api/learning-paths/{pathId} -k
```

---

### Method 3: Database Verification (Supabase Dashboard)

After running tests, verify in Supabase:

**1. Check `learning_paths` table:**
- Should have 2 new rows (from test script) or more (from curl tests)
- Verify `title`, `description`, `schedule` (JSON array), `status`
- Check `targetLanguage` is 'ja'
- Verify `schedule` has 7 day objects with themes and objectives

**2. Check `scenario_generation_queue` table:**
- Should have 14 new rows (7 per path from test script)
- Each row should have:
  - `pathId` matching created paths
  - `dayIndex` from 1 to 7
  - `status` = 'pending'
  - `targetGenerationDate` set
  - `retryCount` = 0

**3. Query examples:**

```sql
-- View created paths
SELECT id, title, target_language, status,
       jsonb_array_length(schedule) as day_count
FROM learning_paths
ORDER BY created_at DESC
LIMIT 5;

-- View queue jobs
SELECT path_id, day_index, status, created_at
FROM scenario_generation_queue
ORDER BY created_at DESC
LIMIT 14;

-- Check queue statistics
SELECT
  status,
  COUNT(*) as count
FROM scenario_generation_queue
GROUP BY status;
```

---

## 🐛 Troubleshooting

### Issue: "OpenAI completion failed"

**Cause:** Missing or invalid OpenAI API key

**Fix:**
```bash
# Check if API key is set
echo $OPENAI_API_KEY

# Set it if missing (in .env file)
OPENAI_API_KEY=sk-...
```

### Issue: "Table does not exist"

**Cause:** Database migration not run

**Fix:**
```bash
# Generate and run migration
pnpm db:generate
pnpm db:push
```

### Issue: "Repository not found"

**Cause:** Repositories not exported in index (intentionally commented out)

**Fix:** This is expected. The test script imports repositories directly from files, not from the index.

### Issue: "Failed to fetch" in dev server

**Cause:** Repository exports breaking existing routes

**Fix:** Use Method 1 (direct service testing) instead of API testing

---

## ✅ Success Criteria

PR #4 is working correctly if:

- [x] Test script runs without errors
- [x] Both paths created successfully (preferences + brief)
- [x] Paths visible in `learning_paths` table
- [x] Each path has correct number of days (7)
- [x] Schedule contains themes, objectives, difficulty levels
- [x] Queue jobs created (14 total: 7 per path)
- [x] Queue jobs have status 'pending'
- [x] Queue stats show correct totals
- [x] No TypeScript compilation errors

---

## 📊 Expected Test Results

### Successful Test Output Indicators:

1. **Path Creation:**
   - ✅ "SUCCESS: Path created from preferences"
   - ✅ "SUCCESS: Path created from creator brief"

2. **Database Verification:**
   - ✅ Path exists in DB: true
   - ✅ Days count matches expected (7)
   - ✅ Status is 'draft'

3. **Queue Verification:**
   - ✅ Jobs created matches expected (7)
   - ✅ Queue stats show pending jobs (14)

4. **Final Summary:**
   - ✅ ALL TESTS PASSED!
   - Exit code: 0

---

## 🎯 Next Steps After Successful Testing

1. **Review generated content:**
   - Check syllabus quality in database
   - Verify themes are coherent and progressive
   - Ensure learning objectives are clear

2. **Prepare for PR #5:**
   - Queue processor will consume these pending jobs
   - Generate actual scenarios for each day
   - Update queue status from pending → ready

3. **Optional cleanup:**
   - Delete test paths from database
   - Clear test queue jobs
   ```sql
   DELETE FROM scenario_generation_queue WHERE path_id LIKE 'lp-%';
   DELETE FROM learning_paths WHERE id LIKE 'lp-%';
   ```

---

## 📝 Notes

- Test paths are created with `userId = null` (anonymous)
- Each test creates a 7-day course (shorter for faster testing)
- Production paths will typically be 28-30 days
- Queue jobs won't be processed until PR #5 (queue processor) is implemented
- OpenAI API calls may take 5-10 seconds per path generation
- Costs: ~$0.01-0.02 per test run (using gpt-4o-mini)
