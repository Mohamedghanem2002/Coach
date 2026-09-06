import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import clientPromise from "./mongodb";
export const { handlers, auth } = NextAuth({
  trustHost: true,
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
        return { id: user._id.toString(), name: user.name, email: user.email };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user === null || user === void 0 ? void 0 : user.id)
        token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (session.user && token.sub) session.user.id = token.sub;
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
