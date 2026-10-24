# Saheli Backend – Women's Safety Companion API

Backend API, safety intelligence, and emergency workflows for **Saheli – Women's Safety Companion**.

---

## 1. Quick Start

### Prerequisites
- **Node.js**: v20+ (tested on Node v24)
- **npm** (or pnpm / yarn)

### Installation
```bash
# Navigate to the backend directory
cd saheli-backend

# Install dependencies
npm install

# Push schema to SQLite database (creates dev.db)
npx prisma db push

# Seed sample data (Shillong fixtures, sample shelters, sample alerts)
npx tsx prisma/seed.ts
```

### Running the Server
```bash
# Development mode with hot-reloading
npm run dev

# Production build and run
npm run build
npm start
```

The API will be available at: `http://localhost:5000/api/v1`

---

## 2. Environment Variables

Copy `.env.example` to `.env`:
```env
PORT=5000
NODE_ENV=development
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:5173

# Database connection
DATABASE_URL=file:./dev.db

# JWT Secret
JWT_SECRET=saheli_super_secret_development_jwt_key_change_in_production_2026

# Emergency notification mode: "mock" (safe) or "real"
EMERGENCY_DELIVERY_MODE=mock

# AI Assistant: "mock" or "gemini"
AI_PROVIDER=mock
GEMINI_API_KEY=
```

---

## 3. Database Architecture & PostgreSQL Migration Guide

### Current Setup (SQLite)
During local development, the backend uses **SQLite** (`file:./dev.db`) through Prisma ORM for instant zero-dependency execution.

### Exact Steps Required to Migrate to PostgreSQL
Migrating from SQLite to PostgreSQL is planned and straightforward, but requires these specific verified steps:

