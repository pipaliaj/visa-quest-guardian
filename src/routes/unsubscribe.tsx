import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, MailX } from "lucide-react";

export const Route = createFileRoute("/unsubscribe")({
  validateSearch: (s: Record<string, unknown>) => ({ token: (s.token as string) ?? "" }),
  component: UnsubscribePage,
});

function UnsubscribePage() {
  const { token } = Route.useSearch();
  const [state, setState] = useState<"loading" | "valid" | "already" | "invalid" | "done" | "error">("loading");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    fetch(`/email/unsubscribe?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.valid) setState("valid");
        else if (j.reason === "already_unsubscribed") setState("already");
        else setState("invalid");
      })
      .catch(() => setState("error"));
  }, [token]);

  const confirm = async () => {
    setWorking(true);
    const r = await fetch("/email/unsubscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const j = await r.json();
    setWorking(false);
    if (j.success) setState("done");
    else if (j.reason === "already_unsubscribed") setState("already");
    else setState("error");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md p-8 text-center">
        {state === "loading" && <p className="text-sm text-muted-foreground">Loading…</p>}
        {state === "valid" && (
          <>
            <MailX className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 text-xl font-semibold">Unsubscribe from alerts?</h1>
            <p className="mt-2 text-sm text-muted-foreground">You'll stop receiving slot alert emails from SchengenSlot.</p>
            <Button className="mt-6 w-full" onClick={confirm} disabled={working}>
              {working ? "Processing…" : "Confirm unsubscribe"}
            </Button>
          </>
        )}
        {state === "done" && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" />
            <h1 className="mt-4 text-xl font-semibold">You're unsubscribed</h1>
            <p className="mt-2 text-sm text-muted-foreground">You won't receive any more slot alert emails.</p>
          </>
        )}
        {state === "already" && (
          <>
            <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground" />
            <h1 className="mt-4 text-xl font-semibold">Already unsubscribed</h1>
          </>
        )}
        {(state === "invalid" || state === "error") && (
          <>
            <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
            <h1 className="mt-4 text-xl font-semibold">Link is invalid or expired</h1>
            <p className="mt-2 text-sm text-muted-foreground">If you believe this is an error, contact support.</p>
          </>
        )}
      </Card>
    </div>
  );
}
