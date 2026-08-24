import { createClient } from 'npm:@supabase/supabase-js@2'
import { createEmailWebhookHandler } from 'npm:@lovable.dev/email-js@0.1.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Notification-only bookkeeping: Lovable enforces suppression at send time.
// These rows keep the project's own history/badges accurate.
async function record(
  recipient: string,
  reason: 'bounce' | 'complaint' | 'unsubscribe',
  status: 'bounced' | 'complained' | 'suppressed',
  message: string,
  eventId: string,
) {
  const email = recipient.toLowerCase()

  const { error: suppressError } = await supabase
    .from('suppressed_emails')
    .upsert({ email, reason, metadata: null }, { onConflict: 'email' })
  if (suppressError) {
    console.error('Failed to upsert suppressed email', {
      event_id: eventId,
      code: suppressError.code,
      message: suppressError.message,
    })
    throw new Error('Failed to write suppression')
  }

  const { error: logError } = await supabase.from('email_send_log').insert({
    template_name: 'system',
    recipient_email: email,
    status,
    error_message: message,
    metadata: null,
  })
  if (logError) {
    console.error('Failed to insert email_send_log', {
      event_id: eventId,
      code: logError.code,
      message: logError.message,
    })
    throw new Error('Failed to write send log')
  }
}

const handler = createEmailWebhookHandler({
  apiKey: Deno.env.get('LOVABLE_API_KEY')!,
  on: {
    'email.bounced': async (event) => {
      await record(
        event.data.recipient,
        'bounce',
        'bounced',
        'Permanent bounce — email address is invalid or rejected',
        event.event_id,
      )
    },
    'email.complaint': async (event) => {
      await record(
        event.data.recipient,
        'complaint',
        'complained',
        'Spam complaint — recipient marked email as spam',
        event.event_id,
      )
    },
    'email.unsubscribed': async (event) => {
      await record(
        event.data.recipient,
        'unsubscribe',
        'suppressed',
        'Recipient unsubscribed',
        event.event_id,
      )
    },
  },
})

Deno.serve((req) => handler(req))
