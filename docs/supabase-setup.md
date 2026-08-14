# Supabase setup — ChargeLocal

**Project ref:** `tnqyioeviefqswcqkavq`  
**API URL:** `https://tnqyioeviefqswcqkavq.supabase.co`

## 1. Fill `.env` (client keys)

Open [API Settings](https://supabase.com/dashboard/project/tnqyioeviefqswcqkavq/settings/api) and copy into [`.env`](../.env):

| Variable | Where to get it |
|----------|-----------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Already set |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | **Project API keys** → `anon` `public` (JWT) or **Publishable key** (`sb_publishable_...`) |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | [Mapbox tokens](https://account.mapbox.com/access-tokens/) → public token (`pk.`) |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | [Stripe test keys](https://dashboard.stripe.com/test/apikeys) → Publishable key |

Restart Expo after changing `.env`: `npx expo start -c`

## 2. Edge Function secrets (server only — NOT in `.env`)

In [Edge Function Secrets](https://supabase.com/dashboard/project/tnqyioeviefqswcqkavq/settings/functions):

| Secret | Used by |
|--------|---------|
| `OPEN_CHARGE_MAP_API_KEY` | `sync-public-stations` |
| `STRIPE_SECRET_KEY` | `stripe` |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically for Edge Functions.

## 3. Apply database schema

If the project is **Active** (not paused):

```bash
npx supabase login
npx supabase link --project-ref tnqyioeviefqswcqkavq
npx supabase db push
```

## 4. Enable PostGIS

Schema migration runs `CREATE EXTENSION IF NOT EXISTS postgis`. If using the Supabase dashboard SQL editor first:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

## 5. Storage buckets

Migrations create:

- `avatars` — public read, authenticated upload to own folder
- `charger-photos` — public read, host upload

## 6. Auth redirect URLs

In [Auth URL config](https://supabase.com/dashboard/project/tnqyioeviefqswcqkavq/auth/url-configuration), add:

- `chargelocal://`
- `exp://127.0.0.1:8081` (local dev)

## 7. Demo seed

After setting `SUPABASE_SERVICE_ROLE_KEY` in `.env` (local only):

```bash
npm run seed
```

Creates `driver@chargelocal.test` / `host@chargelocal.test` (password `ChargeLocalDemo1!`) plus persona listings around Cville / Richmond / DC.

## 8. Public stations

```bash
npx supabase functions deploy sync-public-stations
npx supabase functions deploy stripe
npx supabase functions deploy notify
npx supabase functions deploy delete-account
```

Schedule `sync-public-stations` in the dashboard cron (e.g. every 6 hours).

## Troubleshooting

- **MCP / SQL timeouts:** Project may be paused or still provisioning — open the dashboard and confirm status is **Active**.
- **`get_publishable_keys` failed:** Paste the anon/publishable key manually from API Settings into `.env`.
- **Empty map:** run `npm run seed` and confirm you are zoomed near Charlottesville.
