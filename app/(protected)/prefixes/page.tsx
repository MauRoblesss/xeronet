import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";
import { canEdit } from "@/lib/roles";
import { revalidatePath } from "next/cache";
import dynamic from "next/dynamic";

const IpLookup = dynamic(() => import("@/components/ip-lookup"), { ssr: false });

export const dynamic = "force-dynamic";

async function createPrefix(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!canEdit((session?.user as any)?.role)) throw new Error("Forbidden");
  await prisma.prefix.create({
    data: {
      cidr: String(formData.get("cidr")),
      ipVersion: Number(formData.get("ipVersion")),
      location: String(formData.get("location")),
      nodeId: formData.get("nodeId") ? String(formData.get("nodeId")) : null,
      status: formData.get("status") as any,
      assignedTo: formData.get("assignedTo") ? String(formData.get("assignedTo")) : null,
      vlan: formData.get("vlan") ? Number(formData.get("vlan")) : null,
      vrf: formData.get("vrf") ? String(formData.get("vrf")) : null,
      notes: formData.get("notes") ? String(formData.get("notes")) : null,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: session?.user?.id as string,
      action: "create_prefix",
      description: `Created prefix ${formData.get("cidr")}`,
    },
  });
  revalidatePath("/prefixes");
}

async function updatePrefix(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!canEdit((session?.user as any)?.role)) throw new Error("Forbidden");
  const id = String(formData.get("id"));
  await prisma.prefix.update({
    where: { id },
    data: {
      status: formData.get("status") as any,
      assignedTo: formData.get("assignedTo") ? String(formData.get("assignedTo")) : null,
      notes: formData.get("notes") ? String(formData.get("notes")) : null,
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: session?.user?.id as string,
      action: "update_prefix",
      description: `Updated prefix ${id}`,
    },
  });
  revalidatePath("/prefixes");
}

export default async function PrefixesPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const session = await getServerSession(authOptions);
  const editable = canEdit((session?.user as any)?.role);
  const nodes = await prisma.node.findMany({ orderBy: { name: "asc" } });
  const prefixes = await prisma.prefix.findMany({
    orderBy: { updatedAt: "desc" },
    include: { node: true },
  });

  const filtered = prefixes.filter((prefix) => {
    const query = (searchParams.q || "").toLowerCase();
    const status = searchParams.status;
    if (query && !`${prefix.cidr}${prefix.location}${prefix.assignedTo ?? ""}`.toLowerCase().includes(query)) return false;
    if (status && prefix.status !== status) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Prefixes</h1>
      <div className="card">
        <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="text-sm text-gray-300">Search</label>
            <input name="q" defaultValue={searchParams.q} className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-300">Status</label>
            <select name="status" defaultValue={searchParams.status} className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white">
              <option value="">Any</option>
              <option value="free">Free</option>
              <option value="allocated">Allocated</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>
          <div className="flex items-end">
            <button className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-accent text-white font-semibold" type="submit">
              Apply filters
            </button>
          </div>
        </form>
      </div>

      {editable && (
        <form action={createPrefix} className="card grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm text-gray-300">CIDR</label>
            <input name="cidr" required className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-300">IP Version</label>
            <select name="ipVersion" className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white">
              <option value="4">IPv4</option>
              <option value="6">IPv6</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-300">Location</label>
            <input name="location" required className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-300">Node</label>
            <select name="nodeId" className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white">
              <option value="">Unassigned</option>
              {nodes.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-300">Status</label>
            <select name="status" className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white">
              <option value="free">Free</option>
              <option value="allocated">Allocated</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-300">Assigned to</label>
            <input name="assignedTo" className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-300">VLAN</label>
            <input name="vlan" type="number" className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white" />
          </div>
          <div>
            <label className="text-sm text-gray-300">VRF</label>
            <input name="vrf" className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white" />
          </div>
          <div className="md:col-span-3">
            <label className="text-sm text-gray-300">Notes</label>
            <textarea name="notes" className="w-full mt-1 rounded-lg border border-brand-border bg-brand-dark text-white" />
          </div>
          <div className="flex items-end">
            <button className="px-4 py-2 rounded-lg bg-brand-primary hover:bg-brand-accent text-white font-semibold">Create prefix</button>
          </div>
        </form>
      )}

      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>CIDR</th>
              <th>IP Version</th>
              <th>Location</th>
              <th>Node</th>
              <th>Status</th>
              <th>Assigned</th>
              <th>Updated</th>
              {editable && <th />}
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {filtered.map((prefix) => (
              <tr key={prefix.id}>
                <td>{prefix.cidr}</td>
                <td>IPv{prefix.ipVersion}</td>
                <td>{prefix.location}</td>
                <td>{prefix.node?.name ?? "-"}</td>
                <td className="capitalize">{prefix.status}</td>
                <td>{prefix.assignedTo ?? ""}</td>
                <td>{prefix.updatedAt.toLocaleString()}</td>
                {editable && (
                  <td>
                    <form action={updatePrefix} className="space-y-2">
                      <input type="hidden" name="id" value={prefix.id} />
                      <select name="status" defaultValue={prefix.status} className="w-full rounded border border-brand-border bg-brand-dark text-white text-xs">
                        <option value="free">Free</option>
                        <option value="allocated">Allocated</option>
                        <option value="reserved">Reserved</option>
                      </select>
                      <input
                        name="assignedTo"
                        placeholder="Assigned"
                        defaultValue={prefix.assignedTo ?? ""}
                        className="w-full rounded border border-brand-border bg-brand-dark text-white text-xs"
                      />
                      <textarea
                        name="notes"
                        placeholder="Notes"
                        defaultValue={prefix.notes ?? ""}
                        className="w-full rounded border border-brand-border bg-brand-dark text-white text-xs"
                      />
                      <button className="w-full rounded bg-brand-primary text-white text-xs py-1">Update</button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <IpLookup />
    </div>
  );
}
