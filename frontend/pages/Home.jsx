"use client";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
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
  const { status: sessionStatus } = useSession();
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
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900" dir="rtl">
      <Header />

      <section className="mx-auto w-full max-w-360 px-4 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-cairo text-2xl font-extrabold text-slate-900">
              لوحة التحكم
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              بيانات <strong>{branch}</strong> · تابع لاعبي الأكاديمية وحضورهم
              ومدفوعاتهم من مكان واحد.
            </p>
          </div>
          <button
            className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-red-100 transition hover:-translate-y-0.5 hover:bg-red-700"
            onClick={() => setShowForm(true)}
          >
            <span>＋</span> إضافة لاعب
          </button>
        </div>

        <StatsGrid
          players={players}
          branches={branches}
          branch={branch}
          sessionDate={sessionDate}
          paymentMonth={paymentMonth}
          paymentMonthLabel={paymentMonthLabel}
        />

        <BranchOverview
          branches={branches}
          players={players}
          sessionDate={sessionDate}
          paymentMonth={paymentMonth}
          busyBranch={busyBranch}
          onSelectBranch={setBranch}
          onMarkPresent={markBranchPresent}
        />

        <div className="mt-8 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="font-cairo text-lg font-bold text-slate-900">
              قائمة اللاعبين
            </h2>
            <span className="mr-2 rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-[10px] font-bold text-red-600">
              {filteredPlayers.length} لاعب
            </span>
            {filteredPlayers.length > 0 && (
              <button
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-slate-500 transition hover:border-red-200 hover:text-red-600"
                onClick={toggleFilteredSelection}
              >
                تحديد الكل
              </button>
            )}
          </div>
          <button
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-bold text-slate-600 shadow-sm transition hover:border-red-200 hover:text-red-600"
            onClick={() => setShowForm(true)}
          >
            ＋ تسجيل لاعب
          </button>
        </div>

        <div className="mt-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm lg:flex-row lg:items-center">
          <div className="flex min-h-11 min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 transition focus-within:border-red-500 focus-within:bg-white focus-within:ring-4 focus-within:ring-red-100 lg:w-72">
            <span className="text-lg text-slate-400">⌕</span>
            <input
              className="min-w-0 flex-1 bg-transparent px-1 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم اللاعب..."
            />
          </div>

          <div className="min-w-0 flex-1 overflow-x-auto scrollbar-none">
            <div className="flex min-w-max items-center gap-2 py-1">
              <button
                className={`whitespace-nowrap rounded-full border px-4 py-2 text-[11px] font-semibold transition ${branch === "كل الصالات" ? "border-red-200 bg-red-50 text-red-600" : "border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
                onClick={() => setBranch("كل الصالات")}
              >
                كل الصالات
              </button>
              {branches.map((item) => (
                <button
                  key={item._id}
                  className={`whitespace-nowrap rounded-full border px-4 py-2 text-[11px] font-semibold transition ${branch === item.name ? "border-red-200 bg-red-50 text-red-600" : "border-transparent bg-slate-50 text-slate-600 hover:bg-slate-100"}`}
                  onClick={() => setBranch(item.name)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            {isAddingBranch ? (
              <form
                onSubmit={handleQuickBranchSubmit}
                className="flex w-full min-w-0 flex-col gap-2 rounded-2xl border border-green-200 bg-green-50 p-2 sm:w-auto sm:flex-row sm:items-center"
              >
                <input
                  value={quickBranchName}
                  onChange={(e) => setQuickBranchName(e.target.value)}
                  placeholder="اسم الصالة..."
                  className="h-11 min-w-0 flex-1 rounded-xl border border-green-200 bg-white px-3 text-right text-sm text-slate-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-100 sm:w-40"
                  autoFocus
                  required
                />
                <button
                  className="w-full whitespace-nowrap rounded-xl bg-red-600 px-4 py-2 text-sm font-bold text-white shadow-sm sm:w-auto"
                  type="submit"
                >
                  حفظ
                </button>
                <button
                  className="w-full whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 sm:w-auto"
                  type="button"
                  onClick={() => setIsAddingBranch(false)}
                >
                  إلغاء
                </button>
              </form>
            ) : (
              <button
                className="w-full whitespace-nowrap rounded-xl border border-green-200 bg-green-50 px-4 py-2 text-sm font-bold text-green-700 shadow-sm hover:bg-green-100 sm:w-auto"
                onClick={() => setIsAddingBranch(true)}
              >
                ＋ صالة
              </button>
            )}

            <button
              className="w-full whitespace-nowrap rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm sm:w-auto"
              onClick={() => setShowBranches(true)}
            >
              ⚙️ الفروع
            </button>
          </div>
        </div>

        <div className="mt-3 grid gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:grid-cols-2">
          <label className="grid grid-cols-[auto_1fr] items-center gap-2 text-xs font-bold text-slate-500">
            📅 تاريخ الحصة
            <input
              className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
              type="date"
              max={today}
              value={sessionDate}
              onChange={(event) => {
                if (event.target.value <= today)
                  setSessionDate(event.target.value);
              }}
            />
          </label>
          <label className="grid grid-cols-[auto_1fr] items-center gap-2 text-xs font-bold text-slate-500">
            🗓️ شهر الدفع
            <input
              className="min-h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
              type="month"
              value={paymentMonth}
              onChange={(event) => setPaymentMonth(event.target.value)}
            />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <span className="w-full px-1 text-xs font-bold text-slate-500 sm:w-auto">
            فلترة:
          </span>
          <button
            className={`flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold transition ${statusFilter === "all" ? "border-slate-300 bg-slate-100 text-slate-900" : "border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
            onClick={() => setStatusFilter("all")}
          >
            الكل
          </button>
          <button
            className={`flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold transition ${statusFilter === "present" ? "border-green-200 bg-green-50 text-green-600" : "border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
            onClick={() => setStatusFilter("present")}
          >
            ✓ حاضر <b>{presentToday}</b>
          </button>
          <button
            className={`flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold transition ${statusFilter === "absent" ? "border-red-200 bg-red-50 text-red-600" : "border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
            onClick={() => setStatusFilter("absent")}
          >
            × غائب <b>{absentToday}</b>
          </button>
          <button
            className={`flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold transition ${statusFilter === "paid" ? "border-green-200 bg-green-50 text-green-600" : "border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
            onClick={() => setStatusFilter("paid")}
          >
            💰 دفع <b>{paidCount}</b>
          </button>
          <button
            className={`flex min-h-10 items-center gap-1.5 rounded-full border px-3 text-[11px] font-semibold transition ${statusFilter === "unpaid" ? "border-red-200 bg-red-50 text-red-600" : "border-transparent bg-slate-50 text-slate-500 hover:bg-slate-100"}`}
            onClick={() => setStatusFilter("unpaid")}
          >
            ⏳ لم يدفع <b>{unpaidCount}</b>
          </button>
        </div>

        {notice && (
          <div
            className="mt-3 flex cursor-pointer items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-xs font-semibold text-blue-700 shadow-sm"
            onClick={() => setNotice("")}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span>🔔</span>
              <span>{notice}</span>
            </div>
            <span className="text-lg">×</span>
          </div>
        )}

        {selectedPlayerIds.length > 0 && (
          <div className="mt-3 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-red-700">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-red-600 text-white">
                {selectedPlayerIds.length}
              </span>
              لاعب محدد
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                className="min-h-9 rounded-lg bg-white px-3 text-[11px] font-bold text-slate-600 ring-1 ring-slate-200"
                onClick={toggleFilteredSelection}
              >
                تحديد الكل في الفلترة
              </button>
              <button
                className="min-h-9 rounded-lg bg-green-600 px-3 text-[11px] font-bold text-white disabled:opacity-60"
                disabled={bulkAttendanceBusy}
                onClick={() => markSelectedAttendance("present")}
              >
                ✓ حاضر للمحدد
              </button>
              <button
                className="min-h-9 rounded-lg bg-red-600 px-3 text-[11px] font-bold text-white disabled:opacity-60"
                disabled={bulkAttendanceBusy}
                onClick={() => markSelectedAttendance("absent")}
              >
                × غياب للمحدد
              </button>
              <button
                className="min-h-9 rounded-lg border border-red-200 bg-white px-3 text-[11px] font-bold text-red-600"
                onClick={() => setSelectedPlayerIds([])}
              >
                إلغاء
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden grid-cols-[2.2fr_0.7fr_1fr_1.7fr_1.15fr_0.35fr] gap-4 border-b border-slate-100 bg-slate-50 px-6 py-4 text-[11px] font-bold text-slate-400 lg:grid">
            <span>اللاعب</span>
            <span>العمر</span>
            <span>الفرع</span>
            <span>الحضور</span>
            <span>الاشتراك</span>
            <span></span>
          </div>
          {loading ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-slate-400">
              <span className="text-3xl">⏳</span>
              <strong className="text-lg font-bold text-slate-900">
                جاري تحميل البيانات...
              </strong>
              <span className="text-sm">يرجى الانتظار لحظة.</span>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-6 py-16 text-center text-slate-400">
              <span className="text-4xl">🥋</span>
              <strong className="text-lg font-bold text-slate-900">
                لا يوجد لاعبين هنا
              </strong>
              <span className="text-sm">ابدأ بإضافة أول لاعب للأكاديمية.</span>
              <button
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-100"
                onClick={() => setShowForm(true)}
              >
                ＋ إضافة لاعب
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
