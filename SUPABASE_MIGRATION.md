# Supabase User Migration Guide

This guide helps you migrate your Supabase authentication users to your local database schema and extract email lists for beta testing.

## 🚀 Quick Start

### Step 1: Export Users from Supabase

Choose one of these methods:

#### Option A: Using the Export Script
```bash
# Set your Supabase credentials
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Export users
pnpm migrate:supabase:export
```

#### Option B: Manual Export from Dashboard
1. Go to your Supabase project → Authentication → Users
2. Click "Export" button
3. Save the file as `supabase-users.json` in your project root

#### Option C: SQL Export
Run this query in your Supabase SQL Editor:
```sql
SELECT 
  id,
  email,
  created_at,
  updated_at,
  email_confirmed_at,
  last_sign_in_at,
  user_metadata,
  app_metadata
FROM auth.users 
ORDER BY created_at ASC;
```
Export results as JSON and save as `supabase-users.json`.

### Step 2: Run Migration
```bash
# Import users to local database
pnpm migrate:supabase:import
```

This will:
- ✅ Create users in your local `users` table
- ✅ Skip existing users (safe to run multiple times)  
- ✅ Map Supabase fields to your schema
- ✅ Generate beta tester email lists
- ✅ Provide detailed migration report

## 📧 Beta Tester Email Lists

The migration automatically creates:

### `beta-testers.json`
Detailed user information:
```json
{
  "totalUsers": 25,
  "extractedAt": "2024-01-15T10:30:00Z",
  "betaTesters": [
    {
      "email": "early.adopter@example.com",
      "joinedDate": "2024-01-01T09:00:00Z",
      "name": "Early Adopter"
    }
  ]
}
```

### `beta-testers-emails.txt`
Simple list for copy/paste:
```
early.adopter@example.com
second.user@example.com
third.user@example.com
```

## 🗂️ Data Mapping

| Supabase Field | Local Field | Notes |
|----------------|-------------|-------|
| `email` | `email` | Direct mapping |
| `user_metadata.full_name` | `displayName` | Falls back to extracted name from email |
| `user_metadata.avatar_url` | `avatarUrl` | Profile picture URL |
| `email_confirmed_at` | `emailVerified` | Email verification timestamp |
| `created_at` | `createdAt` | Account creation date |
| N/A | `nativeLanguageId` | Default: 'en' (users can update) |
| N/A | `preferredUILanguageId` | Default: 'ja' (users can update) |

## 🔧 Customization

### Custom Data Source
Edit `scripts/migrate-supabase-users.ts` and modify the `loadSupabaseUsers()` function:

```typescript
async function loadSupabaseUsers(): Promise<SupabaseUser[]> {
  // Load from CSV
  const csv = await fs.readFile('./users.csv', 'utf-8');
  return parseCsv(csv);
  
  // Or connect to external API
  const response = await fetch('https://api.your-service.com/users');
  return response.json();
}
```

### Field Mapping
Modify `mapSupabaseUserToLocal()` to customize field mapping:

```typescript
function mapSupabaseUserToLocal(supabaseUser: SupabaseUser): NewUser {
  return {
    email: supabaseUser.email,
    displayName: supabaseUser.user_metadata?.display_name || 'User',
    // Add your custom mappings
    nativeLanguageId: supabaseUser.user_metadata?.preferred_language || 'en',
    // ...
  };
}
```

## 🚨 Important Notes

### Before Migration
- ✅ Backup your database: `pg_dump your_database > backup.sql`
- ✅ Test on development environment first
- ✅ Ensure your local database is running: `pnpm db:start`

### During Migration
- The script is **safe to run multiple times** (skips existing users)
- Failed migrations are logged and can be retried
- Users are created with default language settings

### After Migration
- Users will need to set their preferred languages
- Email verification status is preserved
- Consider sending welcome emails to migrated users

## 📊 Migration Report

The script provides a detailed report:
```
📊 Migration Summary:
✅ Successful: 20
⏭️  Skipped: 3
❌ Failed: 2

💥 Errors:
   Failed to migrate user invalid@email: Invalid email format
   Failed to migrate user duplicate@email: User already exists
```

## 🧪 Testing

Test the migration with sample data:

1. Create `test-users.json`:
```json
[
  {
    "id": "test-1",
    "email": "test@example.com",
    "created_at": "2024-01-01T00:00:00Z",
    "email_confirmed_at": "2024-01-01T00:01:00Z",
    "user_metadata": {
      "full_name": "Test User"
    }
  }
]
```

2. Rename to `supabase-users.json`
3. Run migration: `pnpm migrate:supabase:import`
4. Check results in database: `pnpm db:studio`

## 🆘 Troubleshooting

### "No supabase-users.json found"
- Ensure the file exists in project root
- Check file format matches the template
- Try the export script first

### "Failed to connect to database"
- Start database: `pnpm db:start`
- Check DATABASE_URL in .env
- Run migrations: `pnpm db:migrate`

### "User already exists"
- This is normal - existing users are skipped
- Check the "Skipped" count in migration report

### Email extraction issues
- Check that users have valid email addresses
- Verify date formats in your data

## 📨 Next Steps: Beta Testing

1. **Review the email list** in `beta-testers.json`
2. **Craft your outreach email** (see example in project)
3. **Send personally** - avoid bulk email tools initially
4. **Track responses** and gather feedback
5. **Iterate** based on user feedback

Ready to reach out to your early users! 🚀