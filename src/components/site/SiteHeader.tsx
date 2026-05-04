import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { BellRing } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BellRing className="h-4 w-4" />
          </span>
          <span className="text-base">SchengenSlot</span>
          <span className="hidden text-xs font-normal text-muted-foreground sm:inline">· Ireland</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          <Link to="/how-it-works" className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>How it works</Link>
          <Link to="/countries" className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>Countries</Link>
          <Link to="/pricing" className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>Pricing</Link>
          <Link to="/faq" className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>FAQ</Link>
          <Link to="/contact" className="transition-colors hover:text-foreground" activeProps={{ className: "text-foreground" }}>Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/login">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}