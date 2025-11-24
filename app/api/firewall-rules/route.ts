import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEdit } from "@/lib/roles";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope") ?? undefined;
  const active = searchParams.get("active");
  const rules = await prisma.firewallRule.findMany({
    where: {
      scope: scope || undefined,
      active: active === null ? undefined : active === "true" ? true : active === "false" ? false : undefined,
    },
    include: { createdBy: true, nodes: { include: { node: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rules);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!canEdit((session?.user as any)?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const rule = await prisma.firewallRule.create({
    data: {
      ip: body.ip,
      cidr: body.cidr,
      version: body.version,
      scope: body.scope,
      reason: body.reason,
      createdById: session?.user?.id as string,
    },
  });
  if (body.scope === "per_node" && Array.isArray(body.nodeIds)) {
    for (const nodeId of body.nodeIds) {
      await prisma.firewallRuleNode.create({ data: { firewallRuleId: rule.id, nodeId } });
    }
  }
  await prisma.auditLog.create({
    data: {
      userId: session?.user?.id as string,
      action: "create_firewall_rule",
      description: `Created firewall rule ${rule.id}`,
    },
  });
  return NextResponse.json(rule, { status: 201 });
}
