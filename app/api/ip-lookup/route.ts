import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import ipaddr from "ipaddr.js";

function contains(ip: string, cidr: string) {
  try {
    const parsedIp = ipaddr.parse(ip);
    const [range, prefix] = ipaddr.parseCIDR(cidr);
    return parsedIp.kind() === range.kind() && parsedIp.match([range, prefix]);
  } catch (e) {
    return false;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const ip = searchParams.get("ip");
  if (!ip) return NextResponse.json({ error: "ip required" }, { status: 400 });

  const prefixes = await prisma.prefix.findMany({ include: { node: true } });
  const match = prefixes.find((p) => contains(ip, p.cidr));
  if (!match) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ prefix: match, node: match.node });
}
