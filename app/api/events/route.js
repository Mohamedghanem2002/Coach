import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";
import clientPromise from "../../../backend/mongodb";
import { currentUserId } from "../../../backend/tenant";

export const dynamic = "force-dynamic";

function appDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  );
  return `${values.year}-${values.month}-${values.day}`;
}

function serializeEvent(event) {
  const participants = Array.isArray(event.participants) ? event.participants : [];
  const totalRevenue = participants.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
  const paidRevenue = participants.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
  const remainingRevenue = Math.max(0, totalRevenue - paidRevenue);

  const paidCount = participants.filter((p) => p.paymentStatus === "paid").length;
  const partialCount = participants.filter((p) => p.paymentStatus === "partially_paid").length;
  const unpaidCount = participants.filter((p) => p.paymentStatus === "unpaid").length;
  const attendedCount = participants.filter((p) => Boolean(p.attended)).length;

  return {
    ...event,
    _id: event._id?.toString(),
    fee: Number(event.fee ?? 100),
    participants: participants.map((p) => ({
      ...p,
      playerId: p.playerId?.toString(),
      totalAmount: Number(p.totalAmount ?? event.fee ?? 100),
      paidAmount: Number(p.paidAmount ?? 0),
      remainingAmount: Number(p.remainingAmount ?? Math.max(0, (p.totalAmount ?? event.fee ?? 100) - (p.paidAmount ?? 0))),
      paymentStatus: p.paymentStatus || "unpaid",
      attended: Boolean(p.attended),
    })),
    stats: {
      totalParticipants: participants.length,
      totalRevenue,
      paidRevenue,
      remainingRevenue,
      paidCount,
      partialCount,
      unpaidCount,
      attendedCount,
    },
  };
}

