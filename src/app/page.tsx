"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { TopBar } from "@/components/TopBar";
import { Footer } from "@/components/Footer";
import {
  Ticket,
  Users,
  BarChart3,
  Shield,
  Zap,
  Clock,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden gradient-hero">
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
          <div className="container mx-auto px-4 py-24 md:py-32 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm text-white/80 mb-6 backdrop-blur-sm">
                <Zap className="h-4 w-4" />
                Kostenlos starten
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Dein Ticket-System
                <br />
                <span className="text-brand-300">für perfekte Organisation</span>
              </h1>
              <p className="text-lg md:text-xl text-white/70 mb-8 max-w-2xl mx-auto">
                Erstelle, verwalte und tracke Tickets mit deinem Team. Einfach,
                schnell und vollständig konfigurierbar.
              </p>

              {session ? (
                <Link
                  href="/groups"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-brand-700 hover:bg-white/90 transition-all hover:scale-105 shadow-xl"
                >
                  Zum Dashboard
                  <ArrowRight className="h-5 w-5" />
                </Link>
              ) : (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-brand-700 hover:bg-white/90 transition-all hover:scale-105 shadow-xl"
                  >
                    Starte durch mit Ticket Pilot
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm hover:bg-white/20 transition-all"
                  >
                    Bereits registriert? Login
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Alles was du brauchst
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Ticket Pilot bietet dir alle Werkzeuge für ein effizientes
              Ticket-Management
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <FeatureCard
              icon={<Ticket className="h-6 w-6" />}
              title="Ticket-System"
              description="Erstelle und verwalte Tickets mit automatischen Nummern, Kategorien und Prioritäten."
            />
            <FeatureCard
              icon={<Users className="h-6 w-6" />}
              title="Gruppen-System"
              description="Gründe Teams, lade Mitglieder ein und konfiguriere Berechtigungen individuell."
            />
            <FeatureCard
              icon={<BarChart3 className="h-6 w-6" />}
              title="Dashboard"
              description="Übersichtliches Dashboard mit Filtern, Sortierung und Echtzeit-Status."
            />
            <FeatureCard
              icon={<Shield className="h-6 w-6" />}
              title="Sicherheit"
              description="Email-Verifikation, optionale 2FA und Discord-Login für maximale Sicherheit."
            />
            <FeatureCard
              icon={<Clock className="h-6 w-6" />}
              title="Fälligkeiten"
              description="Setze Deadlines und behalte den Überblick über anstehende Aufgaben."
            />
            <FeatureCard
              icon={<Zap className="h-6 w-6" />}
              title="Echtzeit"
              description="Live-Updates mit Ably Realtime. Sofortige Benachrichtigungen bei Änderungen."
            />
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20">
          <div className="rounded-3xl gradient-hero p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Bereit loszulegen?
              </h2>
              <p className="text-white/70 text-lg mb-8 max-w-xl mx-auto">
                Erstelle jetzt dein kostenloses Konto und starte mit Ticket
                Pilot.
              </p>
              <Link
href={session ? "/groups" : "/register"}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-lg font-semibold text-brand-700 hover:bg-white/90 transition-all hover:scale-105 shadow-xl"
                >
                  {session ? "Loslegen" : "Starte durch mit Ticket Pilot"}
                  <ArrowRight className="h-5 w-5" />
                </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group rounded-2xl border border-border bg-card p-6 hover:shadow-lg hover:border-brand-500/50 transition-all duration-300">
      <div className="h-12 w-12 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500 mb-4 group-hover:bg-brand-500/20 transition-colors">
        {icon}
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  );
}
