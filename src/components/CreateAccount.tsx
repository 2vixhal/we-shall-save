"use client";

import { useState } from "react";

const SOURCES = ["Salary", "Scholarship", "Instagram Collaboration", "Misc", "Other"];
const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CreateAccount({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [source, setSource] = useState("");
  const [customSource, setCustomSource] = useState("");
  const [salaryMonth, setSalaryMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const inputClass = "w-full px-4 py-2.5 border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-white text-sm";
  const labelClass = "block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5";

  const handleCreate = async () => {
    setError(""); setSuccess("");
    if (!name.trim()) { setError("Account name is required"); return; }
    const finalSource = source === "Other" ? customSource.trim() : source;
    setLoading(true);
    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          balance: parseFloat(balance) || 0,
          source: finalSource || undefined,
          sourceMonth: source === "Salary" && salaryMonth ? salaryMonth : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create account"); }
      else {
        setSuccess(`Account "${data.name}" created!`);
        setName(""); setBalance(""); setSource(""); setCustomSource(""); setSalaryMonth("");
        onCreated();
      }
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  };

  const now = new Date();

  return (
    <div className="space-y-4">
      <div>
        <label className={labelClass}>Account Name</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="e.g. SBI Savings, Cash, HDFC" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Initial Amount (₹)</label>
        <input type="number" value={balance} onChange={(e) => setBalance(e.target.value)}
          placeholder="0" min="0" step="0.01" className={inputClass} />
      </div>
      <div>
        <label className={labelClass}>Source</label>
        <select value={source} onChange={(e) => { setSource(e.target.value); if (e.target.value !== "Other") setCustomSource(""); }}
          className={inputClass}>
          <option value="">Select source (optional)</option>
          {SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {source === "Other" && (
          <input type="text" value={customSource} onChange={(e) => setCustomSource(e.target.value)}
            placeholder="Type the source" className={`${inputClass} mt-2`} />
        )}
      </div>
      {source === "Salary" && (
        <div>
          <label className={labelClass}>Salary for Month</label>
          <select value={salaryMonth} onChange={(e) => setSalaryMonth(e.target.value)} className={inputClass}>
            <option value="">Select month</option>
            {MONTHS_FULL.map((m) => (
              <option key={`cur-${m}`} value={`${m} ${now.getFullYear()}`}>{m} {now.getFullYear()}</option>
            ))}
            {MONTHS_FULL.map((m) => (
              <option key={`prev-${m}`} value={`${m} ${now.getFullYear() - 1}`}>{m} {now.getFullYear() - 1}</option>
            ))}
          </select>
        </div>
      )}
      {error && <p className="text-red-600 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>}
      {success && <p className="text-emerald-700 text-sm text-center bg-emerald-50 py-2 rounded-lg">{success}</p>}
      <button onClick={handleCreate} disabled={loading}
        className="w-full py-2.5 bg-teal-700 text-white text-sm font-bold rounded-xl hover:bg-teal-800 transition-colors disabled:opacity-50 cursor-pointer">
        {loading ? "Creating..." : "Create Account"}
      </button>
    </div>
  );
}
