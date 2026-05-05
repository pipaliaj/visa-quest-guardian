## Problem

The Admin page (`/dashboard/admin`) crashes with "Something went wrong" because every call to a server function (`listScraperKeys`, `createScraperKey`, `injectTestSlot`) returns **401 Unauthorized**.

Confirmed in worker logs:

```
GET https://jaypipalia.com/_serverFn/REDACTED → 401  (x6, right after admin page load)
```

## Root cause

Server functions wrapped with `requireSupabaseAuth` need the user's bearer token in the `Authorization` header. The TanStack Start client does **not** attach it automatically.

The sibling `dashboard.credentials.tsx` route already solves this with a helper:

```ts
const getAuthHeaders = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  return token ? { authorization: `Bearer ${token}` } : undefined;
};

await list({ headers: await getAuthHeaders() });
```

`dashboard.admin.tsx` is missing this — it calls `list()`, `create({ data })`, `inject({ data })` with no headers, so the middleware throws 401 → the unhandled rejection in `useEffect` propagates to the router error boundary → "Something went wrong" page.

## Fix

In `src/routes/dashboard.admin.tsx`:

1. Add the same `getAuthHeaders()` helper (read session, return `{ authorization: \`Bearer ${token}\` }`).
2. Pass `headers: await getAuthHeaders()` to all three server function calls:
   - `list({ headers })` in the initial load `useEffect`
   - `create({ data: { name }, headers })` in `onCreateKey`
   - `inject({ data: {...}, headers })` in `onInject`
   - `list({ headers })` again after creating a key
3. Wrap the initial `list()` call in try/catch (already there) so a transient failure doesn't take down the whole admin page.

No backend, schema, or middleware changes needed — the server functions and RLS are already correct.

## Verification after deploy

1. Reload `/dashboard/admin` — page should render without the error boundary.
2. Click **Create key** with a name like `ie-vfs-prod` — the `ssk_…` secret should appear.
3. Worker logs should show `_serverFn/...  → 200` instead of 401.
