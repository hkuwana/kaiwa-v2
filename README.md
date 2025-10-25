# 🎯 Kaiwa - AI Conversation Practice Platform

> Practice real-world conversations in a new language with an AI partner. Build confidence before you speak with real people.

[![SvelteKit](https://img.shields.io/badge/SvelteKit-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)]()
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)]()
[![Drizzle ORM](https://img.shields.io/badge/Drizzle%20ORM-C5F74F?style=for-the-badge&logo=drizzle&logoColor=black)]()

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm
- Docker for database
- OpenAI API key

### Installation

```bash
# 1. Clone the repository
git clone <your-repo>
cd kaiwa

# 2. Install dependencies
pnpm install

# 3. Set up environment variables
cp .env.example .env.local

# 4. Start the database
pnpm db:start

# 5. Run database migrations
pnpm db:push

# 6. Start the development server
pnpm dev
```

Visit `http://localhost:5173` to start practicing.

## 🏗️ Architecture

Kaiwa is built on a **Clean 3-Layer Architecture** (Services → Stores → UI) and is migrating towards a **Feature-Sliced Design** to enhance scalability and maintainability.

- **Services**: Pure, isolated business logic.
- **Stores**: Svelte 5 runes-based state management and service orchestration.
- **UI**: Thin, declarative Svelte components.
- **Features**: Encapsulated feature modules with their own components, services, and stores.

For a detailed explanation, please see the [Architecture Documentation](src/lib/docs/architecture.md).

## ✨ Features

- **AI-Powered Conversations**: Practice speaking with an AI partner in 8+ languages.
- **Scenario-Based Learning**: Choose from over 30 real-world scenarios like ordering coffee, meeting a partner's parents, or handling a business negotiation.
- **Advanced Phonetics Feedback**: Get detailed pronunciation analysis with IPA transcription, word-level timing, and personalized practice recommendations.
- **Speech Analysis**: Real-time pronunciation scoring, fluency metrics, and speech rate analysis using Echogarden.
- **Audio Processing**: Cloud-based audio storage with automatic cleanup and retention policies.
- **User Authentication**: Secure sign-up and login with Google or email.
- **Subscription Tiers**: Managed with Stripe, offering different levels of access and usage.
- **In-depth Analysis**: Post-conversation analysis of your performance with detailed speech metrics.

## 📚 Documentation

All project documentation has been consolidated in the `src/lib/docs` directory.

- **[Architecture](src/lib/docs/core-architecture.md)**: An overview of the project's philosophy and technical architecture.
- **[Marketing Strategy](src/lib/docs/strategy-marketing.md)**: The go-to-market and user acquisition strategy.
- **[Analysis Feature](src/lib/docs/feature-analysis.md)**: A guide to the conversation analysis feature.
- **[Database Schema](src/lib/docs/core-database-schema.md)**: A detailed look at the database structure.

## 🧪 Testing

Kaiwa uses a comprehensive testing strategy to ensure code quality and reliability.

```bash
# Run type checking
pnpm check

# Run linter
pnpm lint

# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run all smoke tests
pnpm smoke:test:all
```

For more details, see the [Testing Strategy Guide](src/lib/docs/dev_testing_strategy.md).

## 🤝 Contributing

Contributions are welcome! Please follow the existing code patterns and architectural principles. Before starting, please read the [Architecture Documentation](src/lib/docs/architecture.md) to understand the project structure.

## 📄 License

MIT
