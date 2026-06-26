/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  recipientName?: string
  subject?: string
  reply?: string
  staffName?: string
  ticketUrl?: string
}

const Email = ({
  recipientName = 'there',
  subject = 'your ticket',
  reply = '',
  staffName = 'Support',
  ticketUrl = 'https://carnagemc.net/support',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{staffName} replied to: {subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New reply to your ticket</Heading>
        <Text style={text}>Hi {recipientName},</Text>
        <Text style={text}>
          {staffName} replied to your support ticket <strong>"{subject}"</strong>:
        </Text>
        <Section style={quote}>
          <Text style={quoteText}>{reply}</Text>
        </Section>
        <Button style={button} href={ticketUrl}>View ticket</Button>
        <Text style={muted}>You can reply directly on the website to keep the conversation going.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Re: ${d.subject ?? 'your support ticket'}`,
  displayName: 'Support ticket reply',
  previewData: {
    recipientName: 'Steve',
    subject: 'Cannot connect to server',
    reply: 'Hey Steve, please try clearing your DNS cache and reconnecting. Let us know if that helps!',
    staffName: 'CarnageMC Support',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 700 as const, color: 'hsl(20, 25%, 12%)', margin: '0 0 16px' }
const text = { fontSize: '14px', color: 'hsl(20, 25%, 25%)', lineHeight: '1.6', margin: '0 0 12px' }
const muted = { fontSize: '12px', color: 'hsl(20, 10%, 50%)', margin: '16px 0 0' }
const quote = { borderLeft: '3px solid hsl(22, 100%, 55%)', padding: '12px 16px', background: 'hsl(20, 15%, 97%)', margin: '16px 0' }
const quoteText = { fontSize: '14px', color: 'hsl(20, 25%, 25%)', whiteSpace: 'pre-wrap' as const, margin: 0 }
const button = { backgroundColor: 'hsl(22, 100%, 55%)', color: '#fff', fontSize: '14px', borderRadius: '12px', padding: '12px 20px', textDecoration: 'none', display: 'inline-block' }
