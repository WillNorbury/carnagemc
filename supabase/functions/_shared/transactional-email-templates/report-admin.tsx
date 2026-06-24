/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  targetType?: string
  targetLabel?: string
  targetUrl?: string
  reason?: string
  details?: string
  reporterName?: string
  adminUrl?: string
}

const Email = ({
  targetType = 'content',
  targetLabel = 'unknown',
  targetUrl = '',
  reason = '',
  details = '',
  reporterName = 'a user',
  adminUrl = 'https://carnagemc.net/admin?tab=reports',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New report on {targetType}: {targetLabel}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New report submitted</Heading>
        <Text style={text}><strong>Target:</strong> {targetType} — {targetLabel}</Text>
        {targetUrl && <Text style={text}><strong>Link:</strong> {targetUrl}</Text>}
        <Text style={text}><strong>Reported by:</strong> {reporterName}</Text>
        <Text style={text}><strong>Reason:</strong> {reason}</Text>
        {details && (
          <Section style={quote}>
            <Text style={quoteText}>{details}</Text>
          </Section>
        )}
        <Button style={button} href={adminUrl}>Review in admin</Button>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `New report on ${d.targetType ?? 'content'}: ${d.targetLabel ?? 'unknown'}`,
  displayName: 'Report admin notification',
  to: Deno.env.get('ALERT_EMAIL') ?? undefined,
  previewData: {
    targetType: 'plugin',
    targetLabel: 'EpicEnchants',
    reason: 'Malicious code',
    details: 'Looks suspicious on load.',
    reporterName: 'Steve',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 700 as const, color: 'hsl(20, 25%, 12%)', margin: '0 0 16px' }
const text = { fontSize: '14px', color: 'hsl(20, 25%, 25%)', lineHeight: '1.6', margin: '0 0 8px' }
const quote = { borderLeft: '3px solid hsl(22, 100%, 55%)', padding: '10px 14px', background: 'hsl(20, 15%, 97%)', margin: '16px 0' }
const quoteText = { fontSize: '13px', color: 'hsl(20, 25%, 25%)', whiteSpace: 'pre-wrap' as const, margin: 0 }
const button = { backgroundColor: 'hsl(22, 100%, 55%)', color: '#fff', fontSize: '14px', borderRadius: '12px', padding: '12px 20px', textDecoration: 'none', display: 'inline-block' }
