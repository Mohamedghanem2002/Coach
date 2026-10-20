"use client";
import { useState, useEffect, useRef } from "react";
import { Zap } from "lucide-react";

// Hooks
import { useToast } from "../hooks/useToast";
import { useDashboardData } from "../hooks/useDashboardData";
import { usePlayerFilters } from "../hooks/usePlayerFilters";
import { usePlayerOperations } from "../hooks/usePlayerOperations";
import { useBranchOperations } from "../hooks/useBranchOperations";
import { useEventOperations } from "../hooks/useEventOperations";
import { useBackupOperations } from "../hooks/useBackupOperations";

// Components
import Header from "../components/dashboard/Header";
import Footer from "../components/dashboard/Footer";
import MobileBottomNav from "../components/dashboard/MobileBottomNav";
import DashboardHero from "../components/dashboard/DashboardHero";
import PlayerRow from "../components/dashboard/PlayerRow";
import Pagination from "../components/dashboard/Pagination";
import StatsGrid from "../components/dashboard/StatsGrid";
import BranchOverview from "../components/dashboard/BranchOverview";
import BirthdayReminder from "../components/dashboard/BirthdayReminder";
import EventsView from "../components/dashboard/EventsView";
import SubscriptionSuspended from "../components/SubscriptionSuspended";

// Extracted Subcomponents
import DesktopWorkspaceTabs from "../components/dashboard/DesktopWorkspaceTabs";
import CommandBar from "../components/dashboard/CommandBar";
import MobileCommandSurface from "../components/dashboard/MobileCommandSurface";
import BulkActionDock from "../components/dashboard/BulkActionDock";
import DashboardModals from "../components/dashboard/DashboardModals";
import ToastNotification from "../components/dashboard/ToastNotification";
import SubscriptionExpiringBanner from "../components/dashboard/SubscriptionExpiringBanner";
import SubscriptionExpiringModal from "../components/dashboard/SubscriptionExpiringModal";