export async function GET(request) {
  try {
    const ownerId = await currentUserId();
    if (!ownerId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("id");
    const playerId = searchParams.get("playerId");

    const client = await clientPromise;
    const eventsCollection = client.db(process.env.MONGODB_DB).collection("events");

    // Case 1: Specific event
    if (eventId) {
      const event = await eventsCollection.findOne({
        _id: new ObjectId(eventId),
        ownerId,
      });
      if (!event) {
        return NextResponse.json({ error: "الحدث غير موجود" }, { status: 404 });
      }
      return NextResponse.json(serializeEvent(event));
    }

    // Case 2: Events where a specific player is participant
    if (playerId) {
      const allEvents = await eventsCollection
        .find({ ownerId })
        .sort({ date: -1, createdAt: -1 })
        .toArray();

      const playerEvents = allEvents
        .filter((ev) => (ev.participants || []).some((p) => p.playerId?.toString() === playerId))
        .map((ev) => {
          const participant = (ev.participants || []).find((p) => p.playerId?.toString() === playerId);
          return {
            _id: ev._id.toString(),
            title: ev.title,
            type: ev.type || "trip",
            date: ev.date,
            location: ev.location,
            status: ev.status || "upcoming",
            participant,
          };
        });

      return NextResponse.json(playerEvents);
    }

    // Case 3: List all events
    const events = await eventsCollection
      .find({ ownerId })
      .sort({ date: -1, createdAt: -1 })
      .toArray();

    return NextResponse.json(events.map(serializeEvent));
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json({ error: "تعذر تحميل الفعاليات" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const ownerId = await currentUserId();
    if (!ownerId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
    }

    const body = await request.json();
    const title = typeof body.title === "string" ? body.title.trim() : "";
    if (!title || title.length > 120) {
      return NextResponse.json({ error: "اكتب اسم الحدث بشكل صحيح" }, { status: 400 });
    }

    const date = typeof body.date === "string" && body.date.trim() ? body.date.trim() : appDate();
    const type = typeof body.type === "string" && body.type.trim() ? body.type.trim() : "trip";
    const location = typeof body.location === "string" ? body.location.trim() : "";
    const time = typeof body.time === "string" ? body.time.trim() : "";
    const fee = typeof body.fee === "number" && body.fee >= 0 ? body.fee : 100;
    const description = typeof body.description === "string" ? body.description.trim() : "";

    const client = await clientPromise;
    const eventsCollection = client.db(process.env.MONGODB_DB).collection("events");

    const newEvent = {
      _id: new ObjectId(),
      ownerId,
      title,
      type,
      date,
      time,
      location,
      fee,
      description,
      status: "upcoming",
      participants: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // If initial player IDs were passed
    if (Array.isArray(body.playerIds) && body.playerIds.length > 0) {
      const playersCollection = client.db(process.env.MONGODB_DB).collection("players");
      const players = await playersCollection
        .find({
          ownerId,
          _id: { $in: body.playerIds.map((id) => new ObjectId(id)) },
        })
        .toArray();

      newEvent.participants = players.map((p) => ({
        playerId: p._id.toString(),
        name: p.name,
        photo: p.photo || "",
        branch: p.branch || "",
        belt: p.belt || "",
        parentPhone: p.parentPhone || p.phone || "",
        phone: p.phone || "",
        totalAmount: fee,
        paidAmount: 0,
        remainingAmount: fee,
        paymentStatus: "unpaid",
        paymentDate: "",
        notes: "",
        attended: false,
      }));
    }

    await eventsCollection.insertOne(newEvent);

    return NextResponse.json(serializeEvent(newEvent), { status: 201 });
  } catch (error) {
    console.error("POST /api/events error:", error);
    return NextResponse.json({ error: "تعذر إنشاء الحدث" }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const ownerId = await currentUserId();
    if (!ownerId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
    }

    const body = await request.json();
    const eventId = body.id || body.eventId;
    if (!eventId) {
      return NextResponse.json({ error: "معرف الحدث مطلوب" }, { status: 400 });
    }

    const client = await clientPromise;
    const eventsCollection = client.db(process.env.MONGODB_DB).collection("events");
    const event = await eventsCollection.findOne({
      _id: new ObjectId(eventId),
      ownerId,
    });

    if (!event) {
      return NextResponse.json({ error: "الحدث غير موجود" }, { status: 404 });
    }

    const currentParticipants = Array.isArray(event.participants) ? [...event.participants] : [];

    // Action 1: Add participants
    if (body.action === "add_participants") {
      const playerIds = Array.isArray(body.playerIds) ? body.playerIds : [];
      if (!playerIds.length) {
        return NextResponse.json({ error: "لم يتم اختيار أي لاعبين" }, { status: 400 });
      }

      const existingPlayerIdSet = new Set(
        currentParticipants.map((p) => p.playerId?.toString()),
      );
      const newIdsToFetch = playerIds.filter((id) => !existingPlayerIdSet.has(id));

      if (newIdsToFetch.length > 0) {
        const playersCollection = client.db(process.env.MONGODB_DB).collection("players");
        const players = await playersCollection
          .find({
            ownerId,
            _id: { $in: newIdsToFetch.map((id) => new ObjectId(id)) },
          })
          .toArray();

        const defaultFee = Number(body.fee ?? event.fee ?? 100);
        const newParticipants = players.map((p) => ({
          playerId: p._id.toString(),
          name: p.name,
          photo: p.photo || "",
          branch: p.branch || "",
          belt: p.belt || "",
          parentPhone: p.parentPhone || p.phone || "",
          phone: p.phone || "",
          totalAmount: defaultFee,
          paidAmount: 0,
          remainingAmount: defaultFee,
          paymentStatus: "unpaid",
          paymentDate: "",
          notes: "",
          attended: false,
        }));

        currentParticipants.push(...newParticipants);
      }

      await eventsCollection.updateOne(
        { _id: new ObjectId(eventId), ownerId },
        {
          $set: {
            participants: currentParticipants,
            updatedAt: new Date(),
          },
        },
      );

      const updated = await eventsCollection.findOne({
        _id: new ObjectId(eventId),
        ownerId,
      });
      return NextResponse.json(serializeEvent(updated));
    }

    // Action 2: Remove participant
    if (body.action === "remove_participant") {
      const targetPlayerId = body.playerId?.toString();
      const filtered = currentParticipants.filter(
        (p) => p.playerId?.toString() !== targetPlayerId,
      );

      await eventsCollection.updateOne(
        { _id: new ObjectId(eventId), ownerId },
        {
          $set: {
            participants: filtered,
            updatedAt: new Date(),
          },
        },
      );

      const updated = await eventsCollection.findOne({
        _id: new ObjectId(eventId),
        ownerId,
      });
      return NextResponse.json(serializeEvent(updated));
    }

    // Action 3: Update participant payment
    if (body.action === "update_payment") {
      const targetPlayerId = body.playerId?.toString();
      const pIdx = currentParticipants.findIndex(
        (p) => p.playerId?.toString() === targetPlayerId,
      );

      if (pIdx === -1) {
        return NextResponse.json({ error: "المشترك غير موجود في هذا الحدث" }, { status: 404 });
      }

      const participant = currentParticipants[pIdx];
      const totalAmount =
        typeof body.totalAmount === "number"
          ? Math.max(0, body.totalAmount)
          : Number(participant.totalAmount ?? event.fee ?? 100);

      const paidAmount =
        typeof body.paidAmount === "number"
          ? Math.max(0, body.paidAmount)
          : Number(participant.paidAmount ?? 0);

      const remainingAmount = Math.max(0, totalAmount - paidAmount);
      let paymentStatus = "unpaid";
      if (paidAmount >= totalAmount && totalAmount > 0) {
        paymentStatus = "paid";
      } else if (paidAmount > 0 && paidAmount < totalAmount) {
        paymentStatus = "partially_paid";
      }

      currentParticipants[pIdx] = {
        ...participant,
        totalAmount,
        paidAmount,
        remainingAmount,
        paymentStatus,
        paymentDate: paidAmount > 0 ? (participant.paymentDate || appDate()) : "",
        notes: body.notes !== undefined ? body.notes : (participant.notes || ""),
      };

      await eventsCollection.updateOne(
        { _id: new ObjectId(eventId), ownerId },
        {
          $set: {
            participants: currentParticipants,
            updatedAt: new Date(),
          },
        },
      );

      const updated = await eventsCollection.findOne({
        _id: new ObjectId(eventId),
        ownerId,
      });
      return NextResponse.json(serializeEvent(updated));
    }

    // Action 4: Update participant attendance
    if (body.action === "update_attendance") {
      const targetPlayerId = body.playerId?.toString();
      const pIdx = currentParticipants.findIndex(
        (p) => p.playerId?.toString() === targetPlayerId,
      );

      if (pIdx !== -1) {
        currentParticipants[pIdx] = {
          ...currentParticipants[pIdx],
          attended: Boolean(body.attended),
        };

        await eventsCollection.updateOne(
          { _id: new ObjectId(eventId), ownerId },
          {
            $set: {
              participants: currentParticipants,
              updatedAt: new Date(),
            },
          },
        );
      }

      const updated = await eventsCollection.findOne({
        _id: new ObjectId(eventId),
        ownerId,
      });
      return NextResponse.json(serializeEvent(updated));
    }

    // Action 5: Bulk payment for selected participants
    if (body.action === "bulk_payment") {
      const playerIds = new Set(Array.isArray(body.playerIds) ? body.playerIds.map(String) : []);
      const status = body.status === "paid" ? "paid" : "unpaid";

      for (let i = 0; i < currentParticipants.length; i++) {
        const p = currentParticipants[i];
        if (playerIds.has(p.playerId?.toString())) {
          const tot = Number(p.totalAmount ?? event.fee ?? 100);
          const paid = status === "paid" ? tot : 0;
          currentParticipants[i] = {
            ...p,
            paidAmount: paid,
            remainingAmount: status === "paid" ? 0 : tot,
            paymentStatus: status,
            paymentDate: status === "paid" ? appDate() : "",
          };
        }
      }

      await eventsCollection.updateOne(
        { _id: new ObjectId(eventId), ownerId },
        {
          $set: {
            participants: currentParticipants,
            updatedAt: new Date(),
          },
        },
      );

      const updated = await eventsCollection.findOne({
        _id: new ObjectId(eventId),
        ownerId,
      });
      return NextResponse.json(serializeEvent(updated));
    }

    // Action 6: General event details update
    const updates = { updatedAt: new Date() };
    if (typeof body.title === "string" && body.title.trim()) updates.title = body.title.trim();
    if (typeof body.type === "string" && body.type.trim()) updates.type = body.type.trim();
    if (typeof body.date === "string" && body.date.trim()) updates.date = body.date.trim();
    if (typeof body.time === "string") updates.time = body.time.trim();
    if (typeof body.location === "string") updates.location = body.location.trim();
    if (typeof body.fee === "number" && body.fee >= 0) updates.fee = body.fee;
    if (typeof body.description === "string") updates.description = body.description.trim();
    if (["upcoming", "active", "completed", "cancelled"].includes(body.status)) updates.status = body.status;

    await eventsCollection.updateOne(
      { _id: new ObjectId(eventId), ownerId },
      { $set: updates },
    );

    const updated = await eventsCollection.findOne({
      _id: new ObjectId(eventId),
      ownerId,
    });
    return NextResponse.json(serializeEvent(updated));
  } catch (error) {
    console.error("PATCH /api/events error:", error);
    return NextResponse.json({ error: "تعذر تحديث بيانات الحدث" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const ownerId = await currentUserId();
    if (!ownerId) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولًا" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get("id");
    if (!eventId) {
      return NextResponse.json({ error: "معرف الحدث مطلوب" }, { status: 400 });
    }

    const client = await clientPromise;
    const eventsCollection = client.db(process.env.MONGODB_DB).collection("events");

    const result = await eventsCollection.deleteOne({
      _id: new ObjectId(eventId),
      ownerId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "الحدث غير موجود أو تم حذفه مسبقًا" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "تم حذف الحدث بنجاح" });
  } catch (error) {
    console.error("DELETE /api/events error:", error);
    return NextResponse.json({ error: "تعذر حذف الحدث" }, { status: 500 });
  }
}
