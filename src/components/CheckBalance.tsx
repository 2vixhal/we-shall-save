"use client";

import { useState, useEffect, useCallback } from "react";
import SpendingAnalysis from "./SpendingAnalysis";

interface AccountBalance {
  _id: string;
  name: string;
  balance: number;
  startOfMonthBalance: number;
  spentThisMonth: number;
}

interface BalanceData {
  totalBalance: number;
  totalSpentThisMonth: number;
  totalCreditedThisMonth: number;
  startOfMonthTotal: number;
  accounts: AccountBalance[];
}

export default function CheckBalance() {
  const [data, setData] = useState<BalanceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const fetchBalance = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/balance");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  if (loading) {
    return (
      <div className="text-center py-6 text-gray-500">
        Loading balances...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-6 text-gray-500">
        Unable to load balance data
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 mb-6">
        <p className="text-sm text-emerald-600 font-medium">Overall Balance</p>
        <p className="text-4xl font-bold text-emerald-800">
          ₹{data.totalBalance.toLocaleString()}
        </p>
        <div className="flex gap-6 mt-3 text-sm">
          <div>
            <span className="text-gray-500">Start of month: </span>
            <span className="font-semibold text-gray-700">
              ₹{data.startOfMonthTotal.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Spent: </span>
            <span className="font-semibold text-red-600">
              ₹{data.totalSpentThisMonth.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {data.accounts.length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
            Account Breakdown
          </h3>
          <div className="space-y-3">
            {data.accounts.map((acc) => (
              <div
                key={acc._id}
                className="flex items-center justify-between bg-gray-50 rounded-xl p-4"
              >
                <div>
                  <p className="font-semibold text-gray-800">{acc.name}</p>
                  <p className="text-xs text-gray-500">
                    Month start: ₹{acc.startOfMonthBalance.toLocaleString()} |
                    Spent: ₹{acc.spentThisMonth.toLocaleString()}
                  </p>
                </div>
                <p className="text-xl font-bold text-gray-800">
                  ₹{acc.balance.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-center py-4">
          No deposit accounts yet. Create one to get started.
        </p>
      )}

      <div className="mt-6">
        <button
          onClick={() => setShowAnalysis(!showAnalysis)}
          className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
        >
          {showAnalysis ? "Hide Spending Analysis" : "Spending Analysis"}
        </button>

        <div
          className={`overflow-hidden transition-all duration-500 ease-in-out ${
            showAnalysis ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
          }`}
        >
          {showAnalysis && <SpendingAnalysis />}
        </div>
      </div>
    </div>
  );
}