export default function Home() {
  // 1. Notifications & Toasts
  const { toast, setToast, showToast, setNotice } = useToast();

  // 2. Birthday Congratulated listener
  const [congratulatedTick, setCongratulatedTick] = useState(0);
  useEffect(() => {
    const handleCongratulated = () => setCongratulatedTick((t) => t + 1);
    window.addEventListener("birthday_congratulated", handleCongratulated);
    return () => window.removeEventListener("birthday_congratulated", handleCongratulated);
  }, []);

  // 2.5 Subscription Expiry Modal State
  const [showExpiryModal, setShowExpiryModal] = useState(false);

  // 3. Unified Dashboard Data & Real-Time Sync
  const {
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
    reloadAllData,
  } = useDashboardData({ setNotice });

  // 3.5 Auto-notify captain if subscription expires within 3 days
  useEffect(() => {
    if (!accountUser?.subscriptionExpiringAlert?.isExpiringSoon) return;
    try {
      const todayKey = new Date().toISOString().slice(0, 10);
      const storageKey = `coachmaster_expiry_notified_${todayKey}`;
      const alreadyNotified = sessionStorage.getItem(storageKey);
      if (!alreadyNotified) {
        sessionStorage.setItem(storageKey, "true");
        const timer = setTimeout(() => {
          setShowExpiryModal(true);
          const days = accountUser.subscriptionExpiringAlert.daysRemaining;
          const msg =
            days === 0
              ? "⚠️ تنبيه: اشتراكك ينتهي اليوم! يُرجى التجديد لضمان استمرار الخدمة."
              : `⚠️ تنبيه اشتراك الأكاديمية: متبقي ${days} ${days === 1 ? "يوم واحد" : days === 2 ? "يومان" : "أيام"} على انتهاء اشتراكك!`;
          showToast(msg, "warning");
        }, 100);
        return () => clearTimeout(timer);
      }
    } catch (_) {}
  }, [accountUser?.subscriptionExpiringAlert, showToast]);

  // 4. Player Filtering, Sorting, and Metrics
  const {
    today,
    currentMonth,
    branch,
    setBranch,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortBy,
    setSortBy,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sessionDate,
    setSessionDate,
    paymentMonth,
    setPaymentMonth,
    paymentMonthLabel,
    showMobileFilters,
    setShowMobileFilters,
    filteredPlayers,
    sortedFilteredPlayers,
    paginatedPlayers,
    totalPages,
    dashboardPlayers,
    paidCount,
    partialCount,
    unpaidCount,
    totalPendingPaymentCount,
    purchasesDebtCount,
    presentToday,
    absentToday,
    attendanceRateToday,
    todayBirthdaysCount,
    todayBirthdaysList,
  } = usePlayerFilters({ players, branches, congratulatedTick });

  // 5. Selected player & Mobile Tab & Navigation
  const [selected, setSelected] = useState(null);
  const [mobileTab, setMobileTab] = useState("players");
  const playerListRef = useRef(null);

  // 6. Player Operations (CRUD, Attendance, Payments, Bulk)
  const {
    showForm,
    setShowForm,
    welcomePlayer,
    setWelcomePlayer,
    selectedPlayerIds,
    setSelectedPlayerIds,
    bulkAttendanceBusy,
    updatePlayer,
    handleAddPlayer,
    deletePlayer,
    togglePlayerSelection,
    toggleFilteredSelection,
    markSelectedAttendance,
    markSelectedPayment,
    deleteSelectedPlayers,
  } = usePlayerOperations({
    setPlayers,
    setSelected,
    selected,
    branch,
    setBranch,
    setSearch,
    paymentMonth,
    today,
    setNotice,
    showToast,
  });

  // 7. Branch Operations
  const {
    showBranches,
    setShowBranches,
    quickBranchName,
    setQuickBranchName,
    isAddingBranch,
    setIsAddingBranch,
    busyBranch,
    branchAttendanceReport,
    setBranchAttendanceReport,
    addBranch,
    updateBranch,
    renameBranch,
    deleteBranch,
    handleSelectBranch,
    handleBlockedBranchDelete,
    handleQuickBranchSubmit,
    markBranchPresent,
  } = useBranchOperations({
    branches,
    setBranches,
    players,
    setPlayers,
    branch,
    setBranch,
    playerListRef,
    showToast,
    setNotice,
  });

  // 8. Event Operations
  const {
    activeView,
    setActiveView,
    showAddEventModal,
    setShowAddEventModal,
    editingEvent,
    setEditingEvent,
    addParticipantsEvent,
    setAddParticipantsEvent,
    paymentParticipantData,
    setPaymentParticipantData,
    eventActionBusy,
    handleSaveEvent,
    handleDeleteEvent,
    handleAddParticipants,
    handleSaveParticipantPayment,
    handleUpdateParticipantAttendance,
    handleRemoveParticipant,
    handleBulkParticipantPayment,
  } = useEventOperations({
    events,
    setEvents,
    showToast,
  });

  // 9. Backup & Snapshot Operations
  const {
    isBackingUp,
    isCloudBackingUp,
    isRestoring,
    restoreProgressModal,
    showEmailBackupModal,
    setShowEmailBackupModal,
    showRestoreModal,
    setShowRestoreModal,
    showExportExcelModal,
    setShowExportExcelModal,
    exportInitialTab,
    exportInitialEventId,
    restoreFileRef,
    handleOpenExportExcel,
    handleInstantCloudBackup,
    handleDownloadBackup,
    handleFileSelectedForRestore,
  } = useBackupOperations({
    players,
    reloadAllData,
    showToast,
  });

  // 10. Account Settings & System Features
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState(false);

  const handleOpenAccountSettings = () => {
    setShowAccountSettings(true);
    if (accountUser) {
      try {
        const currentSubFingerprint = `${accountUser.subscriptionPlan}_${accountUser.subscriptionExpiresAt}_${accountUser.subscriptionStatus}_${accountUser.subscriptionPaidAmount}_${accountUser.subscriptionRemainingAmount}_${accountUser.subscriptionTotalAmount}_${accountUser.subscriptionPaymentStatus}_${accountUser.updatedAt}`;
        localStorage.setItem("coachmaster_last_seen_sub_fingerprint", currentSubFingerprint);
      } catch (_) {}
    }
    setHasUnreadPlanUpdate(false);
  };

  const handleOpenFeatures = () => {
    setShowFeaturesModal(true);
    try {
      localStorage.setItem("coachmaster_features_guide_read_v1", "true");
    } catch (_) {}
    setHasUnreadGuide(false);
  };

  // Subscription Suspended Screen
  if (subscriptionInactive) {
    return (
      <SubscriptionSuspended
        reason={subscriptionInactive.reason}
        message={subscriptionInactive.message}
        academyName={subscriptionInactive.academyName || academyName}
        subscriptionExpiresAt={subscriptionInactive.subscriptionExpiresAt}
        adminEmail={subscriptionInactive.adminEmail}
        onRefresh={() => {
          setSubscriptionInactive(null);
          setLoading(true);
          window.location.reload();
        }}
      />
    );
  }

  // Cold Start Loading Screen
  if (sessionStatus === "loading" && loading && players.length === 0) {
    return (
      <div
        className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white"
        dir="rtl"
      >
        <div className="flex flex-col items-center gap-4 text-center max-w-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 shadow-xl shadow-red-600/30 ring-2 ring-red-400/30 animate-pulse">
            <Zap className="h-7 w-7 fill-white stroke-white" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-white">CoachMaster</h2>
            <div className="flex items-center justify-center gap-2 mt-2.5">
              <span className="h-4 w-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
              <p className="text-xs font-semibold text-slate-400">جاري تحميل لوحة التحكم...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sessionStatus === "unauthenticated") {
    return null;
  }

  // Admin Account Redirect Guard
  if (sessionStatus === "authenticated" && isUserAdmin) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center bg-slate-50 text-slate-800 p-6"
        dir="rtl"
      >
        <div className="w-12 h-12 border-3 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-base font-black text-slate-900">حساب إدارة المنصة 👑</h2>
        <p className="text-xs text-slate-500 font-bold mt-1">
          هذا الحساب مخصص لإدارة المنصة فقط، جاري تحويلك إلى لوحة التحكم...
        </p>
      </div>
    );
  }

  return (
    <main
      className="min-h-screen flex flex-col justify-between text-slate-900 selection:bg-red-500 selection:text-white w-full max-w-full overflow-x-hidden"
      dir="rtl"
    >
      {/* ━━━ Header ━━━ */}
      <Header
        academyName={academyName}
        players={players}
        onOpenPlayer={(player) => setSelected(player)}
        currentView={activeView}
        onToggleEventsView={() => {
          const next = activeView === "events" ? "players" : "events";
          setActiveView(next);
          setMobileTab(next === "events" ? "events" : "players");
        }}
        eventsCount={events.length}
        onNavigateToBirthdays={() => {
          setActiveView("birthdays");
          setMobileTab("birthdays");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenAccountSettings={handleOpenAccountSettings}
        onOpenFeatures={handleOpenFeatures}
        onInstantCloudBackup={handleInstantCloudBackup}
        onRestore={() => setShowRestoreModal(true)}
        onDownloadBackup={handleDownloadBackup}
        onOpenExportExcel={handleOpenExportExcel}
        isCloudBackingUp={isCloudBackingUp}
        isRestoring={isRestoring}
        isBackingUp={isBackingUp}
        hasUnreadPlanUpdate={hasUnreadPlanUpdate}
        hasUnreadGuide={hasUnreadGuide}
        subscriptionExpiringAlert={accountUser?.subscriptionExpiringAlert}
      />

      {/* ━━━ شريط تنبيه انتهاء الاشتراك (إذا كان متبقي 3 أيام أو أقل) ━━━ */}
      <SubscriptionExpiringBanner
        alertInfo={accountUser?.subscriptionExpiringAlert}
        onOpenModal={() => setShowExpiryModal(true)}
      />

      <section className="mx-auto w-full max-w-[1600px] 2xl:max-w-[1760px] px-3 sm:px-6 lg:px-8 xl:px-10 pt-3.5 pb-28 sm:py-6 overflow-x-hidden">
        {/* Hidden File Input for JSON Backup Restore */}
        <input
          ref={restoreFileRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileSelectedForRestore}
          className="hidden"
        />

        {/* ━━━ لوحة البداية والمؤشرات الذكية على الديسكتوب (Desktop Executive Dashboard) ━━━ */}
        {activeView === "players" && (
          <div className="hidden md:block">
            <DashboardHero
              captainName={captainName}
              academyName={academyName}
              players={players}
              branches={branches}
              branch={branch}
              events={events}
              sessionDate={sessionDate}
              attendanceRateToday={attendanceRateToday}
              presentToday={presentToday}
              absentToday={absentToday}
              paidCount={paidCount}
              totalPendingPaymentCount={totalPendingPaymentCount}
              purchasesDebtCount={purchasesDebtCount}
              todayBirthdays={todayBirthdaysList}
              isCloudBackingUp={isCloudBackingUp}
              isBackingUp={isBackingUp}
              isRestoring={isRestoring}
              onAddPlayer={() => setShowForm(true)}
              onOpenAttendanceReport={(bName) =>
                setBranchAttendanceReport({
                  branchName: bName,
                  date: sessionDate,
                })
              }
              onInstantCloudBackup={handleInstantCloudBackup}
              onRestore={() => setShowRestoreModal(true)}
              onMarkBranchPresent={(bName) => markBranchPresent(bName, sessionDate, updatePlayer)}
              onOpenEvents={() => {
                setActiveView("events");
                setMobileTab("events");
              }}
              onOpenAddEvent={() => {
                setEditingEvent(null);
                setShowAddEventModal(true);
              }}
              onOpenBirthdays={() => {
                setActiveView("birthdays");
                setMobileTab("birthdays");
              }}
              onOpenFinances={() => {
                setActiveView("finances");
                setMobileTab("stats");
              }}
              onFilterStatus={(status) => setStatusFilter(status)}
              onOpenFeatures={handleOpenFeatures}
              onOpenExportExcel={handleOpenExportExcel}
              hasUnreadGuide={hasUnreadGuide}
            />
          </div>
        )}

        {/* ━━━ تجربة الموبايل المخصصة بالكامل (Mobile-First Experience) ━━━ */}
        <div className="md:hidden">
          {mobileTab === "players" && activeView === "players" && (
            <MobileCommandSurface
              attendanceRateToday={attendanceRateToday}
              presentToday={presentToday}
              absentToday={absentToday}
              paidCount={paidCount}
              totalPendingPaymentCount={totalPendingPaymentCount}
              partialCount={partialCount}
              purchasesDebtCount={purchasesDebtCount}
              todayBirthdaysCount={todayBirthdaysCount}
              dashboardPlayers={dashboardPlayers}
              branch={branch}
              setBranch={setBranch}
              branches={branches}
              players={players}
              sessionDate={sessionDate}
              setSessionDate={setSessionDate}
              today={today}
              paymentMonth={paymentMonth}
              setPaymentMonth={setPaymentMonth}
              currentMonth={currentMonth}
              sortBy={sortBy}
              setSortBy={setSortBy}
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
              search={search}
              setSearch={setSearch}
              showMobileFilters={showMobileFilters}
              setShowMobileFilters={setShowMobileFilters}
              onOpenAttendanceReport={(bName) =>
                setBranchAttendanceReport({
                  branchName: bName,
                  date: sessionDate,
                })
              }
              onOpenExportExcel={handleOpenExportExcel}
              onOpenFeatures={handleOpenFeatures}
              hasUnreadGuide={hasUnreadGuide}
              onInstantCloudBackup={handleInstantCloudBackup}
              isCloudBackingUp={isCloudBackingUp}
              onRestore={() => setShowRestoreModal(true)}
              isRestoring={isRestoring}
              onDownloadBackup={handleDownloadBackup}
              isBackingUp={isBackingUp}
              onNavigateToBirthdays={() => {
                setMobileTab("birthdays");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              onToggleFilteredSelection={() => toggleFilteredSelection(filteredPlayers)}
            />
          )}

          {/* محتوى تبويب المؤشرات والإحصائيات على الموبايل */}
          {mobileTab === "stats" && (
            <div className="mb-6 animate-fade-in">
              <StatsGrid
                players={players}
                branches={branches}
                branch={branch}
                sessionDate={sessionDate}
                paymentMonth={paymentMonth}
                paymentMonthLabel={paymentMonthLabel}
                events={events}
                todayBirthdays={todayBirthdaysList}
                onSelectBranch={handleSelectBranch}
                onFilterStatus={(status) => {
                  setStatusFilter(status);
                  setMobileTab("players");
                  setActiveView("players");
                }}
                onOpenEvents={() => {
                  setActiveView("events");
                  setMobileTab("events");
                }}
                onOpenBirthdays={() => {
                  setActiveView("birthdays");
                  setMobileTab("birthdays");
                }}
                onOpenAttendanceReport={(bName) =>
                  setBranchAttendanceReport({
                    branchName: bName,
                    date: sessionDate,
                  })
                }
              />
            </div>
          )}

          {/* محتوى تبويب الصالات على الموبايل */}
          {mobileTab === "branches" && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="font-cairo text-base font-black text-slate-900">
                  صالات وفروع الأكاديمية ({branches.length})
                </h2>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs font-extrabold text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded-xl active:scale-95 cursor-pointer"
                  onClick={() => setShowBranches(true)}
                >
                  <span>⚙️ إدارة الصالات</span>
                </button>
              </div>
              <BranchOverview
                branches={branches}
                players={players}
                sessionDate={sessionDate}
                paymentMonth={paymentMonth}
                busyBranch={busyBranch}
                onSelectBranch={(bName) => {
                  handleSelectBranch(bName);
                  setMobileTab("players");
                }}
                onMarkPresent={(bName) => markBranchPresent(bName, sessionDate, updatePlayer)}
                onOpenAttendanceReport={(bName) =>
                  setBranchAttendanceReport({ branchName: bName, date: sessionDate })
                }
              />
            </div>
          )}

          {/* محتوى تبويب أعياد الميلاد على الموبايل */}
          {mobileTab === "birthdays" && (
            <div className="mb-6 space-y-3">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setMobileTab("players");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200/90 text-xs font-black text-slate-700 hover:bg-slate-50 active-press transition shadow-2xs cursor-pointer min-h-[36px]"
                >
                  <span>العودة لقائمة اللاعبين</span>
                </button>

                <span className="text-[11px] font-black text-rose-600 bg-rose-50 border border-rose-200/80 rounded-full px-2.5 py-0.5">
                  احتفالات الأبطال 🎉
                </span>
              </div>

              <BirthdayReminder
                players={players}
                branches={branches}
                captainName={captainName}
                academyName={academyName}
                onOpenPlayer={(player) => setSelected(player)}
                onBack={() => {
                  setMobileTab("players");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                allowDismiss={false}
                isMobileView={true}
              />
            </div>
          )}

          {/* محتوى تبويب الفعاليات على الموبايل */}
          {mobileTab === "events" && (
            <div className="mb-6">
              <EventsView
                events={events}
                players={players}
                branches={branches}
                academyName={academyName}
                captainName={captainName}
                onOpenCreateEvent={() => {
                  setEditingEvent(null);
                  setShowAddEventModal(true);
                }}
                onOpenEditEvent={(event) => {
                  setEditingEvent(event);
                  setShowAddEventModal(true);
                }}
                onDeleteEvent={handleDeleteEvent}
                onOpenAddParticipants={(event) => setAddParticipantsEvent(event)}
                onOpenPaymentModal={(participant, event) =>
                  setPaymentParticipantData({ participant, event })
                }
                onUpdateAttendance={handleUpdateParticipantAttendance}
                onRemoveParticipant={handleRemoveParticipant}
                onBulkPayment={handleBulkParticipantPayment}
                onOpenExportExcel={handleOpenExportExcel}
                showToast={showToast}
              />
            </div>
          )}
        </div>

        {/* ━━━ Executive Workspace Navigation Bar (Desktop) ━━━ */}
        <DesktopWorkspaceTabs
          activeView={activeView}
          onChangeView={(view) => {
            setActiveView(view);
            if (view === "finances") setMobileTab("stats");
            else if (view === "branches") setMobileTab("branches");
            else if (view === "events") setMobileTab("events");
            else if (view === "birthdays") setMobileTab("birthdays");
            else setMobileTab("players");
          }}
          playersCount={players.length}
          totalPendingPaymentCount={totalPendingPaymentCount}
          branchesCount={branches.length}
          eventsCount={events.length}
          todayBirthdaysCount={todayBirthdaysCount}
          onAddPlayer={() => setShowForm(true)}
        />

        {/* ━━━ Workspace 2: المركز المالي والإحصائيات على الديسكتوب ━━━ */}
        {activeView === "finances" && (
          <div className="hidden md:block mb-8 animate-fade-in-scale">
            <StatsGrid
              players={players}
              branches={branches}
              branch={branch}
              sessionDate={sessionDate}
              paymentMonth={paymentMonth}
              paymentMonthLabel={paymentMonthLabel}
              events={events}
              todayBirthdays={todayBirthdaysList}
              onSelectBranch={handleSelectBranch}
              onFilterStatus={(status) => {
                setStatusFilter(status);
                setActiveView("players");
              }}
              onOpenEvents={() => setActiveView("events")}
              onOpenBirthdays={() => setActiveView("birthdays")}
              onOpenAttendanceReport={(bName) =>
                setBranchAttendanceReport({
                  branchName: bName,
                  date: sessionDate,
                })
              }
            />
          </div>
        )}

        {/* ━━━ Workspace 3: الصالات ومراكز التدريب على الديسكتوب ━━━ */}
        {activeView === "branches" && (
          <div className="hidden md:block mb-8 animate-fade-in-scale">
            <BranchOverview
              branches={branches}
              players={players}
              sessionDate={sessionDate}
              paymentMonth={paymentMonth}
              busyBranch={busyBranch}
              onSelectBranch={handleSelectBranch}
              onMarkPresent={(bName) => markBranchPresent(bName, sessionDate, updatePlayer)}
              onOpenAttendanceReport={(bName) =>
                setBranchAttendanceReport({ branchName: bName, date: sessionDate })
              }
            />
          </div>
        )}

        {/* ━━━ Workspace 4: الفعاليات والبطولات على الديسكتوب ━━━ */}
        {activeView === "events" && (
          <div className="hidden md:block mb-8 animate-fade-in-scale">
            <EventsView
              events={events}
              players={players}
              branches={branches}
              academyName={academyName}
              captainName={captainName}
              onOpenCreateEvent={() => {
                setEditingEvent(null);
                setShowAddEventModal(true);
              }}
              onOpenEditEvent={(event) => {
                setEditingEvent(event);
                setShowAddEventModal(true);
              }}
              onDeleteEvent={handleDeleteEvent}
              onOpenAddParticipants={(event) => setAddParticipantsEvent(event)}
              onOpenPaymentModal={(participant, event) =>
                setPaymentParticipantData({ participant, event })
              }
              onUpdateAttendance={handleUpdateParticipantAttendance}
              onRemoveParticipant={handleRemoveParticipant}
              onBulkPayment={handleBulkParticipantPayment}
              onOpenExportExcel={handleOpenExportExcel}
              showToast={showToast}
            />
          </div>
        )}

        {/* ━━━ Workspace 5: تذكار أعياد الميلاد على الديسكتوب ━━━ */}
        {activeView === "birthdays" && (
          <div className="hidden md:block mb-8 animate-fade-in-scale">
            <BirthdayReminder
              players={players}
              branches={branches}
              captainName={captainName}
              academyName={academyName}
              onOpenPlayer={(player) => setSelected(player)}
              onBack={() => setActiveView("players")}
            />
          </div>
        )}

        {/* ━━━ Workspace 1: الأبطال والتحضير اليومي على الديسكتوب ━━━ */}
        {activeView === "players" && (
          <div className="hidden md:block space-y-4 mb-6 animate-fade-in-scale">
            <CommandBar
              search={search}
              onSearchChange={setSearch}
              onClearSearch={() => setSearch("")}
              branch={branch}
              onSelectBranch={setBranch}
              branches={branches}
              players={players}
              isAddingBranch={isAddingBranch}
              setIsAddingBranch={setIsAddingBranch}
              quickBranchName={quickBranchName}
              setQuickBranchName={setQuickBranchName}
              onQuickBranchSubmit={handleQuickBranchSubmit}
              onOpenManageBranches={() => setShowBranches(true)}
              sessionDate={sessionDate}
              onSessionDateChange={setSessionDate}
              today={today}
              paymentMonth={paymentMonth}
              onPaymentMonthChange={setPaymentMonth}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              dashboardPlayersCount={dashboardPlayers.length}
              presentToday={presentToday}
              absentToday={absentToday}
              paidCount={paidCount}
              totalPendingPaymentCount={totalPendingPaymentCount}
              purchasesDebtCount={purchasesDebtCount}
              todayBirthdaysCount={todayBirthdaysCount}
            />
          </div>
        )}

        {/* ━━━ شريط الإجراءات الجماعية العائم (Floating Bulk Dock) ━━━ */}
        <BulkActionDock
          selectedPlayerIds={selectedPlayerIds}
          bulkAttendanceBusy={bulkAttendanceBusy}
          onToggleAll={() => toggleFilteredSelection(filteredPlayers)}
          onMarkAttendance={(status) => markSelectedAttendance(status, sessionDate)}
          onMarkPayment={markSelectedPayment}
          onDeleteSelected={deleteSelectedPlayers}
          onClearSelection={() => setSelectedPlayerIds([])}
        />

        {/* ━━━ Player Table & Pagination Container ━━━ */}
        <div
          ref={playerListRef}
          className={`${mobileTab === "players" ? "block" : "hidden"} ${
            activeView === "players" ? "md:block" : "md:hidden"
          }`}
        >
          {/* شريط موجز عدد اللاعبين السريع للموبايل */}
          <div className="md:hidden flex items-center justify-between px-1 py-1.5 mb-1 text-xs font-bold text-slate-500">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-700">قائمة اللاعبين</span>
              <span className="rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-black text-slate-700">
                {filteredPlayers.length}
              </span>
              {statusFilter !== "all" && (
                <span className="text-[10px] font-black text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-full">
                  مفلتر
                </span>
              )}
            </div>
            {filteredPlayers.length > 0 && (
              <button
                type="button"
                onClick={() => toggleFilteredSelection(filteredPlayers)}
                className="text-[11px] font-black text-slate-600 hover:text-red-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1 active-press cursor-pointer"
              >
                {selectedPlayerIds.length === filteredPlayers.length
                  ? "إلغاء التحديد"
                  : "تحديد المعروض"}
              </button>
            )}
          </div>

          <div className="mt-1 md:mt-3 overflow-visible rounded-2xl border-0 bg-transparent shadow-none md:overflow-hidden md:border md:border-slate-200/80 md:bg-white md:shadow-xs">
            <div className="hidden grid-cols-[minmax(320px,2.8fr)_100px_150px_210px_minmax(300px,2.6fr)_56px] xl:grid-cols-[minmax(360px,3.2fr)_110px_170px_230px_minmax(340px,2.8fr)_60px] items-center gap-4 xl:gap-5 border-b border-slate-200/90 bg-slate-50/95 px-6 xl:px-8 py-3.5 font-cairo text-xs xl:text-sm font-black text-slate-600 md:grid">
              <span>اللاعب والبيانات</span>
              <span>العمر</span>
              <span>الصالة</span>
              <span className="text-center">تسجيل الحضور اليوم</span>
              <span>الاشتراك والمشتريات</span>
              <span className="text-center">الملف</span>
            </div>

            {loading ? (
              <>
                {/* Mobile loading skeleton */}
                <div className="md:hidden space-y-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="skeleton h-5 w-5 rounded-md shrink-0 mt-1" />
                        <div className="skeleton h-11 w-11 rounded-xl shrink-0" />
                        <div className="flex-1 space-y-1.5 mt-0.5">
                          <div className="skeleton h-4 w-32 rounded-lg" />
                          <div className="skeleton h-3 w-20 rounded-md" />
                        </div>
                        <div className="skeleton h-9 w-9 rounded-xl shrink-0" />
                      </div>
                      <div className="mt-2.5 skeleton h-2.5 w-full rounded-full" />
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <div className="skeleton h-11 rounded-xl" />
                        <div className="skeleton h-11 rounded-xl" />
                      </div>
                      <div className="mt-2 skeleton h-10 rounded-xl" />
                    </div>
                  ))}
                </div>
                {/* Desktop loading skeleton */}
                <div className="hidden md:flex flex-col gap-3 px-6 py-6 bg-white rounded-2xl">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-4 py-2">
                      <div className="skeleton h-11 w-11 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="skeleton h-4 w-36 rounded-lg" />
                        <div className="skeleton h-3 w-24 rounded-lg" />
                      </div>
                      <div className="skeleton h-9 w-20 rounded-xl" />
                      <div className="skeleton h-9 w-20 rounded-xl" />
                      <div className="skeleton h-9 w-20 rounded-xl" />
                    </div>
                  ))}
                </div>
              </>
            ) : filteredPlayers.length === 0 ? (
              <div className="flex flex-col items-center gap-3.5 px-6 py-14 sm:py-20 text-center text-slate-400 bg-white rounded-2xl">
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-red-50 text-2xl sm:text-3xl text-red-600 shadow-xs">
                  🥋
                </div>
                <strong className="font-cairo text-base sm:text-lg font-black text-slate-800">
                  لا توجد نتائج مطابقة
                </strong>
                <span className="text-xs text-slate-500 max-w-sm">
                  لم نجد أي لاعبين وفقاً للبحث أو الفلترة المحددة.
                </span>
                <button
                  type="button"
                  className="mt-1 flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 px-5 py-2.5 text-xs font-black text-white shadow-xs active:scale-95 cursor-pointer"
                  onClick={() => setShowForm(true)}
                >
                  <span>＋</span>
                  <span>إضافة لاعب جديد</span>
                </button>
              </div>
            ) : (
              paginatedPlayers.map((player) => (
                <PlayerRow
                  key={player._id}
                  player={player}
                  branches={branches}
                  sessionDate={sessionDate}
                  paymentMonth={paymentMonth}
                  onOpen={() => setSelected(player)}
                  onUpdate={updatePlayer}
                  isSelected={selectedPlayerIds.includes(player._id)}
                  onToggleSelection={togglePlayerSelection}
                />
              ))
            )}
          </div>

          {/* ترقيم الصفحات (Pagination) */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={sortedFilteredPlayers.length}
            pageSize={pageSize}
            onPageChange={(page) => {
              setCurrentPage(page);
              playerListRef.current?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setCurrentPage(1);
            }}
          />
        </div>
      </section>

      {/* ━━━ Footer ━━━ */}
      <Footer academyName={academyName} />

      {/* ━━━ Mobile Bottom Navigation Bar ━━━ */}
      <MobileBottomNav
        activeTab={mobileTab}
        onChangeTab={(tab) => {
          setMobileTab(tab);
          if (tab === "events") {
            setActiveView("events");
          } else if (tab === "players") {
            setActiveView("players");
          } else if (tab === "branches") {
            setActiveView("branches");
          } else if (tab === "stats") {
            setActiveView("finances");
          } else if (tab === "birthdays") {
            setActiveView("birthdays");
          }
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenAddPlayer={() => setShowForm(true)}
        birthdayCount={todayBirthdaysCount}
        playersCount={players.length}
        branchesCount={branches.length}
        eventsCount={events.length}
      />

      {/* ━━━ All Modals (Lazily loaded) ━━━ */}
      <DashboardModals
        showForm={showForm}
        setShowForm={setShowForm}
        branches={branches}
        branch={branch}
        onAddPlayer={handleAddPlayer}
        onOpenManageBranches={() => {
          setShowForm(false);
          setShowBranches(true);
        }}
        showBranches={showBranches}
        setShowBranches={setShowBranches}
        players={players}
        onAddBranch={addBranch}
        onRenameBranch={renameBranch}
        onUpdateBranch={updateBranch}
        onDeleteBranch={deleteBranch}
        onDeleteBlockedBranch={handleBlockedBranchDelete}
        toastMessage={toast?.message || ""}
        selected={selected}
        setSelected={setSelected}
        onUpdatePlayer={updatePlayer}
        onDeletePlayer={deletePlayer}
        paymentMonth={paymentMonth}
        events={events}
        showAddEventModal={showAddEventModal}
        setShowAddEventModal={setShowAddEventModal}
        editingEvent={editingEvent}
        setEditingEvent={setEditingEvent}
        onSaveEvent={handleSaveEvent}
        eventActionBusy={eventActionBusy}
        addParticipantsEvent={addParticipantsEvent}
        setAddParticipantsEvent={setAddParticipantsEvent}
        onAddParticipants={handleAddParticipants}
        paymentParticipantData={paymentParticipantData}
        setPaymentParticipantData={setPaymentParticipantData}
        onSaveParticipantPayment={handleSaveParticipantPayment}
        showEmailBackupModal={showEmailBackupModal}
        setShowEmailBackupModal={setShowEmailBackupModal}
        userEmail={session?.user?.email}
        showRestoreModal={showRestoreModal}
        setShowRestoreModal={setShowRestoreModal}
        onReloadAllData={reloadAllData}
        restoreProgressModal={restoreProgressModal}
        welcomePlayer={welcomePlayer}
        setWelcomePlayer={setWelcomePlayer}
        branchAttendanceReport={branchAttendanceReport}
        setBranchAttendanceReport={setBranchAttendanceReport}
        sessionDate={sessionDate}
        captainName={captainName}
        academyName={academyName}
        showAccountSettings={showAccountSettings}
        setShowAccountSettings={setShowAccountSettings}
        onUserUpdated={(updatedUser) => {
          if (updatedUser) {
            if (updatedUser.name) setLocalCoachName(updatedUser.name);
            if (updatedUser.academyName) setLocalAcademyName(updatedUser.academyName);
            setAccountUser(updatedUser);
            if (typeof updateSession === "function") {
              updateSession(updatedUser);
            }
          }
        }}
        showFeaturesModal={showFeaturesModal}
        setShowFeaturesModal={setShowFeaturesModal}
        showExportExcelModal={showExportExcelModal}
        setShowExportExcelModal={setShowExportExcelModal}
        exportInitialTab={exportInitialTab}
        exportInitialEventId={exportInitialEventId}
        showToast={showToast}
      />

      {/* ━━━ Global Fixed Toast Notification Overlay ━━━ */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />

      {/* ━━━ نافذة تنبيه انتهاء الاشتراك المنبثقة (قبل 3 أيام) ━━━ */}
      <SubscriptionExpiringModal
        isOpen={showExpiryModal}
        onClose={() => setShowExpiryModal(false)}
        alertInfo={accountUser?.subscriptionExpiringAlert}
        captainName={captainName}
        academyName={academyName}
      />
    </main>
  );
}
