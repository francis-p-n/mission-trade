# Mission Market 📈

**Mission Market** is a live, multiplayer simulation game built for youth sessions. It's designed to be experienced on a large projector, managed by a facilitator, and played from students' mobile devices.

The game creates emotional tension around short-term gain versus long-term faithfulness by having students invest in four different "paths" over several rounds.

---

## 🎯 Core Concept

Students start with 500 Session Credits and must choose one of four paths each round:
1. **Stable Path** — Low risk, steady return.
2. **Popular Path** — Driven by hype and group momentum.
3. **Success Path** — High-risk, high-reward, flashy growth.
4. **Foundation Path** — Slow, unimpressive early on, but heavily rewarded at the end.

The game is intentionally rigged by the facilitator to make the **Foundation Path** look weak early on, before surging at the end—teaching a lesson about patience, faithfulness, and long-term vision over immediate, flashy rewards.

---

## 🏗️ Architecture & Tech Stack

This project is built to be resilient, fast, and real-time:
- **Framework**: Next.js 15+ (App Router) & React 19
- **Styling**: Tailwind CSS for responsive, glassmorphism UI
- **Database & Realtime**: Supabase (PostgreSQL & Realtime subscriptions)
- **Unit Testing**: Jest + React Testing Library
- **E2E Integration Testing**: Playwright

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file in the root of your project with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_ADMIN_PASSWORD=your_secure_admin_password
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### 3. Database Setup
Initialize your Supabase database by running the schema provided in `supabase/schema.sql`. This will create the necessary `sessions`, `players`, `paths`, `rounds`, `choices`, and `events` tables, along with Row-Level Security (RLS) policies.

### 4. Run the Development Server
```bash
npm run dev
```
Navigate to `http://localhost:3000` to access the homepage.

---

## 🎮 How to Play / Run a Session

1. **Facilitator**: Go to `http://localhost:3000` and click "Create New Session".
2. **Presenter Screen**: Open the Presenter View on the main projector so students can see the session QR code and live updates.
3. **Students**: Simply scan the giant QR code on the projector to instantly join the session on your phone. (No app install or manual code entry required!)
4. **Admin Dashboard**: Once ready, the facilitator uses the Admin Panel to start the game, trigger events (e.g., "Hype Surge", "Market Drop"), and progress through rounds.

---

## 🧪 Testing

Mission Market includes a robust testing suite to guarantee reliability during live events.

### Unit Tests
Tests the pure logic of the game engines (`round-engine.ts`, `session-engine.ts`, `forecast-engine.ts`).
```bash
npm run test
```

### End-to-End (Integration) Tests
Tests the UI flows (Admin creation, Student joining) using Playwright. The E2E tests automatically mock the Supabase network layer so they can be run in any environment without a seeded database.
```bash
npm run test:e2e
```
