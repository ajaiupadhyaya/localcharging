# App Store submission checklist

## Before build

- [ ] Update `eas.json` → `submit.production.ios` with Apple ID, ASC App ID, Team ID
- [ ] Update `app.json` → `extra.eas.projectId` with EAS project ID
- [ ] Confirm bundle ID `com.chargelocal.app` in App Store Connect
- [ ] Host Terms/Privacy at public URLs (or use in-app only for review — note in review notes)
- [x] Create demo accounts: `driver@chargelocal.test`, `host@chargelocal.test` (`npm run seed`)
- [x] Seed demo charger + public stations (`npm run seed`)

## Build & submit

```bash
eas login
eas build:configure   # if not done
eas build --profile development --platform ios   # Mapbox requires a dev client
eas build --profile production --platform ios
eas submit --platform ios --latest
```

Development builds are required for Mapbox (not Expo Go). Production submit still needs your Apple Team ID in `eas.json`.

## App Store Connect metadata

- **Name:** ChargeLocal
- **Subtitle:** Local charging for your EV
- **Category:** Travel or Navigation
- **Age rating:** Likely 12+ (UGC, location)
- **Privacy policy URL:** your hosted privacy page (in-app `/legal/privacy` until hosted)
- **Support URL:** contact or GitHub issues

## Review notes (paste into App Store Connect)

```
ChargeLocal is a marketplace connecting EV drivers with residential hosts.

Demo driver: driver@chargelocal.test / ChargeLocalDemo1!
Demo host: host@chargelocal.test / ChargeLocalDemo1!

Flow to test:
1. Sign in as driver → Map tab → select residential charger → Request a charge
2. Sign in as host → Host tab → Approve request
3. Driver → Activity/Booking → see approved address → Open in Maps → Start/end session

Notes:
- Residential map pins are intentionally approximate until booking approval (privacy)
- Stripe is in TEST MODE — no real payments are processed (use 4242… if prompted)
- Location permission is When-In-Use only for showing nearby chargers
- Account deletion available under Profile
- Legal copy is pending professional counsel review
```

## Privacy nutrition labels (App Store)

| Data type | Linked to user | Purpose |
|-----------|----------------|---------|
| Precise location | Yes | App functionality (nearby chargers) |
| Email | Yes | Account |
| Photos | Yes | Host listing photos |
| Payment info | Yes | Stripe checkout (test mode) |
| Product interaction | Yes | Analytics (dev only unless PostHog enabled) |

## Post-approval

- Enable Sentry / crash reporting
- Switch Stripe to live mode when legally ready
- Schedule OCM sync cron in Supabase dashboard
