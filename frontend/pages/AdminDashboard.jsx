"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../components/admin/AdminSidebar";
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
import { CheckCircle2, AlertCircle, X } from "lucide-react";

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

  // Modals state
  const [inspectCaptainId, setInspectCaptainId] = useState(null);
  const [modalRefreshTrigger, setModalRefreshTrigger] = useState(0);
  const [suspendTargetAcademy, setSuspendTargetAcademy] = useState(null);
  const [extendTargetAcademy, setExtendTargetAcademy] = useState(null);
  const [reactivateTargetAcademy, setReactivateTargetAcademy] = useState(null);
  const [deleteTargetAcademy, setDeleteTargetAcademy] = useState(null);

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
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
      // Normal academy user attempted to access /admin! Redirect immediately
      router.push("/");
    }
  }, [sessionStatus, session, router]);

  // 1. Fetch Overview Data
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

  // 2. Fetch Captains Data (with Search, Status Filter, Date Filter, Sorting & Pagination)
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
        }
      })
      .catch((err) => {
        console.error("Captains refresh error:", err);
      })
      .finally(() => {
        setCaptainsLoading(false);
      });
  }, [currentPage, search, statusFilter, dateFilter, sortBy]);

  // Reset page when search or filters change
  const handleSearchChange = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  // 3. Admin Action: Suspend Academy / Captain
  const handleSuspendConfirm = async (reason) => {
    if (!suspendTargetAcademy) return;
    setActionBusy(true);
    try {
      const res = await fetch(`/api/admin/captains/${suspendTargetAcademy.id || suspendTargetAcademy._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspend", reason }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "فشل التعليق");

      showToast(result.message || "تم تعليق حساب الكابتن بنجاح");
      setSuspendTargetAcademy(null);
      loadOverview();
      refreshCaptains();
      if (inspectCaptainId) {
        setModalRefreshTrigger((k) => k + 1);
      }
    } catch (err) {
      showToast(err.message || "تعذر تعليق حساب الكابتن", "error");
    } finally {
      setActionBusy(false);
    }
  };

  // 4. Admin Action: Reactivate Academy / Captain
  const handleReactivateConfirm = async () => {
    if (!reactivateTargetAcademy) return;
    setActionBusy(true);
    try {
      const res = await fetch(`/api/admin/captains/${reactivateTargetAcademy.id || reactivateTargetAcademy._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "فشل التفعيل");

      showToast(result.message || "تمت إعادة تفعيل حساب الكابتن بنجاح");
      setReactivateTargetAcademy(null);
      loadOverview();
      refreshCaptains();
      if (inspectCaptainId) {
        setModalRefreshTrigger((k) => k + 1);
      }
    } catch (err) {
      showToast(err.message || "تعذر إعادة تفعيل الحساب", "error");
    } finally {
      setActionBusy(false);
    }
  };

  // 5. Admin Action: Extend / Set Subscription
  const handleExtendConfirm = async ({ days, months, mode, calculationBase, customDate }) => {
    if (!extendTargetAcademy) return;
    setActionBusy(true);
    try {
      const res = await fetch(`/api/admin/captains/${extendTargetAcademy.id || extendTargetAcademy._id}`, {
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

      showToast(result.message || "تم تحديث اشتراك الكابتن بنجاح");
      setExtendTargetAcademy(null);
      loadOverview();
      refreshCaptains();
      if (inspectCaptainId) {
        setModalRefreshTrigger((k) => k + 1);
      }
    } catch (err) {
      showToast(err.message || "تعذر تمديد الاشتراك", "error");
    } finally {
      setActionBusy(false);
    }
  };

  // 6. Admin Action: Toggle Payment Status
  const handleTogglePayment = async (academy) => {
    const nextPaid = !academy.subscriptionPaid;
    try {
      const res = await fetch(`/api/admin/captains/${academy.id || academy._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "set_payment_status",
          paid: nextPaid,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "فشل تحديث السداد");

      showToast(result.message || "تم تحديث حالة السداد بنجاح");
      loadOverview();
      refreshCaptains();
      if (inspectCaptainId) {
        setModalRefreshTrigger((k) => k + 1);
      }
    } catch (err) {
      showToast(err.message || "تعذر تحديث السداد", "error");
    }
  };

  // 7. Admin Action: Permanently Delete Captain / Academy (Cascade Delete)
  const handleDeleteConfirm = async () => {
    if (!deleteTargetAcademy) return;
    setActionBusy(true);
    try {
      const res = await fetch(`/api/admin/captains/${deleteTargetAcademy.id || deleteTargetAcademy._id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "فشل حذف الحساب");

      showToast(result.message || "تم حذف الحساب وجميع بياناته نهائياً");
      setDeleteTargetAcademy(null);
      if (inspectCaptainId === (deleteTargetAcademy.id || deleteTargetAcademy._id)) {
        setInspectCaptainId(null);
      }
      loadOverview();
      refreshCaptains();
    } catch (err) {
      showToast(err.message || "تعذر حذف الحساب", "error");
    } finally {
      setActionBusy(false);
    }
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500" dir="rtl">
        <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-black text-slate-800">جارٍ التحقق وفتح لوحة الإدارة...</h2>
      </div>
    );
  }

  if (sessionStatus === "unauthenticated" || (session?.user && session.user.role !== "admin")) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc] text-slate-900 selection:bg-red-500 selection:text-white" dir="rtl">
      {/* Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={handleTabChange}
        adminUser={session?.user}
        accountsCount={overviewData?.stats?.totalAccounts ?? overviewData?.stats?.totalAcademies ?? captainsData?.summary?.totalAccounts ?? 0}
        playersCount={overviewData?.stats?.totalPlayers ?? 0}
        hallsCount={overviewData?.stats?.totalHalls ?? overviewData?.stats?.totalBranches ?? 0}
        eventsCount={overviewData?.stats?.totalEvents ?? 0}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-3 sm:p-6 lg:p-8 pb-28 lg:pb-8">
        <div className="max-w-7xl mx-auto">
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
              onRefresh={() => {
                loadOverview();
                refreshCaptains();
              }}
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
          dir="rtl"
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 text-red-200 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="p-1 rounded-full hover:bg-white/20 text-white/80"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
