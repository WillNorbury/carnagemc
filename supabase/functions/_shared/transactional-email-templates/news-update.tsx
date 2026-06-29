import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  title: string
  content: string
  priority?: string
  coverUrl?: string | null
  link?: string
  siteName?: string
}

const Email = ({
  title,
  content,
  priority,
  coverUrl,
  link,
  siteName = 'CarnageMC',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${siteName} announcement: ${title}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName} · ANNOUNCEMENT</Text>
        <Heading style={h1}>{title}</Heading>
        {priority && priority !== 'normal' && (
          <Text style={badge}>{priority.toUpperCase()} PRIORITY</Text>
        )}
        {coverUrl && (
          <Img src={coverUrl} alt={title} width="504" style={cover} />
        )}
        <Text style={body}>{content}</Text>
        {link && (
          <Section style={{ textAlign: 'center', marginTop: '28px' }}>
            <Button href={link} style={btn}>Read on {siteName}</Button>
          </Section>
        )}
        <Text style={footer}>
          You're receiving this because you have an account on {siteName}.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `${d.siteName ?? 'CarnageMC'} announcement: ${d.title ?? 'New post'}`,
  displayName: 'News announcement',
  previewData: {
    title: 'Server-wide event this Saturday',
    content: 'Join us for a server-wide event with prizes and chaos.',
    priority: 'high',
    coverUrl: null,
    link: 'https://carnagemc.net/news',
    siteName: 'CarnageMC',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '32px 28px', maxWidth: '560px', margin: '0 auto' }
const brand = {
  fontSize: '12px', letterSpacing: '0.25em', color: '#ff7a1a',
  textTransform: 'uppercase' as const, fontWeight: 700, margin: '0 0 8px',
}
const h1 = { color: '#0b0b0f', fontSize: '26px', lineHeight: '1.25', margin: '0 0 12px', fontWeight: 800 }
const badge = {
  display: 'inline-block', padding: '4px 10px', borderRadius: '999px',
  backgroundColor: '#fff1e6', color: '#c14a00', fontSize: '11px',
  fontWeight: 700, letterSpacing: '0.1em', margin: '0 0 16px',
}
const cover = { borderRadius: '10px', margin: '8px 0 18px', width: '100%', height: 'auto' as const }
const body = { color: '#1f2937', fontSize: '15px', lineHeight: '1.65', whiteSpace: 'pre-wrap' as const }
const btn = {
  backgroundColor: '#ff7a1a', color: '#ffffff', padding: '12px 22px',
  borderRadius: '8px', fontWeight: 700, fontSize: '14px', textDecoration: 'none',
}
const footer = {
  color: '#9ca3af', fontSize: '12px', marginTop: '32px',
  borderTop: '1px solid #e5e7eb', paddingTop: '16px',
}
