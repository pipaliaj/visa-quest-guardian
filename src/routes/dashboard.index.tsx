import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Radar, BellRing, Activity, Plus, ShieldCheck } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export const Route = createFileRoute("/dashboard/")({
  component: DashboardOverview,
});

type SlotRow = {
  id: string;
  detected_at: string;
  slot_date: string;
  slot_time: string | null;
  centres: { city: string } | null;
  visa_categories: { name: string } | null;
};

function DashboardOverview() {
  const [stats, setStats] = useState({ trackers: 0, alerts: 0, slots: 0 });
  const [recent, setRecent] = useState<SlotRow[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const since = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      const since24 = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const [tr, al, sl, slots, role] = await Promise.all([
        supabase.from("trackers").select("id", { count: "exact", head: true }).eq("active", true),
        supabase.from("notifications_log").select("id", { count: "exact", head: true }).gte("sent_at", since),
        supabase.from("slot_events").select("id", { count: "exact", head: true }).gte("detected_at", since24),
        supabase.from("slot_events").select("id,detected_at,slot_date,slot_time,centres(city),visa_categories(name)").order("detected_at", { ascending: false }).limit(10),
        supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle(),
      ]);
      setStats({ trackers: tr.count ?? 0, alerts: al.count ?? 0, slots: sl.count ?? 0 });
      setRecent((slots.data ?? []) as unknown as SlotRow[]);
      setIsAdmin(!!role.data);
    })();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Overview</h1>
          <p className="mt-1 text-sm text-muted-foreground">Your active trackers and recent alerts.</p>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <Button variant="outline" asChild>
              <Link to="/dashboard/admin"><ShieldCheck className="mr-2 h-4 w-4" /> Admin</Link>
            </Button>
          )}
          <Button asChild>
            <Link to="/dashboard/trackers"><Plus className="mr-2 h-4 w-4" /> New tracker</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Radar className="h-4 w-4" />} label="Active trackers" value={String(stats.trackers)} />
        <StatCard icon={<BellRing className="h-4 w-4" />} label="Alerts (30d)" value={String(stats.alerts)} />
        <StatCard icon={<Activity className="h-4 w-4" />} label="Slots (24h)" value={String(stats.slots)} />
      </div>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-medium">Recent detected slots</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No slots detected yet. They'll appear here in real time.</p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-3">
                <div>
                  <div className="font-medium">{s.centres?.city} — {s.visa_categories?.name}</div>
                  <div className="text-sm text-muted-foreground">{s.slot_date}{s.slot_time ? ` · ${s.slot_time.slice(0,5)}` : ""}</div>
                </div>
                <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(s.detected_at), { addSuffix: true })}</span>
              </li>
            ))}
          </ul>
        )}
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
