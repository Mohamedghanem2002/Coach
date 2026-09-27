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
        const user = await client
          .db(process.env.MONGODB_DB)
          .collection("users")
          .findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
          return null;
        }
        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          academyName: user.academyName || "Re_action DOJO",
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
      }
      if (trigger === "update" && session) {
        if (session.name) token.name = session.name;
        if (session.user?.name) token.name = session.user.name;
        if (session.academyName) token.academyName = session.academyName;
        if (session.user?.academyName) token.academyName = session.user.academyName;
        if (session.email) token.email = session.email;
        if (session.user?.email) token.email = session.user.email;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
        session.user.academyName = token.academyName || "Re_action DOJO";
      }
      return session;
    },
    authorized({ auth: session, request }) {
      if (session) return true;
      if (request.nextUrl.pathname.startsWith("/auth/signin")) return true;
      if (request.nextUrl.pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "يجب تسجيل الدخول أولًا" },
          { status: 401 },
        );
      }
      return false;
    },
  },
});
