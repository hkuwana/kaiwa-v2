# 🏗️ Kaiwa Architecture & Philosophy

> **Mission**: For people who need to actually use the language, not pass a test.

## 🎯 The Signal Plan: Our North Star

Kaiwa follows the **Signal Plan** — a go-to-market strategy centered on one core principle: giving users the **specific, practiced skills to have a single, successful, high-stakes conversation with a loved one**.

Our "Signal" is this emotional outcome: **connecting without fear with the people you love**. Every feature, every interaction, and every technical choice exists to support this journey through four phases:
1. **User Acquisition** — Marketing the solution to emotional problems, not features
2. **User Onboarding** — Proving value instantly by focusing on the user's specific conversation need
3. **User Retention** — Using engagement features only to encourage deeper practice of high-stakes conversations
4. **Real-World Bridge** — Tracking and celebrating real-world conversation success through prep plans, warm-ups, and reflection journaling

## 🎯 Core Philosophy

Kaiwa is the anti-language-learning app. We're not here to help you achieve B2 proficiency or master 2000 vocabulary words. We're here to help you connect with loved ones, express your real feelings, and handle the conversations that actually matter in your life.

Our singular goal is to create a conversational partner that prepares you for the messy, chaotic reality of actually using Languages in real situations. Every architectural decision, every interaction design, and every technical choice serves this fundamental purpose: to make you ready for the conversations you'll actually have, not the ones in textbooks.

### Guiding Principles

1.  **The Survival Training Ground, Not a Classroom**: We provide a safe environment to practice high-stakes, real-world scenarios.
2.  **Real-World Readiness over Gamification**: We foster intrinsic motivation through real-world preparedness, not points and badges.

## 🏛️ Core Architecture: The 3-Layer Model

Kaiwa adopts a **Clean 3-Layer Architecture** to ensure a maintainable, testable, and scalable application.

```text
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                            │
│              (Svelte Components + Pages)                   │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Store Layer                            │
│              (State Management + Orchestration)            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                           │
│              (Pure Business Logic + External APIs)         │
└─────────────────────────────────────────────────────────────┘
```

### Layer Responsibilities

- **Service Layer (Bottom)**: Pure business logic and external API integration. Services are pure TypeScript classes with no knowledge of the UI and never import other services.
- **Store Layer (Middle)**: State management and orchestration. Stores use Svelte 5 runes to manage application state and coordinate services to implement features.
- **UI Layer (Top)**: User interface and interactions. Components are thin and declarative, calling actions on stores and reacting to state changes.

## 🚚 Architectural Evolution: Feature-Sliced Design

To improve scalability, we are migrating to a **Feature-Sliced Architecture**.

### Directory Structure

```text
src/lib/
├── components/      # Shared components
├── services/        # Shared client services
├── stores/          # Shared stores
├── utils/           # Shared utils
│
├── features/
│   ├── [feature_name]/
│   │   ├── components/
│   │   ├── services/
│   │   └── stores/
│
└── server/
    ├── services/      # Shared server services
    └── database/
        ├── repositories/
        └── schema.ts
```

### Key Principles

- **Shared Code**: The root `src/lib/` contains shared, feature-agnostic code.
- **Feature Encapsulation**: `src/lib/features/` contains all client-side code for a specific feature, co-located and isolated. Features do not import from each other.
- **Server-Side Logic**: `src/lib/server/` contains all server-side code, including database repositories that are the only modules to interact directly with the database.

### Migration Strategy

The migration is a 4-phase approach:

1.  **Prepare**: Set up the `features` directory structure.
2.  **Extract**: Incrementally move existing functionality into isolated features like `realtime-conversation` and `analysis`.
3.  **Bridge**: Implement a `FeatureBridge` utility for any necessary cross-feature communication.
4.  **API Reorganization**: Restructure backend APIs to be resource-oriented (e.g., `api/users`, `api/conversations`).
