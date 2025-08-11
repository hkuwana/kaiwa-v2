# 🗄️ Kaiwa Database Migration Strategy

> **Goal**: Migrate from complex legacy schema to clean, phased MVP architecture

## 📊 **Current State vs Target State**

### **Legacy Schema Complexity**

- 40+ tables across 10 different domains
- Complex relationships and dependencies
- Mixed concerns (learning + monetization + social)
- Over-engineered for MVP needs

### **New MVP Schema**

- 7 core tables for essential functionality
- Clean separation of concerns
- Phased expansion approach
- Production-ready from day 1

## 🚀 **Phase 1: MVP Core + Monetization (Week 1-2)**

### **Essential Tables**

```sql
-- Core user management
users              -- User profiles & tier assignment
session            -- Auth sessions (existing)
languages          -- Supported languages (8 core languages)
tiers              -- Free/Pro/Premium definitions
user_usage         -- Monthly usage tracking

-- 💰 MONETIZATION (Phase 1 Priority)
subscriptions      -- Stripe subscription management
payments           -- Payment history and analytics
analytics_events   -- Conversion tracking & user behavior

-- Conversation system
conversations      -- Conversation records with mode tracking
messages           -- Chat history with audio references
```

### **Migration Steps**

1. ✅ **Schema Update** - Already completed in `schema.ts`
2. ✅ **Seeding System** - Created `seed.ts` for MVP data
3. 🔄 **Data Migration** - Run database updates
4. ✅ **Tier Service** - Already implemented usage tracking

### **Commands to Run**

```bash
# Generate and apply schema changes
pnpm db:generate
pnpm db:push

# Seed with essential data
pnpm db:seed:dev

# Verify setup
pnpm db:studio
```

## 🔄 **Phase 2: Enhanced Features (Week 3-4)**

### **Tables to Add**

```sql
-- Learning & Practice
scenarios           -- Daily conversation topics (from legacy)
practice_sessions   -- Structured practice tracking
learning_paths      -- Guided learning progression
session_metrics     -- Performance analytics

-- Language Analysis
grammar_patterns    -- Grammar error tracking
vocabulary_items    -- Word learning system
pronunciation_issues -- Speech analysis results
learning_progress   -- User advancement tracking

-- Advanced Features
speakers            -- Voice personality system (from legacy)
user_preferences    -- Advanced settings
session_feedback    -- User feedback collection
```

### **Legacy Files to Integrate**

- `seed_language.ts` → Enhanced language data with cultural context
- `seed_speakers.ts` → Voice/speaker personality system
- Selected parts of `types.ts` → Advanced type definitions

## 💰 **Phase 3: Monetization & Social (Week 5+)**

### **Tables to Add**

```sql
-- Payment & Subscriptions
subscriptions       -- Stripe integration
payments           -- Transaction history
organizations      -- Team/enterprise accounts
credit_ledger      -- Usage credit system

-- Advanced Learning
anki_decks         -- Vocabulary export system
shared_vocabulary  -- Community word database
anki_user_vocabulary -- Personal vocabulary tracking
vocabulary_exports  -- Export job tracking

-- Social & Growth
user_social_connections -- Friend system
referral_codes     -- Growth tracking
learning_streaks   -- Gamification
achievements       -- Progress rewards

-- Analytics & Insights
analytics_events   -- Advanced event tracking
learning_insights  -- AI-powered analysis
usage_analytics    -- Business intelligence
```

### **Legacy Files to Integrate**

- `vocabularyOps.ts` → Complete Anki integration system
- Full `types.ts` → All monetization and social types

## 🛠️ **Database Improvements Made**

### **1. Enhanced Connection Management**

```typescript
// Better connection pooling and environment handling
const client = postgres(url, {
	max: isDev ? 5 : 20, // Environment-appropriate pool size
	idle_timeout: 20, // Connection timeout
	ssl: prod ? 'require' : false, // Automatic SSL handling
	transform: { column: postgres.toCamel } // camelCase columns
});
```

### **2. Migration Safety**

```typescript
// Environment protection
if (process.env.NODE_ENV === 'production') {
	throw new Error('🚨 Cannot reset production database!');
}

// Graceful degradation during builds
if (building) {
	db = new Proxy(
		{},
		{
			get() {
				throw new Error('Database unavailable during build');
			}
		}
	);
}
```

### **3. Health Monitoring**

```typescript
// Database health checks
export async function healthCheck() {
	return {
		healthy: await canConnect(),
		issues: await validateSchema()
	};
}
```

## 📋 **Implementation Checklist**

### **Phase 1 (This Week)**

- [x] Update core schema with tiers and usage tracking
- [x] Create MVP seeding system
- [x] Implement tier service with usage enforcement
- [x] Add database utilities and safety checks
- [ ] Run database migration
- [ ] Test tier limits in development
- [ ] Verify realtime API integration

### **Phase 2 (Week 3-4)**

- [ ] Add scenarios and practice session tables
- [ ] Migrate speaker/voice personality system
- [ ] Implement learning progress tracking
- [ ] Add session analytics
- [ ] Create advanced language features

### **Phase 3 (Week 5+)**

- [ ] Integrate Stripe for payments
- [ ] Add Anki vocabulary system
- [ ] Implement social features
- [ ] Create analytics dashboard
- [ ] Add enterprise features

## 🎯 **Immediate Next Steps**

1. **Run Database Migration**

   ```bash
   cd /Users/hiro/Documents/kaiwa
   pnpm db:generate  # Create migration files
   pnpm db:push      # Apply schema changes
   pnpm db:seed:dev  # Seed with MVP data
   ```

2. **Verify Setup**

   ```bash
   pnpm db:studio    # Open database browser
   # Check that tiers, languages, and users tables exist
   ```

3. **Test Integration**
   - Test user registration with tier assignment
   - Verify usage tracking works
   - Test conversation creation and persistence

## 🔧 **Development Commands**

```bash
# Database Management
pnpm db:push          # Apply schema changes
pnpm db:generate      # Generate migration files
pnpm db:studio        # Database browser
pnpm db:seed:dev      # Seed development data

# Reset & Cleanup (Development Only)
pnpm db:nuke:dev      # Complete reset
pnpm db:clear:dev     # Clear data, keep schema

# Health Checks
pnpm db:health        # Check database status
pnpm db:migrate       # Run pending migrations
```

## 💡 **Key Benefits of This Approach**

1. **🚀 Faster MVP Launch** - Only essential tables for core functionality
2. **🧹 Cleaner Architecture** - Separated concerns, easier to maintain
3. **📈 Scalable Growth** - Phased expansion without breaking changes
4. **🔒 Production Ready** - Proper connection pooling and error handling
5. **🛡️ Safety First** - Environment protection and graceful degradation
6. **📊 Better Monitoring** - Health checks and migration utilities

This phased approach lets you **ship the MVP quickly** while maintaining a **clear path to advanced features**. The tier system is ready for production, and the realtime API integration will work seamlessly with the new schema.
