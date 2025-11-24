import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEdit } from "@/lib/roles";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!canEdit((session?.user as any)?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const prefix = await prisma.prefix.update({ where: { id: params.id }, data: body });
  await prisma.auditLog.create({
    data: {
      userId: session?.user?.id as string,
      action: "update_prefix",
      description: `Updated prefix ${prefix.cidr}`,
    },
  });
  return NextResponse.json(prefix);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!canEdit((session?.user as any)?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.prefix.delete({ where: { id: params.id } });
  await prisma.auditLog.create({
    data: {
      userId: session?.user?.id as string,
      action: "delete_prefix",
      description: `Deleted prefix ${params.id}`,
    },
  });
  return NextResponse.json({ success: true });
}
