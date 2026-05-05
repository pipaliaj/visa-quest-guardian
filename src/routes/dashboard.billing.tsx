import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { createPortalSession } from "@/utils/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";
import { Loader2, ExternalLink } from "lucide-react";

export const Route = createFileRoute("/dashboard/billing")({
  validateSearch: (s: Record<string, unknown>) => ({
    plan: typeof s.plan === "string" ? s.plan : undefined,
    checkout: typeof s.checkout === "string" ? s.checkout : undefined,
  }),
  component: BillingPage,
});

const PLANS = [
  { id: "single_country_monthly", name: "Single Country", price: "€19/mo" },
  { id: "bundle_3_monthly", name: "Bundle 3", price: "€46/mo" },
  { id: "premium_all_monthly", name: "Premium · All Countries", price: "€80/mo" },
];

function BillingPage() {
  const search = Route.useSearch();
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(search.plan ?? null);
  const [portalLoading, setPortalLoading] = useState(false);

  const refresh = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    if (!u) return;
    setUser({ id: u.id, email: u.email ?? "" });
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", u.id)
      .eq("environment", getStripeEnvironment())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    setSub(data);
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  useEffect(() => {
    if (search.checkout === "success") {
      toast.success("Subscription active! It may take a few seconds to appear.");
      const t = setInterval(refresh, 2000);
      setTimeout(() => clearInterval(t), 15000);
    }
  }, [search.checkout]);

  const openPortal = async () => {
    setPortalLoading(true);
    try {
      const url = await createPortalSession({
        data: { returnUrl: window.location.href, environment: getStripeEnvironment() },
      });
      window.open(url, "_blank");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  const isActive = sub && ["active", "trialing", "past_due"].includes(sub.status) &&
    (!sub.current_period_end || new Date(sub.current_period_end) > new Date());

  return (
    <div className="space-y-6">
      <PaymentTestModeBanner />
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your subscription and payment method.</p>
      </div>

      {isActive ? (
        <Card className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{PLANS.find(p => p.id === sub.plan_code)?.name ?? sub.plan_code}</h2>
                <Badge variant={sub.status === "trialing" ? "secondary" : "default"}>{sub.status}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {sub.cancel_at_period_end
                  ? `Cancels on ${new Date(sub.current_period_end).toLocaleDateString()}`
                  : sub.current_period_end
                    ? `Renews on ${new Date(sub.current_period_end).toLocaleDateString()}`
                    : ""}
              </p>
            </div>
            <Button onClick={openPortal} disabled={portalLoading} variant="outline">
              {portalLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Manage <ExternalLink className="ml-2 h-4 w-4" /></>}
            </Button>
          </div>
        </Card>
      ) : selectedPlan ? (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Complete subscription · {PLANS.find(p => p.id === selectedPlan)?.name}</h2>
            <Button variant="ghost" size="sm" onClick={() => setSelectedPlan(null)}>Change plan</Button>
          </div>
          <StripeEmbeddedCheckout
            priceId={selectedPlan}
            userId={user?.id}
            customerEmail={user?.email}
            returnUrl={`${window.location.origin}/dashboard/billing?checkout=success`}
          />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((p) => (
            <Card key={p.id} className="p-5 flex flex-col">
              <h3 className="font-semibold">{p.name}</h3>
              <p className="mt-1 text-2xl font-bold">{p.price}</p>
              <p className="mt-1 text-xs text-muted-foreground">7-day free trial</p>
              <Button className="mt-4" onClick={() => setSelectedPlan(p.id)}>Start trial</Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}