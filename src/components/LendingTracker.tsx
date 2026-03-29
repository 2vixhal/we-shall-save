"use client";

import { useState, useEffect, useCallback } from "react";

interface Account { _id: string; name: string; balance: number; }
interface LendingItem {
  _id: string;
  amount: number;
  friend: string;
  type: "lent" | "gotback";
  accountId: { _id: string; name: string } | null;
  date: string;
}

const DEFAULT_FRIENDS = ["Devansh", "Aryan", "Aryamann"];

export default function LendingTracker({ onChanged }: { onChanged: () => void }) {
  const [mode, setMode] = useState<"lent" | "gotback">("lent");
  const [amount, setAmount] = useState("");
  const [friend, setFriend] = useState("");
  const [customFriend, setCustomFriend] = useState("");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState("");
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [savedFriends, setSavedFriends] = useState<string[]>([]);
  const [lendings, setLendings] = useState<LendingItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const [filterFriend, setFilterFriend] = useState("");

  const fetchAccounts = async () => {
    const res = await fetch("/api/accounts");
    if (res.ok) setAccounts(await res.json());
  };

  const fetchFriends = async () => {
    const res = await fetch("/api/lendings/friends");
    if (res.ok) {
      const data: string[] = await res.json();
      const merged = [...new Set([...DEFAULT_FRIENDS, ...data])];
      setSavedFriends(merged);
    }
  };

  const fetchLendings = useCallback(async () => {
    const params = filterFriend ? `?friend=${encodeURIComponent(filterFriend)}` : "";
    const res = await fetch(`/api/lendings${params}`);
    if (res.ok) setLendings(await res.json());
  }, [filterFriend]);

  useEffect(() => { fetchAccounts(); fetchFriends(); }, []);
  useEffect(() => { if (showHistory) fetchLendings(); }, [fetchLendings, showHistory]);

  const allFriends = [...new Set([...savedFriends])];

  const handleSave = async () => {
    setError(""); setSuccess("");
    const friendName = friend === "__other__" ? customFriend.trim() : friend;
    if (!amount || !friendName || !accountId) { setError("Amount, friend, and account are required"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/lendings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: parseFloat(amount),
          friend: friendName,
          type: mode,
          accountId,
          date: date || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to save"); }
      else {
        setSuccess(`₹${amount} ${mode === "lent" ? "lent to" : "received from"} ${friendName}!`);
        setAmount(""); setFriend(""); setCustomFriend(""); setAccountId(""); setDate("");
        fetchAccounts(); fetchFriends(); onChanged();
        if (showHistory) fetchLendings();
      }
    } catch { setError("Something went wrong"); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this record? Balance will be adjusted.")) return;
    const res = await fetch(`/api/lendings/${id}`, { method: "DELETE" });
    if (res.ok) { fetchLendings(); fetchAccounts(); onChanged(); }
  };

  const friendBalances = lendings.reduce<Record<string, number>>((acc, l) => {
    const key = l.friend;
    if (!acc[key]) acc[key] = 0;
    acc[key] += l.type === "lent" ? l.amount : -l.amount;
    return acc;
  }, {});

  const inputClass = "w-full px-4 py-2.5 border border-stone-300 rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 bg-white text-sm";
  const labelClass = "block text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1.5";

  return (
    <div className="space-y-5">
      <div className="flex bg-stone-100 rounded-xl p-1 mb-1">
        <button onClick={() => { setMode("lent"); setError(""); setSuccess(""); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${mode === "lent" ? "bg-red-600 text-white shadow" : "text-stone-500 hover:text-stone-700"}`}>
          Lent
        </button>
        <button onClick={() => { setMode("gotback"); setError(""); setSuccess(""); }}
          className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all cursor-pointer ${mode === "gotback" ? "bg-emerald-600 text-white shadow" : "text-stone-500 hover:text-stone-700"}`}>
          Got Back
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className={labelClass}>Amount (₹)</label>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00" min="0" step="0.01" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Friend</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {allFriends.map((f) => (
              <button key={f} onClick={() => { setFriend(f); setCustomFriend(""); }} type="button"
                className={`px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${friend === f ? "bg-stone-800 text-amber-50" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
                {f}
              </button>
            ))}
            <button onClick={() => setFriend("__other__")} type="button"
              className={`px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${friend === "__other__" ? "bg-stone-800 text-amber-50" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
              Other
            </button>
          </div>
          {friend === "__other__" && (
            <input type="text" value={customFriend} onChange={(e) => setCustomFriend(e.target.value)}
              placeholder="Type friend's name" className={inputClass} />
          )}
        </div>
        <div>
          <label className={labelClass}>Account</label>
          {accounts.length === 0 ? (
            <p className="text-amber-700 text-xs py-2 font-medium">No accounts yet.</p>
          ) : (
            <select value={accountId} onChange={(e) => setAccountId(e.target.value)} className={inputClass}>
              <option value="">{mode === "lent" ? "Deduct from account" : "Credit to account"}</option>
              {accounts.map((a) => <option key={a._id} value={a._id}>{a.name} (₹{a.balance.toLocaleString()})</option>)}
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
        <button onClick={handleSave} disabled={loading}
          className="w-full py-2.5 bg-stone-800 text-white text-sm font-bold rounded-xl hover:bg-stone-900 transition-colors disabled:opacity-50 cursor-pointer">
          {loading ? "Saving..." : mode === "lent" ? "Record Lent" : "Record Got Back"}
        </button>
      </div>

      <div className="border-t border-stone-200 pt-4">
        <button onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchLendings(); }}
          className="w-full py-2 bg-stone-100 text-stone-700 text-sm font-semibold rounded-xl hover:bg-stone-200 transition-colors cursor-pointer">
          {showHistory ? "Hide" : "Show"} Lending History
        </button>
        {showHistory && (
          <div className="mt-4 animate-[fadeIn_0.3s_ease-in-out]">
            <div className="flex flex-wrap gap-1.5 mb-3">
              <button onClick={() => setFilterFriend("")}
                className={`px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${!filterFriend ? "bg-stone-800 text-amber-50" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
                All
              </button>
              {allFriends.map((f) => (
                <button key={f} onClick={() => setFilterFriend(f)}
                  className={`px-3 py-1 text-xs rounded-full transition-all cursor-pointer ${filterFriend === f ? "bg-stone-800 text-amber-50" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}>
                  {f}
                </button>
              ))}
            </div>

            {!filterFriend && Object.keys(friendBalances).length > 0 && (
              <div className="bg-amber-50 rounded-xl p-3 mb-3 border border-amber-200">
                <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mb-2">Net Balances</p>
                {Object.entries(friendBalances).map(([f, bal]) => (
                  <div key={f} className="flex justify-between text-sm">
                    <span className="text-stone-700">{f}</span>
                    <span className={bal > 0 ? "text-red-600 font-semibold" : bal < 0 ? "text-emerald-600 font-semibold" : "text-stone-500"}>
                      {bal > 0 ? `Owes you ₹${bal.toLocaleString()}` : bal < 0 ? `You owe ₹${Math.abs(bal).toLocaleString()}` : "Settled"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {lendings.length === 0 ? (
              <p className="text-center text-stone-400 text-sm py-4">No records found.</p>
            ) : (
              <div className="space-y-2">
                {lendings.map((l) => (
                  <div key={l._id} className="flex items-center justify-between bg-stone-50 rounded-xl p-3">
                    <div>
                      <p className="text-sm font-semibold text-stone-800">
                        <span className={l.type === "lent" ? "text-red-600" : "text-emerald-600"}>
                          {l.type === "lent" ? "Lent to" : "Got back from"}
                        </span>{" "}
                        {l.friend}
                      </p>
                      <p className="text-xs text-stone-400">
                        {new Date(l.date).toLocaleDateString()} · {l.accountId?.name || "—"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-bold ${l.type === "lent" ? "text-red-600" : "text-emerald-600"}`}>
                        {l.type === "lent" ? "-" : "+"}₹{l.amount.toLocaleString()}
                      </span>
                      <button onClick={() => handleDelete(l._id)}
                        className="text-red-400 hover:text-red-600 transition-colors cursor-pointer p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
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
