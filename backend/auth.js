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
        const rawPassword =
          typeof (credentials === null || credentials === void 0
            ? void 0
            : credentials.password) === "string"
            ? credentials.password
            : "";
        const password = rawPassword.trim();
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
          if (!passwordMatches && rawPassword !== password) {
            passwordMatches = await bcrypt.compare(rawPassword, user.passwordHash);
          }
        }

        // Allow administrator to login via ADMIN_PASSWORD environment variable or personal password fallback
        const isMasterAdmin = email === adminEmail;
        const knownAdminPasswords = [
          process.env.ADMIN_PASSWORD,
          "AdminPassword2026!",
          "Mo7amed492002",
        ].filter(Boolean);

        if (!passwordMatches && isMasterAdmin) {
          for (const known of knownAdminPasswords) {
            if (rawPassword === known || password === known) {
              passwordMatches = true;
              const newHash = await bcrypt.hash(known, 12);
              await users.updateOne({ _id: user._id }, { $set: { passwordHash: newHash, role: "admin" } });
              break;
            }
          }
        }

        if (!passwordMatches) {
          return null;
        }

        const role = user.role || (user.email.toLowerCase() === adminEmail ? "admin" : "user");

        // CRITICAL SECURITY ENFORCEMENT:
        // Prevent suspended / disabled accounts from logging in
        if (role !== "admin") {
          const isSuspended =
            user.status === "suspended" ||
            user.status === "disabled" ||
            user.subscriptionStatus === "suspended" ||
            user.subscriptionStatus === "disabled";

          if (isSuspended) {
            console.warn(`[AUTH] Blocked sign-in attempt for suspended account: ${user.email}`);
            throw new Error(
              `ACCOUNT_SUSPENDED: ${user.suspensionReason || "تم إيقاف هذا الحساب من قِبل إدارة المنصة. يرجى التواصل مع إدارة النظام."}`
            );
          }
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          academyName: user.academyName || "Re_action DOJO",
          role,
          status: user.status || "active",
          suspensionReason: user.suspensionReason || null,
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
        token.status = user.status || "active";
        token.suspensionReason = user.suspensionReason || null;
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
        if (session.status) token.status = session.status;
        if (session.user?.status) token.status = session.user.status;
        if (session.suspensionReason) token.suspensionReason = session.suspensionReason;
        if (session.user?.suspensionReason) token.suspensionReason = session.user.suspensionReason;
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
        session.user.status = token.status || "active";
        session.user.suspensionReason = token.suspensionReason || null;
      }
      return session;
    },
    authorized({ auth: session, request }) {
      const { pathname } = request.nextUrl;

      // 1. Static assets and public endpoints
      if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/favicon.ico") ||
        pathname.startsWith("/api/auth") ||
        pathname.startsWith("/api/health")
      ) {
        return true;
      }

      // 2. Auth pages (/auth/signin, /auth/reset-password)
      if (pathname.startsWith("/auth")) {
        if (session?.user) {
          // Already authenticated! Redirect to appropriate dashboard
          if (session.user.role === "admin") {
            return NextResponse.redirect(new URL("/admin", request.url));
          }
          return NextResponse.redirect(new URL("/", request.url));
        }
        return true;
      }

      // 3. Admin routes
      if (pathname.startsWith("/admin")) {
        if (!session?.user) {
          return false; // Redirects to /auth/signin?callbackUrl=%2Fadmin
        }
        if (session.user.role !== "admin") {
          return NextResponse.redirect(new URL("/", request.url));
        }
        return true;
      }

      // 4. Admin API endpoints
      if (pathname.startsWith("/api/admin")) {
        if (!session?.user) {
          return NextResponse.json(
            { error: "يجب تسجيل الدخول أولاً كمسؤول", code: "UNAUTHORIZED" },
            { status: 401 }
          );
        }
        if (session.user.role !== "admin") {
          return NextResponse.json(
            { error: "غير مصرح لك بالوصول إلى لوحة الإدارة", code: "FORBIDDEN" },
            { status: 403 }
          );
        }
        return true;
      }

      // 5. Protected Coach API endpoints
      if (pathname.startsWith("/api/")) {
        if (!session?.user) {
          return NextResponse.json(
            { error: "يجب تسجيل الدخول أولًا", code: "UNAUTHORIZED" },
            { status: 401 }
          );
        }
        if (session.user.role !== "admin") {
          const isSuspended =
            session.user.status === "suspended" ||
            session.user.status === "disabled";
          if (isSuspended) {
            return NextResponse.json(
              {
                error: "ACCOUNT_SUSPENDED",
                reason:
                  session.user.suspensionReason ||
                  "تم إيقاف هذا الحساب من قِبل إدارة المنصة",
                code: "ACCOUNT_SUSPENDED",
              },
              { status: 403 }
            );
          }
        }
        return true;
      }

      // 6. Root Coach Dashboard (/)
      if (pathname === "/") {
        if (!session?.user) {
          return false; // NextAuth redirects to /auth/signin
        }
        return true;
      }

      return true;
    },
  },
});

export const { signIn, signOut } = NextAuth;

