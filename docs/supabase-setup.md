# Supabase setup — ChargeLocal

**Project ref:** `sqyypzixzprkiwapzidc`  
**API URL:** `https://sqyypzixzprkiwapzidc.supabase.co`

## 1. Fill `.env` (client keys)

Open [API Settings](https://supabase.com/dashboard/project/sqyypzixzprkiwapzidc/settings/api) and copy into [`.env`](../.env):

| Variable | Where to get it |
|----------|-----------------|
| `EXPO_PUBLIC_SUPABASE_URL` | Already set |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | **Project API keys** → `anon` `public` (JWT) or **Publishable key** (`sb_publishable_...`) |
| `EXPO_PUBLIC_MAPBOX_TOKEN` | [Mapbox tokens](https://account.mapbox.com/access-tokens/) → public token (`pk.`) |
| `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` | [Stripe test keys](https://dashboard.stripe.com/test/apikeys) → Publishable key |

Restart Expo after changing `.env`: `npx expo start -c`

## 2. Edge Function secrets (server only — NOT in `.env`)

In [Edge Function Secrets](https://supabase.com/dashboard/project/sqyypzixzprkiwapzidc/settings/functions):

| Secret | Used by |
|--------|---------|
| `OPEN_CHARGE_MAP_API_KEY` | `sync-public-stations` |
| `STRIPE_SECRET_KEY` | `stripe` |

`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are injected automatically for Edge Functions.

## 3. Apply database schema

If the project is **Active** (not paused):

```bash
npx supabase login
npx supabase link --project-ref sqyypzixzprkiwapzidc
npx supabase db push
```

Or ask Cursor to run migrations via the Supabase MCP once the database responds (MCP reported timeouts while the project was still initialising).

## 4. Enable PostGIS

Schema migration runs `CREATE EXTENSION IF NOT EXISTS postgis`. If using the Supabase dashboard SQL editor first:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

## 5. Storage buckets

Create in [Storage](https://supabase.com/dashboard/project/sqyypzixzprkiwapzidc/storage/buckets):

- `avatars` — public read, authenticated upload to own folder
- `charger-photos` — public read, host upload

## 6. Auth redirect URLs

In [Auth URL config](https://supabase.com/dashboard/project/sqyypzixzprkiwapzidc/auth/url-configuration), add:

- `chargelocal://`
- `exp://127.0.0.1:8081` (local dev)

## Troubleshooting

- **MCP / SQL timeouts:** Project may be paused or still provisioning — open the dashboard and confirm status is **Active**.
- **`get_publishable_keys` failed:** Paste the anon/publishable key manually from API Settings into `.env`.
