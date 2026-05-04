import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export const Route = createFileRoute("/countries")({
  head: () => ({
    meta: [
      { title: "Supported countries · SchengenSlot" },
      { name: "description", content: "We monitor Schengen visa appointments for France, Germany, Spain, Italy and Netherlands from Ireland." },
    ],
  }),
  component: Countries,
});

const COUNTRIES = [
  { flag: "🇫🇷", name: "France", provider: "VFS Global", url: "visa.vfsglobal.com/irl/en/fra", categories: ["Short-stay", "Long-stay", "Work", "Study"] },
  { flag: "🇩🇪", name: "Germany", provider: "VFS Global", url: "visa.vfsglobal.com/irl/en/deu", categories: ["Short-stay", "Long-stay", "Work", "Study"] },
  { flag: "🇪🇸", name: "Spain", provider: "BLS International", url: "ireland.blsspainvisa.com", categories: ["Short-stay", "Long-stay", "Work", "Study"] },
  { flag: "🇮🇹", name: "Italy", provider: "VFS Global", url: "visa.vfsglobal.com/irl/en/ita", categories: ["Short-stay", "Long-stay", "Work", "Study"] },
  { flag: "🇳🇱", name: "Netherlands", provider: "VFS Global", url: "visa.vfsglobal.com/irl/en/nld", categories: ["Short-stay", "Long-stay", "Work", "Study"] },
];

function Countries() {
  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold tracking-tight">Supported countries</h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">All centres are based in Dublin. More countries are added based on demand — let us know which one you need next.</p>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {COUNTRIES.map((c) => (
            <Card key={c.name} className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-4xl">{c.flag}</div>
                  <h3 className="mt-3 text-xl font-semibold">{c.name}</h3>
                  <p className="text-sm text-muted-foreground">{c.provider} · Dublin</p>
                </div>
                <Badge variant="secondary" className="bg-success/10 text-success">Live</Badge>
              </div>
              <p className="mt-4 truncate text-xs text-muted-foreground">{c.url}</p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {c.categories.map((cat) => (
                  <Badge key={cat} variant="outline" className="text-xs font-normal">{cat}</Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
        <div className="mt-12">
          <Button asChild>
            <Link to="/signup">Track a country <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    </SiteLayout>
  );
}