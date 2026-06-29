"use client";

import { useState, useEffect } from "react";

interface Account { _id: string; name: string; balance: number; }

const CATEGORY_CONFIG: { name: string; subs?: string[] }[] = [
  { name: "Transport", subs: ["Petrol", "Auto", "Other"] },
  { name: "Recharges", subs: ["WiFi", "Mobile", "Other"] },
  { name: "Outday", subs: ["Food", "Tickets", "Other"] },
  { name: "Health & Fitness", subs: ["Protein", "Apparel", "Gym", "Other"] },
  { name: "Skincare" },
  { name: "Travel" },
  { name: "Shopping", subs: ["Clothing", "Other"] },
  { name: "Education" },
  { name: "UPI Lite" },
  { name: "Grocery" },
  { name: "EMI", subs: ["Education Loan", "Other"] },
  { name: "Misc" },
  { name: "Other" },
];

const CATEGORIES = CATEGORY_CONFIG.map((c) => c.name);

export default function DebitCreditForm({ onSaved }: { onSaved: () => void }) {
  const [mode, setMode] = useState<"debit" | "credit">("debit");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [customSub, setCustomSub] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [receivedFrom, setReceivedFrom] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [savedCustomCats, setSavedCustomCats] = useState<string[]>([]);
  const [savedSources, setSavedSources] = useState<string[]>([]);
  const [savedTripNames, setSavedTripNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fetchAccounts = async () => {
    const res = await fetch("/api/accounts");
    if (res.ok) setAccounts(await res.json());
  };

  const fetchSavedData = async () => {
    const [catRes, srcRes, tripRes] = await Promise.all([
      fetch("/api/transactions/custom-categories"),
      fetch("/api/transactions/credit-sources"),
      fetch("/api/transactions/family-names?category=Travel"),
    ]);
    if (catRes.ok) setSavedCustomCats(await catRes.json());
    if (srcRes.ok) setSavedSources(await srcRes.json());
    if (tripRes.ok) setSavedTripNames(await tripRes.json());
  };

  useEffect(() => { fetchAccounts(); fetchSavedData(); }, []);

  const currentConfig = CATEGORY_CONFIG.find((c) => c.name === category);
  const hasSubs = currentConfig?.subs && currentConfig.subs.length > 0;
  const isTravel = category === "Travel";

  const handleDiscard = () => {
    setAmount(""); setCategory(""); setSubCategory(""); setCustomSub("");
    setCustomCategory(""); setNote(""); setReceivedFrom(""); setAccountId("");
    setDate(""); setError(""); setSuccess("");
  };

  const buildFinalCategory = () => {
    if (category === "Other") return customCategory.trim();
    if (hasSubs) {
      const sub = subCategory === "Other" ? customSub.trim() : subCategory;
      return sub ? `${category} - ${sub}` : category;
    }
    if (isTravel) {
      return customSub.trim() ? `Travel - ${customSub.trim()}` : "Travel";
    }
    return category;
  };

  const handleSave = async () => {
    setError(""); setSuccess("");
    if (!amount || !accountId) { setError("Amount and account are required"); return; }
    if (mode === "debit" && !category) { setError("Please select a category"); return; }
    if (mode === "debit" && category === "Other" && !customCategory.trim()) { setError("Please specify the category"); return; }
    if (mode === "debit" && hasSubs && !subCategory) { setError("Please select a sub-category"); return; }
    if (mode === "debit" && hasSubs && subCategory === "Other" && !customSub.trim()) { setError("Please specify the sub-category"); return; }
    if (mode === "credit" && !receivedFrom) { setError("Please enter who you received this from"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mode,
          amount: parseFloat(amount),
          category: mode === "debit" ? buildFinalCategory() : undefined,
          receivedFrom: mode === "credit" ? receivedFrom : undefined,
          accountId,
          date: date || undefined,
          note: note.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); }
      else {
        setSuccess(`${mode === "debit" ? "Debit" : "Credit"} of ₹${amount} saved!`);
        handleDiscard(); fetchAccounts(); fetchSavedData(); onSaved();
      }
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  };

  const pillClass = (active: boolean) =>
    `px-3 py-1.5 text-xs rounded-full transition-all cursor-pointer ${active ? "bg-stone-800 text-amber-50 dark:bg-amber-600" : "bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-700 dark:text-stone-300"}`;

  const inputClass = "w-full px-4 py-2.5 border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-white text-sm dark:bg-stone-800 dark:border-stone-600 dark:text-stone-100 dark:focus:ring-amber-400/50";
  const labelClass = "block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5 dark:text-stone-400";

  return (
    <div>
      <div className="flex bg-stone-100 dark:bg-stone-700 rounded-xl p-1 mb-5">
        <button onClick={() => { setMode("debit"); setError(""); setSuccess(""); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${mode === "debit" ? "bg-red-600 text-white shadow" : "text-stone-500 hover:text-stone-700 dark:text-stone-400"}`}>
          Debit
        </button>
        <button onClick={() => { setMode("credit"); setError(""); setSuccess(""); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${mode === "credit" ? "bg-emerald-600 text-white shadow" : "text-stone-500 hover:text-stone-700 dark:text-stone-400"}`}>
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
          <>
            <div>
              <label className={labelClass}>Category</label>
              <select value={category} onChange={(e) => { setCategory(e.target.value); setSubCategory(""); setCustomSub(""); setCustomCategory(""); }} className={inputClass}>
                <option value="">Select a category</option>
                {CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            {/* Other — custom category with saved pills */}
            {category === "Other" && (
              <div>
                <label className={labelClass}>Specify Category</label>
                {savedCustomCats.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {savedCustomCats.map((c) => (
                      <button key={c} onClick={() => setCustomCategory(c)} type="button" className={pillClass(customCategory === c)}>{c}</button>
                    ))}
                  </div>
                )}
                <input type="text" value={customCategory} onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="Type your expense category" className={inputClass} />
              </div>
            )}

            {/* Sub-categories as pills */}
            {hasSubs && (
              <div>
                <label className={labelClass}>Sub-Category</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {currentConfig!.subs!.map((s) => (
                    <button key={s} onClick={() => { setSubCategory(s); if (s !== "Other") setCustomSub(""); }} type="button" className={pillClass(subCategory === s)}>{s}</button>
                  ))}
                </div>
                {subCategory === "Other" && (
                  <input type="text" value={customSub} onChange={(e) => setCustomSub(e.target.value)}
                    placeholder="Specify sub-category" className={inputClass} />
                )}
              </div>
            )}

            {/* Travel — trip name with remembered names */}
            {isTravel && (
              <div>
                <label className={labelClass}>Trip Name</label>
                {savedTripNames.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {savedTripNames.map((t) => (
                      <button key={t} onClick={() => setCustomSub(t)} type="button" className={pillClass(customSub === t)}>{t}</button>
                    ))}
                  </div>
                )}
                <input type="text" value={customSub} onChange={(e) => setCustomSub(e.target.value)}
                  placeholder="e.g. Goa Trip, Manali 2026" className={inputClass} />
              </div>
            )}
          </>
        ) : (
          <div>
            <label className={labelClass}>Received From</label>
            {savedSources.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {savedSources.map((s) => (
                  <button key={s} onClick={() => setReceivedFrom(s)} type="button" className={pillClass(receivedFrom === s)}>{s}</button>
                ))}
              </div>
            )}
            <input type="text" value={receivedFrom} onChange={(e) => setReceivedFrom(e.target.value)}
              placeholder="e.g. Freelance, Friend, Refund" className={inputClass} />
          </div>
        )}

        <div>
          <label className={labelClass}>Note (optional)</label>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Quick note about this expense" className={inputClass} />
        </div>

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
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${inputClass} [color-scheme:light] dark:[color-scheme:dark]`} />
          <p className="text-xs text-stone-400 mt-1">Leave empty for today</p>
        </div>
        {error && <p className="text-red-600 text-sm text-center bg-red-50 dark:bg-red-900/30 py-2 rounded-lg">{error}</p>}
        {success && <p className="text-emerald-700 text-sm text-center bg-emerald-50 dark:bg-emerald-900/30 py-2 rounded-lg">{success}</p>}
        <div className="flex gap-3 pt-1">
          <button onClick={handleDiscard}
            className="flex-1 py-2.5 border-2 border-stone-300 text-stone-600 text-sm font-bold rounded-xl hover:bg-stone-50 transition-colors cursor-pointer dark:border-stone-600 dark:text-stone-300 dark:hover:bg-stone-700">Discard</button>
          <button onClick={handleSave} disabled={loading}
            className="flex-1 py-2.5 bg-stone-800 text-white text-sm font-bold rounded-xl hover:bg-stone-900 transition-colors disabled:opacity-50 cursor-pointer dark:bg-amber-700 dark:hover:bg-amber-800">
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
