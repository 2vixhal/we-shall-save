"use client";

import { useState, useEffect } from "react";

interface Account { _id: string; name: string; balance: number; }

const CATEGORIES = [
  "Dadi", "Vedika", "Mammi", "Papa", "Transport", "Petrol",
  "Recharges", "Outside Eating", "Lent", "Protein",
  "Recreational Activity", "Food", "Shopping", "Bills",
  "Entertainment", "Health", "Education", "Clothing", "UPI Lite", "Other",
];

export default function DebitCreditForm({ onSaved }: { onSaved: () => void }) {
  const [mode, setMode] = useState<"debit" | "credit">("debit");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [receivedFrom, setReceivedFrom] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => { fetchAccounts(); }, []);
  const fetchAccounts = async () => {
    const res = await fetch("/api/accounts");
    if (res.ok) setAccounts(await res.json());
  };

  const handleDiscard = () => {
    setAmount(""); setCategory(""); setCustomCategory("");
    setReceivedFrom(""); setAccountId(""); setDate(""); setError(""); setSuccess("");
  };

  const handleSave = async () => {
    setError(""); setSuccess("");
    if (!amount || !accountId) { setError("Amount and account are required"); return; }
    if (mode === "debit" && !category) { setError("Please select a category"); return; }
    if (mode === "debit" && category === "Other" && !customCategory.trim()) { setError("Please specify the category"); return; }
    if (mode === "credit" && !receivedFrom) { setError("Please enter who you received this from"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mode,
          amount: parseFloat(amount),
          category: mode === "debit" ? (category === "Other" ? customCategory.trim() : category) : undefined,
          receivedFrom: mode === "credit" ? receivedFrom : undefined,
          accountId,
          date: date || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); }
      else { setSuccess(`${mode === "debit" ? "Debit" : "Credit"} of ₹${amount} saved!`); handleDiscard(); fetchAccounts(); onSaved(); }
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  };

  const inputClass = "w-full px-4 py-2.5 border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-white text-sm";
  const labelClass = "block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5";

  return (
    <div>
      <div className="flex bg-stone-100 rounded-xl p-1 mb-5">
        <button onClick={() => { setMode("debit"); setError(""); setSuccess(""); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${mode === "debit" ? "bg-red-600 text-white shadow" : "text-stone-500 hover:text-stone-700"}`}>
          Debit
        </button>
        <button onClick={() => { setMode("credit"); setError(""); setSuccess(""); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${mode === "credit" ? "bg-emerald-600 text-white shadow" : "text-stone-500 hover:text-stone-700"}`}>
          Credit
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className={labelClass}>Amount (₹)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00" min="0" step="0.01" className={inputClass} />
        </div>
        {mode === "debit" ? (
          <div>
            <label className={labelClass}>Category</label>
            <select value={category} onChange={(e) => { setCategory(e.target.value); if (e.target.value !== "Other") setCustomCategory(""); }} className={inputClass}>
              <option value="">Select a category</option>
              {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            {category === "Other" && (
              <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Type your expense category" className={`${inputClass} mt-2`} />
            )}
          </div>
        ) : (
          <div>
            <label className={labelClass}>Received From</label>
            <input type="text" value={receivedFrom} onChange={(e) => setReceivedFrom(e.target.value)}
              placeholder="e.g. Freelance, Friend, Refund" className={inputClass} />
          </div>
        )}
        <div>
          <label className={labelClass}>Account</label>
          {accounts.length === 0 ? (
            <p className="text-amber-700 text-xs py-2 font-medium">No accounts yet. Create a deposit account first.</p>
          ) : (
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
              <option value="">Select an account</option>
              {accounts.map((acc) => <option key={acc._id} value={acc._id}>{acc.name} (₹{acc.balance.toLocaleString()})</option>)}
            </select>
          )}
        </div>
        <div>
          <label className={labelClass}>Date (optional)</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} [color-scheme:light]`} />
          <p className="text-xs text-stone-400 mt-1">Leave empty for today</p>
        </div>
        {error && <p className="text-red-600 text-sm text-center bg-red-50 py-2 rounded-lg">{error}</p>}
        {success && <p className="text-emerald-700 text-sm text-center bg-emerald-50 py-2 rounded-lg">{success}</p>}
        <div className="flex gap-3 pt-1">
          <button onClick={handleDiscard}
            className="flex-1 py-2.5 border-2 border-stone-300 text-stone-600 text-sm font-bold rounded-xl hover:bg-stone-50 transition-colors cursor-pointer">Discard</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-2.5 bg-stone-800 text-white text-sm font-bold rounded-xl hover:bg-stone-900 transition-colors disabled:opacity-50 cursor-pointer">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
