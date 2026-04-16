# Split the Bill

Split the Bill is a React Native app for group dining: scan a restaurant receipt, parse line items with Gemini, and let everyone at the table swipe to claim what they ordered.

## Stack overview

| Layer | Technology | Purpose |
| --- | --- | --- |
| Mobile app | Expo + React Native + Expo Router | iOS/Android app shell, routing, camera UX |
| Backend | Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) | Persistence, auth, image storage, live updates |
| AI parsing | Gemini 2.0 Flash-Lite | Receipt understanding + structured JSON extraction |
| Styling | NativeWind + Tailwind CSS | Utility-first styling with `className` |
| Client state | Zustand | Current bill/participant local UI state |
| Server state | TanStack Query | Cached data fetching and mutations |
| Animations | Reanimated + Gesture Handler | Swipe-to-claim interactions |

## Repository structure

```text
splitthebill/
├── apps/
│   └── mobile/
├── packages/
│   └── shared/
├── supabase/
│   ├── migrations/
│   └── functions/
│       └── scan-receipt/
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── README.md
```

## Getting started

### Prerequisites

- Node.js 20+
- pnpm 9+
- Expo CLI (`npx expo` is fine)
- Supabase CLI (for local DB/functions/deploy)

### Install dependencies

```bash
pnpm install
```

### Supabase setup

1. Create a Supabase project.
2. Apply migration:
   ```bash
   supabase db push
   ```
3. Create a Storage bucket named `receipts`.
4. Deploy function after setting env vars:
   ```bash
   supabase functions deploy scan-receipt
   ```

### App environment variables

Copy the example file:

```bash
cp /home/runner/work/splitthebill/splitthebill/apps/mobile/.env.example /home/runner/work/splitthebill/splitthebill/apps/mobile/.env
```

Set `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.

### Run the app

```bash
pnpm --filter mobile start
```

Then launch in iOS simulator, Android emulator, or Expo Go.

## Edge function deployment

Deploy from repo root:

```bash
supabase functions deploy scan-receipt
```

## Environment variables reference

| Variable | Required | Used by | Description |
| --- | --- | --- | --- |
| `EXPO_PUBLIC_SUPABASE_URL` | Yes | Mobile app | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Yes | Mobile app | Supabase anon public key |
| `SUPABASE_URL` | Yes | Edge function | Supabase URL for service client |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Edge function | Service key for storage download + DB writes |
| `GEMINI_API_KEY` | Yes | Edge function | Gemini API key for receipt parsing |

## v1 features

- Scan receipts from camera (`expo-camera`)
- Upload original image to Supabase Storage
- Parse receipt line items using Gemini structured JSON responses
- Persist bills, items, participants, and claims in Postgres
- Join bills with a 6-character room code
- Swipe right to claim / swipe left to unclaim items
- Realtime participant/claim sync via Supabase Realtime
- Running per-person totals with proportional tax + tip

## v1.1 roadmap

- Inline receipt correction/editing flow
- Split-item shares controls (1/2, 1/3, custom)
- Shareable settlement summary screen
- Deep-link payments (Venmo/PayPal/Revolut)
- Bill history for authenticated users
