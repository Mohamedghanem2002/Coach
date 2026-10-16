"use client";
import { useState, useMemo, useDeferredValue, useEffect } from "react";
import {
  localDate,
  paymentStatusFor,
  getPaymentDetailsFor,
  getBirthdayInfo,
  getTodayBirthdays,
  getPurchasesSummary,
  isBranchWorkingDate,
  isPlayerPresentOnDate,
  isPlayerAbsentOnDate,
} from "../lib/dashboard-utils";

export const today = localDate();
export const currentMonth = today.slice(0, 7);

export function usePlayerFilters({ players, branches, congratulatedTick = 0 } = {}) {
  const [branch, setBranch] = useState("كل الصالات");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sessionDate, setSessionDate] = useState(today);
  const [paymentMonth, setPaymentMonth] = useState(currentMonth);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const deferredSearch = useDeferredValue(search);

  const paymentMonthLabel = useMemo(() => {
    try {
      return new Intl.DateTimeFormat("ar-EG", {
        month: "long",
        year: "numeric",
      }).format(new Date(`${paymentMonth}-01T00:00:00`));
    } catch {
      return paymentMonth;
    }
  }, [paymentMonth]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [branch, deferredSearch, statusFilter, sortBy]);

  const filteredPlayers = useMemo(() => {
    void congratulatedTick;
    return (players || []).filter((player) => {
      const matchesBranch =
        branch === "كل الصالات" || player.branch === branch;
      const isPresent = isPlayerPresentOnDate(player, sessionDate);
      const isAbsent = isPlayerAbsentOnDate(player, branches, sessionDate);
      const paymentDetails = getPaymentDetailsFor(player, paymentMonth);
      const purchasesSum = getPurchasesSummary(player);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "present" && isPresent) ||
        (statusFilter === "absent" && isAbsent) ||
        (statusFilter === "paid" &&
          paymentDetails.status === "paid") ||
        (statusFilter === "partially_paid" &&
          paymentDetails.status === "partially_paid") ||
        (statusFilter === "unpaid" &&
          paymentDetails.status !== "paid") ||
        (statusFilter === "purchases_debt" &&
          (purchasesSum.remainingAmount > 0 || purchasesSum.undeliveredCount > 0)) ||
        (statusFilter === "birthday" &&
          Boolean(
            getBirthdayInfo(player)?.isToday ||
            getBirthdayInfo(player)?.daysLeft === 1
          ));
      const q = deferredSearch.trim();
      const matchesSearch =
        !q ||
        player.name.includes(q) ||
        (player.fileNumber && String(player.fileNumber).includes(q)) ||
        (player.guardianPhone && String(player.guardianPhone).includes(q));
      return matchesBranch && matchesStatus && matchesSearch;
    });
  }, [
    players,
    branch,
    branches,
    deferredSearch,
    statusFilter,
    sessionDate,
    paymentMonth,
    congratulatedTick,
  ]);

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
          const aSum = getPurchasesSummary(a);
          const bSum = getPurchasesSummary(b);
          if (bSum.remainingAmount !== aSum.remainingAmount) {
            return bSum.remainingAmount - aSum.remainingAmount;
          }
          return bSum.undeliveredCount - aSum.undeliveredCount;
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

  const dashboardPlayers = useMemo(() => {
    return branch === "كل الصالات"
      ? (players || [])
      : (players || []).filter((player) => player.branch === branch);
  }, [players, branch]);

  const paidCount = useMemo(() => {
    return dashboardPlayers.filter(
      (player) => paymentStatusFor(player, paymentMonth) === "paid"
    ).length;
  }, [dashboardPlayers, paymentMonth]);

  const partialCount = useMemo(() => {
    return dashboardPlayers.filter(
      (player) => paymentStatusFor(player, paymentMonth) === "partially_paid"
    ).length;
  }, [dashboardPlayers, paymentMonth]);

  const unpaidCount = useMemo(() => {
    return dashboardPlayers.filter(
      (player) => paymentStatusFor(player, paymentMonth) === "unpaid"
    ).length;
  }, [dashboardPlayers, paymentMonth]);

  const totalPendingPaymentCount = unpaidCount + partialCount;

  const purchasesDebtCount = useMemo(() => {
    return dashboardPlayers.filter((player) => {
      const s = getPurchasesSummary(player);
      return s.remainingAmount > 0 || s.undeliveredCount > 0;
    }).length;
  }, [dashboardPlayers]);

  const presentToday = useMemo(() => {
    return dashboardPlayers.filter((player) =>
      isPlayerPresentOnDate(player, sessionDate)
    ).length;
  }, [dashboardPlayers, sessionDate]);

  const absentToday = useMemo(() => {
    return dashboardPlayers.filter((player) =>
      isPlayerAbsentOnDate(player, branches, sessionDate)
    ).length;
  }, [dashboardPlayers, branches, sessionDate]);

  const attendanceRateToday = useMemo(() => {
    const total = presentToday + absentToday;
    if (total > 0) return Math.round((presentToday / total) * 100);
    if (dashboardPlayers.length > 0) return Math.round((presentToday / dashboardPlayers.length) * 100);
    return 0;
  }, [presentToday, absentToday, dashboardPlayers]);

  const activeBranchData = useMemo(
    () => (branches || []).find((b) => b.name === branch),
    [branches, branch]
  );

  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowTick(Date.now()), 30000);
    return () => clearInterval(id);
  }, []);

  const isBranchWorkingToday = useMemo(
    () => isBranchWorkingDate(activeBranchData, sessionDate, new Date(nowTick)),
    [activeBranchData, sessionDate, nowTick]
  );

  const todayBirthdaysCount = useMemo(() => {
    return dashboardPlayers.filter((player) => {
      const bday = getBirthdayInfo(player);
      return Boolean(bday?.isToday || bday?.daysLeft === 1);
    }).length;
  }, [dashboardPlayers]);

  const todayBirthdaysList = useMemo(() => {
    return getTodayBirthdays(players || []);
  }, [players]);

  return {
    today,
    currentMonth,
    branch,
    setBranch,
    search,
    setSearch,
    deferredSearch,
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
    activeBranchData,
    isBranchWorkingToday,
    todayBirthdaysCount,
    todayBirthdaysList,
  };
}
