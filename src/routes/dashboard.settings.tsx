import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Notification channels and profile.</p>
      </div>
      <Card className="p-10 text-center text-sm text-muted-foreground">
        Channel toggles (email, web push, SMS, Telegram, WhatsApp) coming next.
      </Card>
    </div>
  );
}