import Link from "next/link";
import { Ticket } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-brand-500" />
            <span className="font-semibold">Ticket Pilot</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/imprint" className="hover:text-foreground transition-colors">
              Impressum
            </Link>
            <Link href="/privacy" className="hover:text-foreground transition-colors">
              Datenschutz
            </Link>
            <span>© {new Date().getFullYear()} Ticket Pilot</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
