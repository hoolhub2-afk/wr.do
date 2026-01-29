import authConfig from "@/auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { UserRole } from "@prisma/client";
import NextAuth, { type DefaultSession } from "next-auth";

import { prisma } from "@/lib/db";
import { getUserById } from "@/lib/dto/user";

// More info: https://authjs.dev/getting-started/typescript#module-augmentation
declare module "next-auth" {
  interface Session {
    user: {
      role: UserRole;
      team: string;
      active: number;
      apiKey: string;
      emailVerified: Date;
      trustLevel: number;
    } & DefaultSession["user"];
  }
}

export const {
  handlers: { GET, POST },
  auth,
} = NextAuth({
  trustHost: true, // TODO: Test with docker
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    // error: "/auth/error",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Update trustLevel for LinuxDo users
      if (account?.provider === "linuxdo" && profile && user.id) {
        const linuxDoProfile = profile as any;
        if (typeof linuxDoProfile.trust_level === "number") {
          await prisma.user.update({
            where: { id: user.id },
            data: { trustLevel: linuxDoProfile.trust_level },
          }).catch(() => {
            // User might not exist yet on first sign in
          });
        }
      }
      return true;
    },
    async session({ token, session }) {
      if (session.user) {
        if (token.sub) {
          session.user.id = token.sub;
        }

        if (token.email) {
          session.user.email = token.email;
        }

        if (token.role) {
          session.user.role = token.role;
        }

        session.user.name = token.name;
        session.user.image = token.picture;
        session.user.active = token.active as number;
        session.user.team = token.team as string;
        session.user.apiKey = token.apiKey as string;
        session.user.emailVerified = token.emailVerified as Date;
        session.user.trustLevel = (token.trustLevel as number) || 0;
      }

      return session;
    },
    async jwt({ token }) {
      if (!token.sub) return token;

      const dbUser = await getUserById(token.sub);

      if (!dbUser) return token;

      token.name = dbUser.name;
      token.email = dbUser.email;
      token.picture = dbUser.image;
      token.role = dbUser.role;
      token.active = dbUser.active;
      token.team = dbUser.team || "free";
      token.apiKey = dbUser.apiKey;
      token.emailVerified = dbUser.emailVerified;
      token.trustLevel = dbUser.trustLevel || 0;

      return token;
    },
  },
  ...authConfig,
  // debug: process.env.NODE_ENV !== "production"
});
