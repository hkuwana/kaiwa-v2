# 🗄️ Database Setup Guide

This guide helps you set up PostgreSQL for the Kaiwa adaptive learning system.

---

## Option 1: Supabase (Recommended for Quick Start)

**Pros**: No local setup, managed service, automatic backups
**Cons**: Requires internet connection

### Steps:

1. **Create a Supabase Project**:
   - Go to [https://supabase.com](https://supabase.com)
   - Create a new project
   - Wait for it to provision (1-2 minutes)

2. **Get Your Database URL**:
   - Go to **Project Settings** → **Database**
   - Find **Connection String** → **URI**
   - Copy the connection string
   - It looks like: `postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres`

3. **Update `.env` File**:
   ```bash
   # Comment out the local DATABASE_URL
   # DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kaiwa"

   # Uncomment and use your Supabase URL
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT].supabase.co:5432/postgres"
   ```

4. **Run Migrations**:
   ```bash
   pnpm db:push
   ```

5. **Seed Session Types**:
   ```bash
   npx tsx src/lib/server/db/seed/seed-session-types.ts
   ```

---

## Option 2: Local PostgreSQL

**Pros**: Works offline, full control
**Cons**: Requires local installation

### Installation:

**Ubuntu/Debian**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**macOS** (with Homebrew):
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Windows**:
- Download from [https://www.postgresql.org/download/windows/](https://www.postgresql.org/download/windows/)
- Run the installer
- Use default settings (port 5432, username `postgres`)

### Setup:

1. **Create Database**:
   ```bash
   # Connect as postgres user
   sudo -u postgres psql

   # Create database
   CREATE DATABASE kaiwa;

   # Create user (if needed)
   CREATE USER kaiwa_user WITH PASSWORD 'your_password';

   # Grant privileges
   GRANT ALL PRIVILEGES ON DATABASE kaiwa TO kaiwa_user;

   # Exit
   \q
   ```

2. **Update `.env` File**:
   ```bash
   # Use default local setup
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kaiwa"

   # Or use custom user
   DATABASE_URL="postgresql://kaiwa_user:your_password@localhost:5432/kaiwa"
   ```

3. **Test Connection**:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

4. **Run Migrations**:
   ```bash
   pnpm db:push
   ```

5. **Seed Session Types**:
   ```bash
   npx tsx src/lib/server/db/seed/seed-session-types.ts
   ```

---

## Option 3: Docker PostgreSQL

**Pros**: Isolated, reproducible
**Cons**: Requires Docker installed

### Setup:

1. **Install Docker**:
   - Download from [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)

2. **Run PostgreSQL Container**:
   ```bash
   docker run --name kaiwa-postgres \
     -e POSTGRES_PASSWORD=postgres \
     -e POSTGRES_DB=kaiwa \
     -p 5432:5432 \
     -d postgres:16-alpine
   ```

3. **Update `.env` File**:
   ```bash
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kaiwa"
   ```

4. **Run Migrations**:
   ```bash
   pnpm db:push
   ```

5. **Seed Session Types**:
   ```bash
   npx tsx src/lib/server/db/seed/seed-session-types.ts
   ```

---

## Verification

After setup, verify everything is working:

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check tables were created
psql $DATABASE_URL -c "\dt"

# Should see: learning_paths, adaptive_weeks, session_types, etc.

# Check session types were seeded
psql $DATABASE_URL -c "SELECT id, name FROM session_types;"

# Should see 6 session types
```

---

## Troubleshooting

### Error: "DATABASE_URL is not set"
- Make sure `.env` file exists in project root
- Check that `DATABASE_URL` is uncommented
- Restart your terminal/IDE

### Error: "Connection refused"
- **Supabase**: Check your internet connection, verify URL is correct
- **Local**: Make sure PostgreSQL is running: `pg_isready`
- **Docker**: Make sure container is running: `docker ps | grep kaiwa-postgres`

### Error: "Password authentication failed"
- Check password in DATABASE_URL matches your PostgreSQL setup
- For Supabase, get the password from your Supabase dashboard

### Error: "Database does not exist"
- Create the database: `createdb kaiwa` (local) or use Supabase UI
- Verify database name in DATABASE_URL matches

---

## Next Steps

Once database is set up:

1. ✅ Start dev server: `pnpm dev`
2. ✅ Navigate to: `http://localhost:5173/admin/adaptive-paths`
3. ✅ Create your first adaptive learning path!

See `docs/QUICK_SETUP.md` for full setup instructions.
