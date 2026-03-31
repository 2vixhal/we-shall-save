"use client";

import { useState, useEffect, useCallback } from "react";
import MonthSelector from "./MonthSelector";

interface Account { _id: string; name: string; balance: number; }
interface InvestmentItem {
  _id: string;
  amount: number;
  category: string;
  subCategory?: string;
  accountId: { _id: string; name: string } | null;
  date: string;
}

const INV_CATEGORIES = ["Mutual Fund", "ETF", "Stock", "Gold", "Silver", "FD", "Debt Funds"];
const NEEDS_SUB = ["Mutual Fund", "ETF", "Stock", "FD", "Debt Funds"];

export default function InvestmentTracker({ onChanged }: { onChanged: () => void }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [investments, setInvestments] = useState<InvestmentItem[]>([]);
  const [savedSubs, setSavedSubs] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", category: "", subCategory: "", accountId: "", date: "" });
  const [saving, setSaving] = useState(false);

  const fetchAccounts = async () => {
    const res = await fetch("/api/accounts");
    if (res.ok) setAccounts(await res.json());
  };

  const fetchSubs = async () => {
    const res = await fetch("/api/investments/subcategories");
    if (res.ok) setSavedSubs(await res.json());
  };

  const fetchInvestments = useCallback(async () => {
    const res = await fetch(`/api/investments?month=${month}&year=${year}`);
    if (res.ok) setInvestments(await res.json());
  }, [month, year]);

  useEffect(() => { fetchAccounts(); fetchSubs(); }, []);
  useEffect(() => { if (showHistory) fetchInvestments(); }, [fetchInvestments, showHistory]);

  const handleSave = async () => {
    setError(""); setSuccess("");
    if (!amount || !category || !accountId) { setError("Amount, category, and account are required"); return; }
    if (NEEDS_SUB.includes(category) && !subCategory.trim()) { setError("Please specify the name (e.g. fund name)"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: parseFloat(amount), category, subCategory: NEEDS_SUB.includes(category) ? subCategory.trim() : undefined, accountId, date: date || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); }
      else {
        setSuccess(`₹${amount} invested in ${category}!`);
        setAmount(""); setCategory(""); setSubCategory(""); setAccountId(""); setDate("");
        fetchAccounts(); fetchSubs(); onChanged();
        if (showHistory) fetchInvestments();
      }
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  };

  const startEdit = (inv: InvestmentItem) => {
    setEditingId(inv._id);
    setEditForm({
      amount: inv.amount.toString(), category: inv.category,
      subCategory: inv.subCategory || "",
      accountId: inv.accountId?._id || "",
      date: inv.date ? new Date(inv.date).toISOString().split("T")[0] : "",
    });
  };

  const saveEdit = async () => {
    if (!editForm.amount || !editForm.category || !editForm.accountId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/investments/${editingId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(editForm.amount), category: editForm.category,
          subCategory: NEEDS_SUB.includes(editForm.category) ? editForm.subCategory.trim() : undefined,
          accountId: editForm.accountId, date: editForm.date || undefined,
        }),
      });
      if (res.ok) { setEditingId(null); fetchInvestments(); fetchAccounts(); onChanged(); }
    } catch { /* silently fail */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this investment? Balance will be restored.")) return;
    const res = await fetch(`/api/investments/${id}`, { method: "DELETE" });
    if (res.ok) { fetchInvestments(); fetchAccounts(); onChanged(); }
  };

  const inputClass = "w-full px-4 py-2.5 border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-white text-sm dark:bg-stone-800 dark:border-stone-600 dark:text-stone-100";
  const labelClass = "block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 dark:text-stone-400";
  const subsForCategory = savedSubs[category] || [];
  const editSubsForCategory = savedSubs[editForm.category] || [];

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Amount (₹)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00" min="0" step="0.01" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select value={category} onChange={(e) => { setCategory(e.target.value); setSubCategory(""); }} className={inputClass}>
            <option value="">Select investment type</option>
            {INV_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {NEEDS_SUB.includes(category) && (
          <div>
            <label className={labelClass}>Name</label>
            {subsForCategory.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {subsForCategory.map((s) => (
                  <button key={s} onClick={() => setSubCategory(s)} type="button"
                    className={`px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${subCategory === s ? "bg-stone-800 text-amber-50 dark:bg-amber-600" : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300"}`}>
                    {s}
                  </button>
                ))}
              </div>
            )}
            <input type="text" value={subCategory} onChange={(e) => setSubCategory(e.target.value)}
              placeholder="e.g. Nifty 50, Reliance" className={inputClass} />
          </div>
        )}
        <div>
          <label className={labelClass}>Account</label>
          <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
            <option value="">Deduct from account</option>
            {accounts.map((a) => <option key={a._id} value={a._id}>{a.name} (₹{a.balance.toLocaleString()})</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Date (optional)</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`} />
        </div>
        {error && <p className="text-red-600 text-sm text-center bg-red-50 dark:bg-red-900/30 py-2 rounded-lg">{error}</p>}
        {success && <p className="text-emerald-700 text-sm text-center bg-emerald-50 dark:bg-emerald-900/30 py-2 rounded-lg">{success}</p>}
        <button onClick={handleSave} disabled={loading}
          className="w-full py-2.5 bg-amber-700 text-white text-sm font-bold rounded-xl hover:bg-amber-800 transition-colors disabled:opacity-50 cursor-pointer">
          {loading ? "Saving..." : "Save Investment"}
        </button>
      </div>

      <div className="border-t border-stone-200 dark:border-stone-700 pt-4">
        <button onClick={() => setShowHistory(!showHistory)}
          className="w-full py-2 bg-stone-100 dark:bg-stone-700 text-stone-700 dark:text-stone-200 text-sm font-semibold rounded-xl hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors cursor-pointer">
          {showHistory ? "Hide" : "Show"} Monthly Investment History
        </button>
        {showHistory && (
          <div className="mt-4 animate-[fadeIn_0.3s_ease-in-out]">
            <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
            {investments.length === 0 ? (
              <p className="text-center text-stone-400 text-sm py-4">No investments this month.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-bold text-stone-700 dark:text-stone-200">
                  Total: ₹{investments.reduce((s, i) => s + i.amount, 0).toLocaleString()}
                </p>
                {investments.map((inv) => (
                  <div key={inv._id}>
                    {editingId === inv._id ? (
                      <div className="bg-stone-50 dark:bg-stone-800 rounded-xl p-3 border-2 border-amber-500/50 space-y-2">
                        <input type="number" value={editForm.amount} onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                          placeholder="Amount" className={inputClass} />
                        <select value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value, subCategory: "" }))} className={inputClass}>
                          {INV_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                        {NEEDS_SUB.includes(editForm.category) && (
                          <>
                            {editSubsForCategory.length > 0 && (
                              <div className="flex flex-wrap gap-1.5">
                                {editSubsForCategory.map((s) => (
                                  <button key={s} onClick={() => setEditForm((f) => ({ ...f, subCategory: s }))} type="button"
                                    className={`px-2 py-0.5 text-xs rounded-full cursor-pointer ${editForm.subCategory === s ? "bg-stone-800 text-amber-50" : "bg-stone-200 text-stone-600"}`}>{s}</button>
                                ))}
                              </div>
                            )}
                            <input type="text" value={editForm.subCategory} onChange={(e) => setEditForm((f) => ({ ...f, subCategory: e.target.value }))}
                              placeholder="Fund/Stock name" className={inputClass} />
                          </>
                        )}
                        <select value={editForm.accountId} onChange={(e) => setEditForm((f) => ({ ...f, accountId: e.target.value }))} className={inputClass}>
                          {accounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                        </select>
                        <input type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} className={inputClass} />
                        <div className="flex gap-2">
                          <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 border border-stone-300 text-stone-600 text-xs font-bold rounded-lg cursor-pointer">Cancel</button>
                          <button onClick={saveEdit} disabled={saving} className="flex-1 py-1.5 bg-stone-800 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50">
                            {saving ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-stone-50 dark:bg-stone-700/50 rounded-xl p-3">
                        <div>
                          <p className="text-sm font-semibold text-stone-800 dark:text-stone-200">{inv.category}{inv.subCategory ? ` — ${inv.subCategory}` : ""}</p>
                          <p className="text-xs text-stone-400">{new Date(inv.date).toLocaleDateString()} · {inv.accountId?.name || "—"}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold text-amber-800 dark:text-amber-400">₹{inv.amount.toLocaleString()}</span>
                          <button onClick={() => startEdit(inv)} className="p-1 text-stone-400 hover:text-amber-700 cursor-pointer">
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                          </button>
                          <button onClick={() => handleDelete(inv._id)} className="p-1 text-red-400 hover:text-red-600 cursor-pointer">
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
        )}
      </div>
    </div>
  );
}
