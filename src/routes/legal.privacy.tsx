import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";

export const Route = createFileRoute("/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy · SchengenSlot" },
      { name: "description", content: "How SchengenSlot handles your data." },
    ],
  }),
  component: Privacy,
});

function Privacy() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="mt-3 text-sm text-muted-foreground">Last updated: 4 May 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p><strong className="text-foreground">What we collect.</strong> Account email, optional name, optional phone number, optional Telegram handle, your country/centre/category preferences, and a log of which alerts we sent you.</p>
          <p><strong className="text-foreground">What we don't collect.</strong> Your passport, applicant data, visa application contents, or any data from official consulate or VFS/BLS/TLS systems.</p>
          <p><strong className="text-foreground">How we use it.</strong> Solely to deliver alerts to you, bill you for the service, and provide support.</p>
          <p><strong className="text-foreground">Sharing.</strong> Never sold. Shared only with sub-processors who help us run the service: Stripe (billing), Resend (email), Twilio (SMS / WhatsApp), Telegram (alerts), and our cloud database provider.</p>
          <p><strong className="text-foreground">Retention.</strong> Account data is kept for as long as your account is active, plus 12 months after deletion for billing/tax records.</p>
          <p><strong className="text-foreground">Your rights (GDPR).</strong> You can access, correct, export or delete your data at any time. Email <a href="mailto:privacy@schengenslot.ie" className="text-primary hover:underline">privacy@schengenslot.ie</a>.</p>
        </div>
      </section>
    </SiteLayout>
  );
}