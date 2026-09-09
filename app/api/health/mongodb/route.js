import { NextResponse } from "next/server";
import clientPromise from "../../../../backend/mongodb";
export async function GET() {
  try {
    const client = await clientPromise;
    await client.db(process.env.MONGODB_DB).command({ ping: 1 });
    return NextResponse.json({ connected: true });
  } catch (_a) {
    return NextResponse.json(
      { connected: false, error: "MongoDB connection failed" },
      { status: 503 },
    );
  }
}
