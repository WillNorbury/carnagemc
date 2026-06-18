import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace('Bearer ', '').trim()
  if (!token) {
    return new Response(JSON.stringify({ error: 'missing_auth' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  // Verify caller
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: 'invalid_session' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const caller = userData.user

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)

  // Check admin role
  const { data: roles } = await admin
    .from('user_roles')
    .select('role')
    .eq('user_id', caller.id)
  const isAdmin = (roles ?? []).some((r: any) => r.role === 'admin' || r.role === 'owner')
  if (!isAdmin) {
    return new Response(JSON.stringify({ error: 'forbidden' }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let body: any
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'invalid_json' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const type = body?.type as 'signup' | 'recovery'
  const email = (body?.email as string | undefined)?.trim().toLowerCase()
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return new Response(JSON.stringify({ error: 'invalid_email' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  if (type !== 'signup' && type !== 'recovery') {
    return new Response(JSON.stringify({ error: 'invalid_type' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const startedAt = new Date().toISOString()

  try {
    if (type === 'signup') {
      // Generate signup link — triggers signup confirmation email via auth-email-hook.
      // Will fail if the user already exists; in that case caller should use a fresh address.
      const randomPw =
        crypto.randomUUID() + crypto.randomUUID().replace(/-/g, '').toUpperCase()
      const { error } = await admin.auth.admin.generateLink({
        type: 'signup',
        email,
        password: randomPw,
      })
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message, hint: 'If user already exists, try a fresh address.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    } else {
      const { error } = await admin.auth.admin.generateLink({
        type: 'recovery',
        email,
      })
      if (error) {
        return new Response(
          JSON.stringify({ error: error.message, hint: 'Recovery requires an existing user.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }
    }
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : 'unknown_error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }

  return new Response(
    JSON.stringify({ ok: true, type, email, triggered_at: startedAt }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
  )
})
