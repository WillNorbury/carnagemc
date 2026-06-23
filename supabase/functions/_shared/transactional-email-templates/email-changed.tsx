/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  oldEmail?: string
  newEmail?: string
  changedBy?: string
}

const Email = ({ oldEmail = '', newEmail = '', changedBy = 'a CarnageMC administrator' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your CarnageMC account email was changed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your account email was changed</Heading>
        <Text style={text}>
          The email address on your CarnageMC account was updated by {changedBy}.
        </Text>
        <Section style={box}>
          <Text style={row}><strong>Previous:</strong> {oldEmail || '(unknown)'}</Text>
          <Text style={row}><strong>New:</strong> {newEmail || '(unknown)'}</Text>
        </Section>
        <Text style={text}>
          You will now receive all CarnageMC notifications, password resets, and security
          alerts at <strong>{newEmail}</strong>.
        </Text>
        <Text style={warn}>
          If you did not request this change, please contact CarnageMC staff immediately —
          your account may be compromised.
        </Text>
        <Text style={footer}>— CarnageMC Staff</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Your CarnageMC account email was changed',
  displayName: 'Email changed notification',
  previewData: { oldEmail: 'old@example.com', newEmail: 'new@example.com', changedBy: 'an administrator' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 700 as const, color: 'hsl(20, 25%, 12%)', margin: '0 0 16px' }
const text = { fontSize: '14px', color: 'hsl(20, 15%, 40%)', lineHeight: '1.6', margin: '0 0 16px' }
const box = { borderLeft: '3px solid hsl(22, 100%, 55%)', padding: '10px 14px', background: 'hsl(20, 15%, 97%)', margin: '0 0 20px' }
const row = { fontSize: '13px', color: 'hsl(20, 25%, 25%)', margin: '4px 0' }
const warn = { fontSize: '13px', color: 'hsl(0, 70%, 40%)', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0' }
