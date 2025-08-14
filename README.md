# 🎯 Kaiwa v2 - Conversation Practice with AI

> **7-Day MVP**: A functional, kernel-first conversation practice app built with SvelteKit and OpenAI.

[![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)]()
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)]()

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- OpenAI API key (optional for development)

### Installation

```bash
# Clone and install
git clone <your-repo>
cd kaiwa
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your OpenAI API key

# Start development server
pnpm dev
```

Visit `http://localhost:5173` and start speaking! 🎤

## 🏗️ Architecture Overview

### Kernel-First Design

```
src/
├── lib/
│   ├── kernel/           # 🧠 Pure functional core
│   │   ├── index.ts      # Conversation state machine
│   │   └── adapters.ts   # External service interfaces
│   ├── orchestrator.ts   # 🎭 Coordinates kernel + adapters
│   ├── components/       # 🎨 UI components
│   └── utils/           # 🛠️ Utility functions
├── routes/
│   ├── +page.svelte     # 📱 Main conversation UI
│   └── api/             # 🔌 API endpoints
└── app.html             # 📄 HTML template
```

### Key Principles

- **Functional Core**: All business logic is pure functions
- **Imperative Shell**: Side effects handled at edges
- **Single State Tree**: One source of truth
- **Progressive Enhancement**: Works without JavaScript

## 🎯 Features

### ✅ Day 1-2 (Kernel)

- [x] Audio recording with browser APIs
- [x] OpenAI Whisper transcription
- [x] GPT conversation responses
- [x] Text-to-speech playback
- [x] Pure functional state management

### ✅ Day 3-4 (Experience)

- [x] Beautiful, responsive UI
- [x] Real-time conversation display
- [x] Visual recording indicators
- [x] Error handling and fallbacks

### 🚧 Day 5-6 (Enhancement)

- [ ] Optional Google OAuth
- [ ] Conversation persistence
- [ ] Progress tracking
- [ ] Cloud storage sync

### 📋 Day 7 (Launch)

- [ ] Production deployment
- [ ] Performance optimization
- [ ] User testing
- [ ] Launch announcement

## 🔧 Configuration

### Environment Variables

```bash
# Required for full functionality
OPENAI_API_KEY=sk-...

# Optional
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
SESSION_SECRET=your-secret-here
```

### API Endpoints

- `POST /api/transcribe` - Audio → Text (Whisper)
- `POST /api/chat` - Text → AI Response (GPT)
- `POST /api/tts` - Text → Audio (OpenAI TTS)

## 🎨 Usage Examples

### Basic Conversation

```typescript
import { createConversationStore } from '$lib/orchestrator';

const conversation = createConversationStore();

// Start conversation
await conversation.startConversation();

// Toggle recording
await conversation.toggleRecording();

// Access reactive state
console.log(conversation.state.messages);
```

### Custom Adapters

```typescript
import { ConversationOrchestrator } from '$lib/orchestrator';
import { myCustomAudioAdapter } from './adapters';

const orchestrator = new ConversationOrchestrator(
 myCustomAudioAdapter, // Custom audio handling
 adapters.ai, // Default AI adapter
 adapters.storage // Default storage
);
```

## 🧪 Testing

```bash
# Type checking
pnpm check

# Unit tests (when implemented)
pnpm test

# E2E tests
pnpm test:e2e

# Linting
pnpm lint
```

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Other Platforms

The app is a standard SvelteKit app and can be deployed to:

- Netlify
- Cloudflare Pages
- Node.js servers
- Docker containers

## 🔍 Troubleshooting

### Common Issues

**"No microphone access"**

- Grant microphone permissions in browser
- Use HTTPS (required for mic access)

**"Transcription not working"**

- Check OPENAI_API_KEY in environment
- Verify API key has credits
- Check browser console for errors

**"Audio not playing"**

- Check browser audio permissions
- Verify speakers/headphones connected
- Try different browser

### Development Mode

Without OpenAI API key, the app runs in fallback mode:

- Transcription returns test messages
- AI responses are hardcoded
- TTS falls back to browser speech synthesis

## 📚 Documentation

- [Architecture Guide](docs/FEATURE_ARCHITECTURE.md)
- [Design Principles](docs/DESIGN_PRINCIPLES.md)
- [Migration Plan](docs/CTO_ASSESSMENT_MIGRATION_PLAN.md)

## 🤝 Contributing

This is a 7-day MVP sprint. Focus areas:

1. **Core Functionality**: Conversation loop reliability
2. **User Experience**: Smooth, delightful interactions
3. **Error Handling**: Graceful fallbacks
4. **Performance**: Fast, responsive UI

## 📄 License

MIT - Build amazing conversation experiences! 🎉

---

**🎯 MVP Goal**: Ship a magical conversation experience in 7 days. Everything else is enhancement.
