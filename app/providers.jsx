"use client";
import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
import PwaInstallPrompt from "../frontend/components/PwaInstallPrompt";

function GlobalCaptainHeartbeat() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== "authenticated" || !session?.user) return;
    if (session.user.role === "admin") return;

    const ping = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      fetch("/api/account/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }).catch(() => {});
    };

    // Immediate ping on mount / auth
    ping();

    // Ping every 45 seconds (well within 120s timeout)
    const interval = setInterval(ping, 45 * 1000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") ping();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", ping);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", ping);
    };
  }, [status, session]);

  return null;
}

export default function Providers({ children }) {
  return (
    <SessionProvider>
      <GlobalCaptainHeartbeat />
      <PwaInstallPrompt />
      {children}
    </SessionProvider>
  );
}
