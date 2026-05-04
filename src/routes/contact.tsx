import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card } from "@/components/ui/card";
import { Mail, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact · SchengenSlot" },
      { name: "description", content: "Get in touch with the SchengenSlot team." },
    ],
  }),
  component: Contact,
});

function Contact() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Get in touch</h1>
        <p className="mt-3 text-muted-foreground">We answer every email within one business day.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          <Card className="p-6">
            <Mail className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-semibold">Email</h3>
            <p className="mt-1 text-sm text-muted-foreground">For support, billing or partnership questions.</p>
            <a href="mailto:hello@schengenslot.ie" className="mt-3 inline-block text-sm font-medium text-primary hover:underline">hello@schengenslot.ie</a>
          </Card>
          <Card className="p-6">
            <MessageCircle className="h-6 w-6 text-primary" />
            <h3 className="mt-3 font-semibold">Telegram</h3>
            <p className="mt-1 text-sm text-muted-foreground">Fastest channel for urgent issues during business hours.</p>
            <p className="mt-3 text-sm font-medium text-primary">@SchengenSlotSupport</p>
          </Card>
        </div>
      </section>
    </SiteLayout>
  );
}