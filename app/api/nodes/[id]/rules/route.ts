import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");
  const node = await prisma.node.findUnique({ where: { id: params.id } });
  if (!node) return NextResponse.json({ error: "Node not found" }, { status: 404 });
  if (!token || token !== node.apiToken) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const globalRules = await prisma.firewallRule.findMany({
    where: { scope: "global", active: true },
    select: { id: true, ip: true, cidr: true, version: true },
  });
  const nodeRules = await prisma.firewallRule.findMany({
    where: {
      scope: "per_node",
      active: true,
      nodes: { some: { nodeId: node.id } },
    },
    select: { id: true, ip: true, cidr: true, version: true },
  });

  return NextResponse.json({ globalRules, nodeRules });
}
