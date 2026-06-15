/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  mcUsername?: string
  applicationType?: string
  why?: string
}

const Email = ({ mcUsername = 'there', applicationType = 'staff', why = '' }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We received your HavocSMP {applicationType} application</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Application received</Heading>
        <Text style={text}>
          Hi {mcUsername}, thanks for applying to be a <strong>{applicationType}</strong> on HavocSMP.
          Our team will review your submission and get back to you soon.
        </Text>
        {why && (
          <Section style={quote}>
            <Text style={quoteText}>{why}</Text>
          </Section>
        )}
        <Text style={footer}>— HavocSMP Staff</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `We received your HavocSMP ${d.applicationType ?? ''} application`.trim(),
  displayName: 'Application received',
  previewData: { mcUsername: 'Notch', applicationType: 'builder', why: 'I love building cathedrals.' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 700 as const, color: 'hsl(20, 25%, 12%)', margin: '0 0 16px' }
const text = { fontSize: '14px', color: 'hsl(20, 15%, 40%)', lineHeight: '1.6', margin: '0 0 16px' }
const quote = { borderLeft: '3px solid hsl(22, 100%, 55%)', padding: '8px 14px', background: 'hsl(20, 15%, 97%)', margin: '0 0 20px' }
const quoteText = { fontSize: '13px', color: 'hsl(20, 25%, 25%)', whiteSpace: 'pre-wrap' as const, margin: 0 }
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0' }
