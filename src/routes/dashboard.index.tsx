import { createFileRoute, Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Radar, BellRing, Activity, Plus } from "lucide-react";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

function DashboardOverview() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your active trackers and recent alerts.</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/trackers"><Plus className="mr-2 h-4 w-4" /> New tracker</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Radar className="h-4 w-4" />} label="Active trackers" value="0" />
        <StatCard icon={<BellRing className="h-4 w-4" />} label="Alerts (30d)" value="0" />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Slots detected" value="0" />
      </div>

      <Card className="p-10 text-center">
        <h2 className="text-lg font-medium">No trackers yet</h2>
        <p className="mt-1 text-sm text-muted-foreground">Create one to start receiving instant Schengen slot alerts.</p>
        <Button asChild className="mt-4">
          <Link to="/dashboard/trackers"><Plus className="mr-2 h-4 w-4" /> Add a country</Link>
        </Button>
      </Card>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold tracking-tight">{value}</div>
    </Card>
  );
}