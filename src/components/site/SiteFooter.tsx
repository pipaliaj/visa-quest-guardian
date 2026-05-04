import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <p className="font-semibold text-foreground">SchengenSlot</p>
            <p className="mt-2 max-w-xs text-sm text-muted-foreground">
              Instant alerts the moment a Schengen visa appointment opens at your chosen application centre in Ireland.
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/how-it-works" className="hover:text-foreground">How it works</Link></li>
              <li><Link to="/countries" className="hover:text-foreground">Countries</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground">Pricing</Link></li>
              <li><Link to="/faq" className="hover:text-foreground">FAQ</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Company</p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/contact" className="hover:text-foreground">Contact</Link></li>
              <li><Link to="/legal/terms" className="hover:text-foreground">Terms</Link></li>
              <li><Link to="/legal/privacy" className="hover:text-foreground">Privacy</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Disclaimer</p>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              SchengenSlot is an independent monitoring service. We are not affiliated with VFS Global, BLS International, TLScontact, VisaMetric, or any embassy or consulate. Booking still happens on the official provider website.
            </p>
          </div>
        </div>
        <div className="mt-10 border-t border-border/60 pt-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} SchengenSlot. Made in Ireland.
        </div>
      </div>
    </footer>
  );
}