# LifeQuest

> **Turn everyday responsibilities into an epic RPG progression.**  
> LifeQuest bridges daily habit building and role-playing games: complete real-world quests, level up five core attributes, maintain daily streaks, earn Gold, and unlock rewards in a fully server-authoritative world.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React_19-20232A?style=flat&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

---

## Live Links

- **Live Deployed App:** https://lifequest-weld-nu.vercel.app
- **Walkthrough Video:** [To be added after recording]

---

## Table of Contents

1. [Overview & Problem Statement](#overview--problem-statement)
2. [Core Features](#core-features)
3. [RPG Progression Systems](#rpg-progression-systems)
4. [Tech Stack](#tech-stack)
5. [Architecture Overview](#architecture-overview)
6. [Security & Anti-Cheat Approach](#security--anti-cheat-approach)
7. [Database Schema Overview](#database-schema-overview)
8. [Environment Variables](#environment-variables)
9. [Local Development Setup](#local-development-setup)
10. [Supabase Database Setup](#supabase-database-setup)
11. [Production Deployment (Vercel)](#production-deployment-vercel)
12. [Project Structure](#project-structure)
13. [Accessibility & Responsiveness](#accessibility--responsiveness)
14. [License](#license)

---

## Overview & Problem Statement

Most task managers and habit trackers treat personal productivity as a monotonous checklist. Gamification in traditional tools often boils down to superficial badges or arbitrary points without tangible progression, leading to quick abandonment.

**LifeQuest** reimagines personal development as an authentic RPG:
- Every quest completed awards XP, Gold, and specific Attribute growth directly tied to the nature of the task.
- Consistency is forged into a multi-tier Rank system driven by daily activity streaks.
- Hard-earned Gold can be redeemed in an in-game Shop for collectible themes, frames, badges, and cosmetics.
- 66 data-driven achievements celebrate every major milestone across all character dimensions.

---

## Core Features

- **Personalized RPG Character Sheet:** Dynamic character overview displaying Level, total XP, current Rank, active Streak, Gold balance, and proportional Attribute distribution meters.
- **Quest System:** Create custom real-life quests categorized by Attribute (*Intellect*, *Strength*, *Wellness*, *Creativity*, *Discipline*) and Difficulty (*Easy*, *Medium*, *Hard*, *Epic*).
- **TODAY Focus Mission Board:** Switch instantly between the focused **TODAY** view and **ALL QUESTS** to plan and execute daily goals without distraction.
- **Server-Authoritative Rewards:** Quest rewards, streak calculations, level increments, and attribute gains are computed exclusively on the server.
- **Dynamic Database-Driven Shop:** 25 collectible items across 4 categories (*Themes*, *Badges*, *Frames*, *Cosmetics*) with sensible progression price tiers.
- **Persistent Loot Inventory:** Track all purchased rewards, purchase timestamps, and item metadata stored reliably in Supabase.
- **Data-Driven Achievement System:** 66 server-evaluated achievements with dynamic unlock requirement hints and celebratory animated toasts.
- **Responsive Navigation:** Fixed sidebar on desktop, bottom navigation bar on mobile, with a dedicated Sign Out workflow accessible from the Character sheet.

---

## RPG Progression Systems

### 1. XP and Level
- Character level advances along a non-linear XP curve defined in the core game engine (`lib/game/logic.ts`).
- Quests reward XP proportional to difficulty.
- Level-ups are validated server-side during quest completion.

### 2. Attributes (5 Core Disciplines)
Each quest contributes to a specific real-world attribute:
- **Intellect:** Reading, coding, studying, research.
- **Strength:** Workouts, physical conditioning, sports.
- **Wellness:** Sleep, hydration, meditation, nutrition.
- **Creativity:** Writing, art, design, brainstorming.
- **Discipline:** Daily habits, chores, administrative tasks.

### 3. Streak & Rank
- **Streak:** Consecutive active quest-completion days tracked in UTC.
- **Rank:** Consistency-driven status tiers that update as streaks grow:
  - **Unranked:** < 3 days
  - **Bronze:** 3 – 6 days
  - **Silver:** 7 – 29 days
  - **Gold:** 30 – 59 days
  - **Elite:** 60+ days

### 4. Gold & Shop
- Gold is the primary in-game reward currency, earned solely through quest completion.
- The **Shop** offers 25 items across 4 categories:
  - **Themes:** Focus Theme, Midnight Obsidian, Cyberpunk Neon, Forest Sanctuary, Solar Eclipse, Mythic Aurora.
  - **Badges:** Warrior Badge, Iron Will Insignia, Scholar Quill, Phoenix Crest, Titan Sigil, Grandmaster Seal, Crown of Sovereign.
  - **Frames:** Golden Frame, Bronze Filigree, Silver Aegis, Prismatic Crystal, Dragonfire Border, Celestial Halo.
  - **Cosmetics:** Traveler Cloak Pin, Companion Pet, Hourglass of Focus, Runes of Power, Aura of Invincible, Throne of Ascended.

### 5. Inventory
- Displays all items purchased by the authenticated user from `public.inventory`.
- Enforces strict unique ownership constraints so users cannot purchase duplicates.

### 6. Achievements
- 66 data-driven achievements:
  - **Quest Completion:** 1, 10, 25, 50, 100, 250, 500, 1,000 quests completed.
  - **Streak Milestones:** 3, 7, 14, 30, 60, 100, 365-day streaks.
  - **Level Milestones:** Levels 5, 10, 20, 30, 50, 75, 100.
  - **Attribute Milestones:** 100, 500, 1,000, 2,500, 5,000, 10,000, 25,000, 50,000 points across all 5 attributes.
  - **Special Milestones:** *First Purchase*, *Loot Collector*, *Curator of Vaults*, *Gold Hoarder*.

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Frontend Library** | React 19 |
| **Language** | TypeScript (Strict Mode) |
| **Styling** | Tailwind CSS & Vanilla CSS Design Tokens |
| **Icons** | Lucide React |
| **Database** | Supabase (PostgreSQL 15+) |
| **Authentication** | Supabase Auth (`@supabase/ssr` with Cookie session storage) |
| **Security** | PostgreSQL Row Level Security (RLS) & `SECURITY DEFINER` RPCs |
| **Hosting** | Vercel |

---

## Architecture Overview

LifeQuest follows a **server-authoritative** architecture. The client is purely a presentation layer; it cannot grant rewards, deduct currency, or modify progression stats directly.

```text
┌────────────────────────────────────────────────────────┐
│                   Next.js Client                       │
│    (DashboardClient, QuestsClient, ShopClient, etc.)   │
└──────────────────────────┬─────────────────────────────┘
                           │ Invokes Server Actions
                           ▼
┌────────────────────────────────────────────────────────┐
│                   Server Actions                       │
│   (completeQuest, createQuest, purchaseItem)           │
│   - Validates user authentication via session cookies  │
│   - Verifies quest/item ownership and state            │
│   - Computes XP, Gold, Streaks, Ranks, Attributes      │
│   - Invokes checkAndUnlockAchievements()               │
└──────────────────────────┬─────────────────────────────┘
                           │ Authenticated Supabase Queries / RPC
                           ▼
┌────────────────────────────────────────────────────────┐
│               Supabase / PostgreSQL                    │
│   - Row Level Security (RLS) policies per user         │
│   - Atomic purchase_item() RPC (FOR UPDATE row lock)   │
│   - Tables: profiles, quests, items, inventory,        │
│     achievements, user_achievements, game_history      │
└────────────────────────────────────────────────────────┘
```

---

## Security & Anti-Cheat Approach

1. **Server-Authoritative Progression:**
   - In `completeQuest`, the browser transmits only the `questId`. The server inspects the database record for rewards, calculates attribute increments, applies streak updates, and writes progression to `profiles`.
2. **Atomic Shop Purchases:**
   - Item purchases invoke the `purchase_item` PostgreSQL RPC (`SECURITY DEFINER`).
   - The function uses `FOR UPDATE` row-level locking on `profiles`, ensures adequate Gold, deducts price, and inserts the inventory record within a single database transaction.
3. **Strict Row Level Security (RLS):**
   - All user data tables (`profiles`, `quests`, `inventory`, `user_achievements`, `game_history`) require `auth.uid() = user_id`.
   - Public catalogs (`items`, `achievements`) are restricted to read-only for authenticated users.
4. **Credential Isolation:**
   - Zero use of service-role / secret keys. Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are used.
5. **Robust Password Validation:**
   - Client-side policy (min. 8 characters, at least one uppercase letter, one lowercase letter, and one digit) coupled with Supabase Auth error mapping.

---

## Database Schema Overview

The database contains seven core relational tables in the `public` schema:

1. **`profiles`**: Extends `auth.users` with RPG stats (`level`, `xp`, `gold`, `streak`, `rank`, `last_active_date`, and attribute totals `intellect`, `strength`, `wellness`, `creativity`, `discipline`).
2. **`quests`**: User quest records (`user_id`, `title`, `description`, `category`, `difficulty`, `xp_reward`, `gold_reward`, `completed`, `completed_at`).
3. **`items`**: Catalog of purchasable shop goods (`name`, `description`, `type`, `price`, `image_url`, `is_active`).
4. **`inventory`**: Tracks owned items per user (`user_id`, `item_id`, `purchased_at`) with a unique composite key preventing duplicate purchases.
5. **`achievements`**: Catalog of achievements (`name`, `description`, `requirement_type`, `requirement_value`, `icon`).
6. **`user_achievements`**: Records unlocked achievements per user (`user_id`, `achievement_id`, `unlocked_at`) with unique composite constraints.
7. **`game_history`**: Append-only event log tracking completions, level-ups, rank-ups, and purchases.

---

## Environment Variables

Create a `.env.local` file in the project root by copying `.env.example`:

| Variable | Description | Required |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase Project URL (`https://<project-ref>.supabase.co`) | Yes |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Your Supabase Project Anon/Publishable API Key | Yes |

---

## Local Development Setup

### Prerequisites
- **Node.js**: v18.17 or later
- **npm**: v9 or later
- A free **Supabase** account and project

### Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/lifequest.git
   cd lifequest
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env.local
   ```
   Open `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```

4. **Set up the database schema:**
   Follow the instructions in [Supabase Database Setup](#supabase-database-setup) below.

5. **Start the local development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Supabase Database Setup

To seed and initialize the LifeQuest database, execute the SQL migration files located in the `supabase/` directory in your **Supabase Dashboard → SQL Editor → New Query**:

1. **Shop & Purchase RPC Migration:**
   - Run [supabase/phase4_shop.sql](supabase/phase4_shop.sql)
   - *Sets up `items`, `inventory`, RLS policies, and the atomic `purchase_item` RPC.*

2. **Achievements Base Migration:**
   - Run [supabase/phase6_achievements.sql](supabase/phase6_achievements.sql)
   - *Sets up `achievements`, `user_achievements`, and requirement structure.*

3. **Game System Expansion Migration:**
   - Run [supabase/phase7_expansion.sql](supabase/phase7_expansion.sql)
   - *Idempotently seeds all 25 shop items and 66 milestone achievements.*

> **Note:** All migration scripts are fully idempotent (`ON CONFLICT DO UPDATE` / `IF NOT EXISTS`), making them completely safe to run multiple times without creating duplicate records.

---

## Production Deployment (Vercel)

1. Push your repository to GitHub.
2. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
3. Import your `lifequest` repository.
4. Under **Environment Variables**, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
5. Click **Deploy**. Vercel will automatically build and deploy the application.

---

## Project Structure

```text
lifequest/
├── app/
│   ├── (app)/                   # Authenticated application shell
│   │   ├── achievements/        # Achievements view (server-rendered)
│   │   ├── character/           # RPG Character Sheet & Session Controls
│   │   ├── dashboard/           # Dashboard (Progression stats & TODAY view)
│   │   ├── inventory/           # User loot bag
│   │   ├── quests/              # Quests catalog & TODAY focus board
│   │   ├── shop/                # In-game reward store
│   │   └── layout.tsx           # Authenticated session boundary & layout
│   ├── actions/                 # Server Actions (Authoritative game logic)
│   │   ├── complete-quest.ts    # Authoritative quest completion & rewards
│   │   ├── create-quest.ts      # Validated quest creation
│   │   └── purchase-item.ts     # Atomic shop purchase handler
│   ├── auth/                    # Authentication pages (Login, Sign-Up, Reset)
│   ├── globals.css              # LifeQuest design tokens & themes
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/
│   ├── achievements/            # Achievement cards & unlock toast
│   ├── app/                     # Sidebar, MobileNav, headers
│   ├── character/               # Sign-out & character controls
│   ├── dashboard/               # XP bar, stats cards, live client
│   ├── quests/                  # Quest row, creation dialog, toasts
│   ├── shop/                    # Shop client & item cards
│   └── ui/                      # Base UI elements
├── lib/
│   ├── game/
│   │   ├── achievements.ts      # Server-side achievement checker
│   │   ├── logic.ts             # XP curves, ranks, streak math, formulas
│   │   └── types.ts             # Canonical TypeScript domain types
│   ├── hooks/                   # Client hooks (useToday, etc.)
│   └── supabase/                # Supabase client, server, and proxy utilities
├── supabase/                    # Production SQL migrations & seed scripts
│   ├── phase4_shop.sql
│   ├── phase6_achievements.sql
│   └── phase7_expansion.sql
├── .env.example                 # Safe environment template
├── proxy.ts                     # Edge routing & auth proxy
└── package.json
```

---

## Accessibility & Responsiveness

- **Responsive Layout:** Adaptive navigation featuring a full desktop sidebar (`AppSidebar`) on wide viewports and a bottom navigation bar (`MobileNav`) for mobile screens, with sign-out accessible via both the desktop sidebar and the mobile character sheet.
- **Clear Visual Feedback:** Visual feedback on interactions including quest completion toasts, active route highlights, achievement unlock notifications, and distinct state badges.
- **Consistent Theming:** Dark mode UI styled with semantic CSS custom properties and Tailwind CSS for readable contrast, structured typography, and clear visual hierarchy.

---

## License

This project was created for the **LifeQuest Hackathon**.
