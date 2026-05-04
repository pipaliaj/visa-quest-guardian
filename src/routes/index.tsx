import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BellRing, Zap, ShieldCheck, Globe2, Smartphone, Mail, MessageCircle, ArrowRight, Activity } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SchengenSlot — Instant visa appointment alerts in Ireland" },
      { name: "description", content: "Get notified the moment a Schengen visa appointment opens at VFS, BLS or TLS centres in Dublin. Pay only for the countries you need." },
      { property: "og:title", content: "SchengenSlot — Instant visa slot alerts" },
      { property: "og:description", content: "Stop refreshing VFS. We watch every centre 24/7 and ping you the second a slot opens." },
    ],
  }),
  component: Index,
});

const COUNTRIES = [
  { flag: "🇫🇷", name: "France", provider: "VFS Global · Dublin" },
  { flag: "🇩🇪", name: "Germany", provider: "VFS Global · Dublin" },
  { flag: "🇪🇸", name: "Spain", provider: "BLS International · Dublin" },
  { flag: "🇮🇹", name: "Italy", provider: "VFS Global · Dublin" },
  { flag: "🇳🇱", name: "Netherlands", provider: "VFS Global · Dublin" },
];

function Index() {
  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-95"
          style={{ background: "var(--gradient-hero)" }}
        />
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Badge variant="secondary" className="mb-6 bg-white/10 text-white backdrop-blur border-white/20">
              <Activity className="mr-1.5 h-3 w-3" /> Watching 5 centres · 24/7
            </Badge>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
              Schengen visa slots,<br />
              <span className="text-accent">the second they open.</span>
            </h1>
            <p className="mt-6 text-lg leading-8 text-white/80">
              Stop refreshing VFS at 3am. We monitor every Schengen visa application centre in Ireland and alert you instantly via push, email, SMS, Telegram and WhatsApp.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
                <Link to="/signup">
                  Start free 24-hour trial <ArrowRight className="ml-1.5 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                <Link to="/how-it-works">See how it works</Link>
              </Button>
            </div>
            <p className="mt-6 text-xs text-white/60">No credit card for trial · Cancel anytime · Pay per country</p>
          </div>
        </div>
      </section>

      {/* Value props */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { icon: Zap, title: "Sub-minute alerts", body: "Our scrapers check each centre every 30–60 seconds. The instant a date opens, you know." },
            { icon: BellRing, title: "5 channels, your call", body: "Web push, email, SMS, Telegram, WhatsApp. Mix and match per tracker." },
            { icon: ShieldCheck, title: "You stay in control", body: "We never auto-book. We tell you a slot exists — you book it on the official site." },
          ].map(({ icon: Icon, title, body }) => (
            <Card key={title} className="p-6" style={{ boxShadow: "var(--shadow-card)" }}>
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Countries */}
      <section className="border-y border-border/60 bg-secondary/30">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mb-10 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-accent-foreground/70">Live coverage</p>
              <h2 className="mt-1 text-3xl font-bold tracking-tight">5 countries · expanding fast</h2>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/countries">All countries <ArrowRight className="ml-1 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {COUNTRIES.map((c) => (
              <Card key={c.name} className="p-5 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="text-3xl">{c.flag}</div>
                <p className="mt-3 font-semibold">{c.name}</p>
                <p className="text-xs text-muted-foreground">{c.provider}</p>
                <div className="mt-3 flex items-center gap-1.5 text-xs text-success">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
                  </span>
                  Monitoring
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight">Three steps to your slot</h2>
          <p className="mt-3 text-muted-foreground">Set up in under 60 seconds.</p>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {[
            { n: "01", title: "Pick your country & visa", body: "France short-stay? Germany work? Choose any combination of country + category." },
            { n: "02", title: "Choose your channels", body: "Push notifications keep working with your phone in your pocket. Add SMS or Telegram for backup." },
            { n: "03", title: "Book the moment we ping", body: "Tap the alert, jump straight to the official VFS/BLS booking page. We don't book for you — you stay in control." },
          ].map((s) => (
            <div key={s.n} className="relative">
              <div className="text-5xl font-bold text-primary/20">{s.n}</div>
              <h3 className="mt-2 text-xl font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Channels strip */}
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold">Five ways to never miss a slot</h2>
              <p className="mt-2 text-primary-foreground/70">Channels are configurable per tracker so a Spain alert can ping your phone while a France alert hits Telegram.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {[
                { Icon: Smartphone, label: "Web Push" },
                { Icon: Mail, label: "Email" },
                { Icon: MessageCircle, label: "Telegram" },
                { Icon: BellRing, label: "SMS" },
                { Icon: Globe2, label: "WhatsApp" },
              ].map(({ Icon, label }) => (
                <div key={label} className="flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur">
                  <Icon className="h-4 w-4" /> {label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-4 py-24 sm:px-6 lg:px-8">
        <Card className="overflow-hidden p-10 text-center" style={{ boxShadow: "var(--shadow-elegant)" }}>
          <h2 className="text-3xl font-bold tracking-tight">Your appointment is waiting.</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Join applicants who stopped refreshing the VFS calendar at midnight and started getting on with their lives.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/signup">Start free trial <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/pricing">See pricing</Link>
            </Button>
          </div>
        </Card>
      </section>
    </SiteLayout>
  );
}
