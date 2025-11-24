"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="px-3 py-2 rounded-lg bg-brand-primary text-white text-sm font-semibold hover:bg-brand-accent transition"
    >
      Sign out
    </button>
  );
}
