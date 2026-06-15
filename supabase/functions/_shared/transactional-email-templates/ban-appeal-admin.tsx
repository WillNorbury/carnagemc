/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  minecraftUsername?: string
  discordTag?: string
  email?: string
  banReason?: string
  appealText?: string
  adminUrl?: string
}

const Email = ({
  minecraftUsername = 'unknown',
  discordTag = '',
  email = '',
  banReason = '',
  appealText = '',
  adminUrl = 'https://havocsmp.net/admin?tab=appeals',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New ban appeal from {minecraftUsername}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New ban appeal</Heading>
        <Text style={text}><strong>Player:</strong> {minecraftUsername}</Text>
        {discordTag && <Text style={text}><strong>Discord:</strong> {discordTag}</Text>}
        {email && <Text style={text}><strong>Email:</strong> {email}</Text>}
        {banReason && <Text style={text}><strong>Ban reason:</strong> {banReason}</Text>}
        <Section style={quote}>
          <Text style={quoteText}>{appealText}</Text>
        </Section>
        <Button style={button} href={adminUrl}>Review in admin</Button>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `New ban appeal from ${d.minecraftUsername ?? 'a player'}`,
  displayName: 'Ban appeal admin notification',
  to: Deno.env.get('ALERT_EMAIL') ?? undefined,
  previewData: { minecraftUsername: 'Notch', appealText: 'Please unban me.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 700 as const, color: 'hsl(20, 25%, 12%)', margin: '0 0 16px' }
const text = { fontSize: '14px', color: 'hsl(20, 25%, 25%)', lineHeight: '1.6', margin: '0 0 8px' }
const quote = { borderLeft: '3px solid hsl(22, 100%, 55%)', padding: '10px 14px', background: 'hsl(20, 15%, 97%)', margin: '16px 0' }
const quoteText = { fontSize: '13px', color: 'hsl(20, 25%, 25%)', whiteSpace: 'pre-wrap' as const, margin: 0 }
const button = { backgroundColor: 'hsl(22, 100%, 55%)', color: '#fff', fontSize: '14px', borderRadius: '12px', padding: '12px 20px', textDecoration: 'none', display: 'inline-block' }
