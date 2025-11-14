# 1-core/ → Architecture & Fundamentals

> **Purpose**: Long-lasting technical architecture and design documents that form the foundation of Kaiwa.

## 📚 Documents in This Section

### [architecture.md](architecture.md)
**System architecture, philosophy, and design patterns**

- 🎯 Core product philosophy (The Signal Plan)
- 🏛️ 3-layer architecture (UI → Store → Service)
- 🚚 Feature-Sliced Design migration
- 🗄️ Repository pattern overview
- 🔌 Key subsystems (realtime, analysis, cron)

👉 **Start here** for system overview

---

### [database-schema.md](database-schema.md)
**Database design, relationships, and data models**

- 📊 Complete schema overview
- 🔗 Table relationships and foreign keys
- 📝 Field definitions and constraints
- 🚀 Migration guides

👉 **Start here** for data model understanding

---

### [repositories.md](repositories.md)
**Data access patterns and repository implementation**

- 🗄️ Repository pattern explained
- ✅ Correct vs incorrect usage
- 🧪 Testing with mocks
- 📋 CRUD operation examples

👉 **Start here** for database access patterns

---

### [cron-jobs.md](cron-jobs.md)
**Scheduled task architecture using GitHub Actions**

- ⏰ Cron job architecture overview
- 🔧 Setup and deployment guide
- 🐛 Debugging and monitoring
- 💰 Cost breakdown ($0/month!)

👉 **Start here** for scheduled tasks

---

### [scenario-metadata.md](scenario-metadata.md)
**Scenario data model architecture**

- 📐 Three-table design (scenarios, metadata, progress)
- 🔄 Data flow and updates
- ⚡ Performance optimizations
- 📊 Aggregate metrics

👉 **Start here** for scenario data design

---

## 🎯 When to Use This Section

**Use core docs when:**
- Onboarding new developers
- Making architectural decisions
- Understanding system design
- Planning major refactors
- Documenting new patterns

**Don't use for:**
- Step-by-step how-tos → See [../2-guides/](../2-guides/)
- Feature-specific docs → See [../3-features/](../3-features/)
- Process checklists → See [../5-processes/](../5-processes/)

---

## 🔗 Related Sections

- [2-guides/](../2-guides/) - How-to guides for developers
- [3-features/](../3-features/) - Feature-specific documentation
- [Dev Setup](../2-guides/dev-setup.md) - Getting started

---

## ✍️ Contributing

When updating core docs:
1. These are **long-lasting** documents - only update for major changes
2. Keep docs **skimmable** with bullets and examples
3. Update **related docs** when making changes
4. Add **migration guides** for breaking changes

---

**Last Updated**: 2025-11-13
