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

| Bereich | Technologie |
|---|---|
| Frontend | Next.js 14, TypeScript, Tailwind CSS |
| Datenbank | Cloudflare D1 (SQLite) via @libsql/client |
| ORM | Drizzle ORM |
| Auth | NextAuth.js |
| Email | Resend |
| Realtime | Ably |
| Hosting | Cloudflare Pages |

## Quick Start (lokal)

```bash
# Abhängigkeiten installieren
npm install

# Datenbank initialisieren
npx drizzle-kit push

# Server starten
npm run dev
```

Öffne `http://localhost:3000`

## Deploy auf Cloudflare Pages

### 1. Cloudflare D1 Datenbank erstellen

```bash
# Cloudflare CLI installieren
npm install -g wrangler

# Einloggen
wrangler login

# D1 Datenbank erstellen
wrangler d1 create ticket-pilot-db

# ID kopieren und in wrangler.toml eintragen

# Schema auf D1 ausführen
wrangler d1 execute ticket-pilot-db --remote --file=./schema.sql
```

### 2. Turso REST API (für Remote-Zugriff)

Da Cloudflare D1 nur von Cloudflare-Edges aus erreichbar ist, nutzen wir Turso als REST-Proxy:

```bash
# Turso CLI installieren
curl -sSfL https://get.tur.so/install.sh | bash
turso auth signup

# Database erstellen
turso db create ticket-pilot
turso db tokens create ticket-pilot

# Werte in Environment Variables eintragen:
# TURSO_DATABASE_URL=libsql://ticket-pilot-[dein-account].turso.io
# TURSO_AUTH_TOKEN=dein-token
```

### 3. Deploy

```bash
# Git initialisieren und pushen
git init
git add .
git commit -m "Initial: Ticket Pilot"
git remote add origin https://github.com/DEIN_USER/ticket-pilot.git
git push -u origin main

# Auf Cloudflare Pages verbinden:
# 1. cloudflare.com → Pages → Create a project
# 2. GitHub Repo verbinden
# 3. Build-Command: npm run build
# 4. Output directory: .next
# 5. Environment Variables setzen (siehe .env.example)
```

## Umgebungsvariablen

| Variable | Beschreibung | Woher |
|---|---|---|
| `DATABASE_URL` | Lokale DB (dev) | `file:./dev.db` |
| `TURSO_DATABASE_URL` | Cloud DB URL | Turso/D1 |
| `TURSO_AUTH_TOKEN` | Cloud DB Token | Turso |
| `NEXTAUTH_SECRET` | Session Secret | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | App URL | `https://deine-domain.com` |
| `RESEND_API_KEY` | Email-Versand | [resend.com](https://resend.com) |
| `EMAIL_FROM` | Absender-Email | Resend |
| `DISCORD_CLIENT_ID` | Discord Login (opt.) | [discord.com/developers](https://discord.com/developers) |
| `DISCORD_CLIENT_SECRET` | Discord Login (opt.) | Discord Developer Portal |
| `ABLY_API_KEY` | Realtime (opt.) | [ably.com](https://ably.com) |

## Free-Tier Limits

| Service | Limit | Ausreichend für |
|---|---|---|
| Cloudflare D1 | 5 GB + 5 Mio Ops/Monat | ~10.000+ Tickets/Monat |
| Turso | 500 DBs, 9 GB | Reicht für Jahre |
| Resend | 3.000 Emails/Monat | ~100 Bestätigungen/Tag |
| Ably | 6 Mio Messages/Monat | 200 gleichzeitige User |
| Cloudflare Pages | Unlimited Bandbreite | Kein Problem |

## Lizenz

MIT
