import { createClient } from 'npm:@supabase/supabase-js@2.108.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const SITE_BASE = 'https://www.carnagemc.net'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

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
      .limit(1)
    if (!roleRows || roleRows.length === 0) {
      return json({ ok: false, error: 'Forbidden — admin only' }, 403)
    }

    const body = await req.json().catch(() => ({}))
    const entryId: string | undefined = body?.entryId
    const testEmail: string | undefined =
      typeof body?.testEmail === 'string' && body.testEmail.trim()
        ? body.testEmail.trim().toLowerCase()
        : undefined
    if (!entryId) return json({ ok: false, error: 'entryId required' }, 400)

    if (testEmail) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRe.test(testEmail)) {
        return json({ ok: false, error: 'Invalid testEmail' }, 400)
      }
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    })

    const { data: entry, error: entryErr } = await admin
      .from('changelog_entries')
      .select('id, title, content, category, version, entry_date, published')
      .eq('id', entryId)
      .maybeSingle()
    if (entryErr || !entry) return json({ ok: false, error: 'Entry not found' }, 404)
    // Allow test sends on unpublished entries; only block bulk sends on drafts.
    if (!testEmail && !entry.published) return json({ ok: false, error: 'Entry not published' }, 400)

    let list: string[]
    if (testEmail) {
      list = [testEmail]
    } else {
      // Collect every confirmed user's email, paginated
      const recipients = new Set<string>()
      let page = 1
      const perPage = 1000
      while (true) {
        const { data, error } = await admin.auth.admin.listUsers({ page, perPage })
        if (error) return json({ ok: false, error: error.message }, 500)
        const users = data?.users ?? []
        for (const u of users) {
          if (u.email && u.email_confirmed_at) recipients.add(u.email.toLowerCase())
        }
        if (users.length < perPage) break
        page += 1
        if (page > 50) break
      }
      // Drop suppressed addresses
      const { data: suppressed } = await admin.from('suppressed_emails').select('email')
      for (const row of suppressed ?? []) {
        if (row?.email) recipients.delete(String(row.email).toLowerCase())
      }
      list = [...recipients]
    }

    if (list.length === 0) return json({ ok: true, sent: 0, message: 'No recipients' })

    const slug = entry.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80)
    const templateData = {
      title: entry.title,
      content: entry.content,
      category: entry.category,
      version: entry.version,
      entryDate: entry.entry_date,
      link: `${SITE_BASE}/changelog/${slug}`,
      siteName: 'CarnageMC',
    }

    // Post to Discord channel (non-blocking for email flow). Skipped for test sends.
    let discord: { ok: boolean; status?: number; error?: string } = { ok: false }
    if (!testEmail) {
      try {
        const botToken = Deno.env.get('DISCORD_BOT_TOKEN')
        const channelId = '1522474298332287037'
        if (!botToken) {
          discord = { ok: false, error: 'DISCORD_BOT_TOKEN not set' }
        } else {
          const plain = (entry.content || '')
            .replace(/<[^>]+>/g, '')
            .replace(/\s+/g, ' ')
            .trim()
          const description = plain.length > 1800 ? plain.slice(0, 1800) + '…' : plain
          const embed: Record<string, unknown> = {
            title: entry.title?.slice(0, 256) || 'Changelog update',
            url: templateData.link,
            description,
            color: 0xef4444,
            timestamp: new Date(entry.entry_date ?? Date.now()).toISOString(),
            footer: { text: 'CarnageMC Changelog' },
            fields: [] as { name: string; value: string; inline?: boolean }[],
          }
          const fields = embed.fields as { name: string; value: string; inline?: boolean }[]
          if (entry.category) fields.push({ name: 'Category', value: String(entry.category), inline: true })
          if (entry.version) fields.push({ name: 'Version', value: String(entry.version), inline: true })

          const resp = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bot ${botToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              content: `📝 **New changelog entry**`,
              embeds: [embed],
              allowed_mentions: { parse: [] },
            }),
          })
          if (resp.ok) {
            discord = { ok: true, status: resp.status }
          } else {
            const text = await resp.text().catch(() => '')
            discord = { ok: false, status: resp.status, error: text.slice(0, 500) }
            console.error('Discord post failed', resp.status, text)
          }
        }
      } catch (e) {
        discord = { ok: false, error: (e as Error).message }
        console.error('Discord post error', e)
      }
    }


    let queued = 0
    const errors: string[] = []
    for (const email of list) {
      try {
        const idempotencyKey = testEmail
          ? `changelog-${entry.id}-test-${email}-${Date.now()}`
          : `changelog-${entry.id}-${email}`
        const { error } = await admin.functions.invoke('send-transactional-email', {
          body: {
            templateName: 'changelog-update',
            recipientEmail: email,
            idempotencyKey,
            from: 'CarnageMC Updates <updates@carnagemc.net>',
            templateData: testEmail
              ? { ...templateData, title: `[TEST] ${templateData.title}` }
              : templateData,
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
    })
  } catch (e) {
    return json({ ok: false, error: (e as Error).message }, 500)
  }
})
