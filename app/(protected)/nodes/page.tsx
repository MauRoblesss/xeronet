import { prisma } from "@/lib/prisma";
import { generateApiToken } from "@/lib/tokens";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { canEdit } from "@/lib/roles";

export const dynamic = "force-dynamic";

async function createNode(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!canEdit((session?.user as any)?.role)) throw new Error("Forbidden");
  await prisma.node.create({
    data: {
      name: String(formData.get("name")),
      location: String(formData.get("location")),
      ipAddress: String(formData.get("ipAddress")),
      type: String(formData.get("type")),
      status: String(formData.get("status")),
      apiToken: generateApiToken(),
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: session?.user?.id as string,
      action: "create_node",
      description: `Created node ${formData.get("name")}`,
    },
  });
  revalidatePath("/nodes");
}

async function deleteNode(id: string) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!canEdit((session?.user as any)?.role)) throw new Error("Forbidden");
  await prisma.node.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      userId: session?.user?.id as string,
      action: "delete_node",
      description: `Deleted node ${id}`,
    },
  });
  revalidatePath("/nodes");
}

export default async function NodesPage() {
  const session = await getServerSession(authOptions);
  const editable = canEdit((session?.user as any)?.role);
  const nodes = await prisma.node.findMany({ orderBy: { createdAt: "desc" }, include: { firewallRuleNodes: true } });
  const globalRules = await prisma.firewallRule.count({ where: { scope: "global", active: true } });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-white">Nodes</h1>
      </div>
      {editable && (
        <form action={createNode} className="card grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-300">Name</label>
            <input name="name" className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white" required />
          </div>
          <div>
            <label className="text-sm text-gray-300">Location</label>
            <input name="location" className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white" required />
          </div>
          <div>
            <label className="text-sm text-gray-300">IP Address</label>
            <input name="ipAddress" className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white" required />
          </div>
          <div>
            <label className="text-sm text-gray-300">Type</label>
            <input name="type" className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white" defaultValue="router" />
          </div>
          <div>
            <label className="text-sm text-gray-300">Status</label>
            <select name="status" className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white">
              <option value="online">Online</option>
              <option value="offline">Offline</option>
            </select>
          </div>
          <div className="flex items-end">
            <button type="submit" className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-accent text-white font-semibold">Create node</button>
          </div>
        </form>
      )}
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Location</th>
              <th>IP</th>
              <th>Type</th>
              <th>Status</th>
              <th>API token</th>
              <th>Rules applied</th>
              {editable && <th />}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {nodes.map((node) => {
              const nodeRules = node.firewallRuleNodes.length + globalRules;
              return (
                <tr key={node.id}>
                  <td>{node.name}</td>
                  <td>{node.location}</td>
                  <td>{node.ipAddress}</td>
                  <td className="capitalize">{node.type}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      node.status === "online" ? "bg-green-600/30 text-green-300" : "bg-yellow-600/30 text-yellow-200"
                    }`}>
                      {node.status}
                    </span>
                  </td>
                  <td>
                    <code className="text-xs bg-black/40 px-2 py-1 rounded">{node.apiToken.slice(0, 6)}•••</code>
                  </td>
                  <td>{nodeRules}</td>
                  {editable && (
                    <td>
                      <form action={() => deleteNode(node.id)}>
                        <button className="text-red-400 hover:text-red-300 text-sm">Delete</button>
                      </form>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
