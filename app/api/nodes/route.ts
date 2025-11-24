import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { canEdit } from "@/lib/roles";
import { generateApiToken } from "@/lib/tokens";

export async function GET() {
  const nodes = await prisma.node.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(nodes);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!canEdit((session?.user as any)?.role)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const body = await request.json();
  const node = await prisma.node.create({
    data: {
      name: body.name,
      location: body.location,
      ipAddress: body.ipAddress,
      type: body.type,
      status: body.status ?? "online",
      apiToken: generateApiToken(),
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: session?.user?.id as string,
      action: "create_node",
      description: `Created node ${node.name}`,
    },
  });
  return NextResponse.json(node, { status: 201 });
}
