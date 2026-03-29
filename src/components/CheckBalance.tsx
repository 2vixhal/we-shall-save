"use client";

import { useState, useEffect, useCallback } from "react";
import MonthSelector from "./MonthSelector";
import SpendingAnalysis from "./SpendingAnalysis";

interface AccountBalance {
  _id: string;
  name: string;
  balance: number;
  spentThisMonth: number;
  creditedThisMonth: number;
}

interface BalanceData {
  totalBalance: number;
  totalSpentThisMonth: number;
  totalCreditedThisMonth: number;
  accounts: AccountBalance[];
}

export default function CheckBalance() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/balance?month=${month}&year=${year}`);
      if (res.ok) setData(await res.json());
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  const handleMonthChange = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
    setShowAnalysis(false);
  };

  if (loading) return <div className="text-center py-6 text-stone-400 text-sm">Loading balances...</div>;
  if (!data) return <div className="text-center py-6 text-stone-400 text-sm">Unable to load balance data</div>;

  return (
    <div>
      <MonthSelector month={month} year={year} onChange={handleMonthChange} />

      <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-xl p-5 mb-5 text-white">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Current Balance</p>
        <p className="text-3xl font-bold mt-1 tracking-tight">₹{data.totalBalance.toLocaleString()}</p>
        <div className="flex gap-5 mt-3 text-xs">
          <div>
            <span className="text-stone-400">Spent: </span>
            <span className="font-bold text-red-400">₹{data.totalSpentThisMonth.toLocaleString()}</span>
          </div>
          <div>
            <span className="text-stone-400">Credited: </span>
            <span className="font-bold text-emerald-400">₹{data.totalCreditedThisMonth.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {data.accounts.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold text-stone-500 mb-3 uppercase tracking-wider">Account Breakdown</h3>
          <div className="space-y-2">
            {data.accounts.map((acc) => (
              <div key={acc._id} className="flex items-center justify-between bg-stone-50 rounded-xl p-3.5 border border-stone-100">
                <div>
                  <p className="font-semibold text-stone-800 text-sm">{acc.name}</p>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Spent: ₹{acc.spentThisMonth.toLocaleString()} &middot; Credited: ₹{acc.creditedThisMonth.toLocaleString()}
                  </p>
                </div>
                <p className="text-lg font-bold text-stone-800 tabular-nums">₹{acc.balance.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-stone-400 text-center text-sm py-4">No deposit accounts yet.</p>
      )}

      <div className="mt-5">
        <button onClick={() => setShowAnalysis(!showAnalysis)}
          className="w-full py-2.5 bg-amber-700 text-white text-sm font-bold rounded-xl hover:bg-amber-800 transition-colors cursor-pointer">
          {showAnalysis ? "Hide Spending Analysis" : "Spending Analysis"}
        </button>
        {showAnalysis && (
          <div className="animate-[fadeIn_0.3s_ease-in-out]">
            <SpendingAnalysis month={month} year={year} />
          </div>
        )}
      </div>
    </div>
  );
}
