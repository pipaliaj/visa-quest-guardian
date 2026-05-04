import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/legal/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service · SchengenSlot" },
      { name: "description", content: "SchengenSlot terms of service." },
    ],
  }),
  component: Terms,
});

function Terms() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 prose prose-slate">
        <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: 4 May 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p><strong className="text-foreground">1. Service.</strong> SchengenSlot ("we") provides a monitoring and notification service for publicly available Schengen visa appointment information published on third-party visa application centre websites.</p>
          <p><strong className="text-foreground">2. No affiliation.</strong> We are not affiliated with VFS Global, BLS International, TLScontact, VisaMetric, or any embassy, consulate or government body.</p>
          <p><strong className="text-foreground">3. No booking.</strong> We do not log into your accounts, submit applications, or book appointments on your behalf. All bookings are made by you on the official provider site.</p>
          <p><strong className="text-foreground">4. No guarantees.</strong> We do not guarantee that you will obtain an appointment, that alerts will be delivered without delay, or that detected slots will still be available when you act on them.</p>
          <p><strong className="text-foreground">5. Billing.</strong> Subscriptions are billed monthly per country. Cancellation takes effect at the end of the current billing period. We do not offer prorated refunds.</p>
          <p><strong className="text-foreground">6. Acceptable use.</strong> You may not resell, repackage or scrape our alerts. One account per person.</p>
          <p><strong className="text-foreground">7. Liability.</strong> Our liability is limited to the fees you have paid us in the last 12 months.</p>
          <p><strong className="text-foreground">8. Governing law.</strong> Ireland.</p>
        </div>
      </section>
    </SiteLayout>
  );
}