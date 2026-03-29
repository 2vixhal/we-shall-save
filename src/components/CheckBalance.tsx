"use client";

import { useState, useEffect, useCallback } from "react";
import MonthSelector from "./MonthSelector";
import SpendingAnalysis from "./SpendingAnalysis";

interface AccountBalance {
  _id: string;
  name: string;
  balance: number;
}

interface BalanceData {
  totalBalance: number;
  accounts: AccountBalance[];
}

interface MonthlyData {
  totalSpentThisMonth: number;
  totalCreditedThisMonth: number;
}

export default function CheckBalance() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [loadingMonthly, setLoadingMonthly] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoadingBalance(true);
    try {
      const res = await fetch("/api/accounts");
      if (res.ok) {
        const accounts: AccountBalance[] = await res.json();
        const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);
        setBalanceData({ totalBalance, accounts });
      }
    } catch { /* silently fail */ }
    finally { setLoadingBalance(false); }
  }, []);

  const fetchMonthly = useCallback(async () => {
    setLoadingMonthly(true);
    try {
      const res = await fetch(`/api/balance?month=${month}&year=${year}`);
      if (res.ok) {
        const data = await res.json();
        setMonthlyData({
          totalSpentThisMonth: data.totalSpentThisMonth,
          totalCreditedThisMonth: data.totalCreditedThisMonth,
        });
      }
    } catch { /* silently fail */ }
    finally { setLoadingMonthly(false); }
  }, [month, year]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => { fetchMonthly(); }, [fetchMonthly]);

  const handleMonthChange = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
    setShowAnalysis(false);
  };

  return (
    <div>
      {/* Account Balances - always the same, no month filter */}
      {loadingBalance ? (
        <div className="text-center py-6 text-stone-400 text-sm">Loading balances...</div>
      ) : !balanceData ? (
        <div className="text-center py-6 text-stone-400 text-sm">Unable to load data</div>
      ) : (
        <>
          <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-xl p-5 mb-4 text-white">
            <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Total Balance</p>
            <p className="text-3xl font-bold mt-1 tracking-tight">₹{balanceData.totalBalance.toLocaleString()}</p>
          </div>

          {balanceData.accounts.length > 0 ? (
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-stone-500 mb-3 uppercase tracking-wider">All Accounts</h3>
              <div className="space-y-2">
                {balanceData.accounts.map((acc) => (
                  <div key={acc._id} className="flex items-center justify-between bg-stone-50 rounded-xl p-3.5 border border-stone-100">
                    <p className="font-semibold text-stone-800 text-sm">{acc.name}</p>
                    <p className="text-lg font-bold text-stone-800 tabular-nums">₹{acc.balance.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-stone-400 text-center text-sm py-4 mb-6">No deposit accounts yet.</p>
          )}
        </>
      )}

      {/* Monthly Expenditure Tracking */}
      <div className="border-t border-stone-200 pt-5">
        <h3 className="text-xs font-semibold text-stone-500 mb-3 uppercase tracking-wider">Monthly Expenditure</h3>
        <MonthSelector month={month} year={year} onChange={handleMonthChange} />

        {loadingMonthly ? (
          <div className="text-center py-4 text-stone-400 text-sm">Loading...</div>
        ) : monthlyData ? (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <p className="text-xs font-semibold text-red-400 uppercase tracking-wider">Spent</p>
              <p className="text-xl font-bold text-red-700 mt-1 tabular-nums">₹{monthlyData.totalSpentThisMonth.toLocaleString()}</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Credited</p>
              <p className="text-xl font-bold text-emerald-700 mt-1 tabular-nums">₹{monthlyData.totalCreditedThisMonth.toLocaleString()}</p>
            </div>
          </div>
        ) : null}

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
