/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface OrderLine {
  name: string
  quantity: number
  priceFormatted: string
  recipient?: string | null
}

interface Props {
  recipientName?: string
  orderId?: string
  items?: OrderLine[]
  subtotalFormatted?: string
  couponCode?: string | null
  couponSummary?: string | null
  discountFormatted?: string | null
  bundleSummary?: string | null
  totalFormatted?: string
  ticketUrl?: string
}

const Email = ({
  recipientName = 'there',
  orderId = '',
  items = [],
  subtotalFormatted = '',
  couponCode = null,
  couponSummary = null,
  discountFormatted = null,
  bundleSummary = null,
  totalFormatted = '',
  ticketUrl = 'https://carnagemc.net/me/orders',
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your CarnageMC store order — {totalFormatted}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Order received</Heading>
        <Text style={text}>Hi {recipientName},</Text>
        <Text style={text}>
          Thanks for your order! Our team will follow up in your support ticket with
          payment instructions and fulfillment status.
        </Text>

        <Section style={card}>
          <Text style={cardHeading}>Order #{orderId.slice(0, 8)}</Text>
          {items.map((it, i) => (
            <Section key={i} style={lineRow}>
              <Text style={lineName}>
                {it.name} <span style={lineQty}>× {it.quantity}</span>
              </Text>
              {it.recipient ? (
                <Text style={giftLine}>🎁 Gift to <strong>{it.recipient}</strong></Text>
              ) : null}
              <Text style={linePrice}>{it.priceFormatted}</Text>
            </Section>
          ))}

          <Section style={totals}>
            <Text style={totalRow}>Subtotal: <strong>{subtotalFormatted}</strong></Text>
            {couponSummary ? (
              <Text style={totalRow}>
                Coupon {couponCode ? <strong>{couponCode}</strong> : null} — {couponSummary}
                {discountFormatted ? ` (−${discountFormatted})` : ''}
              </Text>
            ) : null}
            {bundleSummary ? <Text style={totalRow}>{bundleSummary}</Text> : null}
            <Text style={grandTotal}>Total: {totalFormatted}</Text>
          </Section>
        </Section>

        <Button style={button} href={ticketUrl}>View your orders</Button>
        <Text style={muted}>
          Questions? Reply to the support ticket linked above and staff will assist.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: (d: Record<string, any>) =>
    `Order received — ${d.totalFormatted ?? 'CarnageMC Store'}`,
  displayName: 'Store order confirmation',
  previewData: {
    recipientName: 'Steve',
    orderId: '1a2b3c4d-5e6f',
    items: [
      { name: 'VIP Rank', quantity: 1, priceFormatted: '$9.99', recipient: 'Notch' },
      { name: 'Crate Key', quantity: 3, priceFormatted: '$5.97' },
    ],
    subtotalFormatted: '$15.96',
    couponCode: 'SUMMER',
    couponSummary: '10% off',
    discountFormatted: '$1.60',
    bundleSummary: 'Bundle discount: 5% off (−$0.72)',
    totalFormatted: '$13.64',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Arial, sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px' }
const h1 = { fontSize: '22px', fontWeight: 700 as const, color: 'hsl(20, 25%, 12%)', margin: '0 0 16px' }
const text = { fontSize: '14px', color: 'hsl(20, 25%, 25%)', lineHeight: '1.6', margin: '0 0 12px' }
const muted = { fontSize: '12px', color: 'hsl(20, 10%, 50%)', margin: '16px 0 0' }
const card = { border: '1px solid hsl(20, 15%, 90%)', borderRadius: '12px', padding: '16px 18px', margin: '16px 0' }
const cardHeading = { fontSize: '12px', fontWeight: 700 as const, color: 'hsl(22, 100%, 45%)', letterSpacing: '0.08em', textTransform: 'uppercase' as const, margin: '0 0 12px' }
const lineRow = { borderTop: '1px solid hsl(20, 15%, 94%)', padding: '10px 0', margin: 0 }
const lineName = { fontSize: '14px', color: 'hsl(20, 25%, 15%)', margin: '0 0 2px', fontWeight: 600 as const }
const lineQty = { color: 'hsl(20, 10%, 45%)', fontWeight: 400 as const }
const giftLine = { fontSize: '12px', color: 'hsl(22, 90%, 40%)', margin: '0 0 2px' }
const linePrice = { fontSize: '13px', color: 'hsl(20, 25%, 30%)', margin: 0 }
const totals = { borderTop: '2px solid hsl(20, 15%, 90%)', paddingTop: '10px', marginTop: '10px' }
const totalRow = { fontSize: '13px', color: 'hsl(20, 25%, 25%)', margin: '2px 0' }
const grandTotal = { fontSize: '15px', fontWeight: 700 as const, color: 'hsl(20, 25%, 12%)', margin: '8px 0 0' }
const button = { backgroundColor: 'hsl(22, 100%, 55%)', color: '#fff', fontSize: '14px', borderRadius: '12px', padding: '12px 20px', textDecoration: 'none', display: 'inline-block' }
