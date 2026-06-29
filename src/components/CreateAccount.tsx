"use client";

import { useState, useEffect, useCallback } from "react";

interface AccountDetail {
  _id: string;
  name: string;
  balance: number;
  source?: string;
  sourceMonth?: string;
  totalDebited: number;
  totalCredited: number;
  originalTotal: number;
}

const SOURCES = ["Salary", "Scholarship", "Instagram Collaboration", "Misc", "Other"];
const MONTHS_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function CreateAccount({ onCreated }: { onCreated: () => void }) {
  const [accounts, setAccounts] = useState<AccountDetail[]>([]);
  const [loadingAccs, setLoadingAccs] = useState(true);
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [source, setSource] = useState("");
  const [customSource, setCustomSource] = useState("");
  const [salaryMonth, setSalaryMonth] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBalance, setEditBalance] = useState("");
  const [editError, setEditError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoadingAccs(true);
    try {
      const res = await fetch("/api/accounts?detailed=true");
      if (res.ok) setAccounts(await res.json());
    } catch { /* silently fail */ }
    finally { setLoadingAccs(false); }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const salaryAccounts = accounts.filter((a) => a.source === "Salary");
  const totalSalary = salaryAccounts.reduce((s, a) => s + a.originalTotal, 0);

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
      if (!res.ok) { setError(data.error || "Failed to create"); }
      else {
        setSuccess(`Account "${data.name}" created!`);
        setName(""); setBalance(""); setSource(""); setCustomSource(""); setSalaryMonth("");
        setShowCreate(false);
        fetchAccounts(); onCreated();
      }
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  };

  const startEdit = (acc: AccountDetail) => {
    setEditingId(acc._id);
    setEditName(acc.name);
    setEditBalance(acc.balance.toString());
    setEditError("");
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setEditError("");
    if (!editName.trim()) { setEditError("Name is required"); return; }
    const newBal = parseFloat(editBalance);
    if (isNaN(newBal) || newBal < 0) { setEditError("Balance must be non-negative"); return; }

    try {
      const res = await fetch(`/api/accounts/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName.trim(), balance: newBal }),
      });
      if (!res.ok) {
        const data = await res.json();
        setEditError(data.error || "Failed to update");
        return;
      }
      setEditingId(null);
      fetchAccounts(); onCreated();
    } catch { setEditError("Something went wrong"); }
  };

  const inputClass = "w-full px-4 py-2.5 border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 bg-white text-sm dark:bg-stone-800 dark:border-stone-600 dark:text-stone-100";
  const labelClass = "block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 dark:text-stone-400";
  const now = new Date();

  return (
    <div>
      {/* Salary summary */}
      {salaryAccounts.length > 0 && (
        <div className="bg-gradient-to-br from-emerald-700 to-emerald-800 rounded-xl p-4 mb-5 text-white">
          <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">Total Salary Received</p>
          <p className="text-2xl font-bold mt-1">₹{totalSalary.toLocaleString()}</p>
          <div className="flex flex-wrap gap-2 mt-2">
            {salaryAccounts.map((a) => (
              <span key={a._id} className="text-[10px] bg-emerald-600/40 px-2 py-0.5 rounded-full">
                {a.sourceMonth || a.name}: ₹{a.originalTotal.toLocaleString()}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Existing accounts */}
      {loadingAccs ? (
        <p className="text-center text-stone-400 text-sm py-4">Loading accounts...</p>
      ) : accounts.length > 0 ? (
        <div className="space-y-2 mb-5">
          <h3 className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider">Your Accounts</h3>
          {accounts.map((acc) => (
            <div key={acc._id} className="bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-3.5">
              {editingId === acc._id ? (
                <div className="space-y-2.5">
                  <div>
                    <label className={labelClass}>Name</label>
                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Current Balance (₹)</label>
                    <input type="number" value={editBalance} onChange={(e) => setEditBalance(e.target.value)} min="0" step="0.01" className={inputClass} />
                  </div>
                  {editError && <p className="text-red-600 text-xs text-center">{editError}</p>}
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(null)} className="flex-1 py-2 border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 text-xs font-bold rounded-lg cursor-pointer">Cancel</button>
                    <button onClick={saveEdit} className="flex-1 py-2 bg-teal-700 text-white text-xs font-bold rounded-lg cursor-pointer">Save</button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-sm text-stone-800 dark:text-stone-100">{acc.name}</p>
                      {acc.source && (
                        <span className="text-[10px] font-semibold text-stone-500 bg-stone-200 dark:bg-stone-700 dark:text-stone-400 px-2 py-0.5 rounded-full">
                          {acc.source}{acc.sourceMonth ? ` · ${acc.sourceMonth}` : ""}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 text-[11px]">
                      <span className="text-stone-400">Original: <span className="font-semibold text-stone-600 dark:text-stone-300">₹{acc.originalTotal.toLocaleString()}</span></span>
                      <span className="text-stone-400">Spent: <span className="font-semibold text-red-600 dark:text-red-400">₹{acc.totalDebited.toLocaleString()}</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-lg font-bold text-stone-800 dark:text-stone-100 tabular-nums">₹{acc.balance.toLocaleString()}</p>
                    </div>
                    <button onClick={() => startEdit(acc)}
                      className="p-2 text-stone-400 hover:text-teal-600 hover:bg-teal-50 dark:hover:bg-teal-900/20 rounded-lg cursor-pointer" title="Edit">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {/* Create new account */}
      {!showCreate ? (
        <button onClick={() => setShowCreate(true)}
          className="w-full py-2.5 bg-teal-700 text-white text-sm font-bold rounded-xl hover:bg-teal-800 transition-colors cursor-pointer">
          + Create New Account
        </button>
      ) : (
        <div className="border-2 border-teal-200 dark:border-teal-800 rounded-xl p-4 space-y-4 animate-[fadeIn_0.2s_ease-in-out]">
          <h3 className="text-xs font-semibold text-teal-700 dark:text-teal-400 uppercase tracking-wider">New Account</h3>
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
          {error && <p className="text-red-600 text-sm text-center bg-red-50 dark:bg-red-900/30 py-2 rounded-lg">{error}</p>}
          {success && <p className="text-emerald-700 text-sm text-center bg-emerald-50 dark:bg-emerald-900/30 py-2 rounded-lg">{success}</p>}
          <div className="flex gap-2">
            <button onClick={() => { setShowCreate(false); setError(""); setSuccess(""); }}
              className="flex-1 py-2.5 border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 text-sm font-bold rounded-xl cursor-pointer">Cancel</button>
            <button onClick={handleCreate} disabled={loading}
              className="flex-1 py-2.5 bg-teal-700 text-white text-sm font-bold rounded-xl hover:bg-teal-800 transition-colors disabled:opacity-50 cursor-pointer">
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
