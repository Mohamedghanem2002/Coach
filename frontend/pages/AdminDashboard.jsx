"use client";
import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminOverviewTab from "../components/admin/AdminOverviewTab";
import AdminAcademiesTab from "../components/admin/AdminAcademiesTab";
import AdminAuditLogsTab from "../components/admin/AdminAuditLogsTab";
import AcademyDetailsModal from "../components/admin/AcademyDetailsModal";
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

  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "academies" | "audit"
  const [overviewData, setOverviewData] = useState(null);
  const [academiesData, setAcademiesData] = useState({ academies: [], pagination: {} });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [academiesLoading, setAcademiesLoading] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [toast, setToast] = useState(null);

  // Modals state
  const [inspectAcademyId, setInspectAcademyId] = useState(null);
  const [suspendTargetAcademy, setSuspendTargetAcademy] = useState(null);
  const [extendTargetAcademy, setExtendTargetAcademy] = useState(null);
  const [reactivateTargetAcademy, setReactivateTargetAcademy] = useState(null);
  const [deleteTargetAcademy, setDeleteTargetAcademy] = useState(null);

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

  // 2. Fetch Academies Data (with Search, Status Filter & Pagination)
  useEffect(() => {
    let ignore = false;
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: "15",
      search,
      status: statusFilter,
    });

    fetch(`/api/admin/academies?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (!ignore && data?.success) {
          setAcademiesData({
            academies: data.academies || [],
            pagination: data.pagination || {},
          });
        }
      })
      .catch((err) => {
        console.error("Academies fetch error:", err);
      })
      .finally(() => {
        if (!ignore) setAcademiesLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [currentPage, search, statusFilter]);

  const refreshAcademies = useCallback(() => {
    setAcademiesLoading(true);
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: "15",
      search,
      status: statusFilter,
    });

    fetch(`/api/admin/academies?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.success) {
          setAcademiesData({
            academies: data.academies || [],
            pagination: data.pagination || {},
          });
        }
      })
      .catch((err) => {
        console.error("Academies refresh error:", err);
      })
      .finally(() => {
        setAcademiesLoading(false);
      });
  }, [currentPage, search, statusFilter]);

  // Reset page when search or status changes
  const handleSearchChange = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };

  const handleStatusFilterChange = (val) => {
    setStatusFilter(val);
    setCurrentPage(1);
  };

  // 3. Admin Action: Suspend Academy
  const handleSuspendConfirm = async (reason) => {
    if (!suspendTargetAcademy) return;
    setActionBusy(true);
    try {
      const res = await fetch(`/api/admin/academies/${suspendTargetAcademy.id || suspendTargetAcademy._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suspend", reason }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "فشل التعليق");

      showToast(result.message || "تم تعليق خدمة الأكاديمية بنجاح");
      setSuspendTargetAcademy(null);
      loadOverview();
      refreshAcademies();
      // If details modal was open for this academy, reload it
      if (inspectAcademyId === suspendTargetAcademy.id) {
        setInspectAcademyId(null);
        setTimeout(() => setInspectAcademyId(suspendTargetAcademy.id), 50);
      }
    } catch (err) {
      showToast(err.message || "تعذر تعليق الأكاديمية", "error");
    } finally {
      setActionBusy(false);
    }
  };

  // 4. Admin Action: Reactivate Academy
  const handleReactivateConfirm = async () => {
    if (!reactivateTargetAcademy) return;
    setActionBusy(true);
    try {
      const res = await fetch(`/api/admin/academies/${reactivateTargetAcademy.id || reactivateTargetAcademy._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "activate" }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "فشل التفعيل");

      showToast(result.message || "تمت إعادة تفعيل الأكاديمية بنجاح");
      setReactivateTargetAcademy(null);
      loadOverview();
      refreshAcademies();
      if (inspectAcademyId === reactivateTargetAcademy.id) {
        setInspectAcademyId(null);
        setTimeout(() => setInspectAcademyId(reactivateTargetAcademy.id), 50);
      }
    } catch (err) {
      showToast(err.message || "تعذر إعادة تفعيل الأكاديمية", "error");
    } finally {
      setActionBusy(false);
    }
  };

  // 5. Admin Action: Extend Subscription
  const handleExtendConfirm = async ({ days, customDate }) => {
    if (!extendTargetAcademy) return;
    setActionBusy(true);
    try {
      const res = await fetch(`/api/admin/academies/${extendTargetAcademy.id || extendTargetAcademy._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "extend_subscription",
          days,
          customDate,
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "فشل التمديد");

      showToast(result.message || "تم تمديد اشتراك الأكاديمية بنجاح");
      setExtendTargetAcademy(null);
      loadOverview();
      refreshAcademies();
      if (inspectAcademyId === extendTargetAcademy.id) {
        setInspectAcademyId(null);
        setTimeout(() => setInspectAcademyId(extendTargetAcademy.id), 50);
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
      const res = await fetch(`/api/admin/academies/${academy.id || academy._id}`, {
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
      refreshAcademies();
      if (inspectAcademyId === (academy.id || academy._id)) {
        setInspectAcademyId(null);
        setTimeout(() => setInspectAcademyId(academy.id || academy._id), 50);
      }
    } catch (err) {
      showToast(err.message || "تعذر تحديث السداد", "error");
    }
  };

  // 7. Admin Action: Permanently Delete Academy (Cascade Delete)
  const handleDeleteConfirm = async () => {
    if (!deleteTargetAcademy) return;
    setActionBusy(true);
    try {
      const res = await fetch(`/api/admin/academies/${deleteTargetAcademy.id || deleteTargetAcademy._id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "فشل حذف الأكاديمية");

      showToast(result.message || "تم حذف الأكاديمية وجميع بياناتها نهائياً");
      setDeleteTargetAcademy(null);
      if (inspectAcademyId === (deleteTargetAcademy.id || deleteTargetAcademy._id)) {
        setInspectAcademyId(null);
      }
      loadOverview();
      refreshAcademies();
    } catch (err) {
      showToast(err.message || "تعذر حذف الأكاديمية", "error");
    } finally {
      setActionBusy(false);
    }
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-500" dir="rtl">
        <div className="w-10 h-10 border-3 border-red-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-sm font-black text-slate-800">جارٍ التحقق وفتح لوحة الإدارة...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#f8fafc] text-slate-900 selection:bg-red-500 selection:text-white" dir="rtl">
      {/* Sidebar Navigation */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        adminUser={session?.user}
        academiesCount={overviewData?.stats?.totalAcademies || 0}
      />

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
        <div className="max-w-7xl mx-auto">
          {activeTab === "overview" && (
            <AdminOverviewTab
              stats={overviewData?.stats}
              recentAcademies={overviewData?.recentAcademies || []}
              recentAuditLogs={overviewData?.recentAuditLogs || []}
              onSelectAcademy={(id) => setInspectAcademyId(id)}
              onNavigateToAcademies={() => setActiveTab("academies")}
            />
          )}

          {activeTab === "academies" && (
            <AdminAcademiesTab
              academies={academiesData.academies}
              pagination={academiesData.pagination}
              search={search}
              onSearchChange={handleSearchChange}
              statusFilter={statusFilter}
              onStatusFilterChange={handleStatusFilterChange}
              onPageChange={(p) => setCurrentPage(p)}
              onSelectAcademy={(id) => setInspectAcademyId(id)}
              onOpenSuspend={(ac) => setSuspendTargetAcademy(ac)}
              onOpenExtend={(ac) => setExtendTargetAcademy(ac)}
              onOpenReactivate={(ac) => setReactivateTargetAcademy(ac)}
              onOpenDelete={(ac) => setDeleteTargetAcademy(ac)}
              onTogglePayment={handleTogglePayment}
              loading={academiesLoading}
              onRefresh={() => {
                loadOverview();
                refreshAcademies();
              }}
            />
          )}

          {activeTab === "audit" && <AdminAuditLogsTab />}
        </div>
      </main>

      {/* Academy Full Details Modal */}
      <AcademyDetailsModal
        academyId={inspectAcademyId}
        isOpen={Boolean(inspectAcademyId)}
        onClose={() => setInspectAcademyId(null)}
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
