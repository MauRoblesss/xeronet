import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { canEdit } from "@/lib/roles";

export const dynamic = "force-dynamic";

async function createRule(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!canEdit((session?.user as any)?.role)) throw new Error("Forbidden");
  const scope = String(formData.get("scope"));
  const rule = await prisma.firewallRule.create({
    data: {
      ip: formData.get("ip") ? String(formData.get("ip")) : null,
      cidr: formData.get("cidr") ? String(formData.get("cidr")) : null,
      version: Number(formData.get("version")),
      scope,
      reason: formData.get("reason") ? String(formData.get("reason")) : null,
      createdById: session?.user?.id as string,
      active: true,
    },
  });
  if (scope === "per_node") {
    const nodeIds = (formData.getAll("nodeIds") as string[]).filter(Boolean);
    for (const nodeId of nodeIds) {
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
  revalidatePath("/firewall");
}

async function toggleRule(id: string, active: boolean) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!canEdit((session?.user as any)?.role)) throw new Error("Forbidden");
  await prisma.firewallRule.update({ where: { id }, data: { active } });
  await prisma.auditLog.create({
    data: {
      userId: session?.user?.id as string,
      action: active ? "activate_firewall_rule" : "deactivate_firewall_rule",
      description: `${active ? "Activated" : "Deactivated"} firewall rule ${id}`,
    },
  });
  revalidatePath("/firewall");
}

export default async function FirewallPage() {
  const session = await getServerSession(authOptions);
  const editable = canEdit((session?.user as any)?.role);
  const [rules, nodes] = await Promise.all([
    prisma.firewallRule.findMany({
      orderBy: { createdAt: "desc" },
      include: { createdBy: true, nodes: { include: { node: true } } },
    }),
    prisma.node.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Firewall rules</h1>
      {editable && (
        <form action={createRule} className="card grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-300">IP</label>
            <input name="ip" placeholder="Single IP" className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-300">CIDR</label>
            <input name="cidr" placeholder="45.153.34.0/24" className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-300">Version</label>
            <select name="version" className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white">
              <option value="4">IPv4</option>
              <option value="6">IPv6</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-300">Scope</label>
            <select name="scope" className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white">
              <option value="global">Global</option>
              <option value="per_node">Per-node</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm text-gray-300">Nodes (for per-node)</label>
            <select
              name="nodeIds"
              multiple
              className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white h-32"
            >
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.name} ({node.location})
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-3">
            <label className="text-sm text-gray-300">Reason</label>
            <textarea name="reason" className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white" />
          </div>
          <div className="flex items-end">
            <button className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-accent text-white font-semibold">Create rule</button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>IP/CIDR</th>
              <th>Version</th>
              <th>Scope</th>
              <th>Active</th>
              <th>Reason</th>
              <th>Nodes</th>
              <th>Created</th>
              <th>By</th>
              {editable && <th />}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {rules.map((rule) => (
              <tr key={rule.id}>
                <td className="text-xs">{rule.id.slice(0, 8)}</td>
                <td>{rule.ip || rule.cidr}</td>
                <td>IPv{rule.version}</td>
                <td className="capitalize">{rule.scope}</td>
                <td>{rule.active ? "Yes" : "No"}</td>
                <td className="max-w-xs truncate" title={rule.reason || undefined}>{rule.reason}</td>
                <td className="text-xs text-gray-300">
                  {rule.scope === "global"
                    ? "All nodes"
                    : rule.nodes.map((n) => n.node?.name).filter(Boolean).join(", ") || "-"}
                </td>
                <td>{rule.createdAt.toLocaleString()}</td>
                <td>{rule.createdBy?.name || "System"}</td>
                {editable && (
                  <td>
                    <form action={() => toggleRule(rule.id, !rule.active)}>
                      <button className="text-sm text-brand-primary hover:text-brand-accent">
                        {rule.active ? "Deactivate" : "Activate"}
                      </button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
