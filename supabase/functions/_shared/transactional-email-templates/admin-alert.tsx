/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  title?: string
  severity?: 'info' | 'warning' | 'critical' | 'success'
  summary?: string
  details?: string
  link?: string
  linkLabel?: string
  timestamp?: string
  serviceName?: string
  endpoint?: string
  errorSnippet?: string
  duration?: string
  uptimeWindow?: string
}

const colors: Record<string, string> = {
  info: 'hsl(220, 90%, 55%)',
  warning: 'hsl(40, 95%, 50%)',
  critical: 'hsl(0, 80%, 55%)',
  success: 'hsl(140, 65%, 45%)',
}

const Email = ({
  title = 'Admin alert',
  severity = 'info',
  summary = '',
  details = '',
  link = 'https://carnagemc.net/admin',
  linkLabel = 'Open Admin',
  timestamp,
  serviceName,
  endpoint,
  errorSnippet,
  duration,
  uptimeWindow,
}: Props) => {
  const accent = colors[severity] ?? colors.info
  const facts: Array<[string, string]> = []
  if (serviceName) facts.push(['Service', serviceName])
  if (endpoint) facts.push(['Endpoint', endpoint])
  if (duration) facts.push(['Duration', duration])
  if (uptimeWindow) facts.push(['Uptime (24h)', uptimeWindow])
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{title}{summary ? ` — ${summary}` : ''}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={{ ...badge, background: accent }}>
            <Text style={badgeText}>{severity.toUpperCase()}</Text>
          </Section>
          <Heading style={{ ...h1, color: accent }}>{title}</Heading>
          {summary && <Text style={text}>{summary}</Text>}
          {facts.length > 0 && (
            <Section style={factsBox}>
              {facts.map(([k, v]) => (
                <Text key={k} style={factLine}>
                  <span style={factKey}>{k}:</span> <span style={factVal}>{v}</span>
                </Text>
              ))}
            </Section>
          )}
          {errorSnippet && (
            <Section style={{ ...quote, borderLeftColor: accent }}>
              <Text style={quoteLabel}>Last error</Text>
              <Text style={quoteText}>{errorSnippet}</Text>
            </Section>
          )}
          {details && !errorSnippet && (
            <Section style={{ ...quote, borderLeftColor: accent }}>
              <Text style={quoteText}>{details}</Text>
            </Section>
          )}
          {link && <Button style={{ ...button, background: accent }} href={link}>{linkLabel}</Button>}
          <Text style={muted}>
            Sent from admin@carnagemc.net{timestamp ? ` · ${timestamp}` : ''}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => {
    const sev = (d.severity ?? 'info').toString().toUpperCase()
    return `[${sev}] ${d.title ?? 'Admin alert'}`
  },
  displayName: 'Admin alert',
  previewData: {
    title: 'Minecraft Server is DOWN',
    severity: 'critical',
    summary: 'Service has failed multiple consecutive checks.',
    details: 'Uptime (24h): 98.2%\nError: connection refused',
    link: 'https://carnagemc.net/status',
    linkLabel: 'View Status',
    timestamp: new Date().toISOString(),
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const badge = { display: 'inline-block', padding: '4px 10px', borderRadius: '999px', margin: '0 0 12px' }
const badgeText = { color: '#fff', fontSize: '11px', fontWeight: 700 as const, letterSpacing: '0.5px', margin: 0 }
const h1 = { fontSize: '22px', fontWeight: 700 as const, margin: '0 0 12px' }
const text = { fontSize: '14px', color: 'hsl(20, 25%, 25%)', lineHeight: '1.6', margin: '0 0 12px' }
const muted = { fontSize: '12px', color: 'hsl(20, 10%, 50%)', margin: '16px 0 0' }
const quote = { borderLeft: '3px solid', padding: '12px 16px', background: 'hsl(20, 15%, 97%)', margin: '12px 0 16px' }
const quoteLabel = { fontSize: '11px', fontWeight: 700 as const, letterSpacing: '0.5px', color: 'hsl(20, 15%, 40%)', textTransform: 'uppercase' as const, margin: '0 0 6px' }
const quoteText = { fontSize: '13px', color: 'hsl(20, 25%, 25%)', whiteSpace: 'pre-wrap' as const, margin: 0, fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }
const button = { color: '#fff', fontSize: '14px', borderRadius: '12px', padding: '12px 20px', textDecoration: 'none', display: 'inline-block' }
const factsBox = { background: 'hsl(20, 15%, 98%)', border: '1px solid hsl(20, 15%, 90%)', borderRadius: '8px', padding: '10px 14px', margin: '0 0 12px' }
const factLine = { fontSize: '13px', color: 'hsl(20, 25%, 25%)', margin: '2px 0' }
const factKey = { fontWeight: 600 as const, color: 'hsl(20, 15%, 40%)' }
const factVal = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }
