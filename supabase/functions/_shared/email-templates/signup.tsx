/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  token?: string
  confirmationUrl?: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  token,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your email for {siteName}{token ? ` — code ${token}` : ''}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Confirm your email</Heading>
        <Text style={text}>
          Thanks for signing up for{' '}
          <Link href={siteUrl} style={link}>
            <strong>{siteName}</strong>
          </Link>
          ! Click the button below to verify{' '}
          <Link href={`mailto:${recipient}`} style={link}>{recipient}</Link>.
        </Text>
        {confirmationUrl && (
          <Button style={button} href={confirmationUrl}>
            Confirm email
          </Button>
        )}
        {token && (
          <>
            <Text style={altText}>Or enter this 6-digit code in the app:</Text>
            <Text style={codeStyle}>{token}</Text>
          </>
        )}
        <Text style={footer}>
          This link and code expire shortly. If you didn't create an account, you
          can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif' }
const container = { padding: '20px 25px' }
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: 'hsl(20, 25%, 12%)',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: 'hsl(20, 15%, 40%)',
  lineHeight: '1.5',
  margin: '0 0 25px',
}
const link = { color: 'inherit', textDecoration: 'underline' }
const button = {
  backgroundColor: 'hsl(22, 100%, 55%)',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '12px',
  padding: '12px 20px',
  textDecoration: 'none',
  display: 'inline-block',
  marginBottom: '24px',
}
const altText = { fontSize: '13px', color: 'hsl(20, 15%, 40%)', margin: '0 0 8px' }
const codeStyle = {
  fontFamily: 'Courier, monospace',
  fontSize: '32px',
  letterSpacing: '8px',
  fontWeight: 'bold' as const,
  color: 'hsl(20, 25%, 12%)',
  textAlign: 'center' as const,
  margin: '0 0 30px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
