# CoachMaster — Architecture & Codebase Guide

This document describes the architectural structure, design patterns, and file organization of the CoachMaster codebase.

---

## 1. High-Level Architecture

CoachMaster is a martial arts academy management platform built on **Next.js 16 (App Router + Turbopack)** and **React 19**, backed by **MongoDB**.

```
┌────────────────────────────────────────────────────────┐
│                   Next.js App Router                   │
│   app/ (Pages, Layouts, API Handlers, Route Adapters)  │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
┌─────────────────────────┐ ┌─────────────────────────┐
│     Frontend Layer      │ │      Backend Layer      │
│  frontend/pages/        │ │  backend/lib/ (DB, Auth)│
│  frontend/components/   │ │  backend/models/        │
│  frontend/lib/ (Canvas) │ │  backend/services/      │
└─────────────────────────┘ └─────────────────────────┘
```

---

## 2. Directory Structure

```
CoachMaster/
├── app/                           # Next.js App Router entry points
│   ├── api/                       # REST API handlers
│   │   ├── account/               # Account & heartbeat endpoints
│   │   ├── admin/                 # Admin operations (captains, halls, events, audits)
│   │   ├── auth/                  # NextAuth and registration endpoints
│   │   ├── backup/                # Snapshot and email backup endpoints
│   │   ├── branches/              # Branch CRUD
│   │   ├── events/                # Academy events & participant accounting
│   │   └── players/               # Player registration & payment management
│   ├── admin/page.jsx             # Admin dashboard entry route
│   ├── auth/signin/page.jsx       # Authentication entry route
│   ├── layout.jsx                 # Global root layout (Cairo font, metadata, RTL)
│   └── page.jsx                   # Captain dashboard entry route
│
├── frontend/                      # Presentation layer
│   ├── pages/                     # Full-page views
│   │   ├── Dashboard.jsx          # Main captain workspace & operations
│   │   ├── AdminDashboard.jsx     # Master admin workspace & management
│   │   └── SignInPage.jsx         # Authentication view
│   │
│   ├── components/                # Modular UI components
│   │   ├── common/                # Shared, cross-cutting UI elements
│   │   │   └── SocialIcons.jsx    # Standardized WhatsApp & Facebook SVG icons
│   │   │
│   │   ├── dashboard/             # Captain dashboard components
│   │   │   ├── events/            # EventsView subcomponents
│   │   │   │   ├── events-config.js          # Type & status badge configurations
│   │   │   │   ├── EventOverviewCard.jsx     # Overview card in event grid
│   │   │   │   ├── EventDetailHero.jsx       # Event detail header & financial bar
│   │   │   │   ├── EventParticipantCard.jsx  # Participant attendance & payment card
│   │   │   │   └── EventBulkActionsDock.jsx  # Bulk participant operations bar
│   │   │   ├── EventsView.jsx     # Events & trips coordination surface
│   │   │   ├── Profile.jsx        # Player profile, subscriptions, and belt history
│   │   │   ├── PlayerRow.jsx      # Individual player row in roster table
│   │   │   ├── StatsGrid.jsx      # Top KPI analytics grid
│   │   │   └── Header.jsx / Footer.jsx
│   │   │
│   │   └── admin/                 # Admin dashboard components
│   │       ├── captains/          # Captain management modular subcomponents
│   │       │   ├── CaptainDesktopRow.jsx     # Desktop table row
│   │       │   ├── CaptainMobileCard.jsx     # Mobile card view item
│   │       │   ├── CaptainActionSheet.jsx    # Mobile drawer actions sheet
│   │       │   ├── CaptainFilterModal.jsx    # Filter and sort modal
│   │       │   ├── CaptainHallsTab.jsx       # Details modal: halls & branches
│   │       │   ├── CaptainEventsTab.jsx      # Details modal: events & activities
│   │       │   └── CaptainAuditTab.jsx       # Details modal: audit log trail
│   │       ├── promo/             # Promo card generator subcomponents
│   │       │   ├── promo-constants.js        # Theme definitions (Dark, Light, Red)
│   │       │   └── CaptainCardRow.jsx        # Batch card generation row item
│   │       ├── AdminCaptainsTab.jsx          # Captain accounts tab coordinator
│   │       ├── CaptainDetailsModal.jsx       # Captain 360-degree inspection modal
│   │       └── AdminPromoTab.jsx             # Promotional card generator
│   │
│   └── lib/                       # Frontend utilities & graphic generation engines
│       ├── birthday-card-utils.js # Canvas birthday card generator
│       ├── welcome-card-utils.js  # Canvas welcome card generator
│       ├── profile-card-utils.js  # Canvas player profile ID card generator
│       ├── promo-card-utils.js    # Canvas platform promo banner generator
│       ├── excel-export-utils.js  # XLSX roster & event export utilities
│       └── dashboard-utils.js     # Belt colors, currency formatters, WhatsApp links
│
└── backend/                       # Server-side business logic & persistence
    ├── lib/                       # MongoDB client, auth, and multi-tenant security
    ├── models/                    # Schemas (Captain, Player, Event, AuditLog)
    └── services/                  # Emailing, backup scheduling, snapshot archival
```

---

## 3. Core Design & Refactoring Patterns

### A. Modular Subcomponent Hierarchy
Large interactive views are decomposed into focused subcomponents grouped in dedicated subdirectories:
- **`frontend/components/admin/captains/`**: Separates desktop rows, mobile cards, filter sheets, and drill-down modal tabs.
- **`frontend/components/dashboard/events/`**: Separates overview cards, detail hero banners, participant action docks, and configuration tokens.
- **`frontend/components/admin/promo/`**: Separates theme presets and individual generator rows.

### B. Canvas Graphics Generator Engines
High-resolution canvas generation routines are encapsulated in `frontend/lib/*-card-utils.js`:
- Follow standard HTML5 Canvas 2D context drawing techniques with font-loading synchronization.
- Strictly isolated from React rendering state to prevent CPU/memory overhead.
- Includes `profile-card-utils.js`, `welcome-card-utils.js`, `birthday-card-utils.js`, and `promo-card-utils.js`.

### C. Shared Presentation Primitives
Commonly duplicated elements (e.g. brand SVGs, WhatsApp actions, social media links) reside in `frontend/components/common/` to guarantee single-source-of-truth styling across all modals, banners, and footers.

### D. Multi-Tenancy & Data Isolation
- Each captain's data (players, branches, attendance, events) is scoped by `userId` / `academyName`.
- Event finances use ID-isolated accounting calculations so that metrics remain accurate when filtering between individual events and academy-wide aggregates.

---

## 4. Verification & Quality Assurance

To verify code integrity after any changes:

```bash
# Verify ESLint rules
npm run lint

# Verify Next.js production build and Turbopack route compilation
npm run build
```
