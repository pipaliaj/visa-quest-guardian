import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, Plus, KeyRound } from "lucide-react";
import { injectTestSlot, createScraperKey, listScraperKeys } from "@/server/admin.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/dashboard/admin")({
  component: AdminPage,
});

type Centre = { id: string; city: string };
type Category = { id: string; name: string };
type ScraperKey = { id: string; name: string; key_prefix: string | null; active: boolean; last_heartbeat_at: string | null; last_slot_at: string | null };

function AdminPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [cats, setCats] = useState<Category[]>([]);
  const [keys, setKeys] = useState<ScraperKey[]>([]);
  const [centreId, setCentreId] = useState("");
  const [catId, setCatId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);

  const inject = useServerFn(injectTestSlot);
  const create = useServerFn(createScraperKey);
  const list = useServerFn(listScraperKeys);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate({ to: "/login" }); return; }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
      if (!role) {
        // Offer bootstrap
        const { data: bs } = await supabase.rpc("bootstrap_admin");
        if (bs === true) {
          toast.success("You are now the first admin");
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } else {
        setIsAdmin(true);
      }
      setChecking(false);
      const [ce, ca] = await Promise.all([
        supabase.from("centres").select("id,city").order("city"),
        supabase.from("visa_categories").select("id,name").order("name"),
      ]);
      setCentres((ce.data ?? []) as Centre[]);
      setCats((ca.data ?? []) as Category[]);
      try {
        const ks = await list();
        setKeys(ks.keys as ScraperKey[]);
      } catch {}
    })();
  }, [navigate]);

  if (checking) return <p className="text-sm text-muted-foreground">Checking access…</p>;
  if (!isAdmin) {
    return (
      <Card className="p-10 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm">Admin only. <Link to="/dashboard" className="underline">Back to dashboard</Link>.</p>
      </Card>
    );
  }

  const onInject = async () => {
    if (!centreId || !catId || !date) return toast.error("Centre, category, date required");
    try {
      const r = await inject({ data: { centre_id: centreId, category_id: catId, slot_date: date, slot_time: time || null } });
      toast.success(`Slot injected. Notified ${r.notified} user(s).`);
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  const onCreateKey = async () => {
    if (!keyName) return toast.error("Name required");
    try {
      const r = await create({ data: { name: keyName } });
      setNewKey(r.secret);
      setKeyName("");
      const ks = await list();
      setKeys(ks.keys as ScraperKey[]);
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Admin</h1>
        <p className="mt-1 text-sm text-muted-foreground">Inject test slots and manage scraper keys.</p>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-medium"><Plus className="h-4 w-4" /> Inject test slot</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Centre</Label>
            <Select value={centreId} onValueChange={setCentreId}>
              <SelectTrigger><SelectValue placeholder="Centre" /></SelectTrigger>
              <SelectContent>{centres.map((c) => <SelectItem key={c.id} value={c.id}>{c.city}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={catId} onValueChange={setCatId}>
              <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
              <SelectContent>{cats.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Time (optional)</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <Button className="mt-4" onClick={onInject}>Inject slot</Button>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-medium"><KeyRound className="h-4 w-4" /> Scraper keys</h2>
        <div className="flex gap-2">
          <Input placeholder="Key name (e.g. ie-vfs-prod)" value={keyName} onChange={(e) => setKeyName(e.target.value)} />
          <Button onClick={onCreateKey}>Create key</Button>
        </div>
        {newKey && (
          <div className="mt-4 rounded-md border border-border bg-muted p-3 text-sm">
            <div className="mb-1 font-medium">New scraper key (copy now — won't be shown again):</div>
            <code className="break-all">{newKey}</code>
          </div>
        )}
        <div className="mt-6 space-y-2">
          {keys.length === 0 ? <p className="text-sm text-muted-foreground">No scraper keys yet.</p> : keys.map((k) => (
            <div key={k.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
              <div>
                <div className="font-medium">{k.name} <span className="ml-2 text-xs text-muted-foreground">{k.key_prefix}…</span></div>
                <div className="text-xs text-muted-foreground">
                  Heartbeat: {k.last_heartbeat_at ? new Date(k.last_heartbeat_at).toLocaleString() : "never"}
                </div>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-xs ${k.active ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>{k.active ? "Active" : "Revoked"}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
