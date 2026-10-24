# Saheli: Women's Safety Companion

Saheli is a mobile-first web app that helps women plan informed journeys, keep trusted contacts in the loop, and reach help quickly. The first region is Shillong, Meghalaya.

> **Status:** the frontend is feature-complete and runs entirely in the browser. **No backend is connected yet.** Anything that should reach another person (SOS, check-ins, live sharing, reports) is saved in a local **outbox** and is ready for the backend to deliver. See [Backend handoff](#backend-handoff).

---

## Features

| Area                 | What it does                                                                                                                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Onboarding**       | Intro, language choice, name and city, first trusted contact, location and notification permissions, SOS countdown, discreet SOS, offline pack                                                |
| **SOS**              | Confirm, then a cancellable countdown. Attaches location, can repeat location updates, sends an "I'm safe now" follow-up, and links to Call 112                                               |
| **Discreet SOS**     | Silent alert by triple-tapping the logo or shaking the phone, a practice area, and a fake incoming call                                                                                       |
| **Check-in**         | Timer with "I'm safe", +10 min and "I've arrived". A missed check-in starts a grace period, then contacts are alerted                                                                         |
| **Journeys**         | Plan a route (A/B/C with evidence), compare routes, start a journey (auto check-in and sharing optional), end it, and see history                                                             |
| **Live sharing**     | Choose contacts and a duration. Pause, resume, stop, or revoke per contact                                                                                                                    |
| **Explore**          | Map of Shillong with layers, time of day, date, zoom, area search, evidence for each area, and links to report or plan a route                                                                |
| **Trusted contacts** | Add, edit and remove contacts. Roles (SOS / journey viewer / disaster check-in), escalation rules, test message, preview of what recipients see                                               |
| **Safety tools**     | Digital safety (guides, checklist, evidence log), report a concern, shelter finder, offline tools, helplines                                                                                  |
| **Disaster**         | Official alert banner, flood and landslide guidance, and "I'm safe / I need help" check-in for contacts                                                                                       |
| **Settings**         | Theme, language, text size, simplified mode, reduced motion, voice guidance, notification categories, emergency and journey defaults, privacy dashboard (retention, data export), help, about |
| **Languages**        | English and Hindi are complete. Bengali, Nepali, Khasi and Garo are partial                                                                                                                   |

## Tech stack

- **React 19** + **TypeScript** (strict), built with **Vite**
- **Tailwind CSS v4** (base reset) + custom design tokens in `src/styles/`, with light and dark themes
- **react-hook-form** + **zod** for form validation
- **i18next** / **react-i18next** for translations
- **ESLint** (typescript-eslint, react-hooks) + **Prettier** for code quality
- State via **React Context** + `localStorage` (no external state library)

## Getting started

Requirements: **Node.js 20.19+** (22 recommended) and **pnpm** (npm also works).

```bash
pnpm install
```

```bash
pnpm dev
```

Then open http://localhost:5173. For the intended experience, use your browser's device toolbar at phone width.

| Script           | Purpose                                                    |
| ---------------- | ---------------------------------------------------------- |
| `pnpm dev`       | Start the dev server with hot reload                       |
| `pnpm build`     | Type-check, then build to `dist/`                          |
| `pnpm preview`   | Serve the production build locally (http://localhost:4173) |
| `pnpm typecheck` | TypeScript check only                                      |
| `pnpm lint`      | ESLint                                                     |
| `pnpm format`    | Format all files with Prettier (`format:check` to verify)  |

Before pushing, run `pnpm lint`, `pnpm format:check` and `pnpm build`. All three should pass with no errors.

**To reset the app** (for example, to see onboarding again), use _Profile → Settings → Clear all app data_, or _Help & support → Replay introduction_.

> Geolocation and notifications need a secure context: `localhost` or HTTPS.

## Project structure

The code is organised **by feature**: everything for one feature (screens, its components, hooks and logic) lives in one folder under `src/features/`. Shared building blocks live in the top-level folders around it. Imports use the `@/` alias for `src/`.

```
├── index.html                       HTML shell
├── eslint.config.js / .prettierrc.json
├── vite.config.ts / tsconfig.json
└── src/
    ├── main.tsx                     Entry: i18n, global styles, <App/> inside the error boundary
    ├── app/                         Application wiring (no feature UI)
    │   ├── App.tsx                  Providers, then onboarding or the main shell
    │   ├── AppShell.tsx             Tabs + bottom nav, or the top stacked screen; runs background engines
    │   ├── useDocumentPreferences.ts  Applies theme / text size / motion / language to <html>
    │   ├── navigation/
    │   │   ├── types.ts             TabName, ScreenName, ScreenParams
    │   │   ├── NavigationProvider.tsx  Tab + screen stack, synced with browser history (back button)
    │   │   ├── useNavigation.ts     useNavigation(), useScreenParams()
    │   │   └── registry.tsx         Screen name → component map, tab config
    │   └── state/
    │       ├── AppStateProvider.tsx Global user data: profile, contacts, sharing, journeys, prefs, permissions
    │       └── useAppState.ts       useAppState() and the AppState type
    ├── features/                    One folder per feature
    │   ├── onboarding/              Intro slides, about-you, setup steps
    │   ├── home/                    Home tab, route planner card
    │   ├── explore/                 Explore tab, Shillong map, area evidence sheet
    │   ├── journeys/                Journeys tab, route planning, comparison, assessment
    │   ├── contacts/                Contacts tab, contact form, recipient preview
    │   ├── profile/                 Profile tab, edit profile
    │   ├── sos/                     SOS, discreet SOS, fake call, silent SOS triggers
    │   ├── checkin/                 Check-in screen, status chip, timer engine
    │   ├── sharing/                 Live location sharing, status chip
    │   ├── disaster/                Alert card, disaster guidance + check-in
    │   ├── tools/                   Tools hub, digital safety, report, shelters, offline pack
    │   ├── privacy/                 Privacy dashboard, retention, data export
    │   ├── assistant/               Safety Assistant screen + prepared answers
    │   └── settings/                Settings, language, accessibility, notifications, preferences, help, about
    ├── components/                  Shared, feature-agnostic UI
    │   ├── ui/                      Design-system primitives: Button, Icon, Badge, Toggle, Segmented, Accordion, Toast…
    │   ├── layout/ScreenLayout.tsx  Standard screen header + back button
    │   └── ContactChips, HelplineRow, MapPreview, ErrorBoundary
    ├── hooks/                       Generic hooks: usePersistedState, useNow, useToast, useOnlineStatus
    ├── lib/                         Framework-free helpers: storage, outbox, device APIs, formatting, validation
    ├── config/                      Constants (storage keys, roles, languages) and default settings
    ├── data/                        Static and sample content: helplines, guidance, shelters, areas, routes
    ├── types/                       Shared domain types (Contact, SharingSession, CheckIn, OutboxItem…)
    ├── i18n/                        i18next setup + locales/ (en, hi complete; bn, ne, kha, garo partial)
    ├── styles/                      Global CSS split by concern (tokens, components, flows, screens, responsive)
    └── assets/                      Favicon and other static assets
```

## How it works (frontend)

- **Navigation.** Five bottom tabs. Other screens open on a stack with `open(name, params?)` and close with `back()` (both from `useNavigation()`). The stack is synced with browser history, so the device back button works. Screens are registered in `src/app/navigation/registry.tsx`.
- **Global state.** `AppStateProvider` holds data several features share (profile, contacts, sharing session, journeys, display prefs, permissions). Read it with `useAppState()`.
- **Feature state.** Settings owned by one feature use `usePersistedState(key, fallback)`. It works like `useState`, but saves to `localStorage`, and every component using the same key stays in sync. All storage keys are listed in `src/config/constants.ts`.
- **Outbox.** `queueMessage()` in `src/lib/outbox.ts` records every message meant for a contact or moderator. The Notifications screen lists it as "Activity". **This is the main backend integration point.**
- **Background engines.** `useCheckInEngine()` (due → missed → escalated) and `useDiscreetTriggers()` (shake / logo triple-tap) run in `AppShell`, so they work on any screen.

### Adding a new screen

1. Create `src/features/<feature>/<Name>Screen.tsx` with a default export. Use `ScreenLayout` and `useNavigation().back`.
2. Add its name to `ScreenName` in `src/app/navigation/types.ts`.
3. Register it in `SCREENS` in `src/app/navigation/registry.tsx`.
4. Open it from anywhere with `open("<name>")`.

### Conventions

- Shared UI goes in `components/`; anything used by only one feature stays in that feature's folder.
- No hard-coded `localStorage` keys: add them to `STORAGE_KEYS`.
- User-facing text that is translated goes through `t("key")`; add new keys to `src/i18n/locales/en.ts` (TypeScript then requires them in `hi.ts`).
- Sample data lives in `src/data/` and is marked `SAMPLE DATA`, so it is easy to swap for API calls.

## What is simulated

The UI says so wherever data is simulated.

- Map, route evidence, area insights, the heavy-rain alert and shelters are **Shillong sample data**.
- Messages to contacts are **queued locally, not delivered**.
- The Safety Assistant uses **prepared answers** based on keywords.
- Helpline numbers (112, 181, 1091, 1930, 108, 1078, 1098) are real Indian public numbers and are dialled with `tel:` links.

## Known limitations / next steps

- **Backend (in progress, separate owner):** auth, contacts sync, message delivery (SMS + push), live location links, reports moderation, official alert feed. See [Backend handoff](#backend-handoff).
- **Translations:** some screens (contacts, sharing, Explore, routes) still have English-only text. Bengali, Nepali, Khasi and Garo need native translators.
- **Background behaviour:** check-ins and repeated SOS location updates only run while the app is open in the browser. Background delivery needs the backend and push notifications.

## Backend handoff

The frontend currently stores everything in `localStorage`. These are the places to connect a backend. The UI does not need to change.

**1. Message delivery (the outbox).** Every message meant for a contact goes through `queueMessage()` in `src/lib/outbox.ts`. Each item is an `OutboxItem` (see `src/types/index.ts`) with `kind`, `title`, a ready-to-send `body`, `recipients` (contact names today; switch to ids once contacts live on the server), an optional `location` and `status: "queued"`. Keep the local write as an offline fallback, add a `POST /messages` call, and add `sent` / `delivered` / `failed` statuses. The Notifications → Activity list shows them.

| Kind                             | Created in                                                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------------- |
| `sos`, `sos-cancel`              | `features/sos/SosScreen.tsx`, `features/sos/silentSos.ts`                                   |
| `checkin-missed`, `checkin-safe` | `features/checkin/useCheckIn.ts`, `features/checkin/CheckInScreen.tsx`, `features/journeys` |
| `disaster-safe`, `disaster-help` | `features/disaster/DisasterScreen.tsx`                                                      |
| `test`                           | `features/contacts/ContactsScreen.tsx`                                                      |
| `report`                         | `features/tools/ReportConcernScreen.tsx`                                                    |
| `journey`                        | `app/state/AppStateProvider.tsx` (`startJourney`)                                           |
| `sharing`                        | `features/sharing/LiveSharingScreen.tsx`                                                    |

**2. Data to persist on the server.** These keys come from `STORAGE_KEYS` in `src/config/constants.ts`, and their types are in `src/types/index.ts`:
`profile`, `contacts`, `sharingSession`, `checkIn` (escalation must also run server-side so it works when the phone is off), `activeJourney`, `journeyHistory` (respect `retention`), `reports` (with a moderation queue), `emergencyPrefs`, `notifPrefs`. Display prefs, discreet SOS settings, the evidence log and assistant chat are device-only.

**3. Suggested endpoints.**

| Endpoint                                                            | Used by                                                       |
| ------------------------------------------------------------------- | ------------------------------------------------------------- |
| `POST /auth/otp`, `POST /auth/verify`                               | Onboarding (phone OTP)                                        |
| `GET/PUT /me`                                                       | Profile, emergency and notification prefs                     |
| `GET/POST/PUT/DELETE /contacts`                                     | Contacts tab, onboarding (send an opt-in SMS on create)       |
| `POST /messages`                                                    | Replaces `queueMessage()`                                     |
| `POST /checkins`, `PATCH /checkins/:id`                             | Check-in (server-side timer sends missed-check-in escalation) |
| `POST /sharing`, `PATCH /sharing/:id`, `POST /sharing/:id/location` | Live sharing, plus a public tracking page for recipients      |
| `POST /journeys`, `PATCH /journeys/:id/end`, `GET /journeys`        | Journeys                                                      |
| `POST /reports`, `GET /reports?area=`                               | Report a concern, Explore                                     |
| `GET /alerts`, `GET /shelters`, `GET /areas/:name/insights`         | Replace the sample data in `src/data/`                        |
| `POST /assistant`                                                   | Safety Assistant (keep `answers.ts` as fallback)              |

**4. Notes.** SMS in India needs a gateway (e.g. MSG91, Gupshup, Twilio) and DLT template registration; the outbox `body` texts are a good starting point. Read the API base URL from `import.meta.env.VITE_API_URL` (put it in `.env.local`, which git ignores).

## In an emergency

Saheli supports decisions; it does not replace emergency services. **Call 112** in India for immediate help.
