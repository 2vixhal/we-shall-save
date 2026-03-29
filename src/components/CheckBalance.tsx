"use client";

import { useState, useEffect, useCallback } from "react";
import MonthSelector from "./MonthSelector";
import SpendingAnalysis from "./SpendingAnalysis";

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

export default function CheckBalance() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [accounts, setAccounts] = useState<AccountDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts?detailed=true");
      if (res.ok) setAccounts(await res.json());
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  if (loading) return <div className="text-center py-6 text-stone-400 text-sm">Loading balances...</div>;

  return (
    <div>
      {/* Overall balance */}
      <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-xl p-5 mb-5 text-white">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Total Balance Across All Accounts</p>
        <p className="text-3xl font-bold mt-1 tracking-tight">₹{totalBalance.toLocaleString()}</p>
      </div>

      {/* Per-account details */}
      {accounts.length > 0 ? (
        <div className="space-y-3 mb-6">
          {accounts.map((acc) => (
            <div key={acc._id} className="bg-stone-50 rounded-xl border border-stone-200 overflow-hidden">
              <div className="flex items-center justify-between p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="font-bold text-stone-800 text-sm">{acc.name}</p>
                    {acc.source && (
                      <span className="text-[10px] font-semibold text-stone-500 bg-stone-200 px-2 py-0.5 rounded-full">
                        {acc.source}{acc.sourceMonth ? ` · ${acc.sourceMonth}` : ""}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-4 text-xs">
                    <div>
                      <span className="text-stone-400">Original: </span>
                      <span className="font-semibold text-stone-600">₹{acc.originalTotal.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Spent: </span>
                      <span className="font-semibold text-red-600">₹{acc.totalDebited.toLocaleString()}</span>
                    </div>
                    <div>
                      <span className="text-stone-400">Credited: </span>
                      <span className="font-semibold text-emerald-600">₹{acc.totalCredited.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right pl-4 flex-shrink-0">
                  <p className="text-xs text-stone-400 font-medium">Remaining</p>
                  <p className="text-2xl font-bold text-stone-800 tabular-nums">₹{acc.balance.toLocaleString()}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-stone-400 text-center text-sm py-4 mb-6">No deposit accounts yet.</p>
      )}

      {/* Expense Analysis section */}
      <div className="border-t border-stone-200 pt-5">
        <button onClick={() => setShowAnalysis(!showAnalysis)}
          className="w-full py-3 bg-amber-700 text-white text-sm font-bold rounded-xl hover:bg-amber-800 transition-colors cursor-pointer">
          {showAnalysis ? "Hide Expense Analysis" : "Expand Expense Analysis"}
        </button>

        {showAnalysis && (
          <div className="mt-5 animate-[fadeIn_0.3s_ease-in-out]">
            <MonthSelector month={month} year={year} onChange={(m, y) => { setMonth(m); setYear(y); }} />
            <SpendingAnalysis month={month} year={year} />
          </div>
        )}
      </div>
    </div>
  );
}
