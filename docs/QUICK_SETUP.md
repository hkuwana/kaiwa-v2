# 🚀 Quick Setup Guide - Adaptive Learning System

This guide will get you up and running with the adaptive learning system in 5 minutes.

---

## ✅ **Prerequisites**

- PostgreSQL database running (local or Supabase)
- Node.js and pnpm installed

---

## 📝 **Step-by-Step Setup**

### **1. Set Up Database**

The `.env` file has already been created with a default DATABASE_URL configuration.

**Choose your database option:**

1. **Supabase** (Recommended - no local setup): See `docs/DATABASE_SETUP.md` → Option 1
2. **Local PostgreSQL**: See `docs/DATABASE_SETUP.md` → Option 2
3. **Docker**: See `docs/DATABASE_SETUP.md` → Option 3

**Quick start with Supabase:**
- Create project at [https://supabase.com](https://supabase.com)
- Get your connection string from Project Settings → Database
- Update DATABASE_URL in `.env` file

**Quick start with local PostgreSQL:**
- Install PostgreSQL (already configured in `.env`)
- Start PostgreSQL service
- Create database: `createdb kaiwa`

📚 **Detailed instructions**: See `docs/DATABASE_SETUP.md`

---

### **2. Run Database Migration**

Create all the tables:

```bash
pnpm db:push
```

**Expected output:**
```
No config path provided, using default 'drizzle.config.ts'
Reading config file...
Pulling schema from database...
Changes applied successfully!
```

---

### **3. Seed Session Types**

Populate the session_types table:

```bash
pnpm db:seed:session-types
```

Or directly with dotenv:

```bash
dotenv -e .env -- tsx src/lib/server/db/seed/seed-session-types.ts
```

**Expected output:**
```
🌱 Seeding session types...

📝 Inserting session types:

   ☕ Quick Check-in
      Duration: 3-5 min
      Category: warmup
      Exchanges: 4

   📖 Story Moment
      Duration: 5-8 min
      Category: practice
      Exchanges: 6

   ❓ Question Game
      Duration: 5-7 min
      Category: practice
      Exchanges: 8

   🎭 Mini Roleplay
      Duration: 8-10 min
      Category: challenge
      Exchanges: 8

   🔄 Review Chat
      Duration: 5-7 min
      Category: review
      Exchanges: 6

   🌊 Deep Dive
      Duration: 12-15 min
      Category: challenge
      Exchanges: 12

✅ Successfully seeded 6 session types!

📊 Verification:
   Total records in table: 6

🎉 Session types seed complete!
```

---

### **4. Start the Dev Server**

```bash
pnpm dev
```

---

### **5. Access the Admin Page**

Open your browser to:

```
http://localhost:5173/admin/adaptive-paths
```

---

## 🎯 **Create Your First Adaptive Path**

1. **Click** the "Start 4-Week Path" button
2. **Fill in** the form:
   - **Title**: e.g., "Dutch for Meeting Lisa's Parents"
   - **Description**: Your learning goal
   - **Theme**: Choose "Meeting Family", "Daily Life", or "Professional"
   - **Level**: Select A1, A2, B1, or B2
   - **Goal** (optional): e.g., "Christmas dinner on Dec 25"
3. **Click** "Create Path"
4. You'll be **redirected** to the Week Dashboard (`/path/[pathId]`)

---

## ✅ **What You Should See**

After creating a path, you'll see the **Week Dashboard**:

```
┌─────────────────────────────────────────────────────────┐
│  Week 1: Introducing Myself                             │
│  "Start with the familiar. Talk about yourself..."      │
│                                                         │
│  Progress this week                                     │
│  ░░░░░░░░░░░░  0 of 5 suggested sessions               │
│  0 minutes practiced                                    │
│                                                         │
│  Pick a session:                                        │
│  ☕ Quick Check-in (3-5 min)                           │
│  📖 Story Moment (5-8 min)                             │
│  ❓ Question Game (5-7 min)                            │
│  🎭 Mini Roleplay (8-10 min)                           │
│  🔄 Review Chat (5-7 min)                              │
│  🌊 Deep Dive (12-15 min)                              │
│                                                         │
│  Conversation topics:                                   │
│  • Introduce yourself                                   │
│  • How you met your partner                             │
│  • Your hobbies and interests                           │
│  • What you do for work                                 │
│  • Ask about their life                                 │
└─────────────────────────────────────────────────────────┘
```

---

## 🧪 **Test the Flow**

1. **Click** a session type (e.g., ☕ Quick Check-in)
2. **Have** a conversation (uses existing conversation UI)
3. **Complete** the session (manually via API or integrate PostSessionCard)
4. **Return** to `/path/[pathId]` to see progress updated

---

## 🐛 **Troubleshooting**

### **Error: "DATABASE_URL is not set"**
- Use `pnpm db:seed:session-types` instead of running tsx directly
- The `.env` file has been created with a default configuration
- Check that `DATABASE_URL` is uncommented in `.env`
- Verify your database is running (see `docs/DATABASE_SETUP.md`)
- Restart your terminal/IDE

### **PostgreSQL not installed?**
- **Use Supabase** (recommended): No installation needed, cloud-hosted
- See `docs/DATABASE_SETUP.md` for Supabase setup instructions

### **Error: "Cannot find package '$env'"**
- This is fixed in the latest commit
- Make sure you've pulled the latest changes
- Run `pnpm install` to refresh

### **Seed script says "already has X records"**
- Session types are already seeded
- Use `--force` flag to re-seed: `npx tsx src/lib/server/db/seed/seed-session-types.ts --force`

### **Database migration fails**
- Check your PostgreSQL is running
- Verify DATABASE_URL is correct
- Test connection: `psql $DATABASE_URL -c "SELECT 1;"`

---

## 📍 **Key URLs**

| URL | Purpose |
|-----|---------|
| `/admin/adaptive-paths` | Create and manage adaptive paths |
| `/path/[pathId]` | View Week Dashboard for a path |
| `/admin` | Main admin area |

---

## 📚 **Documentation**

- **Full Guide**: `docs/adaptive-learning-system.md`
- **Testing Guide**: `docs/TESTING_ADAPTIVE_LEARNING.md`

---

## 🎉 **You're Ready!**

The adaptive learning system is now fully set up and ready to test. Start creating paths and exploring the flexible weekly learning experience!

**Next Steps:**
1. Create 2-3 different adaptive paths
2. Test all 6 session types
3. Complete sessions and watch progress update
4. Test different themes (Daily Life, Meeting Family, Professional)
5. Try different CEFR levels (A1, A2, B1, B2)

---

**Branch**: `claude/continue-adaptive-learning-docs-01ENBT5gj1iHx1ei3pRpqJPD`

**Status**: ✅ All code complete and committed
