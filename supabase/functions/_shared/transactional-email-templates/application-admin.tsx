/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  mcUsername?: string
  applicationType?: string
  discord?: string
  age?: string | number
  timezone?: string
  experience?: string
  why?: string
  portfolioUrl?: string
  adminUrl?: string
}

const Email = ({
  mcUsername = 'unknown',
  applicationType = 'staff',
  discord = '',
  age = '',
  timezone = '',
  experience = '',
  why = '',
  portfolioUrl = '',
  adminUrl = 'https://havocsmp.net/admin?tab=applications',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New {applicationType} application from {mcUsername}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New {applicationType} application</Heading>
        <Text style={text}><strong>Player:</strong> {mcUsername}</Text>
        {discord && <Text style={text}><strong>Discord:</strong> {discord}</Text>}
        {age && <Text style={text}><strong>Age:</strong> {String(age)}</Text>}
        {timezone && <Text style={text}><strong>Timezone:</strong> {timezone}</Text>}
        {portfolioUrl && <Text style={text}><strong>Portfolio:</strong> {portfolioUrl}</Text>}
        {experience && (
          <>
            <Text style={label}>Experience</Text>
            <Section style={quote}><Text style={quoteText}>{experience}</Text></Section>
          </>
        )}
        {why && (
          <>
            <Text style={label}>Why</Text>
            <Section style={quote}><Text style={quoteText}>{why}</Text></Section>
          </>
        )}
        <Button style={button} href={adminUrl}>Review in admin</Button>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `New ${d.applicationType ?? ''} application from ${d.mcUsername ?? 'a player'}`.replace(/\s+/g, ' ').trim(),
  displayName: 'Application admin notification',
  to: Deno.env.get('ALERT_EMAIL') ?? undefined,
  previewData: { mcUsername: 'Notch', applicationType: 'builder', why: 'I love building.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 700 as const, color: 'hsl(20, 25%, 12%)', margin: '0 0 16px', textTransform: 'capitalize' as const }
const text = { fontSize: '14px', color: 'hsl(20, 25%, 25%)', lineHeight: '1.6', margin: '0 0 8px' }
const label = { fontSize: '12px', textTransform: 'uppercase' as const, letterSpacing: '0.05em', color: 'hsl(20, 15%, 45%)', margin: '12px 0 4px' }
const quote = { borderLeft: '3px solid hsl(22, 100%, 55%)', padding: '10px 14px', background: 'hsl(20, 15%, 97%)', margin: '0 0 12px' }
const quoteText = { fontSize: '13px', color: 'hsl(20, 25%, 25%)', whiteSpace: 'pre-wrap' as const, margin: 0 }
const button = { backgroundColor: 'hsl(22, 100%, 55%)', color: '#fff', fontSize: '14px', borderRadius: '12px', padding: '12px 20px', textDecoration: 'none', display: 'inline-block', marginTop: '8px' }
