# Ticket Pilot 🎫

Das moderne Ticket-System für Teams. Erstelle, verwalte und tracke Tickets einfach und effizient.

## Features

- **Ticket-System** mit automatischen Nummern (TP-0001), Kategorien, Prioritäten
- **Gruppen-System** mit Rollen (Owner, Admin, Member) und konfigurierbaren Berechtigungen
- **Dashboard** mit Filtern, Sortierung und Echtzeit-Status
- **Auth** mit Email/Passwort + Discord OAuth (optional)
- **Email-Bestätigung** bei Registrierung
- **Dark/Light Mode** Theme (gespeichert)
- **Kommentare** und **Audit-Log** in jedem Ticket
- **Claiming** – Nur der Claimer kann ein Ticket bearbeiten
- **Realtime** mit Ably (Live-Updates)
- **Rechtliches**: Impressum & Datenschutz (DE)

## Tech-Stack

| Bereich   | Technologie                          |
| --------- | ------------------------------------- |
| Frontend  | Next.js 14, TypeScript, Tailwind CSS  |
| Datenbank | PostgreSQL (Render)                   |
| ORM       | Drizzle ORM (node-postgres)           |
| Auth      | NextAuth.js                           |
| Email     | Resend                                |
| Realtime  | Ably                                  |
| Hosting   | Render (Web Service)                  |

## Quick Start (lokal)

Voraussetzung: eine lokale Postgres-Instanz (z.B. via Docker: `docker run -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=ticket_pilot -p 5432:5432 postgres`).

```bash
# Abhängigkeiten installieren
npm install

# .env anlegen (siehe .env.example) und DATABASE_URL setzen
cp .env.example .env

# Datenbank initialisieren
npm run db:push

# Server starten
npm run dev
```

Öffne `http://localhost:3000`

## Deploy auf Render

### Variante A: Blueprint (empfohlen)

Das Repo enthält `render.yaml`. Damit legt Render Web Service + Postgres-DB automatisch an:

1. Repo zu GitHub pushen
2. In Render: **New → Blueprint** → Repo auswählen
3. Render erkennt `render.yaml`, erstellt `ticket-pilot-db` (Postgres) und den Web Service `ticket-pilot`
4. `DATABASE_URL` wird automatisch verknüpft, `NEXTAUTH_SECRET` automatisch generiert
5. Fehlende Variablen manuell im Dashboard eintragen: `NEXTAUTH_URL` (deine `.onrender.com`-URL oder eigene Domain), `RESEND_API_KEY`, `EMAIL_FROM`, optional `DISCORD_CLIENT_ID`/`SECRET`, `ABLY_API_KEY`
6. Deploy abwarten – Build führt automatisch `db:push` aus (Schema wird angelegt)

### Variante B: Manuell im Dashboard

1. **New → PostgreSQL** erstellen, Namen merken, "Internal Database URL" kopieren
2. **New → Web Service** → Repo verbinden
   - Runtime: Node
   - Build Command: `npm install && npm run db:push && npm run build`
   - Start Command: `npm run start`
3. Environment Variables setzen (siehe Tabelle unten), `DATABASE_URL` = die kopierte Postgres-URL
4. Deploy starten

## Umgebungsvariablen

| Variable                | Beschreibung          | Woher                                                     |
| ------------------------ | ---------------------- | ---------------------------------------------------------- |
| `DATABASE_URL`           | Postgres-Verbindung    | Render Postgres (automatisch bei Blueprint)                |
| `NEXTAUTH_SECRET`        | Session Secret          | `openssl rand -base64 32` (Blueprint generiert automatisch) |
| `NEXTAUTH_URL`           | App URL                | Deine Render-URL, z.B. `https://ticket-pilot.onrender.com` |
| `RESEND_API_KEY`         | Email-Versand           | [resend.com](https://resend.com)                            |
| `EMAIL_FROM`             | Absender-Email          | Resend                                                      |
| `DISCORD_CLIENT_ID`      | Discord Login (opt.)   | [discord.com/developers](https://discord.com/developers)   |
| `DISCORD_CLIENT_SECRET`  | Discord Login (opt.)   | Discord Developer Portal                                    |
| `ABLY_API_KEY`           | Realtime (opt.)        | [ably.com](https://ably.com)                                |

## Hinweis Render Free-Tier

- Kostenloser Web Service schläft nach 15 Min. Inaktivität ein (Cold Start beim nächsten Aufruf)
- Kostenlose Postgres-DB wird nach 90 Tagen gelöscht, falls nicht auf bezahlten Plan upgegraded
- Für Dauerbetrieb: Starter-Plan (Web Service + DB) empfehlenswert

## Lizenz

MIT
