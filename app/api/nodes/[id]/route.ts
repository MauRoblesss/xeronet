import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEdit } from "@/lib/roles";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const node = await prisma.node.findUnique({ where: { id: params.id }, include: { firewallRuleNodes: true } });
  if (!node) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const globalRules = await prisma.firewallRule.count({ where: { scope: "global", active: true } });
  return NextResponse.json({
    ...node,
    appliedRuleCount: node.firewallRuleNodes.length + globalRules,
  });
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!canEdit((session?.user as any)?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const node = await prisma.node.update({
    where: { id: params.id },
    data: body,
  });
  await prisma.auditLog.create({
    data: {
      userId: session?.user?.id as string,
      action: "update_node",
      description: `Updated node ${node.name}`,
    },
  });
  return NextResponse.json(node);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!canEdit((session?.user as any)?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await prisma.node.delete({ where: { id: params.id } });
  await prisma.auditLog.create({
    data: {
      userId: session?.user?.id as string,
      action: "delete_node",
      description: `Deleted node ${params.id}`,
    },
  });
  return NextResponse.json({ success: true });
}
