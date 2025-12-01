# 🧪 Testing the Adaptive Learning System

This guide shows you exactly where to find and test the new adaptive learning system.

---

## 🎯 Where to Access It

### **Option 1: Dashboard (Main Entry Point) ✨**

**URL**: `/dashboard`

**What you'll see**:
1. **Sidebar** (right side):
   - Featured card: "New: Flexible Learning"
   - Big blue button: **"Start 4-Week Path"**
   - Description of the adaptive system

2. **Main area** (if you have no active paths):
   - Center CTA with the same "Start 4-Week Path" button

**Screenshot location**:
```
┌─────────────────────────────────────────────────────┐
│  Dashboard                                          │
│  ┌─────────┬─────────────────────────────────────┐ │
│  │ Main    │ Sidebar                             │ │
│  │ Content │ ┌────────────────────────────────┐  │ │
│  │         │ │ 🚀 New: Flexible Learning     │  │ │
│  │         │ │ 4-week adaptive paths that    │  │ │
│  │         │ │ adjust to your progress...    │  │ │
│  │         │ │                               │  │ │
│  │         │ │ [Start 4-Week Path]  ←───────┼──┼─ Click here!
│  │         │ └────────────────────────────────┘  │ │
│  │         │                                     │ │
└──┴─────────┴─────────────────────────────────────┴─┘
```

---

## 🚀 Step-by-Step: Create Your First Adaptive Path

### **Step 1: Set Up Database (ONE TIME ONLY)**

⚠️ **Must do this first or nothing will work!**

```bash
# 1. Make sure DATABASE_URL is in your .env file
# 2. Run migrations
pnpm db:push

# 3. Seed the session types
npx tsx src/lib/server/db/seed/seed-session-types.ts
```

You should see:
```
✅ Successfully seeded 6 session types!
   ☕ Quick Check-in
   📖 Story Moment
   ❓ Question Game
   🎭 Mini Roleplay
   🔄 Review Chat
   🌊 Deep Dive
```

### **Step 2: Navigate to Dashboard**

```bash
# Start your dev server
pnpm dev

# Open browser to:
http://localhost:5173/dashboard
```

### **Step 3: Click "Start 4-Week Path"**

Look for the big blue button in the sidebar (or center if you have no paths).

A modal will open with this form:

```
┌─────────────────────────────────────────────────┐
│  Start Your 4-Week Learning Path               │
│                                                 │
│  Path Title: [________________________]         │
│  e.g., "Dutch for Meeting Lisa's Parents"      │
│                                                 │
│  Description: [________________________]        │
│  What's your goal for this path?               │
│                                                 │
│  Choose a Theme:                                │
│  ○ Daily Life                                   │
│  ● Meeting Family  ← Example selection          │
│  ○ Professional                                 │
│                                                 │
│  Your Current Level:                            │
│  [A1] [A2✓] [B1] [B2]                          │
│                                                 │
│  Specific Goal (Optional): [_____________]      │
│  e.g., "Christmas dinner with in-laws"         │
│                                                 │
│  [Cancel]  [Create Path]                       │
└─────────────────────────────────────────────────┘
```

### **Step 4: Fill Out the Form**

**Example values to test**:
- **Title**: `Dutch for Meeting Lisa's Parents`
- **Description**: `I'm meeting my girlfriend's parents next month and want to be able to have basic conversations with them.`
- **Theme**: Select **"Meeting Family"**
- **Level**: Select **"A2 - Elementary"**
- **Goal**: `Family dinner on Christmas Eve`

Click **"Create Path"**

### **Step 5: You'll Be Redirected to the Week Dashboard**

**URL**: `/path/[pathId]` (e.g., `/path/nl-adaptive-xyz123`)

**What you'll see**:

```
┌─────────────────────────────────────────────────────────────┐
│  Week 1: Introducing Myself                                 │
│  "Start with the familiar. Talk about yourself..."          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Progress this week                                  │   │
│  │  ░░░░░░░░░░░░░░░░░  0 of 5 suggested sessions       │   │
│  │  0 minutes practiced                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Pick a session:                                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │ ☕        │ │ 📖        │ │ ❓        │ │ 🎭        │      │
│  │ Quick    │ │ Story    │ │ Question │ │ Mini     │      │
│  │ Check-in │ │ Moment   │ │ Game     │ │ Roleplay │      │
│  │ 3-5 min  │ │ 5-8 min  │ │ 5-7 min  │ │ 8-10 min │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│                                                             │
│  Or choose a conversation topic:                            │
│  • "Introduce yourself"                                     │
│  • "How you met your partner"                               │
│  • "Your hobbies and interests"                             │
│  • "What you do for work"                                   │
│  • "Ask about their life"                                   │
└─────────────────────────────────────────────────────────────┘
```

### **Step 6: Start a Session**

1. **Click any session type** (e.g., ☕ Quick Check-in)
2. You'll be redirected to a conversation: `/app/conversations/[conversationId]`
3. **Have your conversation** (the existing conversation UI)

### **Step 7: Complete the Session**

After the conversation, you would normally see a completion flow. For testing:

```bash
# Manually complete via API (or integrate into your conversation end flow)
curl -X PATCH http://localhost:5173/api/conversations/[conversationId]/complete-adaptive \
  -H "Content-Type: application/json" \
  -d '{
    "comfortRating": 4,
    "mood": "good"
  }'
```

**Or use the PostSessionCard component** in your conversation end flow.

### **Step 8: Return to Week Dashboard**

Navigate back to `/path/[pathId]`

**You should see**:
```
Progress this week
████████░░░░░░░░░░  1 of 5 suggested sessions  ← Updated!
5 minutes practiced                              ← Updated!
```

