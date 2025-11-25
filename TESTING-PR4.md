# 🧪 Testing PR #4: Path Generator Service & API

Quick guide to test the learning path generation functionality.

---

## ⚡ Quick Start (Recommended)

### Option 1: Vitest Unit Tests (Best)

Test the service layer directly using vitest:

```bash
pnpm test:pr4
```

This will:
- ✅ Run comprehensive vitest test suite
- ✅ Test path creation from preferences
- ✅ Test path creation from creator brief
- ✅ Verify database persistence
- ✅ Check queue job creation
- ✅ Validate syllabus quality
- ✅ Auto-cleanup test data

**Watch mode:**
```bash
pnpm test:pr4:watch
```

**Requires:** DATABASE_URL and OPENAI_API_KEY in `.env.development`

### Option 2: API Testing (Integration)

Test via API endpoints with the dev server running:

```bash
# Terminal 1: Start dev server
pnpm dev

# Terminal 2: Run API tests
pnpm test:pr4:api
```

This will:
- ✅ Create 2 test learning paths via API
- ✅ Verify API responses
- ✅ Check queue statistics
- ✅ Display formatted results with colors

**Requires:** Dev server running on https://localhost:5173

**Expected output:**
```
🚀 PR #4 Testing Suite
============================================================

🧪 TEST 1: Creating path from user preferences
✅ SUCCESS: Path created from preferences
💾 Database verification:
  - Path exists in DB: true
  - Title: Mastering Japanese Conversation
  - Days: 7
  - Status: draft
📋 Queue verification:
  - Jobs created: 7
  - Match: ✅

🧪 TEST 2: Creating path from creator brief
✅ SUCCESS: Path created from creator brief
[... similar output ...]

🧪 TEST 3: Checking queue statistics
📊 Queue Statistics:
  - Pending: 14
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

## 📋 Prerequisites

Before testing, ensure:

1. **OpenAI API Key** is configured:
   ```bash
   # Check if set
   echo $OPENAI_API_KEY

   # If not set, add to .env file:
   OPENAI_API_KEY=sk-...
   ```

2. **Database tables** exist:
   ```bash
   # If needed, run migration
   pnpm db:push
   ```

3. **Dependencies** installed:
   ```bash
   pnpm install
   ```

---

## 🔍 What Gets Tested

### Test 1: Path from User Preferences
- Creates a 7-day learning path based on user profile
- User: A2 level Japanese learner
- Goal: Connection (meeting partner's family)
- Preset: "Meet the Parents" course

### Test 2: Path from Creator Brief
- Creates a 7-day learning path from a detailed brief
- Topic: Preparing to meet Japanese partner's parents
- Focus: Formal greetings, etiquette, keigo
- Difficulty: A2 → B1

### Test 3: Queue Statistics
- Verifies scenario generation jobs were created
- Checks queue counts (pending, processing, ready, failed)

---

## 🗄️ Database Verification

After running tests, check Supabase:

### View Created Paths
```sql
SELECT id, title, target_language, status,
       jsonb_array_length(schedule) as day_count
FROM learning_paths
ORDER BY created_at DESC
LIMIT 5;
```

### View Queue Jobs
```sql
SELECT path_id, day_index, status, created_at
FROM scenario_generation_queue
ORDER BY created_at DESC
LIMIT 14;
```

---

## 🐛 Troubleshooting

### Error: "OpenAI completion failed"
**Solution:** Check your `OPENAI_API_KEY` in `.env` file

### Error: "Table does not exist"
**Solution:** Run `pnpm db:push` to create tables

### Error: "Cannot find module"
**Solution:** Run `pnpm install` to install dependencies

### Test hangs or takes too long
**Cause:** OpenAI API call in progress (5-10 seconds per path)
**Solution:** Wait for completion. Each test creates a syllabus via AI.

---

## 📖 Detailed Documentation

For more testing options and detailed guides, see:
- **Full Testing Guide:** `docs/3-features/pr4-testing-guide.md`
- **API Testing:** See curl examples in the guide
- **Implementation Plan:** `docs/3-features/learning-path-implementation-plan.md`

---

## ✅ Success Criteria

PR #4 is working if you see:

- [x] "🎉 ALL TESTS PASSED!" at the end
- [x] 2 paths created (IDs shown in output)
- [x] 14 queue jobs created (7 per path)
- [x] Exit code 0 (no errors)

---

## 🚀 Next Steps

Once PR #4 tests pass:

1. **Review generated content** in Supabase dashboard
2. **Verify syllabus quality** (themes, objectives, progression)
3. **Move to PR #5:** Background job infrastructure for scenario generation

---

## 📝 Notes

- Tests create anonymous paths (`userId = null`)
- Each path is 7 days (faster testing than full 28-day courses)
- OpenAI API cost: ~$0.01-0.02 per test run
- Queue jobs remain 'pending' until PR #5 processor is implemented
- Safe to run multiple times (creates new paths each time)

---

## 🧹 Cleanup (Optional)

To remove test data:

```sql
-- Delete test paths and their queue jobs
DELETE FROM scenario_generation_queue
WHERE path_id IN (
  SELECT id FROM learning_paths WHERE id LIKE 'lp-%'
);

DELETE FROM learning_paths WHERE id LIKE 'lp-%';
```

Or via repository:
```typescript
// In a script or console
await learningPathRepository.deletePath('lp-...');
```
