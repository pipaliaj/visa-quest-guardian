// Server-side helper: enqueues a transactional email by directly POSTing
// to the local send route using the service role key. Used by fanout (no user JWT).
export async function sendTransactionalServer(params: {
  templateName: string
  recipientEmail: string
  idempotencyKey: string
  templateData?: Record<string, any>
}): Promise<{ ok: boolean; status: number; body?: any }> {
  const url = process.env.SUPABASE_URL // not actually used; we POST to ourselves
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return { ok: false, status: 500 }

  // Compute self origin from request env. In the Worker runtime we use a
  // relative URL via the `lovable.app` host, but for cron-style calls we have
  // VITE_PUBLIC_SITE_URL or similar. Easiest: call the route directly.
  const base = process.env.PUBLIC_SITE_URL
    || (typeof globalThis !== 'undefined' && (globalThis as any).location?.origin)
    || ''

  const target = `${base}/lovable/email/transactional/send`
  try {
    const res = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // The send route accepts both user JWT and the service role key.
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify(params),
    })
    const body = await res.json().catch(() => ({}))
    return { ok: res.ok, status: res.status, body }
  } catch (e) {
    console.error('[email/send] fetch failed', e)
    return { ok: false, status: 0 }
  }
}
