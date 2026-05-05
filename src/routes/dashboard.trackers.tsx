import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Trash2, Radar } from "lucide-react";

type Country = { id: string; name: string; code: string; flag_emoji: string | null; monitoring_status?: "live" | "coming_soon" };
type Centre = { id: string; city: string; country_id: string; provider: string };
type Category = { id: string; code: string; name: string };
type Tracker = {
  id: string;
  active: boolean;
  centre_id: string;
  category_id: string;
  centres: { city: string; country_id: string } | null;
  visa_categories: { name: string } | null;
};

export const Route = createFileRoute("/dashboard/trackers")({
  component: TrackersPage,
});

function TrackersPage() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const load = async () => {
    const [c, ce, cat, t] = await Promise.all([
      supabase.from("countries").select("id,name,code,flag_emoji,monitoring_status").eq("active", true).eq("monitoring_status", "live").order("name"),
      supabase.from("centres").select("id,city,country_id,provider").eq("active", true).order("city"),
      supabase.from("visa_categories").select("id,code,name").order("name"),
      supabase.from("trackers").select("id,active,centre_id,category_id,centres(city,country_id),visa_categories(name)").order("created_at", { ascending: false }),
    ]);
    setCountries((c.data ?? []) as Country[]);
    setCentres((ce.data ?? []) as Centre[]);
    setCategories((cat.data ?? []) as Category[]);
    setTrackers((t.data ?? []) as unknown as Tracker[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (id: string, active: boolean) => {
    const { error } = await supabase.from("trackers").update({ active }).eq("id", id);
    if (error) return toast.error(error.message);
    setTrackers((prev) => prev.map((t) => (t.id === id ? { ...t, active } : t)));
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("trackers").delete().eq("id", id);
    if (error) return toast.error(error.message);
    setTrackers((prev) => prev.filter((t) => t.id !== id));
    toast.success("Tracker removed");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Trackers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Get notified the moment a slot opens at your chosen centre.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New tracker</Button>
          </DialogTrigger>
          <NewTrackerDialog
            countries={countries}
            centres={centres}
            categories={categories}
            onCreated={() => { setOpen(false); load(); }}
          />
        </Dialog>
      </div>

      {loading ? (
        <Card className="p-10 text-center text-sm text-muted-foreground">Loading…</Card>
      ) : trackers.length === 0 ? (
        <Card className="p-10 text-center">
          <Radar className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No trackers yet. Create one to start receiving alerts.</p>
        </Card>
      ) : (
        <div className="grid gap-3">
          {trackers.map((t) => {
            const country = countries.find((c) => c.id === t.centres?.country_id);
            return (
              <Card key={t.id} className="flex items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{country?.flag_emoji ?? "🌍"}</span>
                  <div>
                    <div className="font-medium">{country?.name} — {t.centres?.city}</div>
                    <div className="text-sm text-muted-foreground">{t.visa_categories?.name}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={t.active} onCheckedChange={(v) => toggle(t.id, v)} />
                    <span className="text-xs text-muted-foreground">{t.active ? "Active" : "Paused"}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(t.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function NewTrackerDialog({
  countries, centres, categories, onCreated,
}: {
  countries: Country[]; centres: Centre[]; categories: Category[]; onCreated: () => void;
}) {
  const [countryId, setCountryId] = useState<string>("");
  const [centreId, setCentreId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const filteredCentres = centres.filter((c) => c.country_id === countryId);

  const submit = async () => {
    if (!centreId || !categoryId) return toast.error("Pick a centre and category");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return toast.error("Not signed in"); }
    const { error } = await supabase.from("trackers").insert({
      user_id: u.user.id,
      centre_id: centreId,
      category_id: categoryId,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Tracker created");
    setCountryId(""); setCentreId(""); setCategoryId("");
    onCreated();
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>New tracker</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Country</Label>
          <Select value={countryId} onValueChange={(v) => { setCountryId(v); setCentreId(""); }}>
            <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
            <SelectContent>
              {countries.map((c) => <SelectItem key={c.id} value={c.id}>{c.flag_emoji} {c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Centre</Label>
          <Select value={centreId} onValueChange={setCentreId} disabled={!countryId}>
            <SelectTrigger><SelectValue placeholder={countryId ? "Select centre" : "Pick country first"} /></SelectTrigger>
            <SelectContent>
              {filteredCentres.map((c) => <SelectItem key={c.id} value={c.id}>{c.city} ({c.provider})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Visa category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button onClick={submit} disabled={saving}>{saving ? "Creating…" : "Create tracker"}</Button>
      </DialogFooter>
    </DialogContent>
  );
}