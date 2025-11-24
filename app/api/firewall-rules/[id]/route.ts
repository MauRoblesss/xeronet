import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEdit } from "@/lib/roles";

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!canEdit((session?.user as any)?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const rule = await prisma.firewallRule.update({
    where: { id: params.id },
    data: {
      reason: body.reason,
      scope: body.scope,
      active: body.active,
    },
  });
  if (body.scope === "per_node" && Array.isArray(body.nodeIds)) {
    await prisma.firewallRuleNode.deleteMany({ where: { firewallRuleId: rule.id } });
    for (const nodeId of body.nodeIds) {
      await prisma.firewallRuleNode.create({ data: { firewallRuleId: rule.id, nodeId } });
    }
  }
  await prisma.auditLog.create({
    data: {
      userId: session?.user?.id as string,
      action: "update_firewall_rule",
      description: `Updated firewall rule ${rule.id}`,
    },
  });
  return NextResponse.json(rule);
}
