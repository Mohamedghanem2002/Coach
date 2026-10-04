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

        // Allow administrator to login via ADMIN_PASSWORD environment variable fallback
        const isMasterAdmin = email === adminEmail;
        if (!passwordMatches && isMasterAdmin && process.env.ADMIN_PASSWORD) {
          if (rawPassword === process.env.ADMIN_PASSWORD || password === process.env.ADMIN_PASSWORD) {
            passwordMatches = true;
            const newHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, 12);
            await users.updateOne({ _id: user._id }, { $set: { passwordHash: newHash, role: "admin" } });
          }
        }

        if (!passwordMatches) {
          return null;
        }

        const role = user.role || (user.email.toLowerCase() === adminEmail ? "admin" : "user");

        // CRITICAL SECURITY ENFORCEMENT:
        // Prevent suspended / disabled / expired accounts from logging in
        if (role !== "admin") {
          const now = new Date();
          const isExpired =
            user.subscriptionExpiresAt &&
            new Date(user.subscriptionExpiresAt).getTime() < now.getTime();

          const isSuspended =
            user.status === "suspended" ||
            user.status === "disabled" ||
            user.subscriptionStatus === "suspended" ||
            user.subscriptionStatus === "disabled" ||
            isExpired;

          if (isSuspended) {
            console.warn(`[AUTH] Blocked sign-in attempt for suspended/expired account: ${user.email}`);

            if (isExpired && user.status !== "suspended") {
              users
                .updateOne(
                  { _id: user._id },
                  {
                    $set: {
                      status: "suspended",
                      subscriptionStatus: "expired",
                      suspensionReason:
                        "انتهت فترة صلاحية الاشتراك في النظام. يرجى سداد أو تجديد الاشتراك لاستئناف الخدمة ومواصلة الاستخدام.",
                      updatedAt: now,
                    },
                  }
                )
                .catch(() => {});
            }

            const suspensionMsg = isExpired
              ? "انتهت فترة صلاحية الاشتراك في النظام. يرجى سداد أو تجديد الاشتراك لاستئناف الخدمة ومواصلة الاستخدام."
              : (user.suspensionReason || "تم إيقاف هذا الحساب من قِبل إدارة المنصة. يرجى التواصل مع إدارة النظام.");

            throw new Error(`ACCOUNT_SUSPENDED: ${suspensionMsg}`);
          }
        }

        return {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          academyName: user.academyName || "CoachMaster",
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
        token.phone = user.phone || "";
        token.academyName = user.academyName || "CoachMaster";
        token.role = user.role || "user";
        token.status = user.status || "active";
        token.suspensionReason = user.suspensionReason || null;
      }
      // SECURITY: Only allow updating safe client-editable profile fields.
      // NEVER allow client to mutate role, status, or subscription state.
      if (trigger === "update" && session) {
        if (typeof session.name === "string" && session.name.trim()) token.name = session.name.trim();
        if (typeof session.user?.name === "string" && session.user.name.trim()) token.name = session.user.name.trim();
        if (typeof session.academyName === "string" && session.academyName.trim()) token.academyName = session.academyName.trim();
        if (typeof session.user?.academyName === "string" && session.user.academyName.trim()) token.academyName = session.user.academyName.trim();
        if (typeof session.phone === "string") token.phone = session.phone.trim();
        if (typeof session.user?.phone === "string") token.phone = session.user.phone.trim();
        if (typeof session.email === "string" && session.email.trim()) token.email = session.email.trim().toLowerCase();
        if (typeof session.user?.email === "string" && session.user.email.trim()) token.email = session.user.email.trim().toLowerCase();
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        if (token.sub) session.user.id = token.sub;
        if (token.name) session.user.name = token.name;
        if (token.email) session.user.email = token.email;
        session.user.phone = token.phone || "";
        session.user.academyName = token.academyName || "CoachMaster";
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
        if (session.user.role === "admin") {
          const coachEndpoints = [
            "/api/dashboard",
            "/api/players",
            "/api/branches",
            "/api/events",
            "/api/backup",
          ];
          if (coachEndpoints.some((ep) => pathname === ep || pathname.startsWith(ep + "/"))) {
            return NextResponse.json(
              {
                error: "حساب الإدارة مخصص للوحة تحكم المنصة فقط",
                isAdmin: true,
                code: "ADMIN_ACCOUNT_ISOLATED",
              },
              { status: 403 }
            );
          }
          return true;
        }

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
        return true;
      }

      // 6. Root Coach Dashboard (/)
      if (pathname === "/") {
        if (!session?.user) {
          return false; // NextAuth redirects to /auth/signin
        }
        if (session.user.role === "admin") {
          return NextResponse.redirect(new URL("/admin", request.url));
        }
        return true;
      }

      return true;
    },
  },
});

export const { signIn, signOut } = NextAuth;

