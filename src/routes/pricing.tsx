import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing · SchengenSlot" },
      { name: "description", content: "Pay €19/month per country tracked. Bundle 3+ countries for 20% off, 5 countries for 30% off." },
    ],
  }),
  component: Pricing,
});

const TIERS = [
  {
    name: "Single country",
    price: "€19",
    period: "/ country / month",
    desc: "Track one country at one centre. Perfect if you only need a France or Spain appointment.",
    features: ["Web push + email alerts", "Sub-minute detection", "7-day free trial", "Cancel anytime"],
    cta: "Start trial",
    plan: "single_country_monthly",
  },
  {
    name: "Bundle 3",
    price: "€46",
    period: "/ month (3 countries)",
    desc: "Three countries with a 20% discount. Most flexible plan.",
    features: ["Everything in Single", "20% off vs single", "Telegram alerts included"],
    cta: "Choose 3 countries",
    highlight: true,
    plan: "bundle_3_monthly",
  },
  {
    name: "All 6 + Premium",
    price: "€80",
    period: "/ month",
    desc: "All 6 live countries with 30% off, plus SMS and WhatsApp alerts.",
    features: ["All live countries", "SMS alerts", "WhatsApp alerts", "Priority support"],
    cta: "Go premium",
    plan: "premium_all_monthly",
  },
];

function Pricing() {
  const navigate = useNavigate();
  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight">Pay only for what you track</h1>
          <p className="mt-4 text-lg text-muted-foreground">€19/month per country. 7-day free trial on all plans.</p>
        </div>
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {TIERS.map((t) => (
            <Card key={t.name} className={`flex flex-col p-7 ${t.highlight ? "border-primary ring-2 ring-primary/20" : ""}`} style={t.highlight ? { boxShadow: "var(--shadow-elegant)" } : { boxShadow: "var(--shadow-card)" }}>
              {t.highlight && <Badge className="mb-3 w-fit">Most popular</Badge>}
              <h3 className="text-lg font-semibold">{t.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{t.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold tracking-tight">{t.price}</span>
                <span className="text-sm text-muted-foreground">{t.period}</span>
              </div>
              <ul className="mt-6 flex-1 space-y-2.5 text-sm">
                {t.features.map((f) => (
                  <li key={f} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" /> {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-8"
                variant={t.highlight ? "default" : "outline"}
                onClick={() => navigate({ to: "/signup", search: { plan: t.plan } as any })}
              >
                {t.cta} <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
        <p className="mt-10 text-center text-xs text-muted-foreground">Prices in EUR · billed monthly · 7-day free trial · cancel anytime from the dashboard</p>
      </section>
    </SiteLayout>
  );
}