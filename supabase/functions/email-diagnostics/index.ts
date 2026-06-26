import { createClient } from 'npm:@supabase/supabase-js@2.108.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

const SENDER_DOMAIN = 'notify.carnagemc.net'
const FROM_DOMAIN = 'carnagemc.net'

const ALLOWED_FROM = [
  'CarnageMC <noreply@carnagemc.net>',
  'CarnageMC Updates <updates@notify.carnagemc.net>',
  'William @ CarnageMC <william@notify.carnagemc.net>',
]

const extractEmail = (s: string): string | null => {
  const m = s.match(/<([^>]+)>/)
  const e = (m ? m[1] : s).trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null
}

const allowedDomain = (email: string) => {
  const d = email.split('@')[1]
  return d === SENDER_DOMAIN || d === FROM_DOMAIN || d.endsWith('.' + FROM_DOMAIN)
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const ANON_KEY =
      Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? Deno.env.get('SUPABASE_ANON_KEY')!

    const auth = req.headers.get('Authorization') ?? ''
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    })
    const { data: userData } = await userClient.auth.getUser()
    if (!userData?.user) return json({ ok: false, error: 'Unauthorized' }, 401)

    const { data: roleRows } = await userClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userData.user.id)
      .in('role', ['admin', 'owner'])
    const roles = (roleRows ?? []).map((r: any) => r.role)
    if (!roles.includes('admin') && !roles.includes('owner')) {
      return json({ ok: false, error: 'Forbidden — admin only' }, 403)
    }

    const url = new URL(req.url)
    const candidate = url.searchParams.get('from')?.trim() ?? null

    let candidateCheck: null | {
      input: string
      email: string | null
      allowedInList: boolean
      domainVerified: boolean
      reason: string
    } = null

    if (candidate) {
      const email = extractEmail(candidate)
      const allowedEmails = ALLOWED_FROM.map((a) => extractEmail(a)!).filter(Boolean)
      const inList = ALLOWED_FROM.includes(candidate) || (!!email && allowedEmails.includes(email))
      const domainOk = !!email && allowedDomain(email)
      candidateCheck = {
        input: candidate,
        email,
        allowedInList: inList,
        domainVerified: domainOk,
        reason: !email
          ? 'Not a valid email format'
          : !domainOk
          ? `Domain @${email.split('@')[1]} is not the verified sender domain (${SENDER_DOMAIN}) or display domain (${FROM_DOMAIN})`
          : !inList
          ? `Address @${email} is on the verified domain but not in the ALLOWED_FROM whitelist`
          : 'OK — verified domain and whitelisted',
      }
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

    // Recent failed sends caused by invalid from
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: failed } = await admin
      .from('email_send_log')
      .select('id, recipient, status, error_message, template_name, created_at')
      .gte('created_at', since)
      .in('status', ['failed', 'dlq'])
      .order('created_at', { ascending: false })
      .limit(10)

    const invalidFromHits = (failed ?? []).filter((r: any) =>
      String(r.error_message ?? '').toLowerCase().includes('from'),
    )

    return json({
      ok: true,
      sender_domain: SENDER_DOMAIN,
      from_domain: FROM_DOMAIN,
      allowed_from: ALLOWED_FROM,
      candidate: candidateCheck,
      recent_failures: failed ?? [],
      invalid_from_failures: invalidFromHits,
      warnings: [
        ...(invalidFromHits.length > 0
          ? [`${invalidFromHits.length} recent send(s) failed with a From-address error in the last 7 days`]
          : []),
      ],
    })
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500)
  }
})
