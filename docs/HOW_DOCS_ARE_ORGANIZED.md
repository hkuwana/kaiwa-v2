# 📚 How Kaiwa Documentation is Organized

> **Quick Start**: This is your single source of truth for all Kaiwa documentation. Everything lives in `/docs` organized by category.

## 🎯 Organization Philosophy

This documentation follows a **category-based hierarchy** inspired by PostHog and modern documentation best practices:

- **Numbered folders** (1-7) indicate priority and reading order
- **Each folder has a README.md** with a quick index of contents
- **Consistent naming**: `category-topic.md` format (kebab-case)
- **Skimmable format**: Bullet points, clear sections, code examples
- **Single location**: No scattered docs across the codebase

---

## 📂 Directory Structure

### **1-core/** → Architecture & Fundamentals
**Purpose**: Long-lasting technical architecture documents
**When to use**: Foundational system design, database schemas, core patterns

```
1-core/
├── README.md                    # Core docs index
├── architecture.md              # System architecture & philosophy
├── database-schema.md           # Database design & relationships
├── repositories.md              # Data access patterns
└── philosophy.md                # Product philosophy & principles
```

**Key docs**:
- Start with `architecture.md` for system overview
- Check `database-schema.md` for data model
- Read `repositories.md` for data access patterns

---

### **2-guides/** → How-To Guides
**Purpose**: Step-by-step instructions for developers
**When to use**: Setting up environments, testing, integrations

```
2-guides/
├── README.md                    # Guides index
├── dev-setup.md                 # Local development setup
├── testing-strategy.md          # Testing approach & tools
├── stripe-setup.md              # Payment integration setup
├── api-reference.md             # API documentation
└── documentation-convention.md  # How to write docs
```

**Key docs**:
- New devs start with `dev-setup.md`
- Writing docs? Read `documentation-convention.md`
- API integration? Check `api-reference.md`

---

### **3-features/** → Feature Documentation
**Purpose**: Specific product features and implementations
**When to use**: Understanding or working on a specific feature

```
3-features/
├── README.md                    # Features index
├── realtime.md                  # Realtime conversation feature
├── seo.md                       # SEO implementation
├── usage-service.md             # Usage tracking & limits
├── phonetics-feedback.md        # Speech analysis feedback
└── analysis.md                  # Conversation analysis
```

**Key docs**:
- Each feature has its own doc with architecture, examples, and gotchas
- Check the README.md index to find your feature quickly

---

### **4-strategy/** → Business & Marketing
**Purpose**: Business strategy, marketing plans, positioning
**When to use**: Marketing decisions, content creation, business planning

```
4-strategy/
├── README.md                    # Strategy index
├── marketing.md                 # Overall marketing strategy
├── corporate-identity.md        # Brand & messaging
├── founder-emails.md            # Email outreach strategy
└── icp-personas.md              # Ideal customer profiles
```

**Key docs**:
- Creating content? Start with `marketing.md`
- Defining messaging? Read `corporate-identity.md`
- Targeting users? Check `icp-personas.md`

---

### **5-processes/** → Workflows & Checklists
**Purpose**: Repeatable processes and templates
**When to use**: Running demos, testing, interviews, experiments

```
5-processes/
├── README.md                    # Process index
├── demo-checklist.md            # Pre-demo checklist
├── user-interview-template.md   # Interview questions
├── smoke-testing.md             # Quick testing process
└── ab-testing.md                # A/B test process
```

**Key docs**:
- Running a demo? Use `demo-checklist.md`
- User interview? Follow `user-interview-template.md`
- Quick validation? Run `smoke-testing.md`

---

### **6-logs/** → Time-Based Tracking
**Purpose**: Chronological logs, migrations, feedback tracking
**When to use**: Tracking progress, migration history, weekly updates

```
6-logs/
├── README.md                    # Logs index
├── weekly-updates/              # Weekly progress updates
│   ├── README.md
│   └── YYYY-MM-DD.md
├── migrations/                  # Migration logs & guides
│   ├── README.md
│   └── migration-name-YYYY.md
└── feedback/                    # User feedback tracking
    └── user-feedback-triage.md
```

**Key docs**:
- Recent progress? Check `weekly-updates/`
- Migration history? See `migrations/`
- User feedback? Go to `feedback/`

---

### **7-archive/** → Historical Documents
**Purpose**: Point-in-time documents that are no longer actively maintained
**When to use**: Historical context, past analyses, deprecated docs

