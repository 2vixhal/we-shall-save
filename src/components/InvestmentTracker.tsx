"use client";

import { useState, useEffect, useCallback } from "react";
import MonthSelector from "./MonthSelector";

interface Account { _id: string; name: string; balance: number; }
interface InvestmentItem {
  _id: string;
  amount: number;
  category: string;
  subCategory?: string;
  note?: string;
  accountId: { _id: string; name: string } | null;
  date: string;
}

const INV_CATEGORIES = ["Mutual Fund", "ETF", "Stock", "Gold", "Silver", "FD", "Debt Funds", "Other"];
const NEEDS_SUB = ["Mutual Fund", "ETF", "Stock", "FD", "Debt Funds"];

export default function InvestmentTracker({ onChanged }: { onChanged: () => void }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [viewMode, setViewMode] = useState<"month" | "year" | "all">("month");

  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [note, setNote] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [investments, setInvestments] = useState<InvestmentItem[]>([]);
  const [savedSubs, setSavedSubs] = useState<Record<string, string[]>>({});
  const [savedCustomCats, setSavedCustomCats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ amount: "", category: "", customCategory: "", subCategory: "", note: "", accountId: "", date: "" });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  const getId = (item: { _id?: string; id?: string }) => String(item._id || item.id || "");

  const fetchAccounts = async () => {
    const res = await fetch("/api/accounts");
    if (res.ok) setAccounts(await res.json());
  };

  const fetchSubs = async () => {
    const res = await fetch("/api/investments/subcategories");
    if (res.ok) setSavedSubs(await res.json());
  };

  const fetchCustomCats = async () => {
    const res = await fetch("/api/investments/custom-categories");
    if (res.ok) setSavedCustomCats(await res.json());
  };

  const fetchInvestments = useCallback(async () => {
    const dateParams = viewMode === "all" ? "" : viewMode === "year" ? `&year=${year}` : `&month=${month}&year=${year}`;
    const res = await fetch(`/api/investments?view=${viewMode}${dateParams}`);
    if (res.ok) setInvestments(await res.json());
  }, [month, year, viewMode]);

  useEffect(() => { fetchAccounts(); fetchSubs(); fetchCustomCats(); }, []);
  useEffect(() => { if (showHistory) fetchInvestments(); }, [fetchInvestments, showHistory]);

  const effectiveCategory = category === "Other" ? customCategory.trim() : category;

  const handleSave = async () => {
    setError(""); setSuccess("");
    if (!amount || !category || !accountId) { setError("Amount, category, and account are required"); return; }
    if (category === "Other" && !customCategory.trim()) { setError("Please specify the investment type"); return; }
    if (NEEDS_SUB.includes(category) && !subCategory.trim()) { setError("Please specify the name (e.g. fund name)"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/investments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          category: effectiveCategory,
          subCategory: NEEDS_SUB.includes(category) ? subCategory.trim() : undefined,
          note: note.trim() || undefined,
          accountId,
          date: date || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); }
      else {
        setSuccess(`₹${amount} invested in ${effectiveCategory}!`);
        setAmount(""); setCategory(""); setCustomCategory(""); setSubCategory(""); setNote(""); setAccountId(""); setDate("");
        fetchAccounts(); fetchSubs(); fetchCustomCats(); onChanged();
        if (showHistory) fetchInvestments();
      }
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  };

  const startEdit = (inv: InvestmentItem) => {
    const isPreset = INV_CATEGORIES.includes(inv.category) && inv.category !== "Other";
    setEditingId(getId(inv));
    setEditForm({
      amount: inv.amount.toString(),
      category: isPreset ? inv.category : "Other",
      customCategory: isPreset ? "" : inv.category,
      subCategory: inv.subCategory || "",
      note: inv.note || "",
      accountId: inv.accountId?._id || "",
      date: inv.date ? new Date(inv.date).toISOString().split("T")[0] : "",
    });
  };

  const saveEdit = async () => {
    const finalCat = editForm.category === "Other" ? editForm.customCategory.trim() : editForm.category;
    if (!editForm.amount || !finalCat || !editForm.accountId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/investments/${editingId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(editForm.amount),
          category: finalCat,
          subCategory: NEEDS_SUB.includes(editForm.category) ? editForm.subCategory.trim() : undefined,
          note: editForm.note.trim() || undefined,
          accountId: editForm.accountId,
          date: editForm.date || undefined,
        }),
      });
      if (res.ok) { setEditingId(null); fetchInvestments(); fetchAccounts(); onChanged(); }
    } catch { /* silently fail */ }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    if (!id || deletingId) return;
    if (!confirm("Delete this investment? Balance will be restored.")) return;
    setDeletingId(id);
    setError("");
    try {
      const res = await fetch(`/api/investments/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to delete investment");
        return;
      }
      if (editingId === id) setEditingId(null);
      await fetchInvestments();
      fetchAccounts();
      onChanged();
    } catch {
      setError("Failed to delete investment");
    } finally {
      setDeletingId(null);
    }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const categorySummary = (() => {
    const map: Record<string, { total: number; items: InvestmentItem[] }> = {};
    for (const inv of investments) {
      if (!map[inv.category]) map[inv.category] = { total: 0, items: [] };
      map[inv.category].total += inv.amount;
      map[inv.category].items.push(inv);
    }
    return Object.entries(map)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.total - a.total);
  })();

  const totalInvested = investments.reduce((s, i) => s + i.amount, 0);

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
          <select value={category} onChange={(e) => { setCategory(e.target.value); setSubCategory(""); setCustomCategory(""); }} className={inputClass}>
            <option value="">Select investment type</option>
            {INV_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          {category === "Other" && (
            <div className="mt-2">
              {savedCustomCats.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {savedCustomCats.map((c) => (
                    <button key={c} onClick={() => setCustomCategory(c)} type="button"
                      className={`px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${customCategory === c ? "bg-stone-800 text-amber-50 dark:bg-amber-600" : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300"}`}>
                      {c}
                    </button>
                  ))}
                </div>
              )}
              <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Savings, PPF, NPS" className={inputClass} />
            </div>
          )}
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
          <label className={labelClass}>Note (optional)</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. SIP, lump sum, one-time" className={inputClass} />
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
          {showHistory ? "Hide" : "Show"} Investment History
        </button>
        {showHistory && (
          <div className="mt-4 animate-[fadeIn_0.3s_ease-in-out]">
            <div className="flex bg-stone-100 dark:bg-stone-700 rounded-xl p-1 mb-4">
              {(["month", "year", "all"] as const).map((v) => (
                <button key={v} onClick={() => setViewMode(v)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${viewMode === v ? "bg-amber-700 text-white shadow" : "text-stone-500 dark:text-stone-400"}`}>
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

            {/* Total */}
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl p-3.5 text-center mb-4">
              <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold">Total Invested</p>
              <p className="text-xl font-bold text-amber-800 dark:text-amber-300">₹{totalInvested.toLocaleString()}</p>
            </div>

            {/* Per-category summary */}
            {categorySummary.length === 0 ? (
              <p className="text-center text-stone-400 text-sm py-4">No investments for this period.</p>
            ) : (
              <div className="space-y-2.5">
                {categorySummary.map((cs) => {
                  const isOpen = expandedCat === cs.name;
                  return (
                    <div key={cs.name} className={`rounded-xl border overflow-hidden transition-all ${isOpen ? "border-amber-400 dark:border-amber-600" : "border-stone-200 dark:border-stone-700"}`}>
                      <button onClick={() => setExpandedCat(isOpen ? null : cs.name)}
                        className={`w-full text-left p-3.5 cursor-pointer transition-colors ${isOpen ? "bg-amber-50 dark:bg-amber-900/15" : "bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700/50"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-bold text-sm text-stone-800 dark:text-stone-100">{cs.name}</p>
                            <p className="text-[11px] text-stone-400 mt-0.5">{cs.items.length} investment{cs.items.length !== 1 ? "s" : ""}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-amber-800 dark:text-amber-400 tabular-nums">₹{cs.total.toLocaleString()}</span>
                            <svg className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </button>

                      {isOpen && (
                        <div className="border-t border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-3 space-y-1.5 animate-[fadeIn_0.2s_ease-in-out] max-h-72 overflow-y-auto">
                          {cs.items.map((inv) => {
                            const invId = getId(inv);
                            return (
                            <div key={invId}>
                              {editingId === invId ? (
                                <div className="bg-amber-50 dark:bg-amber-900/10 rounded-lg p-2.5 space-y-2 border border-amber-200 dark:border-amber-800">
                                  <input type="number" value={editForm.amount} onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                                    placeholder="Amount" className={inputClass} />
                                  <select value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value, subCategory: "", customCategory: "" }))} className={inputClass}>
                                    {INV_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                                  </select>
                                  {editForm.category === "Other" && (
                                    <input type="text" value={editForm.customCategory} onChange={(e) => setEditForm((f) => ({ ...f, customCategory: e.target.value }))}
                                      placeholder="Investment type" className={inputClass} />
                                  )}
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
                                  <input type="text" value={editForm.note} onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))}
                                    placeholder="Note (optional)" className={inputClass} />
                                  <select value={editForm.accountId} onChange={(e) => setEditForm((f) => ({ ...f, accountId: e.target.value }))} className={inputClass}>
                                    {accounts.map((a) => <option key={a._id} value={a._id}>{a.name}</option>)}
                                  </select>
                                  <input type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} className={inputClass} />
                                  <div className="flex gap-2">
                                    <button onClick={() => setEditingId(null)} className="flex-1 py-1.5 border border-stone-300 text-stone-600 text-xs font-bold rounded-lg cursor-pointer dark:border-stone-600 dark:text-stone-300">Cancel</button>
                                    <button onClick={saveEdit} disabled={saving} className="flex-1 py-1.5 bg-amber-700 text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50">
                                      {saving ? "Saving..." : "Save"}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between bg-stone-50 dark:bg-stone-700/50 rounded-lg p-2.5 border border-stone-100 dark:border-stone-700">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs font-bold text-amber-800 dark:text-amber-400">₹{inv.amount.toLocaleString()}</span>
                                      {inv.subCategory && <span className="text-xs text-stone-500 dark:text-stone-400 truncate">{inv.subCategory}</span>}
                                      <span className="text-[10px] text-stone-400">{inv.accountId?.name || "—"}</span>
                                    </div>
                                    {inv.note && <p className="text-[11px] text-amber-600 dark:text-amber-400 truncate mt-0.5">📝 {inv.note}</p>}
                                    <p className="text-[10px] text-stone-400 mt-0.5">{fmtDate(inv.date)}</p>
                                  </div>
                                  <div className="flex gap-1 ml-2 shrink-0">
                                    <button type="button" onClick={(e) => { e.stopPropagation(); startEdit(inv); }} className="p-1.5 text-stone-400 hover:text-amber-600 cursor-pointer" title="Edit">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                    </button>
                                    <button type="button" onClick={(e) => handleDelete(invId, e)} disabled={deletingId === invId}
                                      className="p-1.5 text-stone-400 hover:text-red-600 cursor-pointer disabled:opacity-50" title="Delete">
                                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );})}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
