import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ZodError } from "zod";
import { credentialsSchema } from "@/modules/auth/auth.types";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import type { Role } from "@/generated/prisma/enums";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string | null | undefined;
      firstName: string;
      lastName: string;
      email: string;
      image: string | null | undefined;
      role: Role;
      isAdmin: boolean;
    };
  }
  interface User {
    id?: string;
    name?: string | null;
    firstName?: string;
    lastName?: string;
    email?: string | null;
    image?: string | null;
    role?: Role;
    isAdmin?: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      id: "credentials",
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          const { email, password } =
            await credentialsSchema.parseAsync(credentials);

          const user = await db.user.findUnique({
            where: { email },
            include: { admin_profile: true },
          });

          if (!user || !user.password_hash) {
            throw new Error("Invalid email or password");
          }

          const isValid = await verifyPassword(password, user.password_hash);

          if (!isValid) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user.id,
            name: `${user.first_name} ${user.last_name}`,
            firstName: user.first_name,
            lastName: user.last_name,
            email: user.email,
            image: user.image,
            role: user.role,
            isAdmin: !!user.admin_profile,
          };
        } catch (error) {
          if (error instanceof ZodError) {
            throw new Error("Invalid input format");
          }
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firstName = user.firstName;
        token.lastName = user.lastName;
        token.isAdmin = user.isAdmin ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as Role;
      session.user.firstName = token.firstName as string;
      session.user.lastName = token.lastName as string;
      session.user.isAdmin = token.isAdmin as boolean;
      return session;
    },
  },
  pages: {
    signIn: "/gate",
  },
});
