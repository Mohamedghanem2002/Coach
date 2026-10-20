"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { normalizePlayer } from "../lib/dashboard-utils";
import { DASHBOARD_CACHE_KEY } from "../lib/sync-utils";

export function useDashboardData({ setNotice } = {}) {
  const router = useRouter();
  const { data: session, status: sessionStatus, update: updateSession } = useSession();

  const adminEmail = (process.env.NEXT_PUBLIC_ADMIN_EMAIL || "mg0447837@gmail.com").trim().toLowerCase();
  const isUserAdmin = useMemo(() => {
    return (
      session?.user?.role === "admin" ||
      (session?.user?.email && session.user.email.trim().toLowerCase() === adminEmail)
    );
  }, [session, adminEmail]);

  const [localCoachName, setLocalCoachName] = useState(null);
  const [localAcademyName, setLocalAcademyName] = useState(null);
  const captainName = localCoachName || session?.user?.name || "كابتن";
  const academyName = localAcademyName || session?.user?.academyName || "CoachMaster";

  const [players, setPlayers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [subscriptionInactive, setSubscriptionInactive] = useState(null);
  const [accountUser, setAccountUser] = useState(null);
  const [hasUnreadPlanUpdate, setHasUnreadPlanUpdate] = useState(false);
  const [hasUnreadGuide, setHasUnreadGuide] = useState(false);

  // Check if platform guide has been read
  useEffect(() => {
    try {
      const guideRead = localStorage.getItem("coachmaster_features_guide_read_v1");
      if (!guideRead) {
        const timer = setTimeout(() => setHasUnreadGuide(true), 0);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, []);

  // Lightweight captain heartbeat tracking (50s interval within 120s timeout)
  useEffect(() => {
    if (sessionStatus !== "authenticated" || isUserAdmin) return;

    const pingHeartbeat = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      fetch("/api/account/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      }).catch(() => {});
    };

    // Immediate initial ping
    pingHeartbeat();

    // Regular heartbeat interval (every 50s keeps status active within 120s window)
    const intervalId = setInterval(pingHeartbeat, 50000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        pingHeartbeat();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [sessionStatus, isUserAdmin]);

  // Check if admin updated the captain's plan or subscription
  useEffect(() => {
    if (!accountUser) return;
    try {
      const currentSubFingerprint = `${accountUser.subscriptionPlan}_${accountUser.subscriptionExpiresAt}_${accountUser.subscriptionStatus}_${accountUser.subscriptionPaidAmount}_${accountUser.subscriptionRemainingAmount}_${accountUser.subscriptionTotalAmount}_${accountUser.subscriptionPaymentStatus}_${accountUser.updatedAt}`;
      const lastSeenFingerprint = localStorage.getItem("coachmaster_last_seen_sub_fingerprint");
      if (lastSeenFingerprint) {
        if (lastSeenFingerprint !== currentSubFingerprint) {
          const timer = setTimeout(() => setHasUnreadPlanUpdate(true), 0);
          return () => clearTimeout(timer);
        }
      } else {
        localStorage.setItem("coachmaster_last_seen_sub_fingerprint", currentSubFingerprint);
      }
    } catch (_) {}
  }, [accountUser]);

  // Persist to local cache whenever data updates
  useEffect(() => {
    if (players.length === 0 && branches.length === 0 && events.length === 0) return;
    try {
      localStorage.setItem(
        DASHBOARD_CACHE_KEY,
        JSON.stringify({
          players,
          branches,
          events,
          savedAt: Date.now(),
        })
      );
    } catch (err) {
      console.warn("Failed persisting dashboard cache:", err);
    }
  }, [players, branches, events]);

  // Network bootstrap data loader
  useEffect(() => {
    if (sessionStatus === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    if (sessionStatus === "authenticated" && isUserAdmin) {
      router.replace("/admin");
      return;
    }
    let cancelled = false;

    // Defer non-critical background backup check
    const backupTimer = setTimeout(() => {
      fetch("/api/backup/email").catch(() => {});
    }, 10000);

    async function loadData() {
      // 1. Instant 0ms local cache hydration
      try {
        const raw = localStorage.getItem(DASHBOARD_CACHE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === "object") {
            const cachedP = Array.isArray(parsed.players)
              ? parsed.players.map((p) => normalizePlayer(p))
              : [];
            const cachedB = Array.isArray(parsed.branches) ? parsed.branches : [];
            const cachedE = Array.isArray(parsed.events) ? parsed.events : [];
            if ((cachedP.length > 0 || cachedB.length > 0) && !cancelled) {
              setPlayers(cachedP);
              setBranches(cachedB);
              setEvents(cachedE);
              setLoading(false);
            }
          }
        }
      } catch (err) {
        console.warn("Cached dashboard read warning:", err);
      }

      // 2. Network bootstrap fetch
      try {
        const bootstrapRes = await fetch("/api/dashboard/bootstrap", { cache: "no-store" });
        if (bootstrapRes.status === 401) {
          router.push("/auth/signin");
          return;
        }
        if (bootstrapRes.status === 403) {
          const errData = await bootstrapRes.json().catch(() => ({}));
          if (errData?.isAdmin || errData?.redirectTo) {
            router.replace(errData.redirectTo || "/admin");
            return;
          }
          if (
            (errData.code === "SUBSCRIPTION_INACTIVE" ||
              errData.code === "ACCOUNT_SUSPENDED" ||
              errData.error === "SUBSCRIPTION_INACTIVE" ||
              errData.error === "ACCOUNT_SUSPENDED") &&
            !cancelled
          ) {
            setSubscriptionInactive(errData);
            setLoading(false);
            return;
          }
        }

        if (bootstrapRes.ok) {
          const data = await bootstrapRes.json();
          if (!cancelled && data?.success) {
            setPlayers(Array.isArray(data.players) ? data.players.map((p) => normalizePlayer(p)) : []);
            setBranches(Array.isArray(data.branches) ? data.branches : []);
            setEvents(Array.isArray(data.events) ? data.events : []);
            if (data.user) {
              if (data.user.name) setLocalCoachName(data.user.name);
              if (data.user.academyName) setLocalAcademyName(data.user.academyName);
              setAccountUser(data.user);
            }
            setLoading(false);
            return;
          }
        }

        // Fallback to individual endpoints if bootstrap endpoint is unavailable
        const [playersResponse, branchesResponse, eventsResponse] = await Promise.all([
          fetch("/api/players", { cache: "no-store" }),
          fetch("/api/branches", { cache: "no-store" }),
          fetch("/api/events", { cache: "no-store" }),
        ]);

        if (playersResponse.status === 401 || branchesResponse.status === 401) {
          router.push("/auth/signin");
          return;
        }

        if (playersResponse.status === 403 || branchesResponse.status === 403 || eventsResponse.status === 403) {
          const pErr = await playersResponse.json().catch(() => ({}));
          const bErr = await branchesResponse.json().catch(() => ({}));
          const eErr = await eventsResponse.json().catch(() => ({}));
          const inactive =
            (pErr.code === "SUBSCRIPTION_INACTIVE" || pErr.code === "ACCOUNT_SUSPENDED" || pErr.error === "SUBSCRIPTION_INACTIVE" || pErr.error === "ACCOUNT_SUSPENDED")
              ? pErr
              : (bErr.code === "SUBSCRIPTION_INACTIVE" || bErr.code === "ACCOUNT_SUSPENDED" || bErr.error === "SUBSCRIPTION_INACTIVE" || bErr.error === "ACCOUNT_SUSPENDED")
              ? bErr
              : (eErr.code === "SUBSCRIPTION_INACTIVE" || eErr.code === "ACCOUNT_SUSPENDED" || eErr.error === "SUBSCRIPTION_INACTIVE" || eErr.error === "ACCOUNT_SUSPENDED")
              ? eErr
              : null;
          if (inactive && !cancelled) {
            setSubscriptionInactive(inactive);
            setLoading(false);
            return;
          }
        }

        if (playersResponse.ok && branchesResponse.ok) {
          const [playersData, branchesData, eventsData] = await Promise.all([
            playersResponse.json(),
            branchesResponse.json(),
            eventsResponse.ok ? eventsResponse.json() : [],
          ]);
          if (!cancelled) {
            setPlayers(Array.isArray(playersData) ? playersData.map((p) => normalizePlayer(p)) : []);
            setBranches(Array.isArray(branchesData) ? branchesData : []);
            setEvents(Array.isArray(eventsData) ? eventsData : []);
          }
        }
      } catch (err) {
        console.error("Data loading error:", err);
        if (!cancelled && typeof setNotice === "function") {
          setNotice("تعذر تحميل البيانات. تأكد من اتصال MongoDB.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();

    return () => {
      cancelled = true;
      clearTimeout(backupTimer);
    };
  }, [router, sessionStatus, isUserAdmin, setNotice]);

  // Silent Real-time Revalidation Function
  const revalidateDashboard = useCallback(async ({ silent = true } = {}) => {
    if (sessionStatus !== "authenticated" || isUserAdmin) return;
    try {
      const bootstrapRes = await fetch("/api/dashboard/bootstrap", { cache: "no-store" });
      if (bootstrapRes.status === 401) {
        router.push("/auth/signin");
        return;
      }
      if (bootstrapRes.status === 403) {
        const errData = await bootstrapRes.json().catch(() => ({}));
        if (errData?.isAdmin || errData?.redirectTo) {
          router.replace(errData.redirectTo || "/admin");
          return;
        }
        if (
          errData.code === "SUBSCRIPTION_INACTIVE" ||
          errData.code === "ACCOUNT_SUSPENDED" ||
          errData.error === "SUBSCRIPTION_INACTIVE" ||
          errData.error === "ACCOUNT_SUSPENDED"
        ) {
          setSubscriptionInactive(errData);
          setLoading(false);
          return;
        }
      }
      if (bootstrapRes.ok) {
        // If previously inactive, clear inactive state immediately
        setSubscriptionInactive(null);
        const data = await bootstrapRes.json();
        if (data?.success) {
          if (Array.isArray(data.players)) {
            setPlayers(data.players.map((p) => normalizePlayer(p)));
          }
          if (Array.isArray(data.branches)) {
            setBranches(data.branches);
          }
          if (Array.isArray(data.events)) {
            setEvents(data.events);
          }
          if (data.user) {
            if (data.user.name) setLocalCoachName(data.user.name);
            if (data.user.academyName) setLocalAcademyName(data.user.academyName);
            setAccountUser(data.user);
          }
          try {
            localStorage.setItem(
              DASHBOARD_CACHE_KEY,
              JSON.stringify({
                players: data.players,
                branches: data.branches,
                events: data.events,
                timestamp: Date.now(),
              })
            );
          } catch (_) {}
        }
      }
    } catch (err) {
      if (!silent) console.warn("Background revalidation warning:", err);
    }
  }, [router, sessionStatus, isUserAdmin]);

  // Reload all data from server
  const reloadAllData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/bootstrap", { cache: "no-store" });
      if (res.status === 403) {
        const errData = await res.json().catch(() => ({}));
        if (
          errData.code === "SUBSCRIPTION_INACTIVE" ||
          errData.code === "ACCOUNT_SUSPENDED" ||
          errData.error === "SUBSCRIPTION_INACTIVE" ||
          errData.error === "ACCOUNT_SUSPENDED"
        ) {
          setSubscriptionInactive(errData);
          setLoading(false);
          return;
        }
      }
      if (res.ok) {
        setSubscriptionInactive(null);
        const data = await res.json();
        if (data?.success) {
          setPlayers(Array.isArray(data.players) ? data.players.map((p) => normalizePlayer(p)) : []);
          setBranches(Array.isArray(data.branches) ? data.branches : []);
          setEvents(Array.isArray(data.events) ? data.events : []);
          if (data.user) {
            if (data.user.name) setLocalCoachName(data.user.name);
            if (data.user.academyName) setLocalAcademyName(data.user.academyName);
            setAccountUser(data.user);
          }
          return;
        }
      }
      const [pRes, bRes, eRes] = await Promise.all([
        fetch("/api/players", { cache: "no-store" }),
        fetch("/api/branches", { cache: "no-store" }),
        fetch("/api/events", { cache: "no-store" }),
      ]);
      if (pRes.status === 403 || bRes.status === 403 || eRes.status === 403) {
        const pErr = await pRes.json().catch(() => ({}));
        const bErr = await bRes.json().catch(() => ({}));
        const eErr = await eRes.json().catch(() => ({}));
        const inactive =
          (pErr.code === "SUBSCRIPTION_INACTIVE" || pErr.code === "ACCOUNT_SUSPENDED") ? pErr
          : (bErr.code === "SUBSCRIPTION_INACTIVE" || bErr.code === "ACCOUNT_SUSPENDED") ? bErr
          : (eErr.code === "SUBSCRIPTION_INACTIVE" || eErr.code === "ACCOUNT_SUSPENDED") ? eErr
          : null;
        if (inactive) {
          setSubscriptionInactive(inactive);
          setLoading(false);
          return;
        }
      }
      if (pRes.ok && bRes.ok) {
        setSubscriptionInactive(null);
        const [pData, bData, eData] = await Promise.all([
          pRes.json(),
          bRes.json(),
          eRes.ok ? eRes.json() : [],
        ]);
        setPlayers(Array.isArray(pData) ? pData.map((p) => normalizePlayer(p)) : []);
        setBranches(Array.isArray(bData) ? bData : []);
        setEvents(Array.isArray(eData) ? eData : []);
      }
    } catch (err) {
      console.error("Error reloading all data:", err);
    }
  }, []);

  // Real-Time Live Sync & Auto-Revalidation Hooks
  useEffect(() => {
    if (sessionStatus !== "authenticated") return;

    const handleFocus = () => {
      revalidateDashboard({ silent: true });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        revalidateDashboard({ silent: true });
      }
    };

    // Fast polling (every 3.5s) to detect status changes across devices
    const pollInterval = setInterval(() => {
      revalidateDashboard({ silent: true });
    }, 3500);

    let channel = null;
    let adminBc = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("coachmaster_sync");
        channel.onmessage = (event) => {
          const payload = event.data;
          if (!payload) return;
          if (payload.type === "PLAYER_UPDATED" && payload.player) {
            const safe = normalizePlayer(payload.player);
            setPlayers((current) =>
              current.map((p) => (p._id === safe._id ? safe : p))
            );
          } else if (payload.type === "PLAYER_ADDED" && payload.player) {
            const safe = normalizePlayer(payload.player);
            setPlayers((current) => {
              if (current.some((p) => p._id === safe._id)) return current;
              return [safe, ...current];
            });
          } else if (payload.type === "PLAYER_DELETED" && payload.id) {
            setPlayers((current) => current.filter((p) => p._id !== payload.id));
          } else if (payload.type === "BULK_PLAYERS_DELETED" && Array.isArray(payload.ids)) {
            setPlayers((current) => current.filter((p) => !payload.ids.includes(p._id)));
          } else if (payload.type === "BRANCHES_UPDATED" && Array.isArray(payload.branches)) {
            setBranches(payload.branches);
          }
          revalidateDashboard({ silent: true });
        };

        // Instant admin sync listener for 0ms cross-tab reaction
        adminBc = new BroadcastChannel("coachmaster_admin_sync");
        adminBc.onmessage = (event) => {
          const type = event.data?.type;
          if (
            type === "ACADEMY_SUSPENDED" ||
            type === "ACADEMY_REACTIVATED" ||
            type === "SUBSCRIPTION_EXTENDED" ||
            type === "PAYMENT_TOGGLED"
          ) {
            revalidateDashboard({ silent: false });
          }
        };
      }
    } catch (_) {}

    const handleStorage = (e) => {
      if (e.key === "coachmaster_sync_event") {
        revalidateDashboard({ silent: true });
      }
    };

    const handleCustomRefresh = () => {
      revalidateDashboard({ silent: true });
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("coachmaster_refresh_data", handleCustomRefresh);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("coachmaster_refresh_data", handleCustomRefresh);
      clearInterval(pollInterval);
      if (channel) {
        channel.close();
      }
      if (adminBc) {
        adminBc.close();
      }
    };
  }, [sessionStatus, revalidateDashboard]);

  return {
    router,
    session,
    sessionStatus,
    updateSession,
    isUserAdmin,
    captainName,
    academyName,
    players,
    setPlayers,
    branches,
    setBranches,
    events,
    setEvents,
    loading,
    setLoading,
    subscriptionInactive,
    setSubscriptionInactive,
    accountUser,
    setAccountUser,
    setLocalCoachName,
    setLocalAcademyName,
    hasUnreadPlanUpdate,
    setHasUnreadPlanUpdate,
    hasUnreadGuide,
    setHasUnreadGuide,
    revalidateDashboard,
    reloadAllData,
  };
}
