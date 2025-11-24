"use client";

import { useState } from "react";

export default function IpLookup() {
  const [ip, setIp] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const onLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    const res = await fetch(`/api/ip-lookup?ip=${encodeURIComponent(ip)}`);
    if (!res.ok) {
      setError("Prefix not found");
      return;
    }
    const data = await res.json();
    setResult(data);
  };

  return (
    <div className="card space-y-3">
      <h3 className="text-lg font-semibold text-white">IP lookup</h3>
      <form onSubmit={onLookup} className="flex gap-3">
        <input
          value={ip}
          onChange={(e) => setIp(e.target.value)}
          className="flex-1 rounded-lg border border-brand-border bg-brand-dark text-white"
          placeholder="151.245.160.20"
          required
        />
        <button className="px-4 py-2 rounded-lg bg-brand-primary text-white">Lookup</button>
      </form>
      {error && <p className="text-sm text-red-400">{error}</p>}
      {result && (
        <div className="text-sm text-gray-200 space-y-1">
          <div className="font-semibold">Prefix: {result.prefix.cidr}</div>
          <div>Location: {result.prefix.location}</div>
          <div>Status: {result.prefix.status}</div>
          {result.node && <div>Node: {result.node.name}</div>}
          {result.prefix.notes && <div className="text-gray-300">Notes: {result.prefix.notes}</div>}
        </div>
      )}
    </div>
  );
}
