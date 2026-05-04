import {
  Body, Button, Container, Head, Heading, Html, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

const SITE_NAME = 'SchengenSlot'

interface SlotAlertProps {
  centre?: string
  category?: string
  country?: string
  slotDate?: string
  slotTime?: string | null
  bookingUrl?: string
}

const SlotAlertEmail = ({
  centre = 'your selected centre',
  category = 'visa',
  country = '',
  slotDate = 'soon',
  slotTime = null,
  bookingUrl,
}: SlotAlertProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>New {category} slot available at {centre} on {slotDate}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>🚨 Slot just opened</Heading>
        <Text style={text}>
          A <strong>{category}</strong> appointment slot just became available
          {country ? ` in ${country}` : ''} at <strong>{centre}</strong>.
        </Text>
        <Section style={detailBox}>
          <Text style={detailRow}><strong>Date:</strong> {slotDate}</Text>
          {slotTime ? <Text style={detailRow}><strong>Time:</strong> {slotTime}</Text> : null}
          <Text style={detailRow}><strong>Centre:</strong> {centre}</Text>
        </Section>
        <Text style={text}>
          Slots disappear in seconds — book immediately.
        </Text>
        {bookingUrl ? (
          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button href={bookingUrl} style={button}>Book this slot now →</Button>
          </Section>
        ) : null}
        <Text style={footer}>You received this because you have an active tracker on {SITE_NAME}.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: SlotAlertEmail,
  subject: (d: Record<string, any>) =>
    `🚨 ${d?.category ?? 'Visa'} slot available — ${d?.centre ?? 'your centre'} on ${d?.slotDate ?? 'soon'}`,
  displayName: 'Slot alert',
  previewData: {
    centre: 'Dublin VFS',
    category: 'Short Stay',
    country: 'Ireland',
    slotDate: '2026-06-12',
    slotTime: '10:30',
    bookingUrl: 'https://example.com/book',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }
const container = { padding: '24px 28px', maxWidth: '560px', margin: '0 auto' }
const h1 = { fontSize: '24px', fontWeight: 'bold', color: '#0f172a', margin: '0 0 16px' }
const text = { fontSize: '15px', color: '#334155', lineHeight: '1.6', margin: '0 0 16px' }
const detailBox = { backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '16px 18px', margin: '20px 0' }
const detailRow = { fontSize: '14px', color: '#0f172a', margin: '4px 0' }
const button = { backgroundColor: '#0f172a', color: '#ffffff', padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', fontWeight: 600, fontSize: '15px' }
const footer = { fontSize: '12px', color: '#94a3b8', margin: '28px 0 0' }
