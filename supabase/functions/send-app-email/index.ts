import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { EmailAPIError } from 'npm:@lovable.dev/email-js@0.1.0'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

// Sends an app email through Lovable's managed email API.
// Suppression, retries, rate limits and unsubscribe are handled by Lovable.
//
// Auth note: verify_jwt = true in config.toml, so Supabase's gateway validates
// the caller's JWT before the request reaches this code.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables')
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let templateName: string
  let recipientEmail: string
  let idempotencyKey: string
  let templateData: Record<string, any> = {}
  let fromOverride: string | undefined
  let subjectOverride: string | undefined
  let bodyHtmlOverride: string | undefined
  let bodyTextOverride: string | undefined

  try {
    const body = await req.json()
    templateName = body.templateName || body.template_name
    recipientEmail = body.recipientEmail || body.recipient_email
    idempotencyKey = body.idempotencyKey || body.idempotency_key || crypto.randomUUID()
    if (body.templateData && typeof body.templateData === 'object') {
      templateData = body.templateData
    }
    if (typeof body.from === 'string' && body.from.trim()) fromOverride = body.from.trim()
    if (typeof body.subjectOverride === 'string' && body.subjectOverride.trim()) {
      subjectOverride = body.subjectOverride.trim()
    }
    if (typeof body.bodyHtmlOverride === 'string' && body.bodyHtmlOverride.trim()) {
      bodyHtmlOverride = body.bodyHtmlOverride
    }
    if (typeof body.bodyTextOverride === 'string' && body.bodyTextOverride.trim()) {
      bodyTextOverride = body.bodyTextOverride
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  if (!templateName) {
    return new Response(JSON.stringify({ error: 'templateName is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  const log = async (status: string, errorMessage?: string) => {
    const { error } = await supabase.from('email_send_log').insert({
      template_name: templateName,
      recipient_email: recipientEmail ?? '',
      status,
      error_message: errorMessage ?? null,
    })
    if (error) console.error('Failed to write email_send_log row', error)
  }

  try {
    const result = await sendTemplateEmail(templateName, recipientEmail, {
      templateData,
      idempotencyKey,
      from: fromOverride,
      subjectOverride,
      htmlOverride: bodyHtmlOverride,
      textOverride: bodyTextOverride,
    })

    if (!result.sent) {
      await log('suppressed')
      console.log('Email suppressed', { templateName })
      return new Response(
        JSON.stringify({ success: false, reason: 'email_suppressed' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    await log('sent')
    return new Response(JSON.stringify({ success: true, sent: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const code = error instanceof EmailAPIError ? error.code : undefined
    console.error('Failed to send app email', { templateName, code, message })
    await log('failed', message.slice(0, 500))

    const notFound = message.includes('not found. Available:')
    return new Response(JSON.stringify({ error: message, code }), {
      status: notFound ? 404 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
