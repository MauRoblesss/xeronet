import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId") || undefined;
  const action = searchParams.get("action") || undefined;
  const logs = await prisma.auditLog.findMany({
    where: { userId, action },
    include: { user: true },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json(logs);
}
