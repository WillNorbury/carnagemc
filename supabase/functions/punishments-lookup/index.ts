// LiteBans punishments lookup proxy
// Queries the network MySQL database and returns bans/mutes/kicks/warnings for a player.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import mysql from 'npm:mysql2@3.11.5/promise'

const HOST = Deno.env.get('LITEBANS_MYSQL_HOST') ?? ''
const PORT = Number(Deno.env.get('LITEBANS_MYSQL_PORT') ?? '3306')
const USER = Deno.env.get('LITEBANS_MYSQL_USER') ?? ''
const PASS = Deno.env.get('LITEBANS_MYSQL_PASSWORD') ?? ''
const DB = Deno.env.get('LITEBANS_MYSQL_DATABASE') ?? ''
const PREFIX = (Deno.env.get('LITEBANS_TABLE_PREFIX') ?? 'litebans_').replace(/[^a-zA-Z0-9_]/g, '')

const UUID_RE = /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i
const NAME_RE = /^[a-zA-Z0-9_]{2,16}$/

function dashUuid(u: string) {
  const s = u.replace(/-/g, '').toLowerCase()
  if (s.length !== 32) return u.toLowerCase()
  return `${s.slice(0,8)}-${s.slice(8,12)}-${s.slice(12,16)}-${s.slice(16,20)}-${s.slice(20)}`
}
function stripUuid(u: string) { return u.replace(/-/g, '').toLowerCase() }

async function resolveUsername(name: string): Promise<{ uuid: string; name: string } | null> {
  try {
    const r = await fetch(`https://api.mojang.com/users/profiles/minecraft/${encodeURIComponent(name)}`)
    if (!r.ok) return null
    const j = await r.json()
    if (!j?.id) return null
    return { uuid: dashUuid(j.id), name: j.name ?? name }
  } catch { return null }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  try {
    const url = new URL(req.url)
    const player = (url.searchParams.get('player') ?? '').trim()
    const recentDays = Number(url.searchParams.get('recent_days') ?? '0')

    if (!HOST || !USER || !DB) {
      return json({ error: 'MySQL not configured' }, 500)
    }

    // Recent mode: return latest punishments across all players within N days
    if (recentDays > 0) {
      const conn = await mysql.createConnection({
        host: HOST, port: PORT, user: USER, password: PASS, database: DB, connectTimeout: 8000,
      })
      const sinceMs = Date.now() - recentDays * 86400_000
      const kinds: Array<'bans'|'mutes'|'warnings'|'kicks'> = ['bans','mutes','warnings','kicks']
      const out: Record<string, any[]> = {}
      for (const k of kinds) {
        try {
          const [rows] = await conn.query(
            `SELECT id, uuid, reason, banned_by_name, banned_by_uuid, removed_by_name, removed_by_reason, removed_by_date,
                    time, until, active, ipban, server_scope
             FROM \`${PREFIX}${k}\` WHERE time >= ? ORDER BY time DESC LIMIT 500`,
            [sinceMs],
          )
          out[k] = (rows as any[]).map(normalize)
        } catch (e) {
          try {
            const [rows] = await conn.query(
              `SELECT id, uuid, reason, banned_by_name, banned_by_uuid, time, until, active
               FROM \`${PREFIX}${k}\` WHERE time >= ? ORDER BY time DESC LIMIT 500`,
              [sinceMs],
            )
            out[k] = (rows as any[]).map(normalize)
          } catch (e2) { out[k] = []; console.error(`recent ${k} failed`, e2) }
        }
      }
      await conn.end()
      return json({
        recent_days: recentDays,
        counts: Object.fromEntries(kinds.map(k => [k, out[k]?.length ?? 0])),
        ...out,
      })
    }

    if (!player) return json({ error: 'Missing player' }, 400)

    let uuidDashed: string | null = null
    let username: string | null = null

    if (UUID_RE.test(player)) {
      uuidDashed = dashUuid(player)
    } else if (NAME_RE.test(player)) {
      const resolved = await resolveUsername(player)
      if (!resolved) return json({ error: 'Player not found', player }, 404)
      uuidDashed = resolved.uuid
      username = resolved.name
    } else {
      return json({ error: 'Invalid player identifier' }, 400)
    }

    const conn = await mysql.createConnection({
      host: HOST, port: PORT, user: USER, password: PASS, database: DB,
      connectTimeout: 8000,
    })

    const undashed = stripUuid(uuidDashed!)
    const variants = [uuidDashed, undashed]

    const select = (kind: string) => `
      SELECT id, uuid, reason, banned_by_name, banned_by_uuid, removed_by_name, removed_by_reason, removed_by_date,
             time, until, active, ipban, ipban_wildcard, server_scope, server_origin
      FROM \`${PREFIX}${kind}\`
      WHERE uuid IN (?, ?)
      ORDER BY time DESC
      LIMIT 200
    `
    const kinds: Array<'bans'|'mutes'|'warnings'|'kicks'> = ['bans','mutes','warnings','kicks']
    const result: Record<string, any[]> = {}
    for (const k of kinds) {
      try {
        const [rows] = await conn.query(select(k), variants)
        result[k] = (rows as any[]).map(normalize)
      } catch (e) {
        // Kicks/warnings tables may not have all columns; retry minimal
        try {
          const [rows] = await conn.query(
            `SELECT id, uuid, reason, banned_by_name, banned_by_uuid, time, until, active
             FROM \`${PREFIX}${k}\` WHERE uuid IN (?, ?) ORDER BY time DESC LIMIT 200`,
            variants,
          )
          result[k] = (rows as any[]).map(normalize)
        } catch (e2) {
          result[k] = []
          console.error(`query ${k} failed`, e2)
        }
      }
    }

    // Last known username from history if present
    if (!username) {
      try {
        const [rows] = await conn.query(
          `SELECT name FROM \`${PREFIX}history\` WHERE uuid IN (?, ?) ORDER BY date DESC LIMIT 1`,
          variants,
        )
        const r = (rows as any[])[0]
        if (r?.name) username = r.name
      } catch {}
    }

    await conn.end()
    return json({
      player: { uuid: uuidDashed, username },
      counts: Object.fromEntries(kinds.map(k => [k, result[k]?.length ?? 0])),
      ...result,
    })
  } catch (e) {
    console.error('punishments-lookup error', e)
    return json({ error: (e as Error).message ?? 'lookup failed' }, 500)
  }
})

function normalize(r: any) {
  const toIso = (v: any) => {
    if (v === null || v === undefined) return null
    const n = typeof v === 'bigint' ? Number(v) : Number(v)
    if (!Number.isFinite(n) || n <= 0) return null
    return new Date(n).toISOString()
  }
  return {
    id: r.id,
    uuid: r.uuid,
    reason: r.reason,
    issued_by: r.banned_by_name,
    issued_by_uuid: r.banned_by_uuid,
    removed_by: r.removed_by_name ?? null,
    removed_reason: r.removed_by_reason ?? null,
    removed_at: toIso(r.removed_by_date),
    issued_at: toIso(r.time),
    expires_at: r.until && Number(r.until) > 0 ? toIso(r.until) : null,
    permanent: !r.until || Number(r.until) <= 0,
    active: r.active === 1 || r.active === true,
    ip_ban: r.ipban === 1 || r.ipban === true,
    server: r.server_scope ?? null,
  }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
