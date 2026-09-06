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
  return (
    <main className="dashboard-container" dir="rtl">
      <Header />

      <section className="content">
        <div className="page-heading">
          <div>
            <h2>لوحة التحكم</h2>
            <p>
              بيانات <strong>{branch}</strong> · تابع لاعبي الأكاديمية وحضورهم
              ومدفوعاتهم من مكان واحد.
            </p>
          </div>
          <button className="primary-button" onClick={() => setShowForm(true)}>
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

        <div className="section-header">
          <div style={{ display: "flex", alignItems: "center" }}>
            <h2>قائمة اللاعبين</h2>
            <span className="count-pill">{filteredPlayers.length} لاعب</span>
          </div>
          <button className="outline-button" onClick={() => setShowForm(true)}>
            ＋ تسجيل لاعب
          </button>
        </div>

        <div className="toolbar">
          <div className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ابحث باسم اللاعب..."
            />
          </div>

          <div className="branch-filters-container">
            <div className="branch-filters">
              <button
                className={branch === "كل الصالات" ? "filter active" : "filter"}
                onClick={() => setBranch("كل الصالات")}
              >
                كل الصالات
              </button>
              {branches.map((item) => (
                <button
                  key={item._id}
                  className={branch === item.name ? "filter active" : "filter"}
                  onClick={() => setBranch(item.name)}
                >
                  {item.name}
                </button>
              ))}

              {isAddingBranch ? (
                <form
                  onSubmit={handleQuickBranchSubmit}
                  style={{
                    display: "inline-flex",
                    gap: "5px",
                    alignItems: "center",
                  }}
                >
                  <input
                    value={quickBranchName}
                    onChange={(e) => setQuickBranchName(e.target.value)}
                    placeholder="اسم الصالة..."
                    style={{
                      border: "1.5px solid var(--border)",
                      borderRadius: "var(--radius-sm)",
                      padding: "6px 10px",
                      fontSize: "11px",
                      outline: "none",
                      background: "#fff",
                      color: "var(--text-main)",
                    }}
                    autoFocus
                    required
                  />
                  <button
                    className="primary-button"
                    style={{
                      padding: "6px 12px",
                      fontSize: "11px",
                      boxShadow: "none",
                    }}
                    type="submit"
                  >
                    حفظ
                  </button>
                  <button
                    className="outline-button"
                    style={{ padding: "6px 12px", fontSize: "11px" }}
                    type="button"
                    onClick={() => setIsAddingBranch(false)}
                  >
                    إلغاء
                  </button>
                </form>
              ) : (
                <button
                  className="outline-button"
                  style={{
                    padding: "6px 12px",
                    fontSize: "11px",
                    color: "var(--green)",
                    borderColor: "var(--green-border)",
                  }}
                  onClick={() => setIsAddingBranch(true)}
                >
                  ＋ صالة
                </button>
              )}

              <button
                className="outline-button"
                style={{ padding: "6px 12px", fontSize: "11px" }}
                onClick={() => setShowBranches(true)}
              >
                ⚙️ الفروع
              </button>
            </div>
          </div>
        </div>

        <div className="control-strip">
          <label>
            📅 تاريخ الحصة
            <input
              type="date"
              max={today}
              value={sessionDate}
              onChange={(event) => {
                if (event.target.value <= today)
                  setSessionDate(event.target.value);
              }}
            />
          </label>
          <label>
            🗓️ شهر الدفع
            <input
              type="month"
              value={paymentMonth}
              onChange={(event) => setPaymentMonth(event.target.value)}
            />
          </label>
        </div>

        <div className="status-filters">
          <span>فلترة:</span>
          <button
            className={
              statusFilter === "all" ? "status-filter active" : "status-filter"
            }
            onClick={() => setStatusFilter("all")}
          >
            الكل
          </button>
          <button
            className={
              statusFilter === "present"
                ? "status-filter present active"
                : "status-filter present"
            }
            onClick={() => setStatusFilter("present")}
          >
            ✓ حاضر <b>{presentToday}</b>
          </button>
          <button
            className={
              statusFilter === "absent"
                ? "status-filter absent active"
                : "status-filter absent"
            }
            onClick={() => setStatusFilter("absent")}
          >
            × غائب <b>{absentToday}</b>
          </button>
          <button
            className={
              statusFilter === "paid"
                ? "status-filter paid active"
                : "status-filter paid"
            }
            onClick={() => setStatusFilter("paid")}
          >
            💰 دفع <b>{paidCount}</b>
          </button>
          <button
            className={
              statusFilter === "unpaid"
                ? "status-filter unpaid active"
                : "status-filter unpaid"
            }
            onClick={() => setStatusFilter("unpaid")}
          >
            ⏳ لم يدفع <b>{unpaidCount}</b>
          </button>
        </div>

        {notice && (
          <div className="notice" onClick={() => setNotice("")}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="notice-icon">🔔</span>
              <span>{notice}</span>
            </div>
            <span className="notice-close">×</span>
          </div>
        )}

        <div className="players-table">
          <div className="table-head">
            <span>اللاعب</span>
            <span>العمر</span>
            <span>الفرع</span>
            <span>الحضور</span>
            <span>الاشتراك</span>
            <span></span>
          </div>
          {loading ? (
            <div className="empty">
              <span style={{ fontSize: "32px" }}>⏳</span>
              <strong>جاري تحميل البيانات...</strong>
              <span>يرجى الانتظار لحظة.</span>
            </div>
          ) : filteredPlayers.length === 0 ? (
            <div className="empty">
              <span style={{ fontSize: "40px" }}>🥋</span>
              <strong>لا يوجد لاعبين هنا</strong>
              <span>ابدأ بإضافة أول لاعب للأكاديمية.</span>
              <button
                className="primary-button"
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
