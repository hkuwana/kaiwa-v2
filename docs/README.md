# 📚 Kaiwa Documentation

> **Welcome!** This is your central hub for all Kaiwa documentation. Everything is organized by category for easy navigation.

## 🚀 Quick Start

- **New to Kaiwa?** → Start with [Dev Setup Guide](2-guides/dev-setup.md)
- **Understanding the system?** → Read [Architecture](1-core/architecture.md)
- **Working on a feature?** → Check [Features](3-features/README.md)
- **Need a process?** → See [Processes](5-processes/README.md)
- **How are docs organized?** → Read [HOW_DOCS_ARE_ORGANIZED.md](HOW_DOCS_ARE_ORGANIZED.md)

---

## 📂 Documentation Categories

### [1-core/](1-core/) → Architecture & Fundamentals

**Long-lasting technical architecture and design documents**

| Doc                                             | Description                                          |
| ----------------------------------------------- | ---------------------------------------------------- |
| [architecture.md](1-core/architecture.md)       | System architecture, philosophy, and design patterns |
| [database-schema.md](1-core/database-schema.md) | Database design and relationships                    |
| [repositories.md](1-core/repositories.md)       | Data access patterns and repository implementation   |

👉 **Start here** if you're new to the codebase

---

### [2-guides/](2-guides/) → How-To Guides

**Step-by-step instructions for developers**

| Doc                                                                 | Description                         |
| ------------------------------------------------------------------- | ----------------------------------- |
| [dev-setup.md](2-guides/dev-setup.md)                               | Local development environment setup |
| [testing-strategy.md](2-guides/testing-strategy.md)                 | Testing approach and tools          |
| [stripe-setup.md](2-guides/stripe-setup.md)                         | Payment integration setup           |
| [api-reference.md](2-guides/api-reference.md)                       | API documentation                   |
| [documentation-convention.md](2-guides/documentation-convention.md) | How to write docs                   |

👉 **Start here** for practical how-to guides

---

### [3-features/](3-features/) → Feature Documentation

**Specific product features and implementations**

| Doc                                                       | Description                          |
| --------------------------------------------------------- | ------------------------------------ |
| [realtime.md](3-features/realtime.md)                     | Realtime conversation implementation |
| [seo.md](3-features/seo.md)                               | SEO strategy and implementation      |
| [usage-service.md](3-features/usage-service.md)           | Usage tracking and limits            |
| [phonetics-feedback.md](3-features/phonetics-feedback.md) | Speech analysis feedback system      |
| [analysis.md](3-features/analysis.md)                     | Conversation analysis feature        |

👉 **Start here** when working on a specific feature

---

### [4-strategy/](4-strategy/) → Business & Marketing

**Business strategy, marketing plans, and positioning**

| Doc                                                       | Description                              |
| --------------------------------------------------------- | ---------------------------------------- |
| [marketing.md](4-strategy/marketing.md)                   | Overall marketing strategy and execution |
| [corporate-identity.md](4-strategy/corporate-identity.md) | Brand, messaging, and positioning        |
| [founder-emails.md](4-strategy/founder-emails.md)         | Email outreach strategy                  |
| [icp-personas.md](4-strategy/icp-personas.md)             | Ideal customer profiles and targeting    |

👉 **Start here** for business and marketing decisions

---

### [5-processes/](5-processes/) → Workflows & Checklists

**Repeatable processes and templates**

| Doc                                                                  | Description                          |
| -------------------------------------------------------------------- | ------------------------------------ |
| [demo-checklist.md](5-processes/demo-checklist.md)                   | Pre-demo preparation checklist       |
| [user-interview-template.md](5-processes/user-interview-template.md) | User interview questions and process |
| [smoke-testing.md](5-processes/smoke-testing.md)                     | Quick validation testing process     |
| [ab-testing.md](5-processes/ab-testing.md)                           | A/B testing process and analysis     |

👉 **Start here** for repeatable workflows

---

### [6-logs/](6-logs/) → Time-Based Tracking

**Chronological logs, migrations, and progress tracking**

| Category                                  | Description                                 |
| ----------------------------------------- | ------------------------------------------- |
| [weekly-updates/](6-logs/weekly-updates/) | Weekly progress updates and accomplishments |
| [migrations/](6-logs/migrations/)         | Migration logs, guides, and histories       |
| [feedback/](6-logs/feedback/)             | User feedback tracking and triage           |

👉 **Start here** for historical tracking and progress

---

### [7-archive/](7-archive/) → Historical Documents

**Point-in-time documents no longer actively maintained**

| Doc                                                            | Description |
| -------------------------------------------------------------- | ----------- |
| Historical analyses, deprecated roadmaps, and old feature docs |

👉 **Start here** for historical context only

---

## 🔍 Find What You Need

### By Role

| I am a...              | Start Here                                    | Then Read                                              |
| ---------------------- | --------------------------------------------- | ------------------------------------------------------ |
| **New Developer**      | [Dev Setup](2-guides/dev-setup.md)            | [Architecture](1-core/architecture.md)                 |
| **Frontend Developer** | [Architecture](1-core/architecture.md)        | [Features](3-features/README.md)                       |
| **Backend Developer**  | [Database Schema](1-core/database-schema.md)  | [Repositories](1-core/repositories.md)                 |
| **Marketer**           | [Marketing Strategy](4-strategy/marketing.md) | [Corporate Identity](4-strategy/corporate-identity.md) |
| **Product Manager**    | [Philosophy](1-core/philosophy.md)            | [ICP Personas](4-strategy/icp-personas.md)             |

### By Task

| I need to...                | Go Here                                          |
| --------------------------- | ------------------------------------------------ |
| Set up my dev environment   | [Dev Setup Guide](2-guides/dev-setup.md)         |
| Understand the architecture | [Architecture](1-core/architecture.md)           |
| Work on a feature           | [Features](3-features/README.md)                 |
| Run a demo                  | [Demo Checklist](5-processes/demo-checklist.md)  |
| Write marketing content     | [Marketing Strategy](4-strategy/marketing.md)    |
| Understand the database     | [Database Schema](1-core/database-schema.md)     |
| Test a change               | [Testing Strategy](2-guides/testing-strategy.md) |
| Track progress              | [Weekly Updates](6-logs/weekly-updates/)         |

---

## 🔎 Search the Docs

```bash
# Search all docs for a keyword
grep -r "keyword" docs/

# Find recently updated docs
find docs/ -name "*.md" -mtime -7

# List all docs in a category
ls docs/1-core/
```

---

## ✍️ Contributing to Docs

**Before adding or updating docs:**

1. Read [HOW_DOCS_ARE_ORGANIZED.md](HOW_DOCS_ARE_ORGANIZED.md)
2. Follow the naming convention: `category-topic.md`
3. Update the relevant folder's README.md
4. Link related documents
5. Keep it skimmable (bullets, examples, clear sections)

---

## 📊 Documentation Status

<!-- TODO: Update after migration -->

- **Total Docs**: [In migration]
- **Last Updated**: 2025-11-13
- **Migration Status**: 🚧 In Progress

---

## 🎯 What's Next?

We're currently migrating docs from scattered locations into this organized structure. Check [6-logs/migrations/](6-logs/migrations/) for migration progress.

---

**Questions?** Start with [HOW_DOCS_ARE_ORGANIZED.md](HOW_DOCS_ARE_ORGANIZED.md) or search the docs!
