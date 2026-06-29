"use client";

import { useState, useEffect, useCallback } from "react";
import MonthSelector from "./MonthSelector";

interface Account { _id: string; name: string; balance: number; }
interface FamilyTxn {
  _id: string;
  type: "debit" | "credit";
  amount: number;
  member: string;
  accountId: { _id: string; name: string } | string;
  note?: string;
  date: string;
}

const DEFAULT_MEMBERS = ["Dadi", "Vedika", "Mammi", "Papa"];

export default function FamilyTracker({ onChanged }: { onChanged: () => void }) {
  const now = new Date();
  const [mode, setMode] = useState<"debit" | "credit">("debit");
  const [amount, setAmount] = useState("");
  const [member, setMember] = useState("");
  const [customMember, setCustomMember] = useState("");
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [members, setMembers] = useState<string[]>([]);
  const [txns, setTxns] = useState<FamilyTxn[]>([]);
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [viewMode, setViewMode] = useState<"month" | "year" | "all">("month");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<FamilyTxn & { accountId: string }>>({});

  const fetchAccounts = async () => {
    const res = await fetch("/api/accounts");
    if (res.ok) setAccounts(await res.json());
  };

  const fetchMembers = async () => {
    const res = await fetch("/api/family/members");
    if (res.ok) {
      const saved: string[] = await res.json();
      const merged = [...new Set([...DEFAULT_MEMBERS, ...saved])];
      setMembers(merged);
    }
  };

  const fetchTxns = useCallback(async () => {
    const dateParams = viewMode === "all" ? "" : viewMode === "year" ? `month=&year=${year}&view=year` : `month=${month}&year=${year}&view=month`;
    const res = await fetch(`/api/family?${dateParams}`);
    if (res.ok) setTxns(await res.json());
  }, [month, year, viewMode]);

  useEffect(() => { fetchAccounts(); fetchMembers(); }, []);
  useEffect(() => { fetchTxns(); }, [fetchTxns]);

  const getAccName = (aid: FamilyTxn["accountId"]) =>
    typeof aid === "object" && aid?.name ? aid.name : "Unknown";

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const handleSave = async () => {
    setError(""); setSuccess("");
    const selectedMember = member === "__other__" ? customMember.trim() : member;
    if (!amount || !selectedMember || !accountId) {
      setError("Amount, member, and account are required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mode,
          amount: parseFloat(amount),
          member: selectedMember,
          accountId,
          note: note.trim() || undefined,
          date: date || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to save");
      else {
        setSuccess(`₹${amount} ${mode === "debit" ? "sent to" : "received from"} ${selectedMember}`);
        setAmount(""); setMember(""); setCustomMember(""); setNote(""); setAccountId(""); setDate("");
        fetchAccounts(); fetchMembers(); fetchTxns(); onChanged();
      }
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    const res = await fetch(`/api/family/${id}`, { method: "DELETE" });
    if (res.ok) { fetchTxns(); fetchAccounts(); onChanged(); }
  };

  const handleEditSave = async () => {
    if (!editId) return;
    const res = await fetch(`/api/family/${editId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) { setEditId(null); fetchTxns(); fetchAccounts(); onChanged(); }
  };

  const totalSent = txns.filter((t) => t.type === "debit").reduce((s, t) => s + t.amount, 0);
  const totalReceived = txns.filter((t) => t.type === "credit").reduce((s, t) => s + t.amount, 0);

  const inputClass = "w-full px-4 py-2.5 border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-pink-500/50 focus:border-pink-500 bg-white text-sm dark:bg-stone-800 dark:border-stone-600 dark:text-stone-100";
  const labelClass = "block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 dark:text-stone-400";

  return (
    <div>
      {/* Mode toggle */}
      <div className="flex bg-stone-100 dark:bg-stone-700 rounded-xl p-1 mb-5">
        <button onClick={() => setMode("debit")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${mode === "debit" ? "bg-red-600 text-white shadow" : "text-stone-500 dark:text-stone-400"}`}>
          Sent to Family
        </button>
        <button onClick={() => setMode("credit")}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${mode === "credit" ? "bg-emerald-600 text-white shadow" : "text-stone-500 dark:text-stone-400"}`}>
          Received from Family
        </button>
      </div>

      {/* Form */}
      <div className="space-y-4 mb-6">
        <div>
          <label className={labelClass}>Amount (₹)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00" min="0" step="0.01" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Family Member</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {members.map((m) => (
              <button key={m} onClick={() => { setMember(m); setCustomMember(""); }} type="button"
                className={`px-3 py-1.5 text-xs rounded-full transition-all cursor-pointer ${member === m ? "bg-pink-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300"}`}>
                {m}
              </button>
            ))}
            <button onClick={() => setMember("__other__")} type="button"
              className={`px-3 py-1.5 text-xs rounded-full transition-all cursor-pointer ${member === "__other__" ? "bg-pink-700 text-white" : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300"}`}>
              + Other
            </button>
          </div>
          {member === "__other__" && (
            <input type="text" value={customMember} onChange={(e) => setCustomMember(e.target.value)}
              placeholder="Enter name" className={inputClass} />
          )}
        </div>

        <div>
          <label className={labelClass}>Account</label>
          {accounts.length === 0 ? (
            <p className="text-amber-700 text-xs py-2 font-medium">No accounts yet.</p>
          ) : (
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
              <option value="">Select account</option>
              {accounts.map((a) => <option key={a._id} value={a._id}>{a.name} (₹{a.balance.toLocaleString()})</option>)}
            </select>
          )}
        </div>

        <div>
          <label className={labelClass}>Note (optional)</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. For groceries, birthday gift" className={inputClass} />
        </div>

        <div>
          <label className={labelClass}>Date (optional)</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`} />
          <p className="text-xs text-stone-400 mt-1">Leave empty for today</p>
        </div>

        {error && <p className="text-red-600 text-sm text-center bg-red-50 dark:bg-red-900/30 py-2 rounded-lg">{error}</p>}
        {success && <p className="text-emerald-700 text-sm text-center bg-emerald-50 dark:bg-emerald-900/30 py-2 rounded-lg">{success}</p>}

        <button onClick={handleSave} disabled={loading}
          className="w-full py-2.5 bg-pink-700 text-white text-sm font-bold rounded-xl hover:bg-pink-800 transition-colors disabled:opacity-50 cursor-pointer">
          {loading ? "Saving..." : `Save ${mode === "debit" ? "Sent" : "Received"}`}
        </button>
      </div>

      {/* Monthly history */}
      <div className="border-t border-stone-200 dark:border-stone-700 pt-5">
        <h3 className="text-sm font-bold text-stone-700 dark:text-stone-200 mb-3">Family Transaction History</h3>
        <div className="flex bg-stone-100 dark:bg-stone-700 rounded-xl p-1 mb-4">
          {(["month", "year", "all"] as const).map((v) => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === v ? "bg-pink-700 text-white shadow" : "text-stone-500 dark:text-stone-400"}`}>
              {v === "month" ? "Monthly" : v === "year" ? "Yearly" : "All Time"}
            </button>
          ))}
        </div>
        {viewMode === "month" && (
          <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
        )}
        {viewMode === "year" && (
          <div className="flex items-center justify-center gap-4 mb-5">
            <button onClick={() => setYear(year - 1)} className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <span className="text-lg font-bold text-stone-700 dark:text-stone-200 tabular-nums">{year}</span>
            <button onClick={() => setYear(year + 1)} className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 cursor-pointer p-1">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl p-3 text-center">
            <p className="text-xs text-red-600 dark:text-red-400 font-semibold">Sent</p>
            <p className="text-lg font-bold text-red-700 dark:text-red-300">₹{totalSent.toLocaleString()}</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-3 text-center">
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">Received</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">₹{totalReceived.toLocaleString()}</p>
          </div>
        </div>

        {txns.length === 0 ? (
          <p className="text-stone-400 text-center text-sm py-4">No family transactions this month.</p>
        ) : (
          <div className="space-y-2">
            {txns.map((tx) => (
              <div key={tx._id} className="bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-3">
                {editId === tx._id ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <select value={editForm.type} onChange={(e) => setEditForm({ ...editForm, type: e.target.value as "debit" | "credit" })}
                        className="px-2 py-1.5 text-xs border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 dark:text-stone-100">
                        <option value="debit">Sent</option>
                        <option value="credit">Received</option>
                      </select>
                      <input type="number" value={editForm.amount} onChange={(e) => setEditForm({ ...editForm, amount: parseFloat(e.target.value) })}
                        className="px-2 py-1.5 text-xs border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 dark:text-stone-100" />
                    </div>
                    <input type="text" value={editForm.member} onChange={(e) => setEditForm({ ...editForm, member: e.target.value })}
                      placeholder="Member name" className="w-full px-2 py-1.5 text-xs border border-stone-300 dark:border-stone-600 rounded-lg bg-white dark:bg-stone-700 dark:text-stone-100" />
                    <div className="flex gap-2">
                      <button onClick={handleEditSave} className="flex-1 py-1.5 bg-pink-700 text-white text-xs font-bold rounded-lg cursor-pointer">Save</button>
                      <button onClick={() => setEditId(null)} className="flex-1 py-1.5 border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 text-xs font-bold rounded-lg cursor-pointer">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${tx.type === "debit" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                          {tx.type === "debit" ? "−" : "+"}₹{tx.amount.toLocaleString()}
                        </span>
                        <span className="text-xs font-medium text-stone-700 dark:text-stone-200">{tx.member}</span>
                        <span className="text-[10px] text-stone-400">{getAccName(tx.accountId)}</span>
                      </div>
                      {tx.note && <p className="text-[11px] text-pink-600 dark:text-pink-400 truncate mt-0.5">📝 {tx.note}</p>}
                      <p className="text-[10px] text-stone-400 mt-0.5">{fmtDate(tx.date)}</p>
                    </div>
                    <div className="flex gap-1.5 ml-2">
                      <button onClick={() => { setEditId(tx._id); setEditForm({ type: tx.type, amount: tx.amount, member: tx.member, accountId: typeof tx.accountId === "object" ? tx.accountId._id : tx.accountId }); }}
                        className="p-1.5 text-stone-400 hover:text-amber-600 cursor-pointer" title="Edit">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => handleDelete(tx._id)}
                        className="p-1.5 text-stone-400 hover:text-red-600 cursor-pointer" title="Delete">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
