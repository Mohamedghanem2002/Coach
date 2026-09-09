"use client";
import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  localDate,
  normalizePlayer,
  paymentStatusFor,
} from "../lib/dashboard-utils";

import BranchManager from "../components/dashboard/BranchManager";
import PlayerRow from "../components/dashboard/PlayerRow";
import Profile from "../components/dashboard/Profile";
import Header from "../components/dashboard/Header";
import StatsGrid from "../components/dashboard/StatsGrid";
import AddPlayerModal from "../components/dashboard/AddPlayerModal";
import BranchOverview from "../components/dashboard/BranchOverview";
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
  const [notice, setNotice] = useState("");
  const [showBranches, setShowBranches] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [sessionDate, setSessionDate] = useState(today);
  const [paymentMonth, setPaymentMonth] = useState(currentMonth);
  const [quickBranchName, setQuickBranchName] = useState("");
  const [isAddingBranch, setIsAddingBranch] = useState(false);
  const [busyBranch, setBusyBranch] = useState("");
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [bulkAttendanceBusy, setBulkAttendanceBusy] = useState(false);
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
    ])
      .then(async ([playersResponse, branchesResponse]) => {
        if (playersResponse.status === 401 || branchesResponse.status === 401) {
          router.push("/auth/signin");
          return;
        }
        if (!playersResponse.ok || !branchesResponse.ok) throw new Error();
        const [playersData, branchesData] = await Promise.all([
          playersResponse.json(),
          branchesResponse.json(),
        ]);
        if (!cancelled) {
          setPlayers(playersData.map(normalizePlayer));
          setBranches(branchesData);
        }
      })
      .catch(() => {
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
  useEffect(() => {
    if (notice) {
      const timer = setTimeout(() => {
        setNotice("");
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [notice]);
  const filteredPlayers = useMemo(
    () =>
      players.filter((player) => {
        const matchesBranch =
          branch === "كل الصالات" || player.branch === branch;
        const record = player.attendance.find(
          (item) => item.date === sessionDate,
        );
        const matchesStatus =
          statusFilter === "all" ||
          (statusFilter === "present" &&
            (record === null || record === void 0 ? void 0 : record.status) ===
              "present") ||
          (statusFilter === "absent" &&
            (record === null || record === void 0 ? void 0 : record.status) ===
              "absent") ||
          (statusFilter === "paid" &&
            paymentStatusFor(player, paymentMonth) === "paid") ||
          (statusFilter === "unpaid" &&
            paymentStatusFor(player, paymentMonth) === "unpaid");
        return (
          matchesBranch &&
          matchesStatus &&
          player.name.includes(deferredSearch.trim())
        );
      }),
    [players, branch, deferredSearch, statusFilter, sessionDate, paymentMonth],
  );
  const dashboardPlayers =
    branch === "كل الصالات"
      ? players
      : players.filter((player) => player.branch === branch);
  const paidCount = dashboardPlayers.filter(
    (player) => paymentStatusFor(player, paymentMonth) === "paid",
  ).length;
  const presentToday = dashboardPlayers.filter((player) =>
    player.attendance.some(
      (item) => item.date === sessionDate && item.status === "present",
    ),
  ).length;
  const absentToday = dashboardPlayers.filter((player) =>
    player.attendance.some(
      (item) => item.date === sessionDate && item.status === "absent",
    ),
  ).length;
  const unpaidCount = dashboardPlayers.length - paidCount;
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

  return (
    <main className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-red-500 selection:text-white pb-16" dir="rtl">
      <Header />

      <section className="mx-auto w-full max-w-7xl px-3.5 py-4 sm:px-6 sm:py-6 lg:px-8">
        {/* البانر الترحيبي الرئيسي */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-gradient-to-l from-white via-white to-red-50/40 p-5 shadow-2xs sm:p-7">
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-red-600 animate-pulse"></span>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-red-600">
                  لوحة تحكم الأكاديمية
                </p>
              </div>
              <h2 className="mt-1 font-cairo text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
                صباح الخير يا كابتن {captainName} 🥋
              </h2>
              <p className="mt-1.5 text-xs sm:text-sm font-medium text-slate-500 max-w-xl">
                إدارة فورية ودقيقة لحضور واشتراكات اللاعبين في مختلف الصالات بكل سهولة وسرعة.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/90 p-2.5 shadow-2xs backdrop-blur-md sm:min-w-[280px]">
              <div className="min-w-0 flex-1 px-1">
                <span className="block text-[10px] font-bold text-slate-400">
                  الصالة المحددة حالياً
                </span>
                <strong className="mt-0.5 block truncate font-cairo text-sm font-extrabold text-slate-900">
                  {branch}
                </strong>
              </div>
              <button
                type="button"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-2.5 text-xs font-black text-white shadow-xs shadow-red-500/20 transition-all hover:brightness-110 active:scale-95"
                onClick={() => setShowForm(true)}
              >
                <span>＋</span>
                <span>لاعب جديد</span>
              </button>
            </div>
          </div>
        </div>

        {/* شبكة الإحصائيات ورسوم الحضور البيانية */}
        <StatsGrid
          players={players}
          branches={branches}
          branch={branch}
          sessionDate={sessionDate}
          paymentMonth={paymentMonth}
          paymentMonthLabel={paymentMonthLabel}
        />

        {/* استعراض الصالات والفروع */}
        <BranchOverview
          branches={branches}
          players={players}
          sessionDate={sessionDate}
          paymentMonth={paymentMonth}
          busyBranch={busyBranch}
          onSelectBranch={handleSelectBranch}
          onMarkPresent={markBranchPresent}
        />

        {/* ترويسة قائمة اللاعبين */}
        <div
          ref={playerListRef}
          className="mt-8 flex flex-wrap items-center justify-between gap-3 scroll-mt-20 border-b border-slate-200/70 pb-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-100 text-red-600 text-sm font-black">
              🥋
            </div>
            <h2 className="font-cairo text-lg font-black text-slate-900 sm:text-xl">
              قائمة لاعبي الأكاديمية
            </h2>
            <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-black text-red-600 ring-1 ring-red-200/60">
              {filteredPlayers.length} لاعب
            </span>
            {filteredPlayers.length > 0 && (
              <button
                type="button"
                className="rounded-xl border border-slate-200/80 bg-white px-3 py-1 text-xs font-bold text-slate-600 shadow-2xs transition-all hover:border-red-200 hover:text-red-600 active:scale-95 cursor-pointer"
                onClick={toggleFilteredSelection}
              >
                تحديد الكل
              </button>
            )}
          </div>

          <button
            type="button"
            className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50/70 px-3.5 py-2 text-xs font-extrabold text-red-600 transition-all hover:bg-red-600 hover:text-white hover:shadow-sm active:scale-95 cursor-pointer"
            onClick={() => setShowForm(true)}
          >
            <span>＋</span>
            <span>تسجيل لاعب جديد</span>
          </button>
        </div>

        {/* شريط البحث والفلترة حسب الصالة */}
        <div className="mt-3.5 flex flex-col gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs lg:flex-row lg:items-center lg:gap-3">
          {/* حقل البحث */}
          <div className="relative flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 transition-all focus-within:border-red-500 focus-within:bg-white focus-within:ring-3 focus-within:ring-red-100 lg:w-80">
            <span className="text-base text-slate-400">⌕</span>
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

        {/* محددات تاريخ الحصة وشهر الدفع */}
        <div className="mt-2.5 grid gap-2.5 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs sm:grid-cols-2">
          <label className="flex items-center gap-2 text-xs font-extrabold text-slate-600">
            <span className="shrink-0 text-red-600">📅 تاريخ الحصة:</span>
            <input
              className="min-h-10 w-full rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
              type="date"
              max={today}
              value={sessionDate}
              onChange={(event) => {
                if (event.target.value <= today)
                  setSessionDate(event.target.value);
              }}
            />
          </label>
          <label className="flex items-center gap-2 text-xs font-extrabold text-slate-600">
            <span className="shrink-0 text-red-600">🗓️ شهر الدفع:</span>
            <input
              className="min-h-10 w-full rounded-xl border border-slate-200/80 bg-slate-50/70 px-3 text-xs font-bold text-slate-900 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
              type="month"
              value={paymentMonth}
              onChange={(event) => setPaymentMonth(event.target.value)}
            />
          </label>
        </div>

        {/* فلاتر الحالة (حاضر / غائب / مدفوع / لم يدفع) */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5 rounded-2xl border border-slate-200/80 bg-white p-2.5 shadow-2xs sm:gap-2">
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
            <span>✓ حاضر</span>
            <span className="rounded-full bg-white/30 px-1.5 text-[10px] font-black">
              {presentToday}
            </span>
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
            <span>× غائب</span>
            <span className="rounded-full bg-white/30 px-1.5 text-[10px] font-black">
              {absentToday}
            </span>
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
            <span>💳 مدفوع</span>
            <span className="rounded-full bg-white/30 px-1.5 text-[10px] font-black">
              {paidCount}
            </span>
          </button>
          <button
            type="button"
            className={`flex min-h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-bold transition-all cursor-pointer ${
              statusFilter === "unpaid"
                ? "bg-amber-600 text-white shadow-xs shadow-amber-500/20"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60"
            }`}
            onClick={() => setStatusFilter("unpaid")}
          >
            <span>⏳ لم يدفع</span>
            <span className="rounded-full bg-white/30 px-1.5 text-[10px] font-black">
              {unpaidCount}
            </span>
          </button>
        </div>

        {/* إشعار التنبيه المؤقت */}
        {notice && (
          <div
            className="mt-3 flex cursor-pointer items-center justify-between rounded-2xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-xs font-bold text-sky-800 shadow-xs animate-slide-up"
            onClick={() => setNotice("")}
          >
            <div className="flex items-center gap-2">
              <span className="text-base">🔔</span>
              <span>{notice}</span>
            </div>
            <span className="text-base text-sky-500 hover:text-sky-800">✕</span>
          </div>
        )}

        {/* شريط الإجراءات الجماعية العائم الفاخر (Floating Bulk Dock) */}
        {selectedPlayerIds.length > 0 && (
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 glass-dock text-white rounded-2xl shadow-2xl border border-white/15 p-3 sm:px-5 flex flex-wrap items-center justify-between gap-3 animate-slide-up max-w-4xl w-[94%]">
            <div className="flex items-center gap-2 text-xs font-extrabold text-white">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-red-600 font-cairo text-sm font-black text-white shadow-xs">
                {selectedPlayerIds.length}
              </span>
              <span>لاعبين محددين</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="min-h-9 rounded-xl bg-white/10 px-3 text-xs font-bold text-slate-200 hover:bg-white/20 transition-all cursor-pointer"
                onClick={toggleFilteredSelection}
              >
                تحديد الكل
              </button>
              <button
                type="button"
                className="min-h-9 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-3 text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-95 disabled:opacity-60 cursor-pointer"
                disabled={bulkAttendanceBusy}
                onClick={() => markSelectedAttendance("present")}
              >
                ✓ تسجيل حضور
              </button>
              <button
                type="button"
                className="min-h-9 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 px-3 text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-95 disabled:opacity-60 cursor-pointer"
                disabled={bulkAttendanceBusy}
                onClick={() => markSelectedAttendance("absent")}
              >
                × تسجيل غياب
              </button>
              <button
                type="button"
                className="min-h-9 rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 px-3 text-xs font-bold text-white shadow-xs hover:brightness-110 active:scale-95 disabled:opacity-60 cursor-pointer"
                disabled={bulkAttendanceBusy}
                onClick={() => markSelectedPayment("paid")}
              >
                💳 تسجيل دفع
              </button>
              <button
                type="button"
                className="min-h-9 rounded-xl bg-white/10 px-3 text-xs font-bold text-slate-300 hover:bg-white/20 transition-all disabled:opacity-60 cursor-pointer"
                disabled={bulkAttendanceBusy}
                onClick={() => markSelectedPayment("unpaid")}
              >
                إلغاء دفع
              </button>
              <button
                type="button"
                className="min-h-9 rounded-xl border border-white/20 px-3 text-xs font-bold text-slate-300 hover:bg-white/10 transition-all cursor-pointer"
                onClick={() => setSelectedPlayerIds([])}
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        {/* جدول وبطاقات اللاعبين */}
        <div className="mt-4 overflow-visible rounded-2xl border-0 bg-transparent shadow-none lg:overflow-hidden lg:border lg:border-slate-200/80 lg:bg-white lg:shadow-2xs">
          <div className="hidden grid-cols-[2.3fr_0.7fr_1.1fr_1.8fr_1.2fr_0.4fr] gap-4 border-b border-slate-200/80 bg-slate-50/80 px-6 py-3.5 font-cairo text-xs font-extrabold text-slate-500 lg:grid">
            <span>اللاعب</span>
            <span>العمر</span>
            <span>الفرع</span>
            <span>تسجيل الحضور</span>
            <span>حالة الاشتراك</span>
            <span></span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-3 px-6 py-20 text-center text-slate-400 bg-white rounded-2xl">
              <span className="text-4xl animate-bounce">⏳</span>
              <strong className="font-cairo text-lg font-black text-slate-800">
                جاري تحميل بيانات اللاعبين...
              </strong>
              <span className="text-xs">يرجى الانتظار لحظة.</span>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="flex flex-col items-center gap-3.5 px-6 py-20 text-center text-slate-400 bg-white rounded-2xl">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl text-red-600 shadow-xs">
                🥋
              </div>
              <strong className="font-cairo text-lg font-black text-slate-800">
                لا توجد نتائج مطابقة
              </strong>
              <span className="text-xs text-slate-500 max-w-sm">
                لم نجد أي لاعبين وفقاً للبحث أو الفلترة المحددة.
              </span>
              <button
                type="button"
                className="mt-2 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-5 py-2.5 text-xs font-black text-white shadow-xs shadow-red-500/20 hover:brightness-110 active:scale-95 cursor-pointer"
                onClick={() => setShowForm(true)}
              >
                <span>＋</span>
                <span>إضافة لاعب جديد</span>
              </button>
            </div>
          ) : (
            filteredPlayers.map((player) => (
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
      </section>


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
          onDelete={deleteBranch}
          onDeleteBlocked={handleBlockedBranchDelete}
          notice={notice}
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
        />
      )}
    </main>
  );
}
