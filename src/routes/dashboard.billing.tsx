import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/billing")({
  component: BillingPage,
});

function BillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">Subscriptions are billed per country.</p>
      </div>
      <Card className="p-10 text-center text-sm text-muted-foreground">
        Stripe checkout and active subscriptions appear here.
      </Card>
    </div>
  );
}