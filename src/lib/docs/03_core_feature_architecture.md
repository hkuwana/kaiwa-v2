# 🏗️ Kaiwa Feature-Sliced Architecture

> **Purpose**: A scalable, feature-sliced architecture that promotes clear boundaries, reduces coupling, and enhances maintainability for the Kaiwa platform.

[![Architecture](https://img.shields.io/badge/Architecture-Feature--Sliced-green?style=for-the-badge)]()
[![Focus](https://img.shields.io/badge/Focus-Features%20%2B%20Server-purple?style=for-the-badge)]()
[![Status](https://img.shields.io/badge/Status-Active-blue?style=for-the-badge)]()

---

## 🎯 Architecture Overview

To improve scalability and prevent cross-contamination between different parts of the application, we are using a **Feature-Sliced Architecture**. This approach organizes the codebase around features, making it more modular and easier to maintain as the application grows.

### 🏛️ Directory Structure

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

---

## 📂 Directory Breakdown

### `src/lib/` (Shared Code)

Code at the top-level of `src/lib/` is considered shared and can be used by any feature or component in the application.

- **Reusability**: Avoids code duplication by providing a central place for common components, services, and utilities.
- **Agnostic**: Shared code should be generic and not have any knowledge of specific features.
- **Example**: A global `Button` component, a `user` store, or a date formatting utility would live here.

### `src/lib/features`

This is where the feature-specific, client-side (or universal) code lives.

- **Encapsulation**: All client-side code related to a single feature (UI, state, logic) is co-located.
- **Clear Boundaries**: Features should not directly import from other features. They can only interact with shared code from the root of `src/lib/`.
- **Example**: The `payments` feature contains all the components, stores, and services needed for the payment processing experience.

### `src/lib/server`

This directory contains all server-side code.

- **Separation of Concerns**: A clear separation between client-side and server-side logic.
- **`database`**: A subdirectory for all database interactions.
    - **`repositories`**: All database queries (CRUD operations) are encapsulated in `*.repository.ts` files. These are the only files that should import and use Drizzle.
    - Server-side services will use these repositories to access data.

---

## 🔄 Data Flow

The data flow is designed to maintain clear boundaries between layers.

1.  **UI Interaction (Client-side)**:
    - A user interacts with a component in `src/lib/features/[feature]/components`.
    - The component calls an action on a store in `src/lib/features/[feature]/stores`.
    - The store orchestrates client-side services from `src/lib/features/[feature]/services` or shared services from `src/lib/services`.

2.  **API Request (Server-side)**:
    - A client-side service or a SvelteKit `+page.server.ts` file makes a request to an API endpoint.
    - The API endpoint uses a server-side service from `src/lib/server/services`.
    - The server-side service calls a repository in `src/lib/server/database/repositories` to interact with the database.

```text
┌────────────────┐   ┌────────────────┐   ┌──────────────────┐
│ UI Component   │──▶│  Feature Store │──▶│  Client Service  │
└────────────────┘   └────────────────┘   └──────────────────┘
                             │
                             ▼ (API Call)
┌────────────────┐   ┌────────────────┐   ┌──────────────────┐
│ Server Endpoint│──▶│  Server Service│──▶│    Repository    │
└────────────────┘   └────────────────┘   └──────────────────┘
```

---

## 🚚 Migration Strategy

We can migrate to this new architecture incrementally, one feature at a time.

1.  **Start with a small feature**: Begin with a less critical feature, like `payments`.
2.  **Create the new directories**: Set up the `features` and `server/database` directories.
3.  **Move the files**:
    - Move the feature's client-side components, stores, and services into `src/lib/features/[feature_name]`.
    - Move any server-side database logic into a repository in `src/lib/server/database/repositories`.
4.  **Update imports**: Adjust all imports to point to the new file locations.
5.  **Test**: Thoroughly test the migrated feature.
6.  **Repeat**: Continue this process for all other features.

---

## 💡 Key Benefits

1.  **Scalability**: Easily add new features without affecting existing ones.
2.  **Maintainability**: Quickly locate and modify all code related to a specific feature.
3.  **Clear Boundaries**: Prevents "spaghetti code" by enforcing strict rules on how features can interact.
4.  **Developer Experience**: Onboarding new developers is easier as they can focus on a single feature at a time.
