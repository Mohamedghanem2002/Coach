"use client";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  localDate,
  normalizePlayer,
  paymentStatusFor,
  getPaymentDetailsFor,
  getBirthdayInfo,
  getTodayBirthdays,
  isBirthdayCongratulated,
  getPurchasesSummary,
} from "../lib/dashboard-utils";
import {
  Plus,
  Users,
  Building2,
  CalendarDays,
  CreditCard,
  Check,
  X,
  Search,
  Bell,
  UserPlus,
  Trash2,
  MessageSquare,
  Filter,
  ChevronDown,
  SlidersHorizontal,
  Cake,
  Clock,
  ArrowUpDown,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Info,
  Compass,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";

import BranchManager from "../components/dashboard/BranchManager";
import PlayerRow from "../components/dashboard/PlayerRow";
import Profile from "../components/dashboard/Profile";
import Header from "../components/dashboard/Header";
import StatsGrid from "../components/dashboard/StatsGrid";
import AddPlayerModal from "../components/dashboard/AddPlayerModal";
import BranchOverview from "../components/dashboard/BranchOverview";
import BirthdayReminder from "../components/dashboard/BirthdayReminder";
import Pagination from "../components/dashboard/Pagination";
import MobileBottomNav from "../components/dashboard/MobileBottomNav";
import EventsView from "../components/dashboard/EventsView";
import AddEventModal from "../components/dashboard/AddEventModal";
import AddParticipantsModal from "../components/dashboard/AddParticipantsModal";
import EventPaymentModal from "../components/dashboard/EventPaymentModal";
import { exportPlayersToCSV } from "../lib/export-utils";
const today = localDate();
const currentMonth = today.slice(0, 7);

export default function Home() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const captainName = session?.user?.name || "كابتن";
  const [players, setPlayers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branch, setBranch] = useState("كل الصالات");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showBranches, setShowBranches] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sessionDate, setSessionDate] = useState(today);
  const [paymentMonth, setPaymentMonth] = useState(currentMonth);
  const [quickBranchName, setQuickBranchName] = useState("");
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [busyBranch, setBusyBranch] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [bulkAttendanceBusy, setBulkAttendanceBusy] = useState(false);
  const [congratulatedTick, setCongratulatedTick] = useState(0);
  const [mobileTab, setMobileTab] = useState("players");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Events management state
  const [events, setEvents] = useState([]);
  const [activeView, setActiveView] = useState("players"); // "players" | "events"
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [addParticipantsEvent, setAddParticipantsEvent] = useState(null);
  const [paymentParticipantData, setPaymentParticipantData] = useState(null);
  const [eventActionBusy, setEventActionBusy] = useState(false);

  useEffect(() => {
    const handleCongratulated = () => setCongratulatedTick((t) => t + 1);
    window.addEventListener("birthday_congratulated", handleCongratulated);
    return () =>
      window.removeEventListener("birthday_congratulated", handleCongratulated);
  }, []);

  const playerListRef = useRef(null);
  const deferredSearch = useDeferredValue(search);
  const paymentMonthLabel = new Intl.DateTimeFormat("ar-EG", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${paymentMonth}-01T00:00:00`));
  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (sessionStatus === "unauthenticated") {
      router.push("/auth/signin");
      return;
    }
    let cancelled = false;
    Promise.all([
      fetch("/api/players", { cache: "no-store" }),
      fetch("/api/branches", { cache: "no-store" }),
      fetch("/api/events", { cache: "no-store" }),
    ])
      .then(async ([playersResponse, branchesResponse, eventsResponse]) => {
        if (playersResponse.status === 401 || branchesResponse.status === 401) {
          router.push("/auth/signin");
          return;
        }
        if (!playersResponse.ok || !branchesResponse.ok) {
          console.error("Initial fetch failed:", {
            playersStatus: playersResponse.status,
            branchesStatus: branchesResponse.status,
            eventsStatus: eventsResponse.status,
          });
          throw new Error("Failed to fetch initial data");
        }
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
      })
      .catch((err) => {
        console.error("Data loading error:", err);
        if (!cancelled)
          setNotice("تعذر تحميل البيانات. تأكد من اتصال MongoDB.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [router, sessionStatus]);
  function showToast(message, type = "success") {
    if (!message) {
      setToast(null);
      return;
    }
    setToast({ message, type });
  }

  function setNotice(message) {
    if (!message) {
      setToast(null);
      return;
    }
    const isError =
      message.includes("تعذر") ||
      message.includes("خطأ") ||
      message.includes("لا يمكن") ||
      message.includes("راجع بيانات");
    showToast(message, isError ? "error" : "success");
  }

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [branch, deferredSearch, statusFilter, sortBy]);
  const filteredPlayers = useMemo(
    () => {
      void congratulatedTick;
      return players.filter((player) => {
        const matchesBranch =
          branch === "كل الصالات" || player.branch === branch;
        const record = (player.attendance || []).find(
          (item) => item.date === sessionDate,
        );
        const paymentDetails = getPaymentDetailsFor(player, paymentMonth);
        const purchasesSum = getPurchasesSummary(player);
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "present" &&
            (record === null || record === void 0 ? void 0 : record.status) ===
              "present") ||
          (statusFilter === "absent" &&
            (record === null || record === void 0 ? void 0 : record.status) ===
              "absent") ||
          (statusFilter === "paid" &&
            paymentDetails.status === "paid") ||
          (statusFilter === "partially_paid" &&
            paymentDetails.status === "partially_paid") ||
          (statusFilter === "unpaid" &&
            paymentDetails.status !== "paid") ||
          (statusFilter === "purchases_debt" &&
            purchasesSum.remainingAmount > 0) ||
          (statusFilter === "birthday" &&
            Boolean(
              getBirthdayInfo(player)?.isToday ||
              getBirthdayInfo(player)?.daysLeft === 1
            ) &&
            !isBirthdayCongratulated(player._id));
        return (
          matchesBranch &&
          matchesStatus &&
          player.name.includes(deferredSearch.trim())
        );
      });
    },
    [
      players,
      branch,
      deferredSearch,
      statusFilter,
      sessionDate,
      paymentMonth,
      congratulatedTick,
    ],
  );

  const sortedFilteredPlayers = useMemo(() => {
    const list = [...filteredPlayers];
    switch (sortBy) {
      case "alphabetical":
        return list.sort((a, b) => a.name.localeCompare(b.name, "ar"));
      case "oldest":
        return list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      case "age-asc":
        return list.sort((a, b) => (a.age || 0) - (b.age || 0));
      case "age-desc":
        return list.sort((a, b) => (b.age || 0) - (a.age || 0));
      case "unpaid-first":
        return list.sort((a, b) => {
          const aDetails = getPaymentDetailsFor(a, paymentMonth);
          const bDetails = getPaymentDetailsFor(b, paymentMonth);
          if (bDetails.remainingAmount !== aDetails.remainingAmount) {
            return bDetails.remainingAmount - aDetails.remainingAmount;
          }
          const aPaid = aDetails.status === "paid" ? 1 : 0;
          const bPaid = bDetails.status === "paid" ? 1 : 0;
          return aPaid - bPaid;
        });
      case "purchases-debt-first":
        return list.sort((a, b) => {
          const aRem = getPurchasesSummary(a).remainingAmount;
          const bRem = getPurchasesSummary(b).remainingAmount;
          return bRem - aRem;
        });
      case "attendance-desc":
        return list.sort((a, b) => {
          const aPresent = (a.attendance || []).filter((x) => x.status === "present").length;
          const aTotal = (a.attendance || []).length;
          const aRate = aTotal ? aPresent / aTotal : 0;

          const bPresent = (b.attendance || []).filter((x) => x.status === "present").length;
          const bTotal = (b.attendance || []).length;
          const bRate = bTotal ? bPresent / bTotal : 0;

          return bRate - aRate;
        });
      case "newest":
      default:
        return list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }, [filteredPlayers, sortBy, paymentMonth]);

  const totalPages = pageSize === 0 ? 1 : Math.ceil(sortedFilteredPlayers.length / pageSize);

  const paginatedPlayers = useMemo(() => {
    if (pageSize === 0) return sortedFilteredPlayers;
    const start = (currentPage - 1) * pageSize;
    return sortedFilteredPlayers.slice(start, start + pageSize);
  }, [sortedFilteredPlayers, currentPage, pageSize]);

  function handleExportAll() {
    if (!sortedFilteredPlayers.length) {
      showToast("لا توجد بيانات لتصديرها وفق الفرز والتصفية الحالية.", "info");
      return;
    }
    const branchLabel = branch === "كل الصالات" ? "الكل" : branch;
    const success = exportPlayersToCSV(
      sortedFilteredPlayers,
      paymentMonth,
      `كشف_لاعبي_الأكاديمية_${branchLabel}_${paymentMonth}.csv`
    );
    if (success) {
      showToast(`تم تصدير (${sortedFilteredPlayers.length}) لاعب بنجاح إلى ملف Excel / CSV.`);
    }
  }

  function handleExportSelected() {
    const selectedList = players.filter((p) => selectedPlayerIds.includes(p._id));
    if (!selectedList.length) return;
    const success = exportPlayersToCSV(
      selectedList,
      paymentMonth,
      `كشف_اللاعبين_المحددين_${paymentMonth}.csv`
    );
    if (success) {
      showToast(`تم تصدير (${selectedList.length}) لاعب محدد بنجاح إلى ملف Excel / CSV.`);
    }
  }

  const dashboardPlayers =
    branch === "كل الصالات"
      ? players
      : players.filter((player) => player.branch === branch);
  const paidCount = dashboardPlayers.filter(
    (player) => paymentStatusFor(player, paymentMonth) === "paid",
  ).length;
  const partialCount = dashboardPlayers.filter(
    (player) => paymentStatusFor(player, paymentMonth) === "partially_paid",
  ).length;
  const unpaidCount = dashboardPlayers.filter(
    (player) => paymentStatusFor(player, paymentMonth) === "unpaid",
  ).length;
  const totalPendingPaymentCount = unpaidCount + partialCount;
  const purchasesDebtCount = dashboardPlayers.filter((player) => {
    const s = getPurchasesSummary(player);
    return s.remainingAmount > 0;
  }).length;
  const presentToday = dashboardPlayers.filter((player) =>
    (player.attendance || []).some(
      (item) => item.date === sessionDate && item.status === "present",
    ),
  ).length;
  const absentToday = dashboardPlayers.filter((player) =>
    (player.attendance || []).some(
      (item) => item.date === sessionDate && item.status === "absent",
    ),
  ).length;
  const attendanceRateToday =
    dashboardPlayers.length > 0
      ? Math.round((presentToday / dashboardPlayers.length) * 100)
      : 0;
  const todayBirthdaysCount = dashboardPlayers.filter((player) => {
    const bday = getBirthdayInfo(player);
    return (
      Boolean(bday?.isToday || bday?.daysLeft === 1) &&
      !isBirthdayCongratulated(player._id)
    );
  }).length;
  async function updatePlayer(id, data) {
    if (data.attendanceStatus && data.date > today) {
      setNotice("لا يمكن تسجيل حضور أو غياب في تاريخ مستقبلي.");
      return null;
    }
    try {
      const response = await fetch("/api/players", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          Object.assign(Object.assign({ id }, data), {
            paymentMonth: data.paymentMonth || paymentMonth,
          }),
        ),
      });
      const result = await response.json();
      if (!response.ok || !result) {
        setNotice(
          (result === null || result === void 0 ? void 0 : result.error) ||
            "تعذر تحديث بيانات اللاعب.",
        );
        return null;
      }
      const safePlayer = normalizePlayer(result);
      setPlayers((current) =>
        current.map((player) => (player._id === id ? safePlayer : player)),
      );
      setSelected((current) =>
        (current === null || current === void 0 ? void 0 : current._id) === id
          ? safePlayer
          : current,
      );
      if (data.attendanceStatus) {
        setNotice(
          `تم تسجيل ${data.attendanceStatus === "present" ? "حضور" : "غياب"} اللاعب بنجاح.`,
        );
      }
      if (data.paymentStatus) {
        setNotice(
          `تم ${data.paymentStatus === "paid" ? "تسجيل دفع" : "إلغاء الدفع"} اللاعب بنجاح.`,
        );
      }
      if (data.purchaseAction === "add") {
        setNotice(`تم تسجيل السلعة (${data.title || "السلعة"}) بنجاح.`);
      } else if (data.purchaseAction === "update") {
        setNotice("تم تسجيل سداد السلعة بنجاح.");
      } else if (data.purchaseAction === "delete") {
        setNotice("تم حذف السلعة من حساب اللاعب بنجاح.");
      }
      return safePlayer;
    } catch (_a) {
      setNotice("تعذر الاتصال بالخادم. حاول مرة أخرى.");
      return null;
    }
  }
  async function handleAddPlayer(playerData) {
    try {
      const response = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(playerData),
      });
      const result = await response.json();
      if (!response.ok) {
        setNotice(result.error || "راجع بيانات اللاعب وحاول مرة أخرى.");
        return;
      }
      setPlayers((current) => [normalizePlayer(result), ...current]);
      setShowForm(false);
      setNotice("تمت إضافة اللاعب بنجاح.");
    } catch (_error) {
      setNotice("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    }
  }
  async function addBranch(name) {
    const response = await fetch("/api/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await response.json();
    if (!response.ok) {
      setNotice(data.error || "تعذر إضافة الفرع.");
      return null;
    }
    setBranches((current) => [...current, data]);
    setNotice("تمت إضافة الفرع بنجاح.");
  }
  async function renameBranch(oldName, newName) {
    try {
      const response = await fetch("/api/branches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName }),
      });
      const data = await response.json();
      if (!response.ok) {
        showToast(data.error || "تعذر تعديل اسم الفرع.", "error");
        return;
      }
      setBranches((current) =>
        current.map((b) => (b.name === oldName ? { ...b, name: newName } : b))
      );
      setPlayers((current) =>
        current.map((p) => (p.branch === oldName ? { ...p, branch: newName } : p))
      );
      if (branch === oldName) setBranch(newName);
      showToast(`تم تعديل اسم الفرع إلى "${newName}" وتحديث جميع بيانات اللاعبين.`);
    } catch {
      showToast("تعذر الاتصال بالخادم لتعديل اسم الفرع.", "error");
    }
  }
  async function deleteBranch(name) {
    const response = await fetch("/api/branches", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await response.json();
    if (!response.ok) {
      setNotice(data.error || "تعذر حذف الفرع.");
      return;
    }
    setBranches((current) =>
      current.filter((branchItem) => branchItem.name !== name),
    );
    if (branch === name) setBranch("كل الصالات");
    setNotice("تم حذف الفرع.");
  }
  function handleSelectBranch(name) {
    setBranch(name);
    window.setTimeout(() => {
      playerListRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }
  function handleBlockedBranchDelete(name, playerCount) {
    setNotice(
      `لا يمكن حذف ${name} لأنها تحتوي على ${playerCount} لاعب. انقل اللاعبين أولًا إلى صالة أخرى.`,
    );
  }
  async function deletePlayer(id) {
    const response = await fetch("/api/players", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (!response.ok) {
      setNotice("تعذر حذف اللاعب.");
      return;
    }
    setPlayers((current) => current.filter((player) => player._id !== id));
    setSelected(null);
    setNotice("تم حذف اللاعب.");
  }
  async function handleQuickBranchSubmit(e) {
    e.preventDefault();
    if (!quickBranchName.trim()) return;
    await addBranch(quickBranchName.trim());
    setQuickBranchName("");
    setIsAddingBranch(false);
  }
  async function markBranchPresent(branchName) {
    const branchPlayers = players.filter(
      (player) => player.branch === branchName,
    );
    if (!branchPlayers.length) {
      setNotice("لا يوجد لاعبين مسجلين في هذه الصالة.");
      return;
    }
    setBusyBranch(branchName);
    const results = await Promise.all(
      branchPlayers.map((player) =>
        updatePlayer(player._id, {
          attendanceStatus: "present",
          date: sessionDate,
        }),
      ),
    );
    setBusyBranch("");
    const savedCount = results.filter(Boolean).length;
    if (savedCount) {
      setNotice(`تم تسجيل حضور ${savedCount} لاعب من ${branchName}.`);
    }
  }
  function togglePlayerSelection(id) {
    setSelectedPlayerIds((current) =>
      current.includes(id)
        ? current.filter((playerId) => playerId !== id)
        : [...current, id],
    );
  }
  function toggleFilteredSelection() {
    const filteredIds = filteredPlayers.map((player) => player._id);
    const allSelected = filteredIds.every((id) =>
      selectedPlayerIds.includes(id),
    );
    setSelectedPlayerIds((current) =>
      allSelected
        ? current.filter((id) => !filteredIds.includes(id))
        : [...new Set([...current, ...filteredIds])],
    );
  }
  async function markSelectedAttendance(status) {
    if (!selectedPlayerIds.length || bulkAttendanceBusy) return;
    setBulkAttendanceBusy(true);
    const results = await Promise.all(
      selectedPlayerIds.map((id) =>
        updatePlayer(id, {
          attendanceStatus: status,
          date: sessionDate,
        }),
      ),
    );
    const savedCount = results.filter(Boolean).length;
    setBulkAttendanceBusy(false);
    setSelectedPlayerIds([]);
    if (savedCount) {
      setNotice(
        `تم تسجيل ${status === "present" ? "حضور" : "غياب"} ${savedCount} لاعب.`,
      );
    }
  }
  async function markSelectedPayment(status) {
    if (!selectedPlayerIds.length || bulkAttendanceBusy) return;
    setBulkAttendanceBusy(true);
    const results = await Promise.all(
      selectedPlayerIds.map((id) =>
        updatePlayer(id, { paymentStatus: status }),
      ),
    );
    const savedCount = results.filter(Boolean).length;
    setBulkAttendanceBusy(false);
    setSelectedPlayerIds([]);
    if (savedCount) {
      setNotice(
        `تم ${status === "paid" ? "تسجيل دفع" : "إلغاء دفع"} ${savedCount} لاعب.`,
      );
    }
  }

  // Event handlers
  async function handleSaveEvent(data) {
    setEventActionBusy(true);
    try {
      const isEditing = Boolean(data.id);
      const res = await fetch("/api/events", {
        method: isEditing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error();
      const saved = await res.json();
      if (isEditing) {
        setEvents((prev) => prev.map((e) => (e._id === saved._id ? saved : e)));
        showToast("تم تحديث بيانات الفعالية بنجاح");
      } else {
        setEvents((prev) => [saved, ...prev]);
        showToast("تم إنشاء الفعالية بنجاح");
      }
      setShowAddEventModal(false);
      setEditingEvent(null);
    } catch {
      showToast("تعذر حفظ الفعالية، يرجى المحاولة ثانية", "error");
    } finally {
      setEventActionBusy(false);
    }
  }

  async function handleDeleteEvent(eventId) {
    try {
      const res = await fetch(`/api/events?id=${eventId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setEvents((prev) => prev.filter((e) => e._id !== eventId));
      showToast("تم حذف الفعالية بنجاح");
    } catch {
      showToast("تعذر حذف الفعالية", "error");
    }
  }

  async function handleAddParticipants({ eventId, playerIds, fee }) {
    setEventActionBusy(true);
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          action: "add_participants",
          playerIds,
          fee,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setEvents((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
      showToast(`تمت إضافة (${playerIds.length}) لاعبين إلى الفعالية بنجاح`);
      setAddParticipantsEvent(null);
    } catch {
      showToast("تعذر إضافة اللاعبين للفعالية", "error");
    } finally {
      setEventActionBusy(false);
    }
  }

  async function handleSaveParticipantPayment({ playerId, paidAmount, totalAmount, notes }) {
    if (!paymentParticipantData?.event?._id) return;
    setEventActionBusy(true);
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId: paymentParticipantData.event._id,
          action: "update_payment",
          playerId,
          paidAmount,
          totalAmount,
          notes,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setEvents((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
      showToast("تم تسجيل دفعة الفعالية بنجاح");
      setPaymentParticipantData(null);
    } catch {
      showToast("تعذر حفظ دفعة الفعالية", "error");
    } finally {
      setEventActionBusy(false);
    }
  }

  async function handleUpdateParticipantAttendance(eventId, playerId, attended) {
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          action: "update_attendance",
          playerId,
          attended,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setEvents((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
    } catch {
      showToast("تعذر تحديث الحضور", "error");
    }
  }

  async function handleRemoveParticipant(eventId, playerId) {
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          action: "remove_participant",
          playerId,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setEvents((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
      showToast("تمت إزالة اللاعب من الفعالية");
    } catch {
      showToast("تعذر إزالة اللاعب", "error");
    }
  }

  async function handleBulkParticipantPayment({ eventId, playerIds, status }) {
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          action: "bulk_payment",
          playerIds,
          status,
        }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setEvents((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
      showToast("تم تحديث السداد الجماعي بنجاح");
    } catch {
      showToast("تعذر تحديث السداد الجماعي", "error");
    }
  }

  return (
    <main className="min-h-screen text-slate-900 selection:bg-red-500 selection:text-white pb-28 md:pb-20 w-full max-w-full overflow-x-hidden" dir="rtl">
      <Header
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
          setMobileTab("birthdays");
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

      <section className="mx-auto w-full max-w-7xl px-3 sm:px-6 py-3.5 sm:py-7 lg:px-8 overflow-x-hidden">
        {/* ━━━ تجربة الموبايل المخصصة بالكامل (Mobile-First Experience) ━━━ */}
        <div className="md:hidden">
          {/* شريط اختيار الصالة الأفقي السريع */}
          <div className="w-full max-w-full min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 mb-2.5 touch-scroll">
            <button
              type="button"
              className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-black transition-all active:scale-95 min-h-[38px] cursor-pointer ${
                branch === "كل الصالات"
                  ? "bg-red-600 text-white shadow-xs shadow-red-500/30"
                  : "bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50"
              }`}
              onClick={() => setBranch("كل الصالات")}
            >
              كل الصالات ({players.length})
            </button>
            {branches.map((b) => {
              const bCount = players.filter((p) => p.branch === b.name).length;
              return (
                <button
                  key={b._id}
                  type="button"
                  className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-black transition-all active:scale-95 min-h-[38px] cursor-pointer ${
                    branch === b.name
                      ? "bg-red-600 text-white shadow-xs shadow-red-500/30"
                      : "bg-white text-slate-700 border border-slate-200/80 hover:bg-slate-50"
                  }`}
                  onClick={() => setBranch(b.name)}
                >
                  {b.name} ({bCount})
                </button>
              );
            })}
          </div>

          {/* بطاقة النبض اليومي السريع (Daily Pulse Card) */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-3.5 shadow-sm relative overflow-hidden mb-3.5">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-red-600">
                  نبض اليوم • {sessionDate}
                </p>
                <h3 className="font-cairo text-sm font-black text-slate-900">
                  {branch === "كل الصالات" ? "جميع صالات الأكاديمية" : `صالة ${branch}`}
                </h3>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black text-slate-700">
                {dashboardPlayers.length} لاعب
              </span>
            </div>

            {/* شريط نسبة حضور اليوم */}
            <div className="space-y-1 mb-2.5">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">نسبة حضور اليوم:</span>
                <span className="font-black text-emerald-700">{attendanceRateToday}% ({presentToday} لاعب)</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                  style={{ width: `${attendanceRateToday}%` }}
                />
              </div>
            </div>

            {/* 4 شرائح سريعة تفاعلية لفلترة القائمة بلمسة واحدة مباشرة من نبض اليوم */}
            <div className="grid grid-cols-4 gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  setStatusFilter(statusFilter === "present" ? "all" : "present");
                  setMobileTab("players");
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all active-press min-h-[52px] cursor-pointer touch-manipulation ${
                  statusFilter === "present"
                    ? "bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-300"
                    : "bg-emerald-50/70 border border-emerald-200/60 text-emerald-800 hover:bg-emerald-100/60"
                }`}
              >
                <div className="flex items-center gap-1">
                  <Check className={`h-3 w-3 ${statusFilter === "present" ? "text-white" : "text-emerald-600"}`} strokeWidth={3} />
                  <span className="text-base font-black leading-none">{presentToday}</span>
                </div>
                <span className="text-[10px] font-bold mt-1">حاضر</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatusFilter(statusFilter === "absent" ? "all" : "absent");
                  setMobileTab("players");
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all active-press min-h-[52px] cursor-pointer touch-manipulation ${
                  statusFilter === "absent"
                    ? "bg-rose-600 text-white shadow-sm ring-2 ring-rose-300"
                    : "bg-rose-50/70 border border-rose-200/60 text-rose-800 hover:bg-rose-100/60"
                }`}
              >
                <div className="flex items-center gap-1">
                  <X className={`h-3 w-3 ${statusFilter === "absent" ? "text-white" : "text-rose-600"}`} strokeWidth={3} />
                  <span className="text-base font-black leading-none">{absentToday}</span>
                </div>
                <span className="text-[10px] font-bold mt-1">غائب</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatusFilter(statusFilter === "paid" ? "all" : "paid");
                  setMobileTab("players");
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all active-press min-h-[52px] cursor-pointer touch-manipulation ${
                  statusFilter === "paid"
                    ? "bg-sky-600 text-white shadow-sm ring-2 ring-sky-300"
                    : "bg-sky-50/70 border border-sky-200/60 text-sky-800 hover:bg-sky-100/60"
                }`}
              >
                <div className="flex items-center gap-1">
                  <CreditCard className={`h-3 w-3 ${statusFilter === "paid" ? "text-white" : "text-sky-600"}`} />
                  <span className="text-base font-black leading-none">{paidCount}</span>
                </div>
                <span className="text-[10px] font-bold mt-1">مدفوع</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatusFilter(statusFilter === "unpaid" ? "all" : "unpaid");
                  setMobileTab("players");
                }}
                className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all active-press min-h-[52px] cursor-pointer touch-manipulation ${
                  statusFilter === "unpaid"
                    ? "bg-amber-600 text-white shadow-sm ring-2 ring-amber-300"
                    : "bg-amber-50/70 border border-amber-200/60 text-amber-800 hover:bg-amber-100/60"
                }`}
              >
                <div className="flex items-center gap-1">
                  <Clock className={`h-3 w-3 ${statusFilter === "unpaid" ? "text-white" : "text-amber-600"}`} />
                  <span className="text-base font-black leading-none">{totalPendingPaymentCount}</span>
                </div>
                <span className="text-[10px] font-bold mt-1">
                  {partialCount > 0 ? "باقي/معلق" : "لم يدفع"}
                </span>
              </button>
            </div>
          </div>

          {/* محتوى تبويب اللاعبين على الموبايل */}
          {mobileTab === "players" && (
            <div className="space-y-2 mb-2">
              {/* شريط البحث مع زر الخيارات المتقدمة ومؤشرات الفلاتر الإضافية */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 flex min-h-11 items-center gap-2 rounded-2xl border border-slate-200/90 bg-white px-3.5 shadow-2xs focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-100 transition-all">
                  <Search className="h-4 w-4 shrink-0 text-slate-400" />
                  <input
                    className="min-w-0 flex-1 bg-transparent py-2.5 text-base sm:text-sm text-slate-900 outline-none placeholder:text-slate-400 font-bold"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="ابحث باسم اللاعب..."
                  />
                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setShowMobileFilters(true)}
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition active-press cursor-pointer touch-manipulation ${
                    sortBy !== "newest" || sessionDate !== today || paymentMonth !== currentMonth
                      ? "border-red-300 bg-red-50 text-red-600 shadow-xs ring-2 ring-red-200/50"
                      : "border-slate-200/90 bg-white text-slate-600 shadow-2xs hover:bg-slate-50"
                  }`}
                  title="تخصيص الفلاتر والترتيب وتاريخ الحصة"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </button>
              </div>

              {/* شريط الفلاتر السريع المدمج (عرض الفلتر النشط وخيارات إضافية ذكية دون تكرار) */}
              <div className="w-full max-w-full min-w-0 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 touch-scroll">
                <button
                  type="button"
                  className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active-press min-h-[34px] cursor-pointer touch-manipulation ${
                    statusFilter === "all"
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
                  }`}
                  onClick={() => setStatusFilter("all")}
                >
                  عرض الكل ({dashboardPlayers.length})
                </button>

                {statusFilter !== "all" && (
                  <button
                    type="button"
                    onClick={() => setStatusFilter("all")}
                    className="shrink-0 flex items-center gap-1 rounded-xl bg-red-50 border border-red-200 px-2.5 py-1 text-xs font-black text-red-700 active-press cursor-pointer"
                  >
                    <span>إلغاء الفلتر</span>
                    <span className="text-[10px] bg-red-200/60 rounded-full h-4 w-4 flex items-center justify-center">✕</span>
                  </button>
                )}

                {partialCount > 0 && (
                  <button
                    type="button"
                    className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all active-press min-h-[34px] cursor-pointer touch-manipulation ${
                      statusFilter === "partially_paid"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-white text-amber-800 border border-amber-300 hover:bg-amber-50"
                    }`}
                    onClick={() => setStatusFilter(statusFilter === "partially_paid" ? "all" : "partially_paid")}
                  >
                    <Clock className="h-3 w-3 text-amber-600" />
                    <span>دفع جزئي ({partialCount})</span>
                  </button>
                )}

                {purchasesDebtCount > 0 && (
                  <button
                    type="button"
                    className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all active-press min-h-[34px] cursor-pointer touch-manipulation ${
                      statusFilter === "purchases_debt"
                        ? "bg-amber-600 text-white shadow-xs"
                        : "bg-white text-amber-900 border border-amber-300 hover:bg-amber-50"
                    }`}
                    onClick={() => setStatusFilter(statusFilter === "purchases_debt" ? "all" : "purchases_debt")}
                  >
                    <ShoppingBag className="h-3 w-3 text-amber-600" />
                    <span>متبقي أدوات ({purchasesDebtCount})</span>
                  </button>
                )}

                {todayBirthdaysCount > 0 && (
                  <button
                    type="button"
                    className={`shrink-0 flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-black transition-all active-press min-h-[34px] cursor-pointer touch-manipulation ${
                      mobileTab === "birthdays"
                        ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xs"
                        : "bg-white text-rose-700 border border-rose-200/80 hover:bg-rose-50"
                    }`}
                    onClick={() => {
                      setMobileTab(mobileTab === "birthdays" ? "players" : "birthdays");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  >
                    <Cake className="h-3 w-3" />
                    <span>أعياد الميلاد ({todayBirthdaysCount})</span>
                  </button>
                )}
              </div>

              {/* نافذة الفلاتر السفلية المنبثقة للموبايل (Mobile Bottom Sheet) */}
              {showMobileFilters && (
                <div
                  className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 p-0 sm:p-4 backdrop-blur-xs animate-backdrop"
                  onClick={() => setShowMobileFilters(false)}
                >
                  <div
                    className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl border border-slate-200/90 bg-white p-5 shadow-2xl space-y-4 animate-bottom-sheet sm:animate-fade-in-scale pb-safe"
                    onClick={(e) => e.stopPropagation()}
                    dir="rtl"
                  >
                    {/* مقبض السحب للموبايل */}
                    <div className="sheet-drag-handle sm:hidden" />

                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-50 text-red-600 border border-red-200">
                          <SlidersHorizontal className="h-4 w-4" />
                        </div>
                        <span className="font-cairo text-sm font-black text-slate-900">خيارات متقدمة وتاريخ الحصة</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMobileFilters(false)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 hover:bg-slate-200 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-extrabold text-slate-600">تاريخ الحصة</span>
                        <input
                          type="date"
                          max={today}
                          value={sessionDate}
                          onChange={(e) => { if (e.target.value <= today) setSessionDate(e.target.value); }}
                          className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-base sm:text-xs font-bold text-slate-800 outline-none focus:border-red-500 focus:bg-white"
                        />
                      </label>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-extrabold text-slate-600">شهر الاشتراك</span>
                        <input
                          type="month"
                          value={paymentMonth}
                          onChange={(e) => setPaymentMonth(e.target.value)}
                          className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-base sm:text-xs font-bold text-slate-800 outline-none focus:border-red-500 focus:bg-white"
                        />
                      </label>
                    </div>

                    <div>
                      <label className="flex flex-col gap-1.5">
                        <span className="text-xs font-extrabold text-slate-600">ترتيب عرض اللاعبين</span>
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="h-11 rounded-xl border border-slate-200 bg-slate-50 px-3 text-base sm:text-xs font-bold text-slate-800 outline-none focus:border-red-500 focus:bg-white cursor-pointer"
                        >
                          <option value="newest">الأحدث تسجيلاً (افتراضي)</option>
                          <option value="alphabetical">الاسم أبجدياً (أ - ي)</option>
                          <option value="oldest">الأقدم تسجيلاً</option>
                          <option value="age-asc">السن: الأصغر أولاً</option>
                          <option value="age-desc">السن: الأكبر أولاً</option>
                          <option value="unpaid-first">متأخرو اشتراك الشهر أولاً</option>
                          <option value="purchases-debt-first">متبقي الأدوات والمشتريات أولاً</option>
                          <option value="attendance-desc">الأعلى التزاماً بالحضور</option>
                        </select>
                      </label>
                    </div>

                    <div className="flex items-center gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          handleExportAll();
                          setShowMobileFilters(false);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-emerald-200 bg-emerald-50 text-xs font-black text-emerald-700 active:scale-95 transition cursor-pointer"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>تصدير كشف Excel</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          toggleFilteredSelection();
                          setShowMobileFilters(false);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border border-slate-200 bg-slate-50 text-xs font-black text-slate-700 active:scale-95 transition cursor-pointer"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        <span>تحديد كل المعروض</span>
                      </button>
                    </div>

                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => setShowMobileFilters(false)}
                        className="w-full h-11 rounded-xl bg-slate-900 font-cairo text-xs font-black text-white active:scale-98 transition cursor-pointer"
                      >
                        تطبيق وإغلاق
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


          {/* محتوى تبويب الإحصائيات على الموبايل */}
          {mobileTab === "stats" && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="font-cairo text-base font-black text-slate-900">إحصائيات الأكاديمية والالتزام</h2>
                <span className="text-xs font-bold text-slate-500">{branch}</span>
              </div>
              <StatsGrid
                players={players}
                branches={branches}
                branch={branch}
                sessionDate={sessionDate}
                paymentMonth={paymentMonth}
                paymentMonthLabel={paymentMonthLabel}
              />
            </div>
          )}

          {/* محتوى تبويب الصالات على الموبايل */}
          {mobileTab === "branches" && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <h2 className="font-cairo text-base font-black text-slate-900">صالات وفروع الأكاديمية ({branches.length})</h2>
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
                onMarkPresent={markBranchPresent}
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
                  <ArrowRight className="h-3.5 w-3.5 text-slate-500" />
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
                showToast={showToast}
              />
            </div>
          )}
        </div>

        {/* ━━━ شريط التبديل العلوي على الديسكتوب بين اللاعبين والفعاليات ━━━ */}
        <div className="hidden md:flex items-center gap-2 mb-4">
          <button
            type="button"
            onClick={() => setActiveView("players")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeView === "players"
                ? "bg-slate-900 text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            <Users className="h-4 w-4" />
            <span>اللاعبين والاشتراكات الشهرية ({players.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveView("events")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
              activeView === "events"
                ? "bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/20"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>الفعاليات والرحلات ({events.length})</span>
          </button>
        </div>

        {/* عرض الفعاليات على الديسكتوب */}
        {activeView === "events" && (
          <div className="hidden md:block mb-8">
            <EventsView
              events={events}
              players={players}
              branches={branches}
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
              showToast={showToast}
            />
          </div>
        )}

        {/* ━━━ Hero Banner (على الديسكتوب فقط) ━━━ */}
        <div className={activeView === "players" ? "hidden md:block relative overflow-hidden rounded-3xl border border-slate-200/60 bg-white p-5 shadow-md sm:p-7" : "hidden"}>
          {/* Decorative gradient blobs */}
          <div className="pointer-events-none absolute -top-10 -left-10 h-40 w-40 rounded-full bg-red-500/6 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-8 left-1/2 h-32 w-64 -translate-x-1/2 rounded-full bg-slate-200/40 blur-2xl" />
          {/* Top gradient accent line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] rounded-t-3xl bg-gradient-to-r from-red-600 via-rose-500 to-amber-500" />

          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 min-w-0">
              <p className="section-eyebrow mb-2">لوحة تحكم الأكاديمية</p>
              <h2 className="font-cairo text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                أهلاً يا كابتن{" "}
                <span className="gradient-text-brand">{captainName}</span>
                {" "}🥋
              </h2>
              <p className="mt-2 text-sm font-medium text-slate-500 max-w-lg leading-relaxed">
                إدارة فورية ودقيقة لحضور واشتراكات اللاعبين في مختلف الصالات.
              </p>

              {/* Micro-stat pills */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600 shadow-xs">
                  <span className="h-2 w-2 rounded-full bg-red-500" />
                  {players.length} لاعب مسجل
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-[11px] font-bold text-emerald-700 shadow-xs">
                  <Building2 className="h-3 w-3" />
                  {branches.length} صالة نشطة
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-500 shadow-xs">
                  الصالة: <strong className="font-black text-slate-900">{branch}</strong>
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex shrink-0 flex-col gap-2.5 sm:items-end">
              <button
                type="button"
                id="add-player-hero-btn"
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-3 text-sm font-black text-white shadow-lg shadow-red-500/25 transition-all hover:brightness-110 hover:shadow-xl hover:shadow-red-500/30 active:scale-95"
                onClick={() => setShowForm(true)}
              >
                <Plus className="h-4 w-4" />
                <span>تسجيل لاعب جديد</span>
              </button>
              <span className="text-[10px] font-medium text-slate-400 text-center">
                {sessionDate}
              </span>
            </div>
          </div>
        </div>

        {/* ━━━ لوحات اللاعبين والتحضير (على الديسكتوب) ━━━ */}
        <div className={activeView === "players" ? "contents" : "hidden"}>
          {/* تذكار أعياد ميلاد أبطال الأكاديمية للكابتن (على الديسكتوب فقط) */}
          <div className="hidden md:block">
            <BirthdayReminder
              players={players}
              branches={branches}
              captainName={captainName}
              onOpenPlayer={(player) => setSelected(player)}
            />
          </div>

        {/* شبكة الإحصائيات ورسوم الحضور البيانية (على الديسكتوب فقط) */}
        <div className="hidden md:block">
          <StatsGrid
            players={players}
            branches={branches}
            branch={branch}
            sessionDate={sessionDate}
            paymentMonth={paymentMonth}
            paymentMonthLabel={paymentMonthLabel}
          />
        </div>

        {/* استعراض الصالات والفروع (على الديسكتوب فقط) */}
        <div className="hidden md:block">
          <BranchOverview
            branches={branches}
            players={players}
            sessionDate={sessionDate}
            paymentMonth={paymentMonth}
            busyBranch={busyBranch}
            onSelectBranch={handleSelectBranch}
            onMarkPresent={markBranchPresent}
          />
        </div>

        {/* ━━━ Player List Header ━━━ */}
        <div
          ref={playerListRef}
          className="hidden md:flex mt-8 flex-wrap items-center justify-between gap-3 scroll-mt-20"
        >
          <div className="flex items-center gap-2.5">
            <p className="section-eyebrow">قائمة لاعبي الأكاديمية</p>
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-black text-red-600 ring-1 ring-red-200/60">
              {filteredPlayers.length} لاعب
            </span>
            {filteredPlayers.length > 0 && (
              <button
                type="button"
                className="rounded-xl border border-slate-200/80 bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-xs transition-all hover:border-red-200 hover:text-red-600 active:scale-95 cursor-pointer"
                onClick={toggleFilteredSelection}
              >
                تحديد الكل
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportAll}
              title="تصدير كشف اللاعبين الحالي إلى Excel / CSV"
              className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50/80 px-3.5 py-2 text-xs font-bold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">تصدير Excel</span>
            </button>

            <button
              type="button"
              id="add-player-list-btn"
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-xs font-extrabold text-red-600 transition-all hover:bg-red-600 hover:text-white hover:shadow-sm active:scale-95 cursor-pointer"
              onClick={() => setShowForm(true)}
            >
              <Plus className="h-3.5 w-3.5" />
              <span>تسجيل لاعب جديد</span>
            </button>
          </div>
        </div>

        {/* ━━━ Control Panel (على الديسكتوب فقط) ━━━ */}
        <div className="hidden md:flex mt-3.5 flex-col gap-2.5 rounded-2xl border border-slate-200/60 bg-white p-3.5 shadow-md lg:flex-row lg:items-center lg:gap-3">
          {/* حقل البحث */}
          <div className="relative flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 transition-all focus-within:border-red-500 focus-within:bg-white focus-within:ring-3 focus-within:ring-red-100 lg:w-80">
            <Search className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 font-medium"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم اللاعب..."
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="text-xs text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            )}
          </div>

          {/* تبويبات الصالات */}
          <div className="min-w-0 flex-1 overflow-x-auto scrollbar-none">
            <div className="flex min-w-max items-center gap-1.5 py-1">
              <button
                type="button"
                className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                  branch === "كل الصالات"
                    ? "bg-red-600 text-white shadow-xs shadow-red-500/20"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                }`}
                onClick={() => setBranch("كل الصالات")}
              >
                كل الصالات
              </button>
              {branches.map((item) => (
                <button
                  type="button"
                  key={item._id}
                  className={`whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    branch === item.name
                      ? "bg-red-600 text-white shadow-xs shadow-red-500/20"
                      : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
                  }`}
                  onClick={() => setBranch(item.name)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          {/* أزرار إدارة الصالات */}
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {isAddingBranch ? (
              <form
                onSubmit={handleQuickBranchSubmit}
                className="flex w-full min-w-0 flex-col gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 p-1.5 sm:w-auto sm:flex-row sm:items-center"
              >
                <input
                  value={quickBranchName}
                  onChange={(e) => setQuickBranchName(e.target.value)}
                  placeholder="اسم الصالة..."
                  className="h-10 min-w-0 flex-1 rounded-lg border border-emerald-300 bg-white px-3 text-right text-xs font-bold text-slate-900 outline-none transition focus:ring-2 focus:ring-emerald-200 sm:w-40"
                  autoFocus
                  required
                />
                <button
                  className="min-h-10 whitespace-nowrap rounded-lg bg-emerald-600 px-3 text-xs font-bold text-white shadow-xs hover:bg-emerald-700"
                  type="submit"
                >
                  حفظ
                </button>
                <button
                  className="min-h-10 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-slate-600"
                  type="button"
                  onClick={() => setIsAddingBranch(false)}
                >
                  إلغاء
                </button>
              </form>
            ) : (
              <button
                type="button"
                className="flex min-h-10 items-center justify-center gap-1 whitespace-nowrap rounded-xl border border-emerald-200 bg-emerald-50/70 px-3.5 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                onClick={() => setIsAddingBranch(true)}
              >
                <span>＋</span>
                <span>صالة جديدة</span>
              </button>
            )}

            <button
              type="button"
              className="flex min-h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-3.5 text-xs font-bold text-slate-700 shadow-2xs transition hover:border-slate-300 hover:bg-slate-50"
              onClick={() => setShowBranches(true)}
            >
              <span>⚙️</span>
              <span>إدارة الفروع</span>
            </button>
          </div>
        </div>

        {/* ━━━ Date Controls & Sort Strip (على الديسكتوب فقط) ━━━ */}
        <div className="hidden md:grid mt-2.5 gap-2.5 rounded-2xl border border-slate-200/60 bg-white p-3.5 shadow-md sm:grid-cols-3">
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500">
              <CalendarDays className="h-3.5 w-3.5 text-red-500" />
              تاريخ الحصة
            </span>
            <input
              className="min-h-10 w-full rounded-xl border border-slate-200/70 bg-slate-50/60 px-3.5 text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
              type="date"
              max={today}
              value={sessionDate}
              onChange={(event) => {
                if (event.target.value <= today)
                  setSessionDate(event.target.value);
              }}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500">
              <CreditCard className="h-3.5 w-3.5 text-red-500" />
              شهر الاشتراك
            </span>
            <input
              className="min-h-10 w-full rounded-xl border border-slate-200/70 bg-slate-50/60 px-3.5 text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
              type="month"
              value={paymentMonth}
              onChange={(event) => setPaymentMonth(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-slate-500">
              <ArrowUpDown className="h-3.5 w-3.5 text-red-500" />
              ترتيب القائمة
            </span>
            <select
              className="min-h-10 w-full rounded-xl border border-slate-200/70 bg-slate-50/60 px-3.5 text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 cursor-pointer"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">الأحدث تسجيلاً (افتراضي)</option>
              <option value="alphabetical">الاسم أبجدياً (أ - ي)</option>
              <option value="oldest">الأقدم تسجيلاً</option>
              <option value="age-asc">السن: الأصغر أولاً</option>
              <option value="age-desc">السن: الأكبر أولاً</option>
              <option value="unpaid-first">متأخرو اشتراك الشهر أولاً</option>
              <option value="purchases-debt-first">متبقي الأدوات والمشتريات أولاً</option>
              <option value="attendance-desc">الأعلى التزاماً بالحضور</option>
            </select>
          </label>
        </div>

        {/* ━━━ Status Filters (على الديسكتوب فقط) ━━━ */}
        <div className="hidden md:flex mt-2.5 flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/60 bg-white p-2.5 shadow-md sm:gap-2">
          <span className="px-2 text-xs font-extrabold text-slate-400">
            فلترة سريعة:
          </span>
          <button
            type="button"
            className={`min-h-9 rounded-xl px-3 text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "all"
                ? "bg-slate-900 text-white shadow-xs"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60"
            }`}
            onClick={() => setStatusFilter("all")}
          >
            الكل
          </button>
          <button
            type="button"
            className={`flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "present"
                ? "bg-emerald-600 text-white shadow-xs shadow-emerald-500/20"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60"
            }`}
            onClick={() => setStatusFilter("present")}
          >
            <Check className="h-3 w-3" strokeWidth={2.5} />
            <span>حاضر</span>
            <span className="rounded-full bg-white/30 px-1.5 text-[10px] font-black">{presentToday}</span>
          </button>
          <button
            type="button"
            className={`flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "absent"
                ? "bg-rose-600 text-white shadow-xs shadow-rose-500/20"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60"
            }`}
            onClick={() => setStatusFilter("absent")}
          >
            <X className="h-3 w-3" strokeWidth={2.5} />
            <span>غائب</span>
            <span className="rounded-full bg-white/30 px-1.5 text-[10px] font-black">{absentToday}</span>
          </button>
          <button
            type="button"
            className={`flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "paid"
                ? "bg-sky-600 text-white shadow-xs shadow-sky-500/20"
                : "bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200/60"
            }`}
            onClick={() => setStatusFilter("paid")}
          >
            <CreditCard className="h-3 w-3" />
            <span>اشتراك مسدد</span>
            <span className="rounded-full bg-white/30 px-1.5 text-[10px] font-black">{paidCount}</span>
          </button>
          {partialCount > 0 && (
            <button
              type="button"
              className={`flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all cursor-pointer ${
                statusFilter === "partially_paid"
                  ? "bg-amber-600 text-white shadow-xs shadow-amber-500/20"
                  : "bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-300"
              }`}
              onClick={() => setStatusFilter("partially_paid")}
            >
              <Clock className="h-3 w-3 text-amber-600" />
              <span>اشتراك جزئي</span>
              <span className="rounded-full bg-white/40 px-1.5 text-[10px] font-black">{partialCount}</span>
            </button>
          )}
          <button
            type="button"
            className={`flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "unpaid"
                ? "bg-rose-600 text-white shadow-xs shadow-rose-500/20"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60"
            }`}
            onClick={() => setStatusFilter("unpaid")}
          >
            <Clock className="h-3 w-3" />
            <span>متأخرات اشتراك الشهر</span>
            <span className="rounded-full bg-white/30 px-1.5 text-[10px] font-black">{totalPendingPaymentCount}</span>
          </button>

          {purchasesDebtCount > 0 && (
            <button
              type="button"
              className={`flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-black transition-all cursor-pointer ${
                statusFilter === "purchases_debt"
                  ? "bg-amber-600 text-white shadow-xs shadow-amber-500/20 ring-2 ring-amber-300"
                  : "bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-300"
              }`}
              onClick={() => setStatusFilter("purchases_debt")}
            >
              <ShoppingBag className="h-3.5 w-3.5 text-amber-600" />
              <span>متبقي أدوات / مشتريات</span>
              <span className="rounded-full bg-white/40 px-1.5 text-[10px] font-black">{purchasesDebtCount}</span>
            </button>
          )}

          {todayBirthdaysCount > 0 && (
            <button
              type="button"
              className={`flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-black transition-all cursor-pointer ${
                statusFilter === "birthday"
                  ? "bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xs shadow-rose-500/20"
                  : "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60"
              }`}
              onClick={() => setStatusFilter("birthday")}
            >
              <Cake className="h-3 w-3" />
              <span>أعياد الميلاد</span>
              <span className="rounded-full bg-white/30 px-1.5 text-[10px] font-black">{todayBirthdaysCount}</span>
            </button>
          )}
        </div>

        {/* Toast placeholder removed — now rendered as fixed overlay near </main> */}

        {/* شريط الإجراءات الجماعية العائم الفاخر (Floating Bulk Dock) */}
        {selectedPlayerIds.length > 0 && (
          <div className="fixed bottom-22 md:bottom-6 left-1/2 -translate-x-1/2 z-40 md:z-50 glass-dock text-white rounded-2xl shadow-2xl border border-white/15 p-2.5 sm:px-5 flex items-center justify-between gap-2.5 animate-slide-up max-w-4xl w-[96%] sm:w-[94%] mb-safe">
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-white shrink-0">
              <span className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-red-600 font-cairo text-xs sm:text-sm font-black text-white shadow-xs">
                {selectedPlayerIds.length}
              </span>
              <span className="hidden xs:inline text-[11px] sm:text-xs">محدد</span>
            </div>

            <div className="min-w-0 flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 touch-scroll">
              <button
                type="button"
                className="min-h-9 whitespace-nowrap rounded-xl bg-white/10 px-2.5 text-xs font-bold text-slate-200 hover:bg-white/20 transition-all cursor-pointer active-press"
                onClick={toggleFilteredSelection}
              >
                الكل
              </button>
              <button
                type="button"
                className="flex items-center gap-1 whitespace-nowrap min-h-9 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 text-xs font-black text-white shadow-xs hover:brightness-110 active-press disabled:opacity-60 cursor-pointer"
                disabled={bulkAttendanceBusy}
                onClick={() => markSelectedAttendance("present")}
              >
                <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span>حضور</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-1 whitespace-nowrap min-h-9 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-3 text-xs font-black text-white shadow-xs hover:brightness-110 active-press disabled:opacity-60 cursor-pointer"
                disabled={bulkAttendanceBusy}
                onClick={() => markSelectedAttendance("absent")}
              >
                <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                <span>غياب</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-1 whitespace-nowrap min-h-9 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-3 text-xs font-black text-white shadow-xs hover:brightness-110 active-press disabled:opacity-60 cursor-pointer"
                disabled={bulkAttendanceBusy}
                onClick={() => markSelectedPayment("paid")}
              >
                <CreditCard className="h-3.5 w-3.5" />
                <span>دفع</span>
              </button>
              <button
                type="button"
                className="min-h-9 whitespace-nowrap rounded-xl bg-white/10 px-2.5 text-xs font-bold text-slate-300 hover:bg-white/20 transition-all disabled:opacity-60 cursor-pointer active-press"
                disabled={bulkAttendanceBusy}
                onClick={() => markSelectedPayment("unpaid")}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleExportSelected}
                className="flex items-center gap-1 whitespace-nowrap min-h-9 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 px-2.5 text-xs font-bold text-white shadow-xs transition-all active-press cursor-pointer"
                title="تصدير كشف Excel"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Excel</span>
              </button>
              <button
                type="button"
                className="min-h-9 rounded-xl border border-white/20 px-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all cursor-pointer active-press shrink-0"
                onClick={() => setSelectedPlayerIds([])}
                title="إلغاء التحديد"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
        </div>

        {/* ━━━ Player Table & Pagination Container ━━━ */}
        <div className={activeView === "events" ? (mobileTab === "players" ? "block md:hidden" : "hidden") : (mobileTab === "players" ? "block" : "hidden md:block")}>
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
                onClick={toggleFilteredSelection}
                className="text-[11px] font-black text-slate-600 hover:text-red-600 bg-white border border-slate-200 rounded-lg px-2.5 py-1 active-press cursor-pointer"
              >
                {selectedPlayerIds.length === filteredPlayers.length ? "إلغاء التحديد" : "تحديد المعروض"}
              </button>
            )}
          </div>
          <div className="mt-4 overflow-visible rounded-2xl border-0 bg-transparent shadow-none md:overflow-hidden md:border md:border-slate-200/60 md:bg-white md:shadow-md">
            <div className="hidden grid-cols-[2fr_0.6fr_1fr_1.4fr_1.8fr_0.4fr] gap-4 border-b border-slate-100 bg-slate-50/90 px-6 py-3.5 font-cairo text-xs font-extrabold text-slate-400 md:grid">
              <span>اللاعب</span>
              <span>العمر</span>
              <span>الفرع</span>
              <span>تسجيل الحضور</span>
              <span>الاشتراك والمشتريات</span>
              <span></span>
            </div>

            {loading ? (
              <>
                {/* Mobile loading skeleton – matches the PlayerRow mobile card layout */}
                <div className="md:hidden space-y-2.5">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-xs">
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
                  className="mt-1 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-xs font-black text-white shadow-xs shadow-red-500/20 hover:brightness-110 active:scale-95 cursor-pointer"
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

      {/* شريط الملاحة السفلي الثابت على الموبايل */}
      <MobileBottomNav
        activeTab={mobileTab}
        onChangeTab={(tab) => {
          setMobileTab(tab);
          if (tab === "events") {
            setActiveView("events");
          } else if (tab === "players") {
            setActiveView("players");
          }
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
        onOpenAddPlayer={() => setShowForm(true)}
        birthdayCount={todayBirthdaysCount}
        playersCount={players.length}
        branchesCount={branches.length}
        eventsCount={events.length}
      />

      {showForm && (
        <AddPlayerModal
          branches={branches}
          initialBranch={branch === "كل الصالات" ? "" : branch}
          onClose={() => setShowForm(false)}
          onAdd={handleAddPlayer}
          onManageBranches={() => {
            setShowForm(false);
            setShowBranches(true);
          }}
        />
      )}

      {showBranches && (
        <BranchManager
          branches={branches}
          players={players}
          onAdd={addBranch}
          onRename={renameBranch}
          onDelete={deleteBranch}
          onDeleteBlocked={handleBlockedBranchDelete}
          notice={toast?.type === "error" ? toast.message : ""}
          onClose={() => setShowBranches(false)}
        />
      )}

      {selected && (
        <Profile
          player={selected}
          branches={branches}
          onClose={() => setSelected(null)}
          onUpdate={updatePlayer}
          onDelete={deletePlayer}
          paymentMonth={paymentMonth}
          events={events}
        />
      )}

      {showAddEventModal && (
        <AddEventModal
          isOpen={showAddEventModal}
          initialEvent={editingEvent}
          onClose={() => {
            setShowAddEventModal(false);
            setEditingEvent(null);
          }}
          onSave={handleSaveEvent}
          isSubmitting={eventActionBusy}
        />
      )}

      {addParticipantsEvent && (
        <AddParticipantsModal
          isOpen={Boolean(addParticipantsEvent)}
          event={addParticipantsEvent}
          players={players}
          branches={branches}
          onClose={() => setAddParticipantsEvent(null)}
          onAddParticipants={handleAddParticipants}
          isSubmitting={eventActionBusy}
        />
      )}

      {paymentParticipantData && (
        <EventPaymentModal
          isOpen={Boolean(paymentParticipantData)}
          participant={paymentParticipantData.participant}
          eventTitle={paymentParticipantData.event?.title}
          onClose={() => setPaymentParticipantData(null)}
          onSavePayment={handleSaveParticipantPayment}
          isSubmitting={eventActionBusy}
        />
      )}
      {/* ━━━ Global Fixed Toast Notification Overlay ━━━
           Always visible on every tab and scroll position.
           Positioned below the sticky header, above all content.
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {toast && (
        <div
          className={`fixed top-[66px] md:top-[80px] left-1/2 -translate-x-1/2 z-[70]
            w-[calc(100%-32px)] max-w-md
            flex cursor-pointer items-center justify-between gap-2.5
            rounded-2xl border px-4 py-3 text-xs font-bold
            shadow-xl backdrop-blur-sm animate-slide-up ${
            toast.type === "error"
              ? "border-rose-200 bg-rose-50/97 text-rose-800"
              : toast.type === "info"
              ? "border-sky-200 bg-sky-50/97 text-sky-800"
              : "border-emerald-200 bg-emerald-50/97 text-emerald-800"
          }`}
          onClick={() => setToast(null)}
          role="alert"
          aria-live="polite"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                toast.type === "error"
                  ? "bg-rose-100 text-rose-600"
                  : toast.type === "info"
                  ? "bg-sky-100 text-sky-600"
                  : "bg-emerald-100 text-emerald-600"
              }`}
            >
              {toast.type === "error" ? (
                <AlertCircle className="h-4 w-4" />
              ) : toast.type === "info" ? (
                <Info className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
            </span>
            <span className="font-extrabold min-w-0 leading-snug">{toast.message}</span>
          </div>
          <button
            type="button"
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:bg-black/5 transition-colors"
            aria-label="إغلاق الإشعار"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </main>
  );
}
