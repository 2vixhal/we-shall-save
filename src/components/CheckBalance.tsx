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

interface TxItem {
  _id: string;
  type: "debit" | "credit";
  amount: number;
  category?: string;
  receivedFrom?: string;
  note?: string;
  date: string;
  createdAt: string;
}

export default function CheckBalance() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [accounts, setAccounts] = useState<AccountDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [expandedAccId, setExpandedAccId] = useState<string | null>(null);
  const [accTxns, setAccTxns] = useState<TxItem[]>([]);
  const [loadingTxns, setLoadingTxns] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts?detailed=true");
      if (res.ok) setAccounts(await res.json());
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const toggleAccount = async (accId: string) => {
    if (expandedAccId === accId) {
      setExpandedAccId(null);
      setAccTxns([]);
      return;
    }
    setExpandedAccId(accId);
    setLoadingTxns(true);
    try {
      const res = await fetch(`/api/transactions?accountId=${accId}`);
      if (res.ok) setAccTxns(await res.json());
    } catch { /* silently fail */ }
    finally { setLoadingTxns(false); }
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  if (loading) return <div className="text-center py-6 text-stone-400 text-sm">Loading balances...</div>;

  return (
    <div>
      <div className="bg-gradient-to-br from-stone-800 to-stone-900 rounded-xl p-5 mb-5 text-white">
        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Total Balance Across All Accounts</p>
        <p className="text-3xl font-bold mt-1 tracking-tight">₹{totalBalance.toLocaleString()}</p>
      </div>

      {accounts.length > 0 ? (
        <div className="space-y-3 mb-6">
          {accounts.map((acc) => {
            const isExpanded = expandedAccId === acc._id;
            return (
              <div key={acc._id} className="rounded-xl border overflow-hidden transition-all dark:border-stone-700"
                style={{ borderColor: isExpanded ? "var(--color-amber-400, #fbbf24)" : undefined }}>
                <button onClick={() => toggleAccount(acc._id)}
                  className={`w-full text-left bg-stone-50 dark:bg-stone-800 p-4 cursor-pointer transition-colors ${isExpanded ? "bg-amber-50 dark:bg-amber-900/20" : "hover:bg-stone-100 dark:hover:bg-stone-700/50"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <p className="font-bold text-stone-800 dark:text-stone-100 text-sm">{acc.name}</p>
                        {acc.source && (
                          <span className="text-[10px] font-semibold text-stone-500 bg-stone-200 dark:bg-stone-700 dark:text-stone-400 px-2 py-0.5 rounded-full">
                            {acc.source}{acc.sourceMonth ? ` · ${acc.sourceMonth}` : ""}
                          </span>
                        )}
                        <svg className={`w-3.5 h-3.5 text-stone-400 transition-transform ml-auto flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      <div className="flex gap-4 text-xs">
                        <div>
                          <span className="text-stone-400">Original: </span>
                          <span className="font-semibold text-stone-600 dark:text-stone-300">₹{acc.originalTotal.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-stone-400">Spent: </span>
                          <span className="font-semibold text-red-600 dark:text-red-400">₹{acc.totalDebited.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-stone-400">Credited: </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{acc.totalCredited.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right pl-4 flex-shrink-0">
                      <p className="text-xs text-stone-400 font-medium">Remaining</p>
                      <p className="text-2xl font-bold text-stone-800 dark:text-stone-100 tabular-nums">₹{acc.balance.toLocaleString()}</p>
                    </div>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 p-4 animate-[fadeIn_0.2s_ease-in-out]">
                    <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-3">
                      All Transactions — {acc.name}
                    </p>
                    {loadingTxns ? (
                      <p className="text-center text-stone-400 text-sm py-3">Loading...</p>
                    ) : accTxns.length === 0 ? (
                      <p className="text-center text-stone-400 text-sm py-3">No transactions for this account.</p>
                    ) : (
                      <div className="space-y-1.5 max-h-80 overflow-y-auto">
                        {accTxns.map((tx) => (
                          <div key={tx._id} className="flex items-center justify-between bg-stone-50 dark:bg-stone-700/50 rounded-lg p-2.5 border border-stone-100 dark:border-stone-700">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={`text-xs font-bold ${tx.type === "debit" ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                  {tx.type === "debit" ? "−" : "+"}₹{tx.amount.toLocaleString()}
                                </span>
                                <span className="text-xs text-stone-500 dark:text-stone-400 truncate">
                                  {tx.type === "debit" ? tx.category : `From: ${tx.receivedFrom}`}
                                </span>
                              </div>
                              {tx.note && <p className="text-[11px] text-amber-600 dark:text-amber-400 truncate">📝 {tx.note}</p>}
                              <p className="text-[10px] text-stone-400">{formatDate(tx.date || tx.createdAt)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-stone-400 text-center text-sm py-4 mb-6">No deposit accounts yet.</p>
      )}

      <div className="border-t border-stone-200 dark:border-stone-700 pt-5">
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
