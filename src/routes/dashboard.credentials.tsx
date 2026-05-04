import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ShieldCheck, Lock, Trash2 } from "lucide-react";
import { listCredentials, upsertCredential, deleteCredential } from "@/server/credentials.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/dashboard/credentials")({
  component: CredentialsPage,
});

type Centre = { id: string; city: string };
type Cred = {
  id: string; centre_id: string; provider: string; label: string; active: boolean;
  updated_at: string; centres: { city: string } | null;
};

const PROVIDERS = ["tls", "vfs", "bls", "visametric", "other"] as const;

function CredentialsPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [creds, setCreds] = useState<Cred[]>([]);

  const [centreId, setCentreId] = useState("");
  const [provider, setProvider] = useState<string>("vfs");
  const [label, setLabel] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");

  const list = useServerFn(listCredentials);
  const upsert = useServerFn(upsertCredential);
  const del = useServerFn(deleteCredential);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) { navigate({ to: "/login" }); return; }
      const { data: role } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
      setIsAdmin(!!role);
      setChecking(false);
      if (!role) return;
      const ce = await supabase.from("centres").select("id,city").order("city");
      setCentres((ce.data ?? []) as Centre[]);
      try {
        const r = await list();
        setCreds(r.credentials as Cred[]);
      } catch {}
    })();
  }, [navigate, list]);

  if (checking) return <p className="text-sm text-muted-foreground">Checking access…</p>;
  if (!isAdmin) {
    return (
      <Card className="p-10 text-center">
        <ShieldCheck className="mx-auto h-8 w-8 text-muted-foreground" />
        <p className="mt-3 text-sm">Admin only. <Link to="/dashboard" className="underline">Back to dashboard</Link>.</p>
      </Card>
    );
  }

  const onSave = async () => {
    if (!centreId || !provider || !label) return toast.error("Centre, provider, label required");
    try {
      await upsert({ data: {
        centre_id: centreId,
        provider: provider as typeof PROVIDERS[number],
        label,
        username: username || null,
        password: password || null,
        notes: notes || null,
      } });
      toast.success("Credential saved (encrypted)");
      setLabel(""); setUsername(""); setPassword(""); setNotes("");
      const r = await list();
      setCreds(r.credentials as Cred[]);
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Delete this credential?")) return;
    try {
      await del({ data: { id } });
      setCreds((cs) => cs.filter((c) => c.id !== id));
    } catch (e: any) { toast.error(e?.message ?? "Failed"); }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Scraper credentials</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Per-centre logins for VFS, BLS, etc. Stored encrypted (AES-256-GCM). Only the running scraper can decrypt them via its signed key.
        </p>
      </div>

      <Card className="p-6">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-medium"><Lock className="h-4 w-4" /> Add / update credential</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Centre</Label>
            <Select value={centreId} onValueChange={setCentreId}>
              <SelectTrigger><SelectValue placeholder="Centre" /></SelectTrigger>
              <SelectContent>{centres.map((c) => <SelectItem key={c.id} value={c.id}>{c.city}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Provider</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger><SelectValue placeholder="Provider" /></SelectTrigger>
              <SelectContent>{PROVIDERS.map((p) => <SelectItem key={p} value={p}>{p.toUpperCase()}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Label (e.g. "main account")</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Username / email</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Notes (e.g. application reference, OTP method)</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </div>
        </div>
        <Button className="mt-4" onClick={onSave}>Save credential</Button>
      </Card>

      <Card className="p-6">
        <h2 className="mb-4 text-lg font-medium">Stored credentials</h2>
        {creds.length === 0 ? (
          <p className="text-sm text-muted-foreground">No credentials yet.</p>
        ) : (
          <div className="space-y-2">
            {creds.map((c) => (
              <div key={c.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <div>
                  <div className="font-medium">
                    {c.label}
                    <span className="ml-2 rounded-full bg-muted px-2 py-0.5 text-xs uppercase">{c.provider}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{c.centres?.city}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Updated {new Date(c.updated_at).toLocaleString()} · {c.active ? "active" : "inactive"}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => onDelete(c.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-xs text-muted-foreground">
          Decrypted values are never returned to this UI. To rotate a password, re-enter and save — it will overwrite the encrypted blob.
        </p>
      </Card>
    </div>
  );
}