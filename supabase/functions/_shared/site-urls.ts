// Central place for public site URLs used in emails.
// Configure per environment with the SITE_URL secret (e.g. https://staging.carnagemc.net).
const raw = (Deno.env.get('SITE_URL') ?? 'https://carnagemc.net').trim()

export const SITE_URL = raw.replace(/\/+$/, '')
export const STATUS_URL = `${SITE_URL}/status`
export const adminUrl = (tab?: string) =>
  tab ? `${SITE_URL}/admin?tab=${tab}` : `${SITE_URL}/admin`
