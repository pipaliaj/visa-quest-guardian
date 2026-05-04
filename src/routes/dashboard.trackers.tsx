import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/dashboard/trackers")({
  component: TrackersPage,
});

function TrackersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Trackers</h1>
        <p className="mt-1 text-sm text-muted-foreground">Pick a country, centre and visa category to monitor.</p>
      </div>
      <Card className="p-10 text-center text-sm text-muted-foreground">
        Tracker creation UI coming next — country, centre, category, alert window.
      </Card>
    </div>
  );
}