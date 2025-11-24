import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { ShieldCheckIcon, HomeModernIcon, FireIcon, FolderIcon, ClockIcon } from "@heroicons/react/24/outline";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: HomeModernIcon },
  { href: "/nodes", label: "Nodes", icon: ShieldCheckIcon },
  { href: "/firewall", label: "Firewall", icon: FireIcon },
  { href: "/prefixes", label: "Prefixes", icon: FolderIcon },
  { href: "/audit", label: "Audit Logs", icon: ClockIcon },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="w-64 bg-brand-surface border-r border-brand-border min-h-screen hidden md:block">
      <div className="p-6 text-xl font-semibold text-white flex items-center gap-2">
        <div className="w-8 h-8 bg-red-600 rounded-md" />
        XeroHost NOC
      </div>
      <nav className="space-y-1 px-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium border border-transparent hover:border-brand-border hover:bg-brand-dark transition ${
                active ? "bg-brand-dark border-brand-border text-white" : "text-gray-300"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
