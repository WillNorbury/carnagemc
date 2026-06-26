/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  recipientName?: string
  originalSubject?: string
  originalMessage?: string
  reply?: string
  staffName?: string
}

const Email = ({
  recipientName = 'there',
  originalSubject = 'your message',
  originalMessage = '',
  reply = '',
  staffName = 'CarnageMC Team',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{staffName} replied to: {originalSubject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>We replied to your message</Heading>
        <Text style={text}>Hi {recipientName},</Text>
        <Text style={text}>
          Thanks for reaching out. {staffName} replied to your message <strong>"{originalSubject}"</strong>:
        </Text>
        <Section style={quote}>
          <Text style={quoteText}>{reply}</Text>
        </Section>
        {originalMessage && (
          <>
            <Text style={muted}>Your original message:</Text>
            <Section style={original}>
              <Text style={quoteText}>{originalMessage}</Text>
            </Section>
          </>
        )}
        <Text style={muted}>
          Reply to this email to continue the conversation — it goes straight to contact@carnagemc.net.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Re: ${d.originalSubject ?? 'your message'}`,
  displayName: 'Contact form reply',
  previewData: {
    recipientName: 'Steve',
    originalSubject: 'Question about ranks',
    originalMessage: 'Hi, what ranks are available?',
    reply: 'Hey Steve, our ranks are listed on the Store page!',
    staffName: 'CarnageMC Team',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 700 as const, color: 'hsl(20, 25%, 12%)', margin: '0 0 16px' }
const text = { fontSize: '14px', color: 'hsl(20, 25%, 25%)', lineHeight: '1.6', margin: '0 0 12px' }
const muted = { fontSize: '12px', color: 'hsl(20, 10%, 50%)', margin: '16px 0 8px' }
const quote = { borderLeft: '3px solid hsl(22, 100%, 55%)', padding: '12px 16px', background: 'hsl(20, 15%, 97%)', margin: '16px 0' }
const original = { borderLeft: '3px solid hsl(20, 10%, 80%)', padding: '12px 16px', background: 'hsl(20, 15%, 98%)', margin: '8px 0' }
const quoteText = { fontSize: '14px', color: 'hsl(20, 25%, 25%)', whiteSpace: 'pre-wrap' as const, margin: 0 }
