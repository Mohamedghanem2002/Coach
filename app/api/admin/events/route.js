import { NextResponse } from "next/server";
import clientPromise from "../../../../backend/mongodb";
import { requireAdmin } from "../../../../backend/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const adminCheck = await requireAdmin();
    if (!adminCheck.authorized) return adminCheck.response;

    const { searchParams } = new URL(request.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const statusFilter = (searchParams.get("status") || "all").trim().toLowerCase();
    const ownerFilter = (searchParams.get("ownerId") || "all").trim();
    const sortBy = (searchParams.get("sortBy") || "newest").trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(100, parseInt(searchParams.get("limit") || "15", 10)));

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const [allEvents, allUsers] = await Promise.all([
      db.collection("events").find({}).toArray(),
      db.collection("users").find({}).toArray(),
    ]);

    // Build user lookup map
    const userMap = new Map();
    for (const u of allUsers) {
      userMap.set(u._id.toString(), u);
    }

    const adminEmail = (process.env.ADMIN_EMAIL || "mg0447837@gmail.com").trim().toLowerCase();
    const isSystemAdmin = (u) => {
      if (!u) return false;
      if (u.role === "admin") return true;
      if (u.email && u.email.trim().toLowerCase() === adminEmail) return true;
      return false;
    };

    // Filter to only events belonging to valid captains (excluding admins and orphaned records)
    const validCaptainEvents = allEvents.filter((e) => {
      const oId = e.ownerId ? e.ownerId.toString() : "";
      const coach = userMap.get(oId);
      return coach && !isSystemAdmin(coach);
    });

    // Process events with status & organizer information
    const processedEvents = validCaptainEvents.map((e) => {
      const eId = e._id ? e._id.toString() : "";
      const oId = e.ownerId ? e.ownerId.toString() : "";
      const coach = userMap.get(oId);

      let isUpcoming = false;
      if (e.date) {
        const eDate = new Date(e.date);
        if (!isNaN(eDate.getTime()) && eDate >= startOfToday) {
          isUpcoming = true;
        }
      }

      const participants = Array.isArray(e.participants) ? e.participants : [];
      const fee = typeof e.fee === "number" ? e.fee : parseFloat(e.fee || e.price || "0") || 0;

      return {
        id: eId,
        _id: eId,
        title: e.title || e.name || "فعالية بدون عنوان",
        date: e.date || null,
        location: e.location || e.venue || "غير محدد",
        fee,
        participantsCount: participants.length,
        participants,
        status: isUpcoming ? "upcoming" : "completed",
        statusLabel: isUpcoming ? "قادمة ⏱️" : "منتهية ✓",
        ownerId: oId,
        coachName: coach?.name || "كابتن غير محدد",
        coachEmail: coach?.email || "",
        coachPhone: coach?.phone || "",
        academyName: coach?.academyName || "أكاديمية غير محددة",
        createdAt: e.createdAt || null,
      };
    });

    const uniqueCoaches = Array.from(
      new Map(
        processedEvents
          .map((e) => [
            e.ownerId,
            { id: e.ownerId, name: e.coachName, academyName: e.academyName },
          ])
      ).values()
    );

    // Apply Search & Filters
    let filtered = processedEvents.filter((e) => {
      if (search) {
        const matchesTitle = (e.title || "").toLowerCase().includes(search);
        const matchesCoach = (e.coachName || "").toLowerCase().includes(search);
        const matchesAcademy = (e.academyName || "").toLowerCase().includes(search);
        const matchesDate = (e.date || "").toLowerCase().includes(search);
        const matchesId = (e.id || "").toLowerCase().includes(search);

        if (!matchesTitle && !matchesCoach && !matchesAcademy && !matchesDate && !matchesId) {
          return false;
        }
      }

      if (statusFilter === "upcoming" && e.status !== "upcoming") return false;
      if (statusFilter === "completed" && e.status !== "completed") return false;

      if (ownerFilter && ownerFilter !== "all" && e.ownerId !== ownerFilter) {
        return false;
      }

      return true;
    });

    // Sorting
    filtered.sort((a, b) => {
      if (sortBy === "date_asc") {
        return new Date(a.date || 0) - new Date(b.date || 0);
      }
      if (sortBy === "date_desc") {
        return new Date(b.date || 0) - new Date(a.date || 0);
      }
      if (sortBy === "participants_desc") {
        return b.participantsCount - a.participantsCount;
      }
      if (sortBy === "fee_desc") {
        return b.fee - a.fee;
      }
      if (sortBy === "oldest") {
        return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
      }
      // Default: newest
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const pageEvents = filtered.slice(offset, offset + limit);

    const upcomingCount = validCaptainEvents.filter((e) => {
      if (!e.date) return false;
      const d = new Date(e.date);
      return !isNaN(d.getTime()) && d >= startOfToday;
    }).length;

    return NextResponse.json({
      success: true,
      summary: {
        totalEvents: validCaptainEvents.length,
        upcomingEvents: upcomingCount,
        completedEvents: validCaptainEvents.length - upcomingCount,
        filteredCount: total,
      },
      filters: {
        coaches: uniqueCoaches,
      },
      events: pageEvents,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasPrev: page > 1,
        hasNext: page < totalPages,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/events failed:", error);
    return NextResponse.json(
      { error: "تعذر استرداد قائمة الفعاليات", details: error?.message || String(error) },
      { status: 500 }
    );
  }
}
