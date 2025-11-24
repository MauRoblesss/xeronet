"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await signIn("credentials", { redirect: false, email, password, callbackUrl });
    if (result?.error) {
      setError("Invalid credentials");
    } else {
      window.location.href = callbackUrl;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-dark">
      <div className="card w-full max-w-md">
        <div className="mb-4 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-12 h-12 bg-red-600 rounded-lg" />
          </div>
          <h1 className="text-2xl font-semibold text-white">XeroHost NOC</h1>
          <p className="text-sm text-gray-400">Sign in to continue</p>
        </div>
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm text-gray-300">Email</label>
            <input
              className="mt-1 w-full rounded-lg border border-brand-border bg-brand-dark text-white"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-300">Password</label>
            <input
              className="mt-1 w-full rounded-lg border border-brand-border bg-brand-dark text-white"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full py-2 rounded-lg bg-brand-primary hover:bg-brand-accent text-white font-semibold"
          >
            Sign in
          </button>
        </form>
      </div>
    </div>
  );
}
