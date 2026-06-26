import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  subject: string
  message: string
  category?: string
  siteName?: string
  senderName?: string
}

const Email = ({ subject, message, category, siteName = 'CarnageMC', senderName }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${siteName}: ${subject}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName}</Text>
        <Heading style={h1}>{subject}</Heading>
        {category && (
          <Section style={metaRow}>
            <Text style={badge}>{category.toUpperCase()}</Text>
          </Section>
        )}
        <Text style={body}>{message}</Text>
        {senderName && <Text style={signature}>— {senderName}</Text>}
        <Text style={footer}>You're receiving this because of your account on {siteName}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => String(d.subject ?? 'Update from CarnageMC'),
  displayName: 'Admin broadcast',
  previewData: {
    subject: 'Important announcement',
    message: 'Hello, this is a message from the CarnageMC team.',
    category: 'Owner Only',
    siteName: 'CarnageMC',
    senderName: 'William',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brand = {
  fontSize: '12px',
  letterSpacing: '0.25em',
  color: '#ff7a1a',
  textTransform: 'uppercase' as const,
  fontWeight: 700,
  margin: '0 0 8px',
}
const h1 = { color: '#0b0b0f', fontSize: '24px', lineHeight: '1.3', margin: '0 0 16px', fontWeight: 800 }
const metaRow = { display: 'block', margin: '0 0 18px' }
const badge = {
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: '999px',
  backgroundColor: '#fff1e6',
  color: '#c14a00',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.1em',
}
const body = { color: '#1f2937', fontSize: '15px', lineHeight: '1.65', whiteSpace: 'pre-wrap' as const }
const signature = { color: '#374151', fontSize: '14px', marginTop: '24px', fontStyle: 'italic' as const }
const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  marginTop: '32px',
  borderTop: '1px solid #e5e7eb',
  paddingTop: '16px',
}
