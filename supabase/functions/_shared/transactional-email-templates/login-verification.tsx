/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface LoginVerificationEmailProps {
  code: string
  ip?: string
  device?: string
  siteName?: string
}

export const LoginVerificationEmail = ({
  code,
  ip,
  device,
  siteName = 'Warden Network',
}: LoginVerificationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{code} is your {siteName} sign-in code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Confirm this sign-in</Heading>
        <Text style={text}>
          We noticed a sign-in to your {siteName} account from a new device or
          network. Enter this code to continue:
        </Text>
        <Text style={codeStyle}>{code}</Text>
        <Text style={text}>This code expires in 10 minutes.</Text>
        {(ip || device) && (
          <Text style={meta}>
            {device ? <>Device: {device}<br /></> : null}
            {ip ? <>IP address: {ip}</> : null}
          </Text>
        )}
        <Text style={footer}>
          If this wasn't you, change your password immediately — someone else
          may have your login details.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default LoginVerificationEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = { fontSize: '22px', fontWeight: 'bold' as const, color: '#111111', margin: '0 0 20px' }
const text = { fontSize: '14px', color: '#55575d', lineHeight: '1.5', margin: '0 0 16px' }
const codeStyle = {
  fontSize: '32px',
  letterSpacing: '8px',
  fontWeight: 'bold' as const,
  color: '#b91c1c',
  margin: '0 0 16px',
}
const meta = { fontSize: '12px', color: '#6b7280', lineHeight: '1.6', margin: '0 0 16px' }
const footer = { fontSize: '12px', color: '#8e8e8e', lineHeight: '1.5', margin: '24px 0 0' }

export const template = {
  component: LoginVerificationEmail,
  subject: (data: Record<string, any>) =>
    `${data?.code ?? 'Your code'} is your sign-in code`,
  displayName: 'Login verification code',
  previewData: {
    code: '482913',
    ip: '203.0.113.7',
    device: 'Chrome on macOS',
    siteName: 'Warden Network',
  },
}
