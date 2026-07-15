import { NextResponse } from "next/server";
import { db } from "@/lib/prisma";

export async function GET() {
  try {
    const rawUrl = process.env.DATABASE_URL || "not-defined";
    const sanitizedUrl = rawUrl.replace(/:([^:@]+)@/, ":***@");

    const licenses = await db.license.findMany({
      select: { code: true, status: true }
    });

    const usersCount = await db.user.count();

    return NextResponse.json({
      databaseUrl: sanitizedUrl,
      licensesCount: licenses.length,
      licenses: licenses,
      usersCount: usersCount
    });
  } catch (err: any) {
    return NextResponse.json({
      error: err.message || "Unknown error",
      stack: err.stack
    }, { status: 500 });
  }
}
