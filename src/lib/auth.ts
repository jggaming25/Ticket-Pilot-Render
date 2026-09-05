import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import { encode as defaultEncode, decode as defaultDecode } from "next-auth/jwt";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { isAdminEmail } from "./admin";
import { isBanActive } from "./utils";

const DAY = 24 * 60 * 60;
const REMEMBER_MAX_AGE = 60 * DAY;
const SHORT_MAX_AGE = DAY;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: REMEMBER_MAX_AGE,
  },
  jwt: {
    // "Angemeldet bleiben" steuert die Laufzeit des Tokens:
    // mit Haken 60 Tage, ohne 24 Stunden. Sperren/Löschungen werden
    // trotzdem live in der session-Callback geprüft.
    async encode({ token, secret, maxAge, salt }) {
      const remember = (token as any)?.remember === true;
      const actualMaxAge = remember ? REMEMBER_MAX_AGE : SHORT_MAX_AGE;
      const params: any = { token, secret, maxAge: actualMaxAge };
      if (salt) params.salt = salt;
      return defaultEncode(params);
    },
    async decode({ token, secret, salt }) {
      const params: any = { token, secret };
      if (salt) params.salt = salt;
      return defaultDecode(params) as any;
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
      ? [
          DiscordProvider({
            clientId: process.env.DISCORD_CLIENT_ID,
            clientSecret: process.env.DISCORD_CLIENT_SECRET,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Passwort", type: "password" },
        remember: { label: "Angemeldet bleiben", type: "checkbox" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const result = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as any))
          .limit(1);
        const user = result[0];

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!isValid) return null;

        if (isBanActive(user.banned, user.bannedUntil)) return null;

        if (!user.emailVerified) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          role: user.role || (isAdminEmail(user.email) ? "admin" : "user"),
          remember: credentials.remember === "true",
        } as any;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "user";
        // Ohne Angabe (z. B. Discord-Login) standardmäßig "Angemeldet bleiben"
        token.remember = (user as any).remember ?? true;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role || "user";

        // Live-Status (Bann/Löschung) aus der DB laden
        try {
          const result = await db
            .select({
              banned: users.banned,
              banReason: users.banReason,
              bannedUntil: users.bannedUntil,
              deleteAt: users.deleteAt,
            })
            .from(users)
            .where(eq(users.id, token.id as string))
            .limit(1);
          const live = result[0];
          if (live) {
            (session.user as any).banned = live.banned || false;
            (session.user as any).banReason = live.banReason;
            (session.user as any).bannedUntil = live.bannedUntil;
            (session.user as any).deleteAt = live.deleteAt;
          } else {
            // Konto gelöscht: Session wird als hinfällig markiert
            (session.user as any).banned = true;
            (session.user as any).banReason = "Dein Konto wurde gelöscht.";
            (session.user as any).deleteAt = new Date(0);
          }
        } catch {
          // DB nicht erreichbar -> nicht blockieren
        }
      }
      return session;
    },
  },
};