// Central place for public site URLs used in emails.
// Configure per environment with the SITE_URL secret (e.g. https://staging.warden.rip).
const raw = (Deno.env.get('SITE_URL') ?? 'https://warden.rip').trim()

export const SITE_URL = raw.replace(/\/+$/, '')
export const STATUS_URL = `${SITE_URL}/status`
export const adminUrl = (tab?: string) =>
  tab ? `${SITE_URL}/admin?tab=${tab}` : `${SITE_URL}/admin`
