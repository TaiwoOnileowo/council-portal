import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { ZodError } from "zod";
import { signInSchema } from "@/modules/auth/auth.types";
import { vendorSignInSchema } from "@/modules/vendor/vendor.types";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/password";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string | null | undefined;
      email: string;
      image: string | null | undefined;
      role: string;
      isVendor?: boolean;
    };
  }
  interface User {
    id?: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
    isVendor?: boolean;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    // Student credentials provider
    Credentials({
      id: "credentials",
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          const { email, password } = await signInSchema.parseAsync(credentials);

          const user = await db.user.findUnique({ where: { email } });

          if (!user || !user.passwordHash) {
            throw new Error("Invalid email or password");
          }

          const isValid = await verifyPassword(password, user.passwordHash);

          if (!isValid) {
            throw new Error("Invalid email or password");
          }

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
            isVendor: false,
          };
        } catch (error) {
          if (error instanceof ZodError) {
            throw new Error("Invalid input format");
          }
          throw error;
        }
      },
    }),

    // Vendor credentials provider
    Credentials({
      id: "vendor",
      credentials: {
        email: {},
        password: {},
      },
      authorize: async (credentials) => {
        try {
          const { email, password } = await vendorSignInSchema.parseAsync(credentials);

          const vendor = await db.vendor.findUnique({ where: { email } });

          if (!vendor) {
            throw new Error("Invalid email or password");
          }

          const isValid = await verifyPassword(password, vendor.passwordHash);

          if (!isValid) {
            throw new Error("Invalid email or password");
          }

          return {
            id: vendor.id,
            name: `${vendor.firstName} ${vendor.lastName}`,
            email: vendor.email,
            image: vendor.image,
            role: "VENDOR",
            isVendor: true,
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
        token.isVendor = user.isVendor ?? false;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      session.user.isVendor = token.isVendor as boolean;
      return session;
    },
  },
  pages: {
    signIn: "/gate",
  },
});
