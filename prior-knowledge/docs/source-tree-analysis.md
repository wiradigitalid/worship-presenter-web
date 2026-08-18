# Source Tree Analysis

This document provides a detailed breakdown of the file and directory layout of the active `worship-presenter-web` project, along with summaries of folder responsibilities and system entry points.

## Project Structure Overview

```text
worship-presenter-web/
├── .github/                 # GitHub actions and CI workflows
├── _bmad/                   # BMad agent configurations and customization scripts
├── _bmad-output/            # Outputs from BMad execution runs (PRDs, plans, etc.)
├── data/                    # Committed default seed corpora under data/<locale>/
├── docs/                    # Technical documentation, design specs, and manuals
├── public/                  # Public static assets (images, icons)
├── scripts/                 # Administration and database import/deploy scripts
├── src/                     # Application source code
│   ├── app/                 # Next.js App Router Pages, Layouts, and API Routes
│   │   ├── (operator)/      # Operator root: dashboard, admin, login, services, presenter
│   │   │   ├── layout.tsx   # Metadata, fonts, UI locale, and ThemeProvider [Entry Point]
│   │   │   └── page.tsx     # Dashboard landing page view
│   │   ├── (projected)/     # Room-facing root: slideshow, projector, safe fallbacks
│   │   │   ├── layout.tsx   # Literal-black projected document shell [Entry Point]
│   │   │   ├── error.tsx    # Generic projected error boundary
│   │   │   └── not-found.tsx # Generic projected not-found boundary
│   │   ├── api/             # Backend API Route Handlers (Webhook, Services, etc.)
│   │   ├── globals.css      # Core Tailwind CSS imports and themes
│   ├── components/          # Reusable React components
│   │   ├── ui/              # Basic layout design component primitives (dialog, popover)
│   │   ├── Header.tsx       # Standard page header layout
│   │   └── SlideView.tsx    # Slide layout presenter renderer
│   ├── lib/                 # Core business logic utility helpers
│   │   ├── auth/            # Hashing and user session handlers
│   │   ├── db/              # SQLite connection initialization [Data Layer]
│   │   ├── announcements.ts # Flyer mapping logic
│   │   ├── images.ts        # Image type checking and sizing sanitizers
│   │   ├── parser.ts        # Rundown parser engine
│   │   ├── pptx.ts          # PPTX slide deck builder wrapper
│   │   ├── present-channel.ts # BroadcastChannel synchronization module
│   │   └── scripture.ts     # Scripture lookup engine
│   └── proxy.ts             # Session authentication gate, Node.js runtime [Entry Point]
├── tests/                   # Native Node.js test runner scripts
├── docker-compose.yml       # Production and Development environment profiles config
├── Dockerfile               # Multi-stage Docker build recipe
├── package.json             # NPM package manifests and script entry points
└── tsconfig.json            # TypeScript compile configurations
```

---

## Folder Responsibilities

### `/src/app/`
Contains Next.js page components, layouts, and API endpoints. It defines the routing paths of the application.
- **Entry Points:** 
  - `src/app/(operator)/layout.tsx` defines operator styles, metadata, locale, and theme; `src/app/(projected)/layout.tsx` owns literal-black room-facing first paint and projected fallbacks.
  - `src/app/(operator)/page.tsx` renders the primary dashboard where church services are listed.

### `/src/app/api/`
Houses Next.js API route handlers which handle request parsing and issue database queries.
- **Entry Point:** `src/app/api/webhook/route.ts` is the public API that parses incoming rundowns from chat bots.

### `/src/components/`
Organizes application-wide React components.
- `ui/` houses UI primitives like `button.tsx`, `card.tsx`, `dialog.tsx`, and `popover.tsx` styled with Tailwind.
- `SlideView.tsx` is crucial because it ensures slide content is scaled correctly using letterboxing calculations to fit screens.

### `/src/lib/`
Contains modular libraries that run both on server and client.
- `parser.ts` is the parser engine that translates unstructured text from church rundowns into parsed JSON.
- `pptx.ts` uses `pptxgenjs` and `jszip` to construct slide decks with custom themes.
- `present-channel.ts` establishes cross-tab communication using the browser `BroadcastChannel` APIs.
- `db/index.ts` connects to SQLite and executes startup SQL DDL tables.

### `/tests/`
Contains modular test scripts running under the Node native test runner (`node --test`). Assures that parser, image, scripture, and webhook integrations operate cleanly.

### `/scripts/`
Contains administration helper scripts:
- `verify-corpora.mjs` asserts the committed corpora under `data/` are complete. It replaced `import-hymnal.mjs` and `import-kjv.mjs`, both retired once the corpora shipped: their source exports no longer exist, so the committed files are the source of record and seeding moved into the app's boot path.
- `docker compose pull && docker compose up -d` pulls and restarts the production Docker stack.
- `smoke-*.mjs` scripts execute endpoint smoke testing.
