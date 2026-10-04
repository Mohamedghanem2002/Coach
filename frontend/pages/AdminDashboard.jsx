"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building2,
  Trophy,
  History,
  Sparkles,
  RefreshCw,
  LogOut,
  CheckCircle2,
  AlertCircle,
  X,
  LayoutGrid,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  CreditCard,
} from "lucide-react";
import CoachMasterLogo from "../components/dashboard/CoachMasterLogo";
import AdminOverviewTab from "../components/admin/AdminOverviewTab";
import AdminCaptainsTab from "../components/admin/AdminCaptainsTab";
import AdminHallsTab from "../components/admin/AdminHallsTab";
import AdminEventsTab from "../components/admin/AdminEventsTab";
import AdminAuditLogsTab from "../components/admin/AdminAuditLogsTab";
import AdminPromoTab from "../components/admin/AdminPromoTab";
import CaptainDetailsModal from "../components/admin/CaptainDetailsModal";
import {
  SuspendModal,
  ExtendSubscriptionModal,
  ReactivateModal,
  DeleteAcademyModal,
} from "../components/admin/AcademyActionModals";

export default function AdminDashboard() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined") {
      const urlTab = new URLSearchParams(window.location.search).get("tab");
      if (urlTab) return urlTab;
    }
    return "overview";
  });

  const [overviewData, setOverviewData] = useState(null);
  const [captainsData, setCaptainsData] = useState({
    captains: [],
    summary: { totalCaptains: 0, totalPlayers: 0, totalHalls: 0, totalEvents: 0 },
    pagination: {},
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [captainsLoading, setCaptainsLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState(null);

  // Real-time synchronization state
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState(() => new Date());
  const [showMoreMobile, setShowMoreMobile] = useState(false);

  // Modals state
  const [inspectCaptainId, setInspectCaptainId] = useState(null);
  const [modalRefreshTrigger, setModalRefreshTrigger] = useState(0);
  const [suspendTargetAcademy, setSuspendTargetAcademy] = useState(null);
  const [extendTargetAcademy, setExtendTargetAcademy] = useState(null);
  const [reactivateTargetAcademy, setReactivateTargetAcademy] = useState(null);
  const [deleteTargetAcademy, setDeleteTargetAcademy] = useState(null);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setShowMoreMobile(false);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Auth Guard
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (sessionStatus === "unauthenticated") {
      router.push("/auth/signin?admin=true");
      return;
    }
    if (session?.user && session.user.role !== "admin") {
      router.push("/");
    }
  }, [sessionStatus, session, router]);

  // Broadcast channel helper for multi-tab zero-refresh sync
  const broadcastAdminChange = (payload) => {
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        const bc = new BroadcastChannel("coachmaster_admin_sync");
        bc.postMessage(payload);
        bc.close();
      }
    } catch (e) {
      console.warn("BroadcastChannel error:", e);
    }
  };

  // 1. Silent Background Refresh (No Full-Screen Spinner)
  const silentRefresh = useCallback(async () => {
    setIsSyncing(true);
    try {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "15",
        search,
        status: statusFilter,
        dateFilter,
        sortBy,
      });

      const [resOverview, resCaptains] = await Promise.all([
        fetch("/api/admin/overview"),
        fetch(`/api/admin/captains?${params.toString()}`),
      ]);

      if (resOverview.ok) {
        const oData = await resOverview.json();
        if (oData?.success) {
          setOverviewData(oData);
        }
      }

      if (resCaptains.ok) {
        const cData = await resCaptains.json();
        if (cData?.success) {
          setCaptainsData({
            captains: cData.captains || [],
            summary: cData.summary || { totalCaptains: 0, totalPlayers: 0, totalHalls: 0, totalEvents: 0 },
            pagination: cData.pagination || {},
          });
        }
      }
      setLastSynced(new Date());
    } catch (err) {
      console.error("Silent refresh error:", err);
    } finally {
      setIsSyncing(false);
    }
  }, [currentPage, search, statusFilter, dateFilter, sortBy]);

  // 2. Initial Fetch Overview Data
  const loadOverview = useCallback(() => {
    fetch("/api/admin/overview")
      .then((res) => {
        if (res.status === 401 || res.status === 403) {
          router.push("/");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.success) {
          setOverviewData(data);
          setLastSynced(new Date());
        }
      })
      .catch((err) => {
        console.error("Overview fetch error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  // 3. Fetch Captains Data with Search, Filters, Sorting & Pagination
  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      setCaptainsLoading(true);
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: "15",
        search,
        status: statusFilter,
        dateFilter,
        sortBy,
      });

      fetch(`/api/admin/captains?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (!ignore && data?.success) {
            setCaptainsData({
              captains: data.captains || [],
              summary: data.summary || { totalCaptains: 0, totalPlayers: 0, totalHalls: 0, totalEvents: 0 },
              pagination: data.pagination || {},
            });
            setLastSynced(new Date());
          }
        })
        .catch((err) => {
          console.error("Captains fetch error:", err);
        })
        .finally(() => {
          if (!ignore) setCaptainsLoading(false);
        });
    }, 250);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [currentPage, search, statusFilter, dateFilter, sortBy]);

  const refreshCaptains = useCallback(() => {
    setCaptainsLoading(true);
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: "15",
      search,
      status: statusFilter,
      dateFilter,
      sortBy,
    });

    fetch(`/api/admin/captains?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setCaptainsData({
            captains: data.captains || [],
            summary: data.summary || { totalCaptains: 0, totalPlayers: 0, totalHalls: 0, totalEvents: 0 },
            pagination: data.pagination || {},
          });
          setLastSynced(new Date());
        }
      })
      .catch((err) => {
        console.error("Captains refresh error:", err);
      })
      .finally(() => {
        setCaptainsLoading(false);
      });
  }, [currentPage, search, statusFilter, dateFilter, sortBy]);

  // 4. Real-time Multi-Tab Sync & Auto-polling (No Refresh Needed)
  useEffect(() => {
    let adminChannel;
    let coachChannel;

    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        adminChannel = new BroadcastChannel("coachmaster_admin_sync");
        coachChannel = new BroadcastChannel("coachmaster-sync");

        adminChannel.onmessage = () => {
          silentRefresh();
        };

        coachChannel.onmessage = () => {
          silentRefresh();
        };
      }
    } catch (e) {
      console.warn("BroadcastChannel registration:", e);
    }

    // Auto-polling every 12 seconds in background
    const interval = setInterval(() => {
      silentRefresh();
    }, 12000);

    // Auto-refresh on window focus
    const handleFocus = () => {
      silentRefresh();
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      if (adminChannel) adminChannel.close();
      if (coachChannel) coachChannel.close();
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
    };
  }, [silentRefresh]);

  const handleManualSync = () => {
    silentRefresh();
    showToast("جاري المزامنة الفورية مع قاعدة البيانات...");
  };

  const handleSearchChange = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  // ━━━ 5. Zero-Refresh Instant Optimistic Mutations ━━━

  // A. Suspend Academy / Captain (0ms Optimistic Update)
  const handleSuspendConfirm = async (reason) => {
    if (!suspendTargetAcademy) return;
    const academyId = suspendTargetAcademy.id || suspendTargetAcademy._id;

    // 0ms Optimistic UI update
    setCaptainsData((prev) => ({
      ...prev,
      captains: prev.captains.map((c) =>
        (c.id === academyId || c._id === academyId)
          ? { ...c, subscriptionStatus: "suspended", status: "suspended", suspensionReason: reason }
          : c
      ),
    }));

    setOverviewData((prev) => prev ? {
      ...prev,
      stats: {
        ...prev.stats,
        activeAccounts: Math.max(0, (prev.stats?.activeAccounts || 1) - 1),
      },
    } : prev);

    setSuspendTargetAcademy(null);
    showToast("تم تعليق حساب الكابتن بنجاح ⛔");
    broadcastAdminChange({ type: "ACADEMY_SUSPENDED", academyId });

    setActionBusy(true);
    try {
      const res = await fetch(`/api/admin/captains/${academyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspend", reason }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "فشل التعليق");
      if (inspectCaptainId) setModalRefreshTrigger((k) => k + 1);
      silentRefresh();
    } catch (err) {
      showToast(err.message || "تعذر تعليق حساب الكابتن", "error");
      silentRefresh();
    } finally {
      setActionBusy(false);
    }
  };

  // B. Reactivate Academy / Captain (0ms Optimistic Update)
  const handleReactivateConfirm = async () => {
    if (!reactivateTargetAcademy) return;
    const academyId = reactivateTargetAcademy.id || reactivateTargetAcademy._id;

    // 0ms Optimistic UI update
    setCaptainsData((prev) => ({
      ...prev,
      captains: prev.captains.map((c) =>
        (c.id === academyId || c._id === academyId)
          ? { ...c, subscriptionStatus: "active", status: "active", suspensionReason: null }
          : c
      ),
    }));

    setOverviewData((prev) => prev ? {
      ...prev,
      stats: {
        ...prev.stats,
        activeAccounts: (prev.stats?.activeAccounts || 0) + 1,
      },
    } : prev);

    setReactivateTargetAcademy(null);
    showToast("تمت إعادة تفعيل حساب الكابتن بنجاح 🟢");
    broadcastAdminChange({ type: "ACADEMY_REACTIVATED", academyId });

    setActionBusy(true);
    try {
      const res = await fetch(`/api/admin/captains/${academyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "فشل التفعيل");
      if (inspectCaptainId) setModalRefreshTrigger((k) => k + 1);
      silentRefresh();
    } catch (err) {
      showToast(err.message || "تعذر إعادة تفعيل الحساب", "error");
      silentRefresh();
    } finally {
      setActionBusy(false);
    }
  };

  // C. Extend / Set Subscription (0ms Optimistic Update)
  const handleExtendConfirm = async ({ days, months, mode, calculationBase, customDate }) => {
    if (!extendTargetAcademy) return;
    const academyId = extendTargetAcademy.id || extendTargetAcademy._id;

    const addedDays = (days || 0) + ((months || 0) * 30);
    const newDaysRemaining = mode === "lifetime" ? 9999 : ((extendTargetAcademy.daysRemaining || 0) + addedDays);

    // 0ms Optimistic UI update
    setCaptainsData((prev) => ({
      ...prev,
      captains: prev.captains.map((c) =>
        (c.id === academyId || c._id === academyId)
          ? {
              ...c,
              subscriptionStatus: "active",
              status: "active",
              subscriptionPlan: mode === "lifetime" ? "lifetime" : c.subscriptionPlan,
              daysRemaining: newDaysRemaining,
            }
          : c
      ),
    }));

    setExtendTargetAcademy(null);
    showToast("تم تحديث وتمديد اشتراك الكابتن فوراً ✨");
    broadcastAdminChange({ type: "SUBSCRIPTION_EXTENDED", academyId });

    setActionBusy(true);
    try {
      const res = await fetch(`/api/admin/captains/${academyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extend_subscription",
          mode,
          calculationBase,
          months,
          days,
          customDate,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "فشل تحديث الاشتراك");
      if (inspectCaptainId) setModalRefreshTrigger((k) => k + 1);
      silentRefresh();
    } catch (err) {
      showToast(err.message || "تعذر تمديد الاشتراك", "error");
      silentRefresh();
    } finally {
      setActionBusy(false);
    }
  };

  // D. Toggle Payment Status (0ms Optimistic Update)
  const handleTogglePayment = async (academy) => {
    const academyId = academy.id || academy._id;
    const nextPaid = !academy.subscriptionPaid;

    // 0ms Optimistic UI update
    setCaptainsData((prev) => ({
      ...prev,
      captains: prev.captains.map((c) =>
        (c.id === academyId || c._id === academyId)
          ? {
              ...c,
              subscriptionPaid: nextPaid,
              subscriptionRemainingAmount: nextPaid ? 0 : (c.subscriptionTotalAmount || 0),
            }
          : c
      ),
    }));

    showToast(nextPaid ? "تم تسجيل سداد اشتراك الكابتن بنجاح ✓" : "تم إلغاء سداد الاشتراك");
    broadcastAdminChange({ type: "PAYMENT_TOGGLED", academyId, nextPaid });

    try {
      const res = await fetch(`/api/admin/captains/${academyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_payment_status",
          paid: nextPaid,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "فشل تحديث السداد");
      if (inspectCaptainId) setModalRefreshTrigger((k) => k + 1);
      silentRefresh();
    } catch (err) {
      showToast(err.message || "تعذر تحديث السداد", "error");
      silentRefresh();
    }
  };

  // E. Permanently Delete Captain / Academy (0ms Optimistic Update)
  const handleDeleteConfirm = async () => {
    if (!deleteTargetAcademy) return;
    const academyId = deleteTargetAcademy.id || deleteTargetAcademy._id;

    // 0ms Optimistic UI update
    setCaptainsData((prev) => ({
      ...prev,
      captains: prev.captains.filter((c) => c.id !== academyId && c._id !== academyId),
      summary: {
        ...prev.summary,
        totalCaptains: Math.max(0, (prev.summary?.totalCaptains || 1) - 1),
        totalAccounts: Math.max(0, (prev.summary?.totalAccounts || 1) - 1),
      },
    }));

    setOverviewData((prev) => prev ? {
      ...prev,
      stats: {
        ...prev.stats,
        totalAccounts: Math.max(0, (prev.stats?.totalAccounts || 1) - 1),
        totalAcademies: Math.max(0, (prev.stats?.totalAcademies || 1) - 1),
      },
    } : prev);

    setDeleteTargetAcademy(null);
    if (inspectCaptainId === academyId) {
      setInspectCaptainId(null);
    }

    showToast("تم حذف الحساب وجميع بياناته فوراً");
    broadcastAdminChange({ type: "ACADEMY_DELETED", academyId });

    setActionBusy(true);
    try {
      const res = await fetch(`/api/admin/captains/${academyId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "فشل حذف الحساب");
      silentRefresh();
    } catch (err) {
      showToast(err.message || "تعذر حذف الحساب", "error");
      silentRefresh();
    } finally {
      setActionBusy(false);
    }
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500" dir="rtl">
        <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-black text-slate-800">جارٍ التحقق وفتح لوحة الإدارة المركزية...</h2>
        <p className="text-xs text-slate-400 mt-1 font-bold">يتم جلب الإحصائيات الحية لحظياً</p>
      </div>
    );
  }

  if (sessionStatus === "unauthenticated" || (session?.user && session.user.role !== "admin")) {
    return null;
  }

  const totalDisplayAccounts =
    overviewData?.stats?.totalAccounts ??
    overviewData?.stats?.totalAcademies ??
    captainsData?.summary?.totalAccounts ??
    captainsData?.summary?.totalCaptains ??
    0;

  const totalDisplayHalls =
    overviewData?.stats?.totalHalls ??
    overviewData?.stats?.totalBranches ??
    captainsData?.summary?.totalHalls ??
    0;

  const totalDisplayEvents =
    overviewData?.stats?.totalEvents ??
    captainsData?.summary?.totalEvents ??
    0;

  const navTabs = [
    {
      id: "overview",
      label: "الإحصائيات العامة",
      icon: LayoutDashboard,
      badge: null,
      iconColor: "text-red-600",
    },
    {
      id: "accounts",
      label: "الكباتن والأكاديميات",
      icon: Users,
      badge: totalDisplayAccounts ? String(totalDisplayAccounts) : null,
      aliases: ["captains", "academies"],
      iconColor: "text-blue-600",
    },
    {
      id: "halls",
      label: "الصالات والملاعب",
      icon: Building2,
      badge: totalDisplayHalls ? String(totalDisplayHalls) : null,
      iconColor: "text-emerald-600",
    },
    {
      id: "events",
      label: "الفعاليات والبطولات",
      icon: Trophy,
      badge: totalDisplayEvents ? String(totalDisplayEvents) : null,
      iconColor: "text-amber-600",
    },
    {
      id: "audit",
      label: "سجل العمليات",
      icon: History,
      badge: null,
      iconColor: "text-slate-600",
    },
    {
      id: "promo",
      label: "الكارت الترويجي",
      icon: Sparkles,
      badge: "NEW",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900 selection:bg-red-500 selection:text-white" dir="rtl">
      
      {/* ═════════════════════════════════════════════════════════════════
          1. EXECUTIVE TOP HEADER (Sticky inside Container Width)
      ═════════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-2xs">
        <div className="container mx-auto max-w-[1480px] 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          
          {/* Right: Brand + Platform Title + Live Sync Status */}
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <CoachMasterLogo size="default" />
              <span className="absolute -bottom-1 -left-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-amber-500 text-white text-[9px] font-black ring-2 ring-white shadow-xs">
                👑
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  تحكم المنصة المركزية
                </h1>
                <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-black text-amber-800 border border-amber-200">
                  ADMIN
                </span>
                {/* Live Sync Beacon */}
                <div
                  className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200/80"
                  title="المزامنة الحية تعمل تلقائياً بدون الحاجة لعمل ريفرش"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>محدث لحظياً</span>
                  <span className="text-[10px] text-emerald-600/80 font-mono font-normal">
                    {lastSynced.toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 truncate">
                منظومة CoachMaster لإدارة الأكاديميات والصالات والاشتراكات
              </p>
            </div>
          </div>

          {/* Center: Live Overview Metrics Pills on Desktop */}
          <div className="hidden xl:flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>{totalDisplayAccounts} كابتن</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700">
              <span className="text-xs">🥋</span>
              <span>{overviewData?.stats?.totalPlayers ?? 0} بطل</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>{totalDisplayHalls} صالة</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs font-bold text-slate-700">
              <Trophy className="w-3.5 h-3.5 text-amber-600" />
              <span>{totalDisplayEvents} بطولة</span>
            </div>
          </div>

          {/* Left: Instant Refresh + Admin Profile + Logout */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Manual Sync Button */}
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
              title="تحديث البيانات فوراً من السيرفر"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? "animate-spin text-red-600" : "text-slate-500"}`} />
              <span className="hidden md:inline">مزامنة فورية</span>
            </button>

            {/* Admin User Profile */}
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-slate-100 bg-slate-50/80">
              <div className="w-7 h-7 rounded-lg bg-slate-800 text-white font-black text-xs flex items-center justify-center shadow-xs">
                {(session?.user?.name || "A").charAt(0)}
              </div>
              <div className="text-right">
                <span className="block text-xs font-black text-slate-800 leading-tight">
                  {session?.user?.name || "المدير العام"}
                </span>
                <span className="block text-[10px] font-mono text-slate-400 truncate max-w-[130px]" dir="ltr">
                  {session?.user?.email || "mg0447837@gmail.com"}
                </span>
              </div>
            </div>

            {/* Logout Button */}
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/auth/signin?admin=true" })}
              className="flex items-center gap-1 px-3 py-2 rounded-xl border border-red-100 bg-red-50/60 hover:bg-red-100 text-red-600 text-xs font-black transition cursor-pointer"
              title="تسجيل الخروج من لوحة الإدارة"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* ═════════════════════════════════════════════════════════════════
          2. MAIN WORKSPACE CONTAINER (Contained, Comfortable on Desktop)
      ═════════════════════════════════════════════════════════════════ */}
      <main className="container mx-auto max-w-[1480px] 2xl:max-w-[1600px] px-3 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 flex-1 pb-28 lg:pb-12">
        
        {/* Executive Workspace Tabs Ribbon (Framed inside Container) */}
        <div className="p-1.5 rounded-2xl sm:rounded-3xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-1.5 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max flex-1">
            {navTabs.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id || (item.aliases && item.aliases.includes(activeTab));
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex items-center gap-2 px-3.5 sm:px-4.5 py-2.5 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? "bg-red-600 text-white shadow-xs shadow-red-600/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? "text-white" : item.iconColor || "text-slate-500"}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-700 border border-slate-200"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Section (Contained & Spacious) */}
        <div className="w-full">
          {activeTab === "overview" && (
            <AdminOverviewTab
              stats={overviewData?.stats}
              analytics={overviewData?.analytics}
              recentAccounts={overviewData?.recentAccounts || overviewData?.recentAcademies || []}
              recentAuditLogs={overviewData?.recentAuditLogs || []}
              onSelectAccount={(id) => setInspectCaptainId(id)}
              onNavigateToTab={handleTabChange}
            />
          )}

          {(activeTab === "accounts" || activeTab === "captains" || activeTab === "academies") && (
            <AdminCaptainsTab
              captains={captainsData.captains}
              summary={captainsData.summary}
              pagination={captainsData.pagination}
              search={search}
              onSearchChange={handleSearchChange}
              statusFilter={statusFilter}
              onStatusFilterChange={handleStatusFilterChange}
              dateFilter={dateFilter}
              onDateFilterChange={(df) => {
                setDateFilter(df);
                setCurrentPage(1);
              }}
              sortBy={sortBy}
              onSortByChange={(sb) => {
                setSortBy(sb);
                setCurrentPage(1);
              }}
              onPageChange={(p) => setCurrentPage(p)}
              onSelectCaptain={(id) => setInspectCaptainId(id)}
              onOpenSuspend={(ac) => setSuspendTargetAcademy(ac)}
              onOpenExtend={(ac) => setExtendTargetAcademy(ac)}
              onOpenReactivate={(ac) => setReactivateTargetAcademy(ac)}
              onOpenDelete={(ac) => setDeleteTargetAcademy(ac)}
              onTogglePayment={handleTogglePayment}
              loading={captainsLoading}
              onRefresh={silentRefresh}
            />
          )}

          {activeTab === "halls" && (
            <AdminHallsTab onSelectCaptain={(id) => setInspectCaptainId(id)} />
          )}

          {activeTab === "events" && (
            <AdminEventsTab onSelectCaptain={(id) => setInspectCaptainId(id)} />
          )}

          {activeTab === "audit" && <AdminAuditLogsTab />}

          {activeTab === "promo" && (
            <AdminPromoTab captains={captainsData.captains || []} />
          )}
        </div>
      </main>

      {/* ═════════════════════════════════════════════════════════════════
          3. NATIVE MOBILE APP NAVIGATION DOCK (< 1024px)
      ═════════════════════════════════════════════════════════════════ */}
      <nav
        className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 flex items-center justify-around h-16 px-2 shadow-lg"
        dir="rtl"
      >
        <button
          type="button"
          onClick={() => handleTabChange("accounts")}
          className={`flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-xl transition cursor-pointer touch-manipulation ${
            activeTab === "accounts" || activeTab === "captains" ? "text-red-600 font-black" : "text-slate-500 font-bold"
          }`}
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px]">الكباتن</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("overview")}
          className={`flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-xl transition cursor-pointer touch-manipulation ${
            activeTab === "overview" ? "text-red-600 font-black" : "text-slate-500 font-bold"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px]">الإحصائيات</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange("promo")}
          className={`flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-xl transition cursor-pointer touch-manipulation ${
            activeTab === "promo" ? "text-red-600 font-black" : "text-slate-500 font-bold"
          }`}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-[10px]">الترويج</span>
        </button>

        <button
          type="button"
          onClick={() => setShowMoreMobile(!showMoreMobile)}
          className={`flex-1 flex flex-col items-center justify-center gap-1 h-full rounded-xl transition cursor-pointer touch-manipulation ${
            showMoreMobile ? "text-red-600 font-black" : "text-slate-500 font-bold"
          }`}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className="text-[10px]">المزيد</span>
        </button>
      </nav>

      {/* Native Slide-up Drawer for "المزيد" on mobile */}
      {showMoreMobile && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 backdrop-blur-xs pb-16"
          onClick={() => setShowMoreMobile(false)}
          dir="rtl"
        >
          <div
            className="w-full bg-white rounded-t-3xl border-t border-slate-200 p-5 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 rounded-full bg-slate-300 mx-auto mb-2" />

            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">الأقسام والخدمات الإدارية</h3>
              <button
                type="button"
                onClick={() => setShowMoreMobile(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => handleTabChange("halls")}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-right transition cursor-pointer ${
                  activeTab === "halls" ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                <Building2 className="w-4 h-4 text-emerald-600" />
                <span>الصالات والملاعب</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("events")}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-right transition cursor-pointer ${
                  activeTab === "events" ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                <Trophy className="w-4 h-4 text-amber-600" />
                <span>الفعاليات والبطولات</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("audit")}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-right transition cursor-pointer ${
                  activeTab === "audit" ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                <History className="w-4 h-4 text-slate-600" />
                <span>سجل العمليات</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabChange("promo")}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-right transition cursor-pointer ${
                  activeTab === "promo" ? "bg-red-50 border-red-200 text-red-700" : "bg-slate-50 border-slate-200 text-slate-800"
                }`}
              >
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>الكارت الترويجي ✨</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════
          4. DIALOGS & ACTION MODALS
      ═════════════════════════════════════════════════════════════════ */}
      
      {/* Captain Full Details Modal */}
      <CaptainDetailsModal
        captainId={inspectCaptainId}
        isOpen={Boolean(inspectCaptainId)}
        onClose={() => setInspectCaptainId(null)}
        refreshTrigger={modalRefreshTrigger}
        onOpenSuspend={(ac) => setSuspendTargetAcademy(ac)}
        onOpenExtend={(ac) => setExtendTargetAcademy(ac)}
        onOpenReactivate={(ac) => setReactivateTargetAcademy(ac)}
        onOpenDelete={(ac) => setDeleteTargetAcademy(ac)}
        onTogglePayment={handleTogglePayment}
      />

      {/* Action Dialogs */}
      <SuspendModal
        isOpen={Boolean(suspendTargetAcademy)}
        onClose={() => setSuspendTargetAcademy(null)}
        onConfirm={handleSuspendConfirm}
        academy={suspendTargetAcademy}
        isBusy={actionBusy}
      />

      <ExtendSubscriptionModal
        isOpen={Boolean(extendTargetAcademy)}
        onClose={() => setExtendTargetAcademy(null)}
        onConfirm={handleExtendConfirm}
        academy={extendTargetAcademy}
        isBusy={actionBusy}
      />

      <ReactivateModal
        isOpen={Boolean(reactivateTargetAcademy)}
        onClose={() => setReactivateTargetAcademy(null)}
        onConfirm={handleReactivateConfirm}
        academy={reactivateTargetAcademy}
        isBusy={actionBusy}
      />

      <DeleteAcademyModal
        isOpen={Boolean(deleteTargetAcademy)}
        onClose={() => setDeleteTargetAcademy(null)}
        onConfirm={handleDeleteConfirm}
        academy={deleteTargetAcademy}
        isBusy={actionBusy}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-20 lg:bottom-6 left-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border animate-slide-up text-xs font-black ${
            toast.type === "error"
              ? "bg-red-600 text-white border-red-700 shadow-red-950/20"
              : "bg-slate-900 text-white border-slate-800 shadow-slate-950/20"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
