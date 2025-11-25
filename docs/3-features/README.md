# 3-features/ → Feature Documentation

> **Purpose**: Documentation for specific product features and their implementations.

## 📚 Documents in This Section

### [realtime.md](realtime.md)

**Realtime conversation implementation**

- 🎙️ WebSocket connection to OpenAI Realtime API
- 🎵 Audio streaming with Web Audio API
- 🔄 State management and error recovery
- 🐛 Debugging and monitoring

👉 **Start here** for realtime conversation feature work

---

### [analysis.md](analysis.md)

**Conversation analysis and feedback system**

- 📊 Speech analysis metrics
- 🎯 Phonetics feedback
- 📈 Progress tracking
- 🤖 AI-powered insights

👉 **Start here** for analysis feature work

---

### [seo.md](seo.md)

**SEO strategy and implementation**

- 🔍 SEO architecture
- 🏷️ Meta tags and structured data
- 🗺️ Sitemap generation
- 📄 Dynamic page optimization

👉 **Start here** for SEO improvements

---

### [learning-path-templates.md](learning-path-templates.md)

**Learning path templates & SEO loop**

- 📚 4-week learning path architecture
- 🧠 Prompt engineering & path generation
- 🧵 Scenario generation queue & cron jobs
- 🔍 Public templates, PII scrubbing & JSON-LD

👉 **Start here** for the learning path SEO feature

---

### [usage-service.md](usage-service.md)

**Usage tracking and limits**

- 📊 Usage tracking implementation
- 🔒 Rate limiting
- 💳 Tier-based limits
- 📈 Analytics integration

👉 **Start here** for usage tracking work

---

### [phonetics-feedback.md](phonetics-feedback.md)

**Speech analysis and pronunciation feedback**

- 🗣️ Phonetic analysis
- 📝 Feedback generation
- 🎯 Accuracy scoring
- 📊 Progress visualization

👉 **Start here** for phonetics work

---

### [email-reminder-setup.md](email-reminder-setup.md)

**Email reminder system**

- 📧 Reminder scheduling
- ⏰ Cron job integration
- 📝 Email templates
- 🎯 User preferences

👉 **Start here** for email reminder work

---

### [audio-speech-analysis.md](audio-speech-analysis.md)

**Audio processing and speech analysis**

- 🎵 Audio capture and processing
- 🗣️ Speech-to-text integration
- 📊 Analysis pipeline
- 💾 Audio storage

👉 **Start here** for audio processing work

---

### [audio-schema-migration.md](audio-schema-migration.md)

**Audio data schema migration**

- 🗄️ Schema changes
- 🔄 Migration steps
- 📋 Data transformation
- ✅ Validation

👉 **Start here** for audio schema changes

---

## 🎯 When to Use This Section

**Use feature docs when:**

- Working on a specific feature
- Understanding feature architecture
- Debugging feature issues
- Planning feature improvements
- Documenting feature changes

**Don't use for:**

- System-wide architecture → See [../1-core/](../1-core/)
- General how-tos → See [../2-guides/](../2-guides/)
- Business strategy → See [../4-strategy/](../4-strategy/)

---

## 🔗 Related Sections

- [1-core/architecture.md](../1-core/architecture.md) - System architecture
- [2-guides/](../2-guides/) - Development guides
- [5-processes/](../5-processes/) - Testing and QA processes

---

## ✍️ Contributing

When adding feature docs:

1. **Be specific**: Focus on one feature per doc
2. **Include examples**: Show code and usage
3. **Document gotchas**: Common issues and solutions
4. **Link architecture**: Reference core architecture docs
5. **Keep updated**: Update when feature changes

### Feature Doc Template

```markdown
# 📌 [Feature Name]

> **Quick Summary**: One-sentence description

## 🎯 Purpose

- What problem does this solve?
- Who uses this feature?

## 🏗️ Architecture

- How is it implemented?
- What are the key components?

## 💻 Usage

- Code examples
- API reference

## 🐛 Common Issues

- Known bugs
- Debugging tips

## 🔗 Related

- Link to related docs
```

---

**Last Updated**: 2025-11-13
