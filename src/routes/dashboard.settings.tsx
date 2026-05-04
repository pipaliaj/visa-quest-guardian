import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type Profile = {
  id: string;
  full_name: string | null;
  channel_email: boolean;
  channel_web_push: boolean;
  channel_sms: boolean;
  channel_telegram: boolean;
  channel_whatsapp: boolean;
  phone_e164: string | null;
  telegram_chat_id: string | null;
};

export const Route = createFileRoute("/dashboard/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      setProfile((data as Profile) ?? null);
    })();
  }, []);

  if (!profile) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const update = (patch: Partial<Profile>) => setProfile((p) => (p ? { ...p, ...patch } : p));

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      channel_email: profile.channel_email,
      channel_web_push: profile.channel_web_push,
      channel_sms: profile.channel_sms,
      channel_telegram: profile.channel_telegram,
      channel_whatsapp: profile.channel_whatsapp,
      phone_e164: profile.phone_e164,
      telegram_chat_id: profile.telegram_chat_id,
    }).eq("id", profile.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Saved");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Profile and notification channels.</p>
      </div>

      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-medium">Profile</h2>
        <div className="space-y-2">
          <Label>Full name</Label>
          <Input value={profile.full_name ?? ""} onChange={(e) => update({ full_name: e.target.value })} />
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <h2 className="text-lg font-medium">Notification channels</h2>
        <Row label="Email" desc="Instant email alerts when a slot is detected." checked={profile.channel_email} onChange={(v) => update({ channel_email: v })} />
        <Row label="Web push" desc="Browser push notifications." checked={profile.channel_web_push} onChange={(v) => update({ channel_web_push: v })} />
        <Row label="SMS" desc="Coming soon." checked={profile.channel_sms} onChange={(v) => update({ channel_sms: v })} disabled />
        <Row label="Telegram" desc="Coming soon." checked={profile.channel_telegram} onChange={(v) => update({ channel_telegram: v })} disabled />
        <Row label="WhatsApp" desc="Coming soon." checked={profile.channel_whatsapp} onChange={(v) => update({ channel_whatsapp: v })} disabled />
      </Card>

      <Button onClick={save} disabled={saving}>{saving ? "Saving…" : "Save changes"}</Button>
    </div>
  );
}

function Row({ label, desc, checked, onChange, disabled }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border pt-4 first:border-0 first:pt-0">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{desc}</div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
