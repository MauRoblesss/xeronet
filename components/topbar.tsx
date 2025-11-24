import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import SignOutButton from "./signout-button";

export default async function Topbar() {
  const session = await getServerSession(authOptions);
  const user = session?.user;
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-brand-border bg-brand-surface/70 backdrop-blur">
      <div className="flex flex-col">
        <span className="text-sm text-gray-400">Welcome</span>
        <span className="text-lg font-semibold text-white">{user?.name ?? "Operator"}</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-200">
        <div className="text-right">
          <div className="font-semibold">{user?.email}</div>
          <div className="text-xs text-gray-400">Role: {(user as any)?.role ?? "unknown"}</div>
        </div>
        <SignOutButton />
      </div>
    </header>
  );
}
