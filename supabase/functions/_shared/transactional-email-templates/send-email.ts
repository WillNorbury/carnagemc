import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { EmailAPIError, sendLovableEmail } from 'npm:@lovable.dev/email-js@0.1.0'
import { TEMPLATES } from './registry.ts'

// Server-only: reads LOVABLE_API_KEY. Import from edge functions only — never
// expose sending to the browser.

// Configuration baked in at scaffold time
const SITE_NAME = "CarnageMC"
// SENDER_DOMAIN is the verified sender subdomain FQDN (e.g., "notify.example.com").
// It MUST match the subdomain delegated to Lovable's nameservers. NEVER use the root domain.
const SENDER_DOMAIN = "notify.carnagemc.net"
// FROM_DOMAIN is the domain shown in the From: header (e.g., "example.com").
// Can be the root domain when display_from_root is enabled — this is cosmetic only.
const FROM_DOMAIN = "carnagemc.net"

export type SendTemplateEmailResult =
  | { sent: true }
  | { sent: false; reason: 'recipient_suppressed' }

export interface SendTemplateEmailOptions {
  templateData?: Record<string, any>
  /** Dedupes retries of the same logical send; defaults to a random UUID (no dedupe). */
  idempotencyKey?: string
  replyTo?: string
  /**
   * Optional From override for features that send from a dedicated address
   * (status@, applications@, ...). Ignored unless the address is on a domain
   * this project controls.
   */
  from?: string
  /** Optional per-send overrides for admin-editable templates. */
  subjectOverride?: string
  htmlOverride?: string
  textOverride?: string
}

/** Only allow From overrides on domains we control, to avoid spoofing. */
function resolveFrom(fromOverride?: string): string {
  const defaultFrom = `${SITE_NAME} <noreply@${FROM_DOMAIN}>`
  if (!fromOverride) return defaultFrom
  const match = fromOverride.match(/<([^>]+)>|([^\s<>]+@[^\s<>]+)/)
  const addr = (match?.[1] ?? match?.[2] ?? '').toLowerCase()
  const domain = addr.split('@')[1] ?? ''
  if (domain === FROM_DOMAIN || domain === SENDER_DOMAIN || domain.endsWith('.' + FROM_DOMAIN)) {
    return fromOverride
  }
  console.warn('Ignoring from override for unverified domain', { domain })
  return defaultFrom
}


/**
 * Renders a registered template and sends it through Lovable's managed email
 * API. Suppression, retries, and rate limits are enforced by Lovable
 * server-side. A suppressed recipient is an expected outcome
 * ({ sent: false }); any other failure throws — EmailAPIError exposes
 * .code and .status for branching.
 */
export async function sendTemplateEmail(
  templateName: string,
  to: string,
  options: SendTemplateEmailOptions = {}
): Promise<SendTemplateEmailResult> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) {
    throw new Error('LOVABLE_API_KEY is not configured')
  }

  const template = TEMPLATES[templateName]
  if (!template) {
    throw new Error(
      `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`
    )
  }

  // Template-level `to` takes precedence — notification templates always
  // send to their fixed address.
  const recipient = template.to || to
  if (!recipient) {
    throw new Error('Recipient is required (the template defines no fixed recipient)')
  }

  const templateData = options.templateData ?? {}
  const element = React.createElement(template.component, templateData)
  const html = options.htmlOverride ?? (await renderAsync(element))
  const text = options.textOverride ?? (await renderAsync(element, { plainText: true }))
  const subject =
    options.subjectOverride ??
    (typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject)

  try {
    await sendLovableEmail(
      {
        to: recipient,
        from: resolveFrom(options.from),

        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: 'transactional',
        label: templateName,
        idempotency_key: options.idempotencyKey || crypto.randomUUID(),
        reply_to: options.replyTo,
      },
      { apiKey, sendUrl: Deno.env.get('LOVABLE_SEND_URL') }
    )
  } catch (error) {
    if (error instanceof EmailAPIError && error.code === 'recipient_suppressed') {
      return { sent: false, reason: 'recipient_suppressed' }
    }
    throw error
  }

  return { sent: true }
}
