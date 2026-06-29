import { createClient } from 'npm:@supabase/supabase-js@2.108.2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SITE_BASE = 'https://www.carnagemc.net'

const enc = new TextEncoder()

const b64url = (buf: ArrayBuffer) => {
  let s = btoa(String.fromCharCode(...new Uint8Array(buf)))
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const hmacToken = async (email: string, secret: string) => {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(`news:${email}`))
  return b64url(sig)
}

const timingSafeEqual = (a: string, b: string) => {
  if (a.length !== b.length) return false
  let r = 0
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return r === 0
}

const htmlPage = (title: string, body: string, status = 200) =>
  new Response(
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><style>
body{font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Arial,sans-serif;background:#0b0b0f;color:#fff;margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
.card{max-width:480px;background:#15151b;border:1px solid #2a2a36;border-radius:14px;padding:32px;text-align:center}
h1{color:#ff7a1a;font-size:22px;margin:0 0 12px}
p{color:#cfcfd6;line-height:1.55;margin:0 0 18px}
a{display:inline-block;background:#ff7a1a;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600}
</style></head><body><div class="card"><h1>${title}</h1>${body}<a href="${SITE_BASE}">Back to CarnageMC</a></div></body></html>`,
    { status, headers: { ...corsHeaders, 'Content-Type': 'text/html; charset=utf-8' } },
  )

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const url = new URL(req.url)
    const email = (url.searchParams.get('email') ?? '').trim().toLowerCase()
    const token = (url.searchParams.get('token') ?? '').trim()

    if (!email || !token || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return htmlPage('Invalid link', '<p>This unsubscribe link is missing or malformed.</p>', 400)
    }

    const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const expected = await hmacToken(email, secret)
    if (!timingSafeEqual(expected, token)) {
      return htmlPage('Invalid link', '<p>This unsubscribe link is invalid or has expired.</p>', 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    )

    const { error } = await admin
      .from('news_email_opt_outs')
      .upsert({ email, reason: 'one-click' }, { onConflict: 'email' })

    if (error) {
      return htmlPage('Something went wrong', `<p>${error.message}</p>`, 500)
    }

    return htmlPage(
      'Unsubscribed from news',
      `<p>You will no longer receive news updates at <strong>${email}</strong>. Account and transactional emails will still be delivered.</p>`,
    )
  } catch (e) {
    return htmlPage('Something went wrong', `<p>${(e as Error).message}</p>`, 500)
  }
})
