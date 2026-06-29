"use client";

import { useState, useEffect, useCallback } from "react";
import MonthSelector from "./MonthSelector";

interface Account { _id: string; name: string; balance: number; }

interface TransactionItem {
  _id: string;
  type: "debit" | "credit";
  amount: number;
  category?: string;
  receivedFrom?: string;
  note?: string;
  salaryMonth?: string;
  accountId: { _id: string; name: string } | string;
  date: string;
  createdAt: string;
}

const CATEGORIES = [
  "Transport", "Petrol",
  "Recharges", "Outside Eating", "Lent", "Protein",
  "Recreational Activity", "Food", "Shopping", "Bills",
  "Entertainment", "Health", "Education", "Clothing", "UPI Lite", "Misc", "Other",
];

export default function TransactionHistory({ onChanged }: { onChanged: () => void }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    type: "debit" as "debit" | "credit", amount: "", category: "",
    customCategory: "", receivedFrom: "", accountId: "", date: "", note: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [movingId, setMovingId] = useState<string | null>(null);
  const [moveMember, setMoveMember] = useState("");
  const [moveCustomMember, setMoveCustomMember] = useState("");
  const [moveNote, setMoveNote] = useState("");
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);

  const DEFAULT_FAMILY = ["Dadi", "Vedika", "Mammi", "Papa"];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [txRes, accRes] = await Promise.all([
        fetch(`/api/transactions?month=${month}&year=${year}`),
        fetch("/api/accounts"),
      ]);
      if (txRes.ok) setTransactions(await txRes.json());
      if (accRes.ok) setAccounts(await accRes.json());
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    fetch("/api/family/members").then((r) => r.ok ? r.json() : []).then((saved: string[]) => {
      setFamilyMembers([...new Set([...DEFAULT_FAMILY, ...saved])]);
    });
  }, []);

  const getAccountName = (accountId: TransactionItem["accountId"]) => {
    if (typeof accountId === "object" && accountId?.name) return accountId.name;
    const acc = accounts.find((a) => a._id === accountId);
    return acc?.name || "Unknown";
  };

  const getAccountId = (accountId: TransactionItem["accountId"]) =>
    typeof accountId === "object" ? accountId._id : accountId;

  const startEdit = (tx: TransactionItem) => {
    const isPreset = CATEGORIES.includes(tx.category || "");
    setEditingId(tx._id);
    setEditForm({
      type: tx.type, amount: tx.amount.toString(),
      category: tx.type === "debit" ? (isPreset ? tx.category || "" : "Other") : "",
      customCategory: tx.type === "debit" && !isPreset ? tx.category || "" : "",
      receivedFrom: tx.receivedFrom || "", accountId: getAccountId(tx.accountId),
      date: tx.date ? new Date(tx.date).toISOString().split("T")[0] : "",
      note: tx.note || "",
    });
    setError("");
  };

  const saveEdit = async () => {
    setError("");
    const finalCategory = editForm.type === "debit"
      ? editForm.category === "Other" ? editForm.customCategory.trim() : editForm.category
      : undefined;
    if (!editForm.amount || !editForm.accountId) { setError("Amount and account are required"); return; }
    if (editForm.type === "debit" && !finalCategory) { setError("Please select or enter a category"); return; }
    if (editForm.type === "credit" && !editForm.receivedFrom.trim()) { setError("Please enter who you received this from"); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/transactions/${editingId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editForm.type, amount: parseFloat(editForm.amount),
          category: finalCategory,
          receivedFrom: editForm.type === "credit" ? editForm.receivedFrom.trim() : undefined,
          accountId: editForm.accountId, date: editForm.date || undefined,
          note: editForm.note.trim() || undefined,
        }),
      });
      if (!res.ok) { const data = await res.json(); setError(data.error || "Failed to update"); return; }
      setEditingId(null); await fetchData(); onChanged();
    } catch { setError("Something went wrong"); }
    finally { setSaving(false); }
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm("Delete this transaction? The balance will be reversed.")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      if (res.ok) { await fetchData(); onChanged(); }
    } catch { /* silently fail */ }
    finally { setDeletingId(null); }
  };

  const startMove = (tx: TransactionItem) => {
    setMovingId(tx._id);
    setMoveMember("");
    setMoveCustomMember("");
    setMoveNote(tx.note || "");
    setError("");
  };

  const confirmMove = async () => {
    const selectedMember = moveMember === "__other__" ? moveCustomMember.trim() : moveMember;
    if (!selectedMember) { setError("Please select a family member"); return; }

    const tx = transactions.find((t) => t._id === movingId);
    if (!tx) return;

    setSaving(true);
    try {
      const accId = typeof tx.accountId === "object" ? tx.accountId._id : tx.accountId;

      const delRes = await fetch(`/api/transactions/${movingId}`, { method: "DELETE" });
      if (!delRes.ok) { setError("Failed to remove original transaction"); return; }

      const createRes = await fetch("/api/family", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: tx.type,
          amount: tx.amount,
          member: selectedMember,
          accountId: accId,
          note: moveNote.trim() || undefined,
          date: tx.date || tx.createdAt,
        }),
      });
      if (!createRes.ok) {
        const data = await createRes.json();
        setError(data.error || "Failed to create family transaction");
        return;
      }

      setMovingId(null);
      await fetchData();
      onChanged();
    } catch { setError("Something went wrong"); }
    finally { setSaving(false); }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const inputClass = "w-full px-3 py-2 border border-stone-300 rounded-lg text-sm text-stone-800 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/50";

  return (
    <div>
      <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />

      {loading ? (
        <div className="text-center py-6 text-stone-400 text-sm">Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className="text-center py-8 text-stone-400">
          <p className="text-sm font-medium">No transactions this month</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-stone-400 font-medium">
            {transactions.length} transaction{transactions.length !== 1 && "s"}
          </p>

          {error && editingId && (
            <p className="text-red-600 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>
          )}

          {transactions.map((tx) => (
            <div key={tx._id}>
              {editingId === tx._id ? (
                <div className="bg-stone-50 rounded-xl p-4 border-2 border-amber-500/50 space-y-2.5">
                  <div className="flex bg-stone-200 rounded-lg p-1">
                    <button onClick={() => setEditForm((f) => ({ ...f, type: "debit", receivedFrom: "", category: "", customCategory: "" }))}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${editForm.type === "debit" ? "bg-red-600 text-white" : "text-stone-500"}`}>
                      Debit
                    </button>
                    <button onClick={() => setEditForm((f) => ({ ...f, type: "credit", category: "", customCategory: "" }))}
                      className={`flex-1 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${editForm.type === "credit" ? "bg-emerald-600 text-white" : "text-stone-500"}`}>
                      Credit
                    </button>
                  </div>
                  <input type="number" value={editForm.amount} onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                    placeholder="Amount" min="0" step="0.01" className={inputClass} />
                  {editForm.type === "debit" ? (
                    <>
                      <select value={editForm.category} onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value, customCategory: e.target.value !== "Other" ? "" : f.customCategory }))}
                        className={inputClass}>
                        <option value="">Select category</option>
                        {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      {editForm.category === "Other" && (
                        <input type="text" value={editForm.customCategory} onChange={(e) => setEditForm((f) => ({ ...f, customCategory: e.target.value }))}
                          placeholder="Type your expense category" className={inputClass} />
                      )}
                    </>
                  ) : (
                    <input type="text" value={editForm.receivedFrom} onChange={(e) => setEditForm((f) => ({ ...f, receivedFrom: e.target.value }))}
                      placeholder="Received from" className={inputClass} />
                  )}
                  <select value={editForm.accountId} onChange={(e) => setEditForm((f) => ({ ...f, accountId: e.target.value }))} className={inputClass}>
                    <option value="">Select account</option>
                    {accounts.map((acc) => <option key={acc._id} value={acc._id}>{acc.name}</option>)}
                  </select>
                  <input type="date" value={editForm.date} onChange={(e) => setEditForm((f) => ({ ...f, date: e.target.value }))} className={inputClass} />
                  <input type="text" value={editForm.note} onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))}
                    placeholder="Note (optional)" className={inputClass} />
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingId(null); setError(""); }}
                      className="flex-1 py-2 border border-stone-300 text-stone-600 text-xs font-bold rounded-lg hover:bg-stone-100 cursor-pointer">Cancel</button>
                    <button onClick={saveEdit} disabled={saving}
                      className="flex-1 py-2 bg-stone-800 text-white text-xs font-bold rounded-lg hover:bg-stone-900 disabled:opacity-50 cursor-pointer">
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-50 dark:bg-stone-800 rounded-xl border border-stone-100 dark:border-stone-700 hover:border-stone-200 dark:hover:border-stone-600 transition-colors">
                  <div className="flex items-center justify-between p-3.5">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${tx.type === "debit" ? "bg-red-100 dark:bg-red-900/30" : "bg-emerald-100 dark:bg-emerald-900/30"}`}>
                        <span className={`text-base font-bold ${tx.type === "debit" ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                          {tx.type === "debit" ? "−" : "+"}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold text-sm ${tx.type === "debit" ? "text-red-700 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400"}`}>
                            {tx.type === "debit" ? "−" : "+"}₹{tx.amount.toLocaleString()}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 truncate">
                          {tx.type === "debit" ? tx.category : `From: ${tx.receivedFrom}`}
                          {tx.salaryMonth && ` (${tx.salaryMonth})`}
                          {" "}&middot; {getAccountName(tx.accountId)}
                        </p>
                        {tx.note && <p className="text-xs text-amber-600 dark:text-amber-400 truncate">📝 {tx.note}</p>}
                        <p className="text-xs text-stone-400">{formatDate(tx.date || tx.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-0.5 flex-shrink-0 ml-2">
                      <button onClick={() => startMove(tx)}
                        className="p-2 text-stone-400 hover:text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-900/20 rounded-lg transition-colors cursor-pointer" title="Move to Family">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                      </button>
                      <button onClick={() => startEdit(tx)}
                        className="p-2 text-stone-400 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors cursor-pointer" title="Edit">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button onClick={() => deleteTransaction(tx._id)} disabled={deletingId === tx._id}
                        className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 cursor-pointer" title="Delete">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {movingId === tx._id && (
                    <div className="border-t border-pink-200 dark:border-pink-800 bg-pink-50/50 dark:bg-pink-900/10 p-3.5 rounded-b-xl space-y-2.5 animate-[fadeIn_0.2s_ease-in-out]">
                      <p className="text-xs font-semibold text-pink-700 dark:text-pink-400">Move to Family Section</p>
                      <div className="flex flex-wrap gap-1.5">
                        {familyMembers.map((m) => (
                          <button key={m} onClick={() => { setMoveMember(m); setMoveCustomMember(""); }} type="button"
                            className={`px-3 py-1.5 text-xs rounded-full transition-all cursor-pointer ${moveMember === m ? "bg-pink-700 text-white" : "bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-600"}`}>
                            {m}
                          </button>
                        ))}
                        <button onClick={() => setMoveMember("__other__")} type="button"
                          className={`px-3 py-1.5 text-xs rounded-full transition-all cursor-pointer ${moveMember === "__other__" ? "bg-pink-700 text-white" : "bg-white dark:bg-stone-700 text-stone-600 dark:text-stone-300 border border-stone-200 dark:border-stone-600"}`}>
                          + Other
                        </button>
                      </div>
                      {moveMember === "__other__" && (
                        <input type="text" value={moveCustomMember} onChange={(e) => setMoveCustomMember(e.target.value)}
                          placeholder="Enter member name" className={`${inputClass} dark:bg-stone-800 dark:border-stone-600 dark:text-stone-100`} />
                      )}
                      <input type="text" value={moveNote} onChange={(e) => setMoveNote(e.target.value)}
                        placeholder="Note (optional)" className={`${inputClass} dark:bg-stone-800 dark:border-stone-600 dark:text-stone-100`} />
                      {error && movingId && <p className="text-red-600 text-xs">{error}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => { setMovingId(null); setError(""); }}
                          className="flex-1 py-2 border border-stone-300 dark:border-stone-600 text-stone-600 dark:text-stone-300 text-xs font-bold rounded-lg cursor-pointer">Cancel</button>
                        <button onClick={confirmMove} disabled={saving}
                          className="flex-1 py-2 bg-pink-700 text-white text-xs font-bold rounded-lg hover:bg-pink-800 disabled:opacity-50 cursor-pointer">
                          {saving ? "Moving..." : "Move to Family"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
