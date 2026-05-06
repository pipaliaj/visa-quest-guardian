import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowRight, Eye, Bell, Calendar, Shield } from "lucide-react";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How it works · SchengenSlot" },
      { name: "description", content: "How SchengenSlot detects and notifies you of new Schengen visa appointment openings." },
    ],
  }),
  component: HowItWorks,
});

function HowItWorks() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight">How SchengenSlot works</h1>
        <p className="mt-4 text-lg text-muted-foreground">A no-magic explanation of what we do, what we don't do, and why we're worth €19/mo per country.</p>

        <div className="mt-12 space-y-10">
          {[
            { Icon: Eye, title: "We watch the appointment calendars", body: "A fleet of always-on workers checks the official appointment calendar of every supported visa centre every 30–60 seconds. We use legitimate browser sessions, residential network connections, and respect each provider's rate limits." },
            { Icon: Bell, title: "We detect new openings instantly", body: "When the calendar goes from \"no slots\" to \"slot on 14 May 09:30\", our system fires a webhook within seconds. Each detection is deduplicated so you don't get hammered with repeats." },
            { Icon: Calendar, title: "We alert only the right people", body: "Your tracker says you want Netherlands short-stay in Dublin? You get pinged. Your friend who tracks Austria work? They don't. Filters respect your alert window (e.g. only weekdays 9–18) so you sleep at night." },
            { Icon: Shield, title: "You book it yourself", body: "Every alert deep-links to the official VFS / BLS / TLS booking page. We never log into your account or auto-book — that would breach provider terms and put your application at risk. The booking, the payment, the documents — all you, on the official site." },
          ].map(({ Icon, title, body }) => (
            <div key={title} className="flex gap-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{title}</h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <Card className="mt-16 p-8 text-center">
          <h2 className="text-2xl font-semibold">Try it for 24 hours, free</h2>
          <p className="mx-auto mt-2 max-w-md text-muted-foreground">No card needed. Add one country, see for yourself how fast the alerts come through.</p>
          <Button asChild size="lg" className="mt-6">
            <Link to="/signup">Get started <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </Card>
      </section>
    </SiteLayout>
  );
}