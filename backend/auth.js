import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import clientPromise from "./mongodb";
export const { handlers, auth } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET || "karate-coach-super-secret-jwt-key-2026-auth-fallback",
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "email-password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email =
          typeof (credentials === null || credentials === void 0
            ? void 0
            : credentials.email) === "string"
            ? credentials.email.trim().toLowerCase()
            : "";
        const password =
          typeof (credentials === null || credentials === void 0
            ? void 0
            : credentials.password) === "string"
            ? credentials.password
            : "";
        if (!email || !password) return null;
        const client = await clientPromise;
        const users = client
          .db(process.env.MONGODB_DB)
          .collection("users");
        let user = await users.findOne({ email });

        const adminEmail = (process.env.ADMIN_EMAIL || "mg0447837@gmail.com").toLowerCase().trim();

        // Seed initial admin if it doesn't exist and ADMIN_PASSWORD is set
        if (!user && email === adminEmail && process.env.ADMIN_PASSWORD) {
          const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
          const initialAdmin = {
            name: "المدير العام",
            email: adminEmail,
            passwordHash,
            role: "admin",
            academyName: "لوحة التحكم الرئيسية",
            status: "active",
            subscriptionStatus: "active",
            subscriptionPlan: "system_admin",
            subscriptionPaid: true,
            createdAt: new Date(),
          };
          const res = await users.insertOne(initialAdmin);
          user = { ...initialAdmin, _id: res.insertedId };
        }

        if (!user) return null;

        let passwordMatches = false;
        if (user.passwordHash) {
          passwordMatches = await bcrypt.compare(password, user.passwordHash);
        }

        // Allow administrator to login via ADMIN_PASSWORD environment variable and sync hash
        if (!passwordMatches && email === adminEmail && process.env.ADMIN_PASSWORD && password === process.env.ADMIN_PASSWORD) {
          passwordMatches = true;
          const newHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
          await users.updateOne({ _id: user._id }, { $set: { passwordHash: newHash, role: "admin" } });
        }

        if (!passwordMatches) {
          return null;
        }

        const role = user.role || (user.email.toLowerCase() === adminEmail ? "admin" : "user");

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          academyName: user.academyName || "Re_action DOJO",
          role,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.sub = user.id;
        token.name = user.name;
        token.email = user.email;
        token.academyName = user.academyName || "Re_action DOJO";
        token.role = user.role || "user";
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.user?.name) token.name = session.user.name;
        if (session.academyName) token.academyName = session.academyName;
        if (session.user?.academyName) token.academyName = session.user.academyName;
        if (session.email) token.email = session.email;
        if (session.user?.email) token.email = session.user.email;
        if (session.role) token.role = session.role;
        if (session.user?.role) token.role = session.user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
        session.user.academyName = token.academyName || "Re_action DOJO";
        session.user.role = token.role || "user";
      }
      return session;
    },
    authorized({ auth: session, request }) {
      const pathname = request.nextUrl.pathname;
      if (pathname.startsWith("/admin")) {
        if (!session?.user) return false;
        if (session.user.role !== "admin") return false;
        return true;
      }
      if (session) return true;
      if (pathname.startsWith("/auth")) return true;
      if (pathname.startsWith("/api/auth")) return true;
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "يجب تسجيل الدخول أولًا" },
          { status: 401 },
        );
      }
      return false;
    },
  },
});
