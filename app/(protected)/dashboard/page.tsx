import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [nodes, prefixes, rules] = await Promise.all([
    prisma.node.count(),
    prisma.prefix.count(),
    prisma.firewallRule.count({ where: { active: true } }),
  ]);
  const onlineNodes = await prisma.node.count({ where: { status: "online" } });

  const cards = [
    { label: "Total nodes", value: nodes },
    { label: "Online nodes", value: onlineNodes },
    { label: "Prefixes", value: prefixes },
    { label: "Active rules", value: rules },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="card">
            <div className="text-sm text-gray-400">{card.label}</div>
            <div className="text-3xl font-bold text-white mt-2">{card.value}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <h2 className="text-lg font-semibold text-white">Welcome</h2>
        <p className="text-sm text-gray-300 mt-2">
          Use the sidebar to manage nodes, firewall rules, prefixes, and audit logs. All actions are tracked for compliance.
        </p>
      </div>
    </div>
  );
}
