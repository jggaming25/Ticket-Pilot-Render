import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import DiscordProvider from "next-auth/providers/discord";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { users } from "./db/schema";
import { eq } from "drizzle-orm";
import { isAdminEmail } from "./admin";
import { isBanActive } from "./utils";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
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
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "user";
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
          }
        } catch {
          // DB nicht erreichbar -> nicht blockieren
        }
      }
      return session;
    },
  },
};