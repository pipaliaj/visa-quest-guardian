import {
  Body, Container, Head, Heading, Html, Preview, Section, Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface ScraperDownProps {
  scraperName?: string
  minutesSilent?: number
  lastHeartbeatAt?: string | null
  lastSlotAt?: string | null
}

const ScraperDownEmail = ({
  scraperName = 'unknown',
  minutesSilent = 0,
  lastHeartbeatAt = null,
  lastSlotAt = null,
}: ScraperDownProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`Scraper ${scraperName} has been silent for ${minutesSilent} minutes`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>⚠️ Scraper offline</Heading>
        <Section>
          <Text style={text}><strong>Name:</strong> {scraperName}</Text>
          <Text style={text}><strong>Silent for:</strong> {String(minutesSilent)} minutes</Text>
          <Text style={text}><strong>Last heartbeat:</strong> {lastHeartbeatAt ?? 'never'}</Text>
          <Text style={text}><strong>Last slot posted:</strong> {lastSlotAt ?? 'never'}</Text>
          <Text style={text}>Check the VPS: <code>sudo journalctl -u slot-scraper -f</code></Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

const main = { backgroundColor: '#0b0f17', fontFamily: 'system-ui, -apple-system, sans-serif', padding: '24px' }
const container = { backgroundColor: '#111827', borderRadius: '12px', padding: '32px', maxWidth: '560px', margin: '0 auto', color: '#e5e7eb' }
const h1 = { color: '#fbbf24', fontSize: '22px', margin: '0 0 16px' }
const text = { color: '#e5e7eb', fontSize: '15px', lineHeight: '22px', margin: '6px 0' }

export const template: TemplateEntry = {
  component: ScraperDownEmail,
  subject: (d) => `⚠️ Scraper "${d.scraperName}" silent for ${d.minutesSilent}m`,
  displayName: 'Scraper offline alert',
  previewData: { scraperName: 'vps-paris-1', minutesSilent: 30, lastHeartbeatAt: '2026-05-04T22:00:00Z', lastSlotAt: '2026-05-04T21:00:00Z' },
}