1. **Update `prisma/schema.prisma` datasource**:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. **Update `DATABASE_URL` in `.env`**:
   Replace `file:./dev.db` with your PostgreSQL connection string:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/saheli?schema=public
   ```
3. **Database Engine Differences Handled**:
   - **No Native Enums Used**: SQLite does not support enums; we used verified string literals validated through Zod in TypeScript, which are 100% compatible with PostgreSQL without migration failures.
   - **No Native String Arrays**: SQLite lacks array types; arrays (such as contact roles and shelter facilities) are stored as JSON strings (`String`), which seamlessly work across both database engines.
   - **Autoincrementing IDs**: Both engines use standard integers (`Int @id @default(autoincrement())`), matching the frontend contract (`id: number`).
4. **Create First PostgreSQL Migration**:
   ```bash
   npx prisma migrate dev --name init_postgres
   ```
5. **Re-seed Data**:
   ```bash
   npx tsx prisma/seed.ts
   ```

---

## 4. API Endpoints (Phase 2 & Phase 3)

### Health Check
- `GET /health` or `GET /api/v1/health`
  - Returns service status, version, uptime, environment, and active mock flags.

### Authentication & User Profiles
- `POST /api/v1/auth/otp`
  - **Body**: `{ "phone": "9876543210" }`
  - Enforces 60-second resend cooldown and 5-minute expiry.
  - Returns: `{ "success": true, "data": { "message": "If this is a valid phone number, an OTP has been sent." } }`
  - In development, the 6-digit OTP is safely logged to the backend console. In production, console logging is disabled.
- `POST /api/v1/auth/verify`
  - **Body**: `{ "phone": "9876543210", "code": "123456" }`
  - Enforces a 3-attempt limit; invalidates OTP on excessive failed attempts.
  - Returns signed JWT token and user profile.
- `GET /api/v1/me`
  - **Headers**: `Authorization: Bearer <TOKEN>`
  - Returns authenticated user profile, emergency preferences, and notification preferences.
- `PUT /api/v1/me`
  - **Headers**: `Authorization: Bearer <TOKEN>`
  - Updates profile name, city, and emergency/notification settings.

### Area Safety Insights & Route Comparison (Phase 4)
- `GET /api/v1/areas/:name/insights`
  - Returns empirical evidence signals (street lighting, transit, open public places, recent community reports, hazards, freshness).
  - Automatically flags sample vs verified live data.
  - Returns `safetyStatus: "Unknown"` and `confidence: "None"` for unmonitored areas (zero fabrication).
  - Protects community privacy (never exposes user phone numbers, IDs, or exact private addresses).
- `POST /api/v1/routes/compare`
  - **Body**: `{ "origin": "Police Bazaar", "destination": "Laitumkhrah", "mode": "Walk", "timeOfDay": "Evening" }`
  - Compares route alternatives, cleanly separating travel metrics (time, distance, speed) from safety evidence.
  - Explains trade-offs (e.g. lighting vs distance vs weather advisories).
  - For unmapped corridors, returns `status: "insufficient_data"` without fabricating imaginary paths.
  - Mandatory disclaimer: *"No route can be guaranteed as completely safe."*

### AI Safety Assistant, Disaster Alerts & Shelters (Phase 5)
- `POST /api/v1/assistant`
  - **Body**: `{ "prompt": "What should I do if I feel unsafe?", "context": { "night": true } }`
  - Returns de-escalation, nearest safe public place guidance, and immediate contact recommendations (Call 112 / 1091 / 1930).
  - Cites all evidence and safety sources.
  - Transparently identifies `provider: "heuristic_mock"` or `"gemini"` and explicitly notes it is not real-time surveillance.
  - Ready for Google Gemini via `GEMINI_API_KEY` without breaking rule-based fallbacks.
- `GET /api/v1/alerts`
  - **Query Params**: `active=true|false`, `area=...`, `severity=info|warning|danger`
  - Returns disaster and weather alerts clearly flagged with `isSample: true` for demo fixtures.
  - Explicitly states that real-time municipal telemetry requires official CAP / SDMA API feeds.
- `GET /api/v1/shelters`
  - **Query Params**: `womenOnly=true|false`, `accessible=true|false`, `open24=true|false`, `area=...`, `status=Confirmed|Reported|Unknown`
  - Returns verified shelters with parsed facilities array, contact phone, and operating status.
  - Distinguishes Confirmed, Reported, and Unknown records.

### Emergency Workflows, Contacts & Live Sharing (Phase 6)
- `GET`, `POST /api/v1/contacts` & `PUT`, `DELETE /api/v1/contacts/:id`
  - Strict user-isolation: users can access and modify only their own contacts.
  - Formats roles and escalation rules.
- `POST /api/v1/checkins` & `GET /api/v1/checkins/active`
  - Starts and tracks timed check-ins with grace periods.
  - `PATCH /api/v1/checkins/:id/safe`: Marks check-in safe and dispatches simulated confirmation.
  - `PATCH /api/v1/checkins/:id/extend`: Extends timer (+10 min).
  - `DELETE /api/v1/checkins/:id`: Cancels session.
  - **Server-Side Escalation Worker**: Runs every 15 seconds. If a check-in is past its grace period (`graceDueAt <= now`), it atomically transitions to `"escalated"` and logs a missed-check-in alert. Idempotent logic prevents duplicate alerts across server restarts.
  - *Limitation*: Server-side escalation operates only while the backend server process and its background worker are alive and reachable.
- `POST /api/v1/messages` & `GET /api/v1/messages`
  - General outbox queueing endpoint for notifications. All messages are dispatched to the Safe Mock Notifier (`status: "mock_delivered"`).
- `POST /api/v1/sos`
  - Triggers an SOS emergency alert. Includes 5-second duplicate suppression to prevent accidental double-tap spam.
- `POST /api/v1/sos/cancel`
  - Registers that the user is safe without deleting original SOS records, preserving safety audit integrity.
- `POST /api/v1/sharing` & `GET /api/v1/sharing/active`
  - Starts live location sharing with an unguessable 48-character cryptographic token (`publicToken`).
  - `PATCH /api/v1/sharing/:id/pause`, `resume`, `end`: Controls sharing lifecycle.
  - `POST /api/v1/sharing/:id/location`: Saves coordinates; automatically trims breadcrumbs to the latest 10 points to protect user privacy.
  - `GET /api/v1/sharing/public/:token`: Public endpoint for trusted contacts. Strict privacy enforcement: **never leaks user phone, email, name, user ID, or contact IDs**. Returns coordinates only while the session is actively live; hides location when paused, expired, or ended.

---

## 5. Automated Tests

Run the comprehensive test suite with Vitest:
```bash
npm test
```

The test suite validates:
- Health check endpoints (`/health` & `/api/v1/health`)
- OTP generation and 60-second cooldown enforcement
- OTP verification with valid 6-digit code
- Rejection of invalid OTPs with remaining attempt counter
- Invalidation after 3 failed attempts
- Rejection of expired OTPs
- Bearer token authorization (401 on missing/invalid tokens)
- Profile retrieval and updates (`GET /me` & `PUT /me`)
- Explainable safety scoring calculation (supported, caution, limited)
- Zero-hallucination handling for missing signals and unmonitored areas (`Unknown`)
- Stale signal detection and confidence downgrading (>24 hours)
- Community report privacy protection (zero leakage of private identifiers)
- Route comparison with separation of travel time from safety evidence
- Non-fabrication of unmapped corridors (`insufficient_data`)
- AI Assistant emergency prompts (recommending 112, well-lit places, trusted contacts)
- AI Assistant cyber harassment queries (1930 and cybercrime portal guidance)
- Disaster contextual answers and non-surveillance disclaimers
- Disaster alert filtering (active vs inactive, sample data tagging)
- Shelter locator filtering (women-only, 24/7, accessible, verified status)
- Contact CRUD and strict user ownership isolation
- Check-in creation, extension, and safe confirmation
- Server-side check-in escalation worker execution and idempotency (zero duplicates)
- SOS trigger, rapid duplicate suppression, and cancellation history preservation
- Live location sharing public token security and privacy enforcement (zero leakage)
- Location breadcrumb trimming (10 points max)

---

## 6. Feature Implementation Status Matrix

| Component | Status | Details |
| :--- | :--- | :--- |
| **Health API** | ✅ Fully Working | Tested and verified live. |
| **Database (SQLite + Prisma)** | ✅ Fully Working | Synced, models created, seeded. |
| **Phone OTP & JWT Auth** | ✅ Fully Working | Tested with expiry, cooldown, attempt limits. |
| **User Profile & Preferences** | ✅ Fully Working | `GET /me` and `PUT /me` active with Zod validation. |
| **Trusted Contacts API** | ✅ Fully Working | Strict user isolation; CRUD operations verified. |
| **Check-in & Escalation Worker** | ✅ Fully Working | Server-side timer; idempotent escalation alerts. |
| **Emergency Messages & Outbox** | ✅ Fully Working | Mock dispatch, outbox history, non-erasing cancels. |
| **SOS Trigger & Duplicate Guard** | ✅ Fully Working | Rapid double-tap suppression; audit trail preserved. |
| **Live Location Sharing** | ✅ Fully Working | Unguessable token, lifecycle controls, strict public privacy. |
| **Area Safety Scoring** | ✅ Fully Working | Strict zero-fabrication; explains all factors. |
| **Route Comparison API** | ✅ Fully Working | Travel time separated from safety evidence; trade-offs explained. |
| **AI Safety Assistant** | ✅ Fully Working (Heuristic) | Source-cited responses; Gemini provider abstraction ready. |
| **Disaster Alerts API** | ✅ Fully Working (Demo Feeds) | Seeded fixtures; clearly tagged `isSample: true`. |
| **Shelter Locator API** | ✅ Fully Working (Demo Fixtures)| Filterable by women-only, accessible, 24/7, status. |
| **Real Carrier SMS / 112 Calls** | 🛡️ Safe Mock Mode | Logs simulated alerts; no real SMS/112 calls dispatched. |
| **Frontend Integration** | ⏳ Phase 7 | Scheduled next. |
