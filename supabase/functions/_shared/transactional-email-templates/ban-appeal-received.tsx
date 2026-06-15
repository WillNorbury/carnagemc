/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Text, Section,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  minecraftUsername?: string
  appealText?: string
}

const Email = ({ minecraftUsername = 'there', appealText = '' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We received your HavocSMP punishment appeal</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Appeal received</Heading>
        <Text style={text}>
          Hi {minecraftUsername}, we've received your punishment appeal and our staff
          will review it shortly. You'll get another email once a decision has been made.
        </Text>
        {appealText && (
          <Section style={quote}>
            <Text style={quoteText}>{appealText}</Text>
          </Section>
        )}
        <Text style={footer}>— HavocSMP Staff</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'We received your HavocSMP appeal',
  displayName: 'Ban appeal received',
  previewData: { minecraftUsername: 'Notch', appealText: 'Please unban me, I will follow the rules.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 700 as const, color: 'hsl(20, 25%, 12%)', margin: '0 0 16px' }
const text = { fontSize: '14px', color: 'hsl(20, 15%, 40%)', lineHeight: '1.6', margin: '0 0 16px' }
const quote = { borderLeft: '3px solid hsl(22, 100%, 55%)', padding: '8px 14px', background: 'hsl(20, 15%, 97%)', margin: '0 0 20px' }
const quoteText = { fontSize: '13px', color: 'hsl(20, 25%, 25%)', whiteSpace: 'pre-wrap' as const, margin: 0 }
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0' }
