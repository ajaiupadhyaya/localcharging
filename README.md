# ChargeLocal

A local charging layer for your EV — residential chargers alongside public infrastructure on one map.

## Stack

- **Client:** Expo SDK 57 (iOS, Android, Web) + Expo Router + NativeWind
- **Maps:** Mapbox (`@rnmapbox/maps` native, `mapbox-gl` web)
- **Backend:** Supabase (Postgres + PostGIS, Auth, Storage, Realtime, Edge Functions)
- **Payments:** Stripe Connect (test mode for v1)
- **Public data:** Open Charge Map (via Edge Function sync)

## Prerequisites

- Node.js 20+
- Expo/EAS CLI: `npm i -g eas-cli`
- Apple Developer account (for TestFlight / App Store)
- Supabase project with PostGIS enabled
- Mapbox access token
- Open Charge Map API key (optional for public sync)
- Stripe test keys (optional until payment flow)

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and fill in keys. See [docs/supabase-setup.md](docs/supabase-setup.md) for this project's Supabase ref (`tnqyioeviefqswcqkavq`).

   ```bash
   cp .env.example .env
   ```

3. **Supabase**

   ```bash
   npx supabase link --project-ref YOUR_REF
   npx supabase db push
   npx supabase functions deploy sync-public-stations
   npx supabase functions deploy stripe
   npx supabase functions deploy notify
   npx supabase functions deploy delete-account
   npm run seed
```

   Set Edge secrets: `OPEN_CHARGE_MAP_API_KEY`, `STRIPE_SECRET_KEY`. Service role is injected automatically for Edge Functions; use it locally only for `npm run seed`.

4. **Run (requires dev build for Mapbox on device)**

   ```bash
   npx expo start
   ```

   Mapbox native modules require a **development build**, not Expo Go:

   ```bash
   eas build --profile development --platform ios
   ```

## Project structure

```
app/           Expo Router screens
src/
  components/  UI + map primitives
  features/    MapShell, hosting, bookings
  lib/         auth, pricing, privacy, providers, payments
supabase/      migrations, edge functions, seed
```

## Core loop

1. Driver opens map → finds residential or public charger
2. Requests a charging window
3. Host approves (or auto-approve listing)
4. Exact address unlocks
5. Check-in → estimated charging session → complete → review

## Tests

```bash
npm test
npm run seed          # demo users + Mid-Atlantic listings (needs service role or run supabase/seed/story_users.sql)
```

## App Store submission (Phase 10)

1. Update `eas.json` submit block with your Apple ID, ASC App ID, Team ID
2. Create app in App Store Connect (`com.chargelocal.app`)
3. Production build: `eas build --profile production --platform ios`
4. Submit: `eas submit --platform ios --latest`
5. Provide review demo accounts (driver + host) and note:
   - Residential pins are approximate until approval
   - Stripe is in test mode (no real charges)
   - Location is When-In-Use only

### Privacy nutrition labels

- Location (When In Use)
- Email
- Photos (host listings)
- Payment info (Stripe)
- Product interaction / diagnostics

### Required in app

- Terms, Privacy, Safety screens (`/legal/*`)
- Account deletion (Profile)
- Location purpose string (configured in `app.json`)

## Design

See [docs/design-tokens.md](docs/design-tokens.md). Map-first IA; no generic SaaS dashboard patterns.

## License

See LICENSE.
