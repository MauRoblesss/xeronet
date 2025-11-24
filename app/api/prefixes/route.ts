import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEdit } from "@/lib/roles";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.toLowerCase();
  const status = searchParams.get("status");
  const prefixes = await prisma.prefix.findMany({ include: { node: true }, orderBy: { updatedAt: "desc" } });
  const filtered = prefixes.filter((p) => {
    if (q && !`${p.cidr}${p.location}${p.assignedTo ?? ""}`.toLowerCase().includes(q)) return false;
    if (status && p.status !== status) return false;
    return true;
  });
  return NextResponse.json(filtered);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!canEdit((session?.user as any)?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const prefix = await prisma.prefix.create({ data: body });
  await prisma.auditLog.create({
    data: {
      userId: session?.user?.id as string,
      action: "create_prefix",
      description: `Created prefix ${prefix.cidr}`,
    },
  });
  return NextResponse.json(prefix, { status: 201 });
}