---

## 🔍 Testing Different Scenarios

### **Test 1: Create Multiple Adaptive Paths**

- Click "Start 4-Week Path" again
- Choose **different themes** (Daily Life, Professional)
- Choose **different levels** (A1, B1, B2)
- See how the conversation seeds change

### **Test 2: Complete Multiple Sessions**

- Start 3-5 sessions in one week
- Mix different session types (Quick Check-in, Story Moment, etc.)
- Watch the progress bar fill up
- See the encouragement messages change

### **Test 3: Test All Session Types**

Try each of the 6 session types:
1. ☕ **Quick Check-in** (3-5 min) - Warm, casual conversation
2. 📖 **Story Moment** (5-8 min) - Tell a story about something
3. ❓ **Question Game** (5-7 min) - Practice Q&A
4. 🎭 **Mini Roleplay** (8-10 min) - Act out a scenario
5. 🔄 **Review Chat** (5-7 min) - Revisit earlier topics
6. 🌊 **Deep Dive** (12-15 min) - Longer, deeper conversation

### **Test 4: Combine with Conversation Seeds**

1. Click a **conversation seed** (e.g., "Introduce yourself")
2. It gets highlighted/selected
3. Then click a **session type**
4. The session should incorporate that topic

---

## 📍 All the Places You Can Access It

### **1. Dashboard** ⭐ (Main entry point)
- **URL**: `/dashboard`
- **Location**: Sidebar "Flexible Learning" card
- **When**: Always visible

### **2. Direct Link to Existing Path**
- **URL**: `/path/[pathId]`
- **Location**: Navigate directly if you know the ID
- **When**: After creating a path

### **3. User's Active Paths List**
- Adaptive paths show up in your dashboard's "Active Paths" list
- Click them to see the Week Dashboard instead of the classic calendar

---

## 🎨 Visual Differences: Classic vs Adaptive

### **Classic Path** (old 28-day system)
```
Path View:
- Calendar with 28 days
- "Day 5 of 28" progression
- Rigid daily lessons
- Fixed scenarios
```

### **Adaptive Path** (new flexible system)
```
Path View:
- Weekly dashboard
- "3 conversations this week" progression
- Choose your own session type
- Pick topics you're interested in
- No "Day X of Y" guilt
```

The same `/path/[pathId]` URL automatically detects which type it is!

---

## 🐛 Troubleshooting

### **Problem: "Start 4-Week Path" button doesn't work**
**Solution**:
1. Check browser console for errors
2. Make sure you ran `pnpm db:push`
3. Make sure you ran the seed script

### **Problem: Modal opens but "Create Path" fails**
**Solution**:
1. Check network tab for API errors
2. Verify DATABASE_URL is set correctly
3. Check that session types are seeded:
   ```bash
   npx tsx src/lib/server/db/seed/seed-session-types.ts
   ```

### **Problem: Week Dashboard shows no session types**
**Solution**:
- Run the seed script again
- Check database has `session_types` table with 6 rows

### **Problem: Starting a session doesn't create a conversation**
**Solution**:
- Check API logs for `/api/learning-paths/[pathId]/sessions`
- Verify your conversation creation flow is working

---

## 📊 Database Queries for Testing

### **Check created paths**
```sql
SELECT id, title, mode, status
FROM learning_paths
WHERE mode = 'adaptive';
```

### **Check session types**
```sql
SELECT id, name, icon, duration_minutes_min, duration_minutes_max
FROM session_types
WHERE is_active = true;
```

### **Check week progress**
```sql
SELECT wp.*, aw.theme, aw.week_number
FROM week_progress wp
JOIN adaptive_weeks aw ON wp.week_id = aw.id
WHERE wp.user_id = 'your-user-id';
```

### **Check completed sessions**
```sql
SELECT ws.*, st.name as session_type_name
FROM week_sessions ws
JOIN session_types st ON ws.session_type_id = st.id
WHERE ws.completed_at IS NOT NULL
ORDER BY ws.completed_at DESC;
```

---

## 🎯 Expected Behavior Checklist

- [ ] "Start 4-Week Path" button visible on dashboard
- [ ] Modal opens with form
- [ ] Form validates required fields
- [ ] Creating path redirects to `/path/[pathId]`
- [ ] Week Dashboard displays with Week 1 theme
- [ ] 6 session type cards visible
- [ ] Conversation seeds displayed
- [ ] Clicking session type creates conversation
- [ ] Progress bar at 0 sessions initially
- [ ] After completing session, progress updates
- [ ] Encouragement message appears
- [ ] Can create multiple adaptive paths
- [ ] Can switch between different paths

---

## 📝 Quick Reference

| What | Where | URL |
|------|-------|-----|
| Create path | Dashboard sidebar | `/dashboard` |
| View path | Path page | `/path/[pathId]` |
| Week dashboard | Same as path page | `/path/[pathId]` |
| Start session | Click session type | Auto-redirects to `/app/conversations/[id]` |
| Session types | Database seed | `session_types` table |
| Week themes | Code templates | `DEFAULT_WEEK_THEMES` in schema |

---

## 🚢 Next Steps After Testing

1. ✅ Verify all session types work
2. ✅ Test different theme templates
3. ✅ Test different CEFR levels
4. 📧 Set up email weekly summaries (V2)
5. 🤖 Implement AI-generated next weeks (V2)
6. 📊 Add analytics for session completion rates

---

**Happy Testing!** 🎉

If you encounter any issues, check:
1. Database is migrated (`pnpm db:push`)
2. Session types are seeded
3. Browser console for errors
4. API logs for backend issues

Full implementation details: `docs/adaptive-learning-system.md`
