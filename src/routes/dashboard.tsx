import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { BellRing, LayoutDashboard, Radar, CreditCard, Settings, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — SchengenSlot" },
      { name: "description", content: "Manage your visa appointment trackers and alerts." },
      { property: "og:title", content: "Dashboard — SchengenSlot" },
      { property: "og:description", content: "Your slot tracking control panel." },
    ],
  }),
  component: DashboardLayout,
});

function DashboardLayout() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) {
        navigate({ to: "/login" });
      } else {
        setEmail(session.user.email ?? null);
        setReady(true);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/login" });
      } else {
        setEmail(data.session.user.email ?? null);
        setReady(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const onSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/" });
  };

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <aside className="border-b border-border lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex h-16 items-center gap-2 border-b border-border px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BellRing className="h-4 w-4" />
            </span>
            <span>SchengenSlot</span>
          </Link>
        </div>
        <nav className="flex flex-row gap-1 overflow-x-auto p-3 text-sm lg:flex-col">
          <NavItem to="/dashboard" icon={<LayoutDashboard className="h-4 w-4" />}>Overview</NavItem>
          <NavItem to="/dashboard/trackers" icon={<Radar className="h-4 w-4" />}>Trackers</NavItem>
          <NavItem to="/dashboard/billing" icon={<CreditCard className="h-4 w-4" />}>Billing</NavItem>
          <NavItem to="/dashboard/settings" icon={<Settings className="h-4 w-4" />}>Settings</NavItem>
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="text-sm text-muted-foreground">{email}</div>
          <Button variant="ghost" size="sm" onClick={onSignOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </header>
        <main className="p-6 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavItem({ to, icon, children }: { to: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      activeOptions={{ exact: true }}
      activeProps={{ className: "bg-muted text-foreground" }}
    >
      {icon}
      {children}
    </Link>
  );
}