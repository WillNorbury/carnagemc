/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  minecraftUsername?: string
  status?: string
  adminResponse?: string
  appealUrl?: string
}

const Email = ({
  minecraftUsername = 'there',
  status = 'updated',
  adminResponse = '',
  appealUrl = 'https://carnagemc.net/appeal',
}: Props) => {
  const accent =
    status === 'approved' ? 'hsl(160, 84%, 39%)' :
    status === 'denied' ? 'hsl(0, 75%, 55%)' :
    'hsl(22, 100%, 55%)'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your CarnageMC appeal was {status}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={{ ...h1, color: accent }}>Appeal {status}</Heading>
          <Text style={text}>
            Hi {minecraftUsername}, staff have reviewed your appeal and marked it as{' '}
            <strong>{status}</strong>.
          </Text>
          {adminResponse && (
            <Section style={quote}>
              <Text style={quoteText}>{adminResponse}</Text>
            </Section>
          )}
          <Button style={{ ...button, backgroundColor: accent }} href={appealUrl}>
            View appeal
          </Button>
          <Text style={footer}>— CarnageMC Staff</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: Email,
  subject: (d: Record<string, any>) => `Your CarnageMC appeal was ${d.status ?? 'updated'}`,
  displayName: 'Ban appeal status update',
  previewData: { minecraftUsername: 'Notch', status: 'approved', adminResponse: 'Welcome back, behave!' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 700 as const, margin: '0 0 16px', textTransform: 'capitalize' as const }
const text = { fontSize: '14px', color: 'hsl(20, 15%, 40%)', lineHeight: '1.6', margin: '0 0 16px' }
const quote = { borderLeft: '3px solid hsl(22, 100%, 55%)', padding: '8px 14px', background: 'hsl(20, 15%, 97%)', margin: '0 0 20px' }
const quoteText = { fontSize: '13px', color: 'hsl(20, 25%, 25%)', whiteSpace: 'pre-wrap' as const, margin: 0 }
const button = { color: '#fff', fontSize: '14px', borderRadius: '12px', padding: '12px 20px', textDecoration: 'none', display: 'inline-block' }
const footer = { fontSize: '12px', color: '#999', margin: '24px 0 0' }
