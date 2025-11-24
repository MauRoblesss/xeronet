import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export const dynamic = "force-dynamic";

export default async function AuditPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  await getServerSession(authOptions); // ensures auth in middleware
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { user: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Audit logs</h1>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Description</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border">
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.createdAt.toISOString()}</td>
                <td>{log.user?.name ?? "System"}</td>
                <td>{log.action}</td>
                <td className="max-w-xl truncate" title={log.description}>{log.description}</td>
                <td>{log.ipAddress ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