```
7-archive/
├── README.md                    # Archive index
├── YYYY-MM-DD-analysis.md       # Past analyses
├── old-roadmap.md               # Deprecated roadmaps
└── deprecated-feature.md        # Old feature docs
```

**Key docs**:
- These are **read-only** historical records
- Dated format: `YYYY-MM-DD-description.md`
- Not for active reference

---

## 🔍 How to Find What You Need

### **Quick Reference by Role**

| Role | Start Here | Then Read |
|------|-----------|-----------|
| **New Developer** | `2-guides/dev-setup.md` | `1-core/architecture.md` |
| **Feature Work** | `3-features/[feature].md` | `1-core/repositories.md` |
| **Marketing/Content** | `4-strategy/marketing.md` | `4-strategy/corporate-identity.md` |
| **Product Decisions** | `1-core/philosophy.md` | `4-strategy/icp-personas.md` |
| **Testing/QA** | `5-processes/smoke-testing.md` | `2-guides/testing-strategy.md` |

### **Search Tips**

```bash
# Find all docs about a topic
grep -r "keyword" docs/

# Find docs modified recently
find docs/ -name "*.md" -mtime -7

# List all docs in a category
ls docs/1-core/
```

---

## ✍️ Writing Documentation

### **Naming Convention**

Format: `category-topic.md` (all lowercase, kebab-case)

**Examples**:
- ✅ `feature-realtime-conversation.md`
- ✅ `guide-stripe-setup.md`
- ✅ `process-demo-checklist.md`
- ❌ `Realtime_Feature.md`
- ❌ `stripe guide.md`

### **Document Structure**

Every doc should have:

```markdown
# 📌 [Title]

> **Quick Summary**: One-sentence description of what this doc covers

## 🎯 Purpose
- Bullet point 1
- Bullet point 2

## 📋 Contents
[Table of contents for longer docs]

## Main Sections
- Use clear headers
- Include code examples
- Add visual aids (diagrams, tables)
- Keep it skimmable

## See Also
- Link to related docs
```

### **Formatting for Skimmability**

✅ **DO**:
- Use bullet points for lists
- Add emoji section markers (📌 🎯 ⚠️ ✅ ❌)
- Include code examples
- Use tables for comparisons
- Add "See Also" links

❌ **DON'T**:
- Write long paragraphs
- Bury key info
- Skip examples
- Forget to link related docs

---

## 🔄 Maintenance

### **When to Update**

- **Core docs**: Only when architecture changes
- **Feature docs**: When feature is modified
- **Strategy docs**: Quarterly or when strategy shifts
- **Process docs**: When process changes
- **Logs**: Add entries, don't modify old ones

### **When to Archive**

Move to `7-archive/` when:
- Document is no longer actively used
- Information is outdated but has historical value
- Replacing with newer version
- Project/feature is deprecated

### **Migration Checklist**

When adding new docs:
1. ✅ Determine correct category (1-7)
2. ✅ Follow naming convention
3. ✅ Add to folder's README.md index
4. ✅ Link related docs
5. ✅ Use skimmable format
6. ✅ Add examples where relevant

---

## 🚀 Quick Actions

### **I need to...**

| Action | Command/Location |
|--------|------------------|
| **Find all docs** | `ls -R docs/` |
| **Search for topic** | `grep -r "topic" docs/` |
| **See recent changes** | `git log --oneline docs/` |
| **Add new doc** | Follow naming convention, update folder README |
| **Archive old doc** | Move to `7-archive/`, update indexes |

---

## 📊 Documentation Stats

Track your docs:

```bash
# Count total docs
find docs/ -name "*.md" | wc -l

# Count by category
find docs/1-core -name "*.md" | wc -l

# Find largest docs
find docs/ -name "*.md" -exec wc -l {} + | sort -rn | head -10
```

---

## 🎓 Best Practices

1. **Keep it DRY**: Don't duplicate information, link to it
2. **Update as you code**: Change the code, update the doc
3. **Examples > Theory**: Show, don't just tell
4. **Think "skim-first"**: Readers should get 80% of value in 30 seconds
5. **Link generously**: Connect related concepts
6. **Version control**: Commit doc changes with code changes
7. **Archive boldly**: Don't keep outdated docs in active folders

---

## 📞 Questions?

- Check folder README.md files first
- Search existing docs: `grep -r "your-question" docs/`
- Can't find it? It might need to be documented! Add it and update this guide.

---

**Last Updated**: 2025-11-13
**Maintained By**: Kaiwa Team
**Feedback**: Open an issue or update this doc directly
