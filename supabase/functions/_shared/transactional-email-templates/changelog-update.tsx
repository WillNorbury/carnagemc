import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
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
  title: string
  content: string
  category?: string
  version?: string | null
  entryDate?: string
  link?: string
  siteName?: string
}

const Email = ({
  title,
  content,
  category,
  version,
  entryDate,
  link,
  siteName = 'CarnageMC',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${siteName} update: ${title}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>{siteName}</Text>
        <Heading style={h1}>{title}</Heading>
        <Section style={metaRow}>
          {category && <Text style={badge}>{category.toUpperCase()}</Text>}
          {version && <Text style={badgeAlt}>v{version}</Text>}
          {entryDate && <Text style={metaText}>{entryDate}</Text>}
        </Section>
        <Text style={body}>{content}</Text>
        {link && (
          <Section style={{ textAlign: 'center', marginTop: '28px' }}>
            <Button href={link} style={btn}>
              View full changelog
            </Button>
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
    `${d.siteName ?? 'CarnageMC'} update: ${d.title ?? 'New changelog'}`,
  displayName: 'Changelog update',
  previewData: {
    title: 'Cart & Wishlist',
    content:
      'Added a local cart and wishlist for Discover listings. Save items, move between cart and wishlist, and sort.',
    category: 'feature',
    version: null,
    entryDate: '2026-06-25',
    link: 'https://carnagemc.net/changelog',
    siteName: 'CarnageMC',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = {
  padding: '32px 28px',
  maxWidth: '560px',
  margin: '0 auto',
}
const brand = {
  fontSize: '12px',
  letterSpacing: '0.25em',
  color: '#ff7a1a',
  textTransform: 'uppercase' as const,
  fontWeight: 700,
  margin: '0 0 8px',
}
const h1 = {
  color: '#0b0b0f',
  fontSize: '26px',
  lineHeight: '1.25',
  margin: '0 0 16px',
  fontWeight: 800,
}
const metaRow = {
  display: 'block',
  margin: '0 0 18px',
}
const badge = {
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: '999px',
  backgroundColor: '#fff1e6',
  color: '#c14a00',
  fontSize: '11px',
  fontWeight: 700,
  letterSpacing: '0.1em',
  marginRight: '8px',
}
const badgeAlt = {
  ...badge,
  backgroundColor: '#eef2ff',
  color: '#3730a3',
}
const metaText = {
  display: 'inline-block',
  fontSize: '12px',
  color: '#6b7280',
}
const body = {
  color: '#1f2937',
  fontSize: '15px',
  lineHeight: '1.65',
  whiteSpace: 'pre-wrap' as const,
}
const btn = {
  backgroundColor: '#ff7a1a',
  color: '#ffffff',
  padding: '12px 22px',
  borderRadius: '8px',
  fontWeight: 700,
  fontSize: '14px',
  textDecoration: 'none',
}
const footer = {
  color: '#9ca3af',
  fontSize: '12px',
  marginTop: '32px',
  borderTop: '1px solid #e5e7eb',
  paddingTop: '16px',
}
