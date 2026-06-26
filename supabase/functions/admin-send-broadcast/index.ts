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

type Category = 'all' | 'admins' | 'owners' | 'subscribers' | 'test'

const ALLOWED_FROM = new Set([
  'CarnageMC <noreply@carnagemc.net>',
  'CarnageMC Updates <updates@carnagemc.net>',
  'William @ CarnageMC <william@carnagemc.net>',
])

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
    const roles = (roleRows ?? []).map((r) => r.role)
    const isAdmin = roles.includes('admin') || roles.includes('owner')
    const isOwner = roles.includes('owner')
    if (!isAdmin) return json({ ok: false, error: 'Forbidden — admin only' }, 403)

    const body = await req.json().catch(() => ({} as any))
    const subject = String(body?.subject ?? '').trim()
    const message = String(body?.message ?? '').trim()
    const category = String(body?.category ?? 'all') as Category
    const from = typeof body?.from === 'string' ? body.from.trim() : undefined
    const testEmail =
      typeof body?.testEmail === 'string' && body.testEmail.trim()
        ? body.testEmail.trim().toLowerCase()
        : undefined

    if (!subject || subject.length > 200) return json({ ok: false, error: 'subject required (<=200 chars)' }, 400)
    if (!message || message.length > 10000) return json({ ok: false, error: 'message required (<=10000 chars)' }, 400)
    if (!['all', 'admins', 'owners', 'subscribers', 'test'].includes(category))
      return json({ ok: false, error: 'invalid category' }, 400)

    // Owner-only categories
    if ((category === 'owners' || category === 'admins') && !isOwner) {
      return json({ ok: false, error: 'Forbidden — owner only category' }, 403)
    }
    if (from && !ALLOWED_FROM.has(from)) {
      return json({ ok: false, error: 'invalid from address' }, 400)
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    })

    // Build recipient list
    let list: string[] = []

    if (category === 'test') {
      if (!testEmail) return json({ ok: false, error: 'testEmail required for test category' }, 400)
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRe.test(testEmail)) return json({ ok: false, error: 'invalid testEmail' }, 400)
      list = [testEmail]
    } else if (category === 'owners' || category === 'admins') {
      const targetRoles = category === 'owners' ? ['owner'] : ['admin', 'owner']
      const { data: rows, error } = await admin
        .from('user_roles')
        .select('user_id')
        .in('role', targetRoles)
      if (error) return json({ ok: false, error: error.message }, 500)
      const ids = [...new Set((rows ?? []).map((r: any) => r.user_id))]
      const emails = new Set<string>()
      // Batch lookup via listUsers
      let page = 1
      const perPage = 1000
      while (true) {
        const { data, error: e2 } = await admin.auth.admin.listUsers({ page, perPage })
        if (e2) return json({ ok: false, error: e2.message }, 500)
        const users = data?.users ?? []
        for (const u of users) {
          if (u.email && u.email_confirmed_at && ids.includes(u.id)) {
            emails.add(u.email.toLowerCase())
          }
        }
        if (users.length < perPage) break
        page += 1
        if (page > 50) break
      }
      list = [...emails]
    } else {
      // all / subscribers => every confirmed user (we don't track a separate subscribers list)
      const emails = new Set<string>()
      let page = 1
      const perPage = 1000
      while (true) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
        if (error) return json({ ok: false, error: error.message }, 500)
        const users = data?.users ?? []
        for (const u of users) {
          if (u.email && u.email_confirmed_at) emails.add(u.email.toLowerCase())
        }
        if (users.length < perPage) break
        page += 1
        if (page > 50) break
      }
      list = [...emails]
    }

    // Drop suppressed
    if (list.length > 0) {
      const { data: suppressed } = await admin.from('suppressed_emails').select('email')
      for (const r of suppressed ?? []) {
        if (r?.email) {
          const idx = list.indexOf(String(r.email).toLowerCase())
          if (idx >= 0) list.splice(idx, 1)
        }
      }
    }

    if (list.length === 0) return json({ ok: true, queued: 0, total: 0, message: 'No recipients' })

    const categoryLabel =
      category === 'owners' ? 'Owner Only'
        : category === 'admins' ? 'Admins'
        : category === 'test' ? 'Test'
        : 'All Users'

    const fromAddress = from ?? 'CarnageMC <noreply@carnagemc.net>'
    const stamp = Date.now()

    let queued = 0
    const errors: string[] = []
    for (const email of list) {
      try {
        const { error } = await admin.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'admin-broadcast',
            recipientEmail: email,
            idempotencyKey: `broadcast-${stamp}-${email}`,
            from: fromAddress,
            templateData: {
              subject,
              message,
              category: categoryLabel,
              siteName: 'CarnageMC',
            },
          },
        })
        if (error) errors.push(`${email}: ${error.message}`)
        else queued += 1
      } catch (e) {
        errors.push(`${email}: ${(e as Error).message}`)
      }
    }

    return json({
      ok: true,
      total: list.length,
      queued,
      failed: errors.length,
      errors: errors.slice(0, 10),
      category: categoryLabel,
    })
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500)
  }
})
