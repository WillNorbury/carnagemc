// Bridge endpoint called by the CarnageConsoleBridge Minecraft plugin.
// - GET            -> returns up to 25 pending commands, marks them sent, stamps last_seen_at
// - POST kind=results -> updates command status + response
// - POST kind=logs    -> bulk-inserts log lines
// Authentication: X-Server-Slug + X-Server-Secret headers matched against mc_servers.

import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

async function authServer(req: Request) {
  const slug = req.headers.get('x-server-slug') ?? ''
  const secret = req.headers.get('x-server-secret') ?? ''
  if (!slug || !secret) return { ok: false as const, resp: json({ error: 'missing auth headers' }, 401) }
  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const { data, error } = await admin
    .from('mc_servers')
    .select('id, ingest_secret, enabled')
    .eq('slug', slug)
    .maybeSingle()
  if (error || !data) return { ok: false as const, resp: json({ error: 'unknown server' }, 401) }
  if (!data.enabled) return { ok: false as const, resp: json({ error: 'server disabled' }, 403) }
  if (data.ingest_secret !== secret) return { ok: false as const, resp: json({ error: 'bad secret' }, 401) }
  return { ok: true as const, admin, serverId: data.id as string }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const auth = await authServer(req)
  if (!auth.ok) return auth.resp
  const { admin, serverId } = auth

  // Heartbeat
  admin.from('mc_servers').update({ last_seen_at: new Date().toISOString() }).eq('id', serverId).then(() => {})

  if (req.method === 'GET') {
    // Atomically claim pending commands
    const { data: pending } = await admin
      .from('mc_console_commands')
      .select('id, command')
      .eq('server_id', serverId)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(25)

    const ids = (pending ?? []).map((p) => p.id)
    if (ids.length) {
      await admin
        .from('mc_console_commands')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .in('id', ids)
    }
    return json({ commands: pending ?? [] })
  }

  if (req.method === 'POST') {
    const url = new URL(req.url)
    const kind = url.searchParams.get('kind') ?? 'results'
    let body: any = {}
    try { body = await req.json() } catch {}

    if (kind === 'logs') {
      const rows = Array.isArray(body?.lines) ? body.lines : []
      if (!rows.length) return json({ inserted: 0 })
      const insert = rows.slice(0, 500).map((l: any) => ({
        server_id: serverId,
        level: ['INFO', 'WARN', 'ERROR', 'DEBUG'].includes(String(l?.level).toUpperCase())
          ? String(l.level).toUpperCase() : 'INFO',
        source: String(l?.source ?? 'server').slice(0, 32),
        line: String(l?.line ?? '').slice(0, 4000),
        logged_at: l?.logged_at ? new Date(l.logged_at).toISOString() : new Date().toISOString(),
      })).filter((r) => r.line.length > 0)
      const { error } = await admin.from('mc_console_logs').insert(insert)
      if (error) return json({ error: error.message }, 500)
      return json({ inserted: insert.length })
    }

    // results: [{ id, status: 'done'|'error', response }]
    const results = Array.isArray(body?.results) ? body.results : []
    let updated = 0
    for (const r of results.slice(0, 100)) {
      const status = r?.status === 'error' ? 'error' : 'done'
      const { error } = await admin
        .from('mc_console_commands')
        .update({
          status,
          response: String(r?.response ?? '').slice(0, 8000),
          completed_at: new Date().toISOString(),
        })
        .eq('id', r?.id)
        .eq('server_id', serverId)
      if (!error) updated++
    }
    return json({ updated })
  }

  return json({ error: 'method not allowed' }, 405)
})
