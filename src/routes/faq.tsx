import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "FAQ · SchengenSlot" },
      { name: "description", content: "Frequently asked questions about SchengenSlot — alerts, accuracy, billing, and what we don't do." },
    ],
  }),
  component: FAQ,
});

const ITEMS = [
  { q: "How fast are the alerts?", a: "We typically detect a new opening within 30–90 seconds and fan out alerts in under a second after that. Web push and Telegram are usually the fastest channels." },
  { q: "Do you book the appointment for me?", a: "No. We never log into your VFS / BLS / TLS account. Auto-booking would breach provider terms and could invalidate your application. We tell you a slot is open — you book it on the official site." },
  { q: "Why aren't all 27 Schengen countries supported?", a: "Each provider portal has different anti-bot measures and login flows, and a working scraper takes effort to build and maintain. We launched with the 5 highest-demand countries from Ireland and add more based on user requests." },
  { q: "What happens if a slot is gone by the time I click?", a: "It happens — popular dates can be booked within seconds. That's why we recommend enabling push + a backup channel (Telegram or SMS), and pre-completing your applicant profile on the official site so you only have to pick the date." },
  { q: "Can I get a refund if I find a slot via you?", a: "Subscriptions are monthly — you cancel anytime from the dashboard and won't be billed for the next cycle. We don't offer prorated refunds for partial months." },
  { q: "Is this legal?", a: "We provide a monitoring service. We never bypass paywalls, never log into your account, and never automate booking. The legal grey zone here is provider terms-of-service, not the law — and providers are well aware that monitoring services exist." },
  { q: "Do you store my visa application data?", a: "Never. We only store your account email, your country preferences, and a log of which alerts we sent you. We never see your passport, application, or any consulate data." },
];

function FAQ() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Frequently asked</h1>
        <p className="mt-3 text-muted-foreground">Honest answers to the most common questions.</p>
        <Accordion type="single" collapsible className="mt-10">
          {ITEMS.map((it, i) => (
            <AccordionItem key={i} value={`i${i}`}>
              <AccordionTrigger className="text-left">{it.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{it.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </SiteLayout>
  );
}