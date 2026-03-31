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

interface InvItem {
  _id: string;
  amount: number;
  category: string;
  subCategory?: string;
  date: string;
}

interface LendItem {
  _id: string;
  amount: number;
  friend: string;
  type: "lent" | "gotback";
  date: string;
}

type TabKey = "transactions" | "investments" | "lending";

export default function CheckBalance() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [accounts, setAccounts] = useState<AccountDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [expandedAccId, setExpandedAccId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("transactions");
  const [accTxns, setAccTxns] = useState<TxItem[]>([]);
  const [accInvs, setAccInvs] = useState<InvItem[]>([]);
  const [accLends, setAccLends] = useState<LendItem[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/accounts?detailed=true");
      if (res.ok) setAccounts(await res.json());
    } catch { /* silently fail */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  const fetchAccountData = async (accId: string) => {
    setLoadingData(true);
    try {
      const [txRes, invRes, lendRes] = await Promise.all([
        fetch(`/api/transactions?accountId=${accId}`),
        fetch(`/api/investments?accountId=${accId}`),
        fetch(`/api/lendings?accountId=${accId}`),
      ]);
      if (txRes.ok) setAccTxns(await txRes.json());
      if (invRes.ok) setAccInvs(await invRes.json());
      if (lendRes.ok) setAccLends(await lendRes.json());
    } catch { /* silently fail */ }
    finally { setLoadingData(false); }
  };

  const toggleAccount = (accId: string) => {
    if (expandedAccId === accId) {
      setExpandedAccId(null);
      return;
    }
    setExpandedAccId(accId);
    setActiveTab("transactions");
    fetchAccountData(accId);
  };

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  if (loading) return <div className="text-center py-6 text-stone-400 text-sm">Loading balances...</div>;

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "transactions", label: "Transactions", count: accTxns.length },
    { key: "investments", label: "Investments", count: accInvs.length },
    { key: "lending", label: "Lending", count: accLends.length },
  ];

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
              <div key={acc._id} className={`rounded-xl border overflow-hidden transition-all ${isExpanded ? "border-amber-400 dark:border-amber-500" : "border-stone-200 dark:border-stone-700"}`}>
                <button onClick={() => toggleAccount(acc._id)}
                  className={`w-full text-left p-4 cursor-pointer transition-colors ${isExpanded ? "bg-amber-50 dark:bg-amber-900/20" : "bg-stone-50 dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700/50"}`}>
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
                  <div className="border-t border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800/50 animate-[fadeIn_0.2s_ease-in-out]">
                    {/* Tabs */}
                    <div className="flex border-b border-stone-200 dark:border-stone-700">
                      {tabs.map((t) => (
                        <button key={t.key} onClick={() => setActiveTab(t.key)}
                          className={`flex-1 py-2.5 text-xs font-semibold text-center transition-colors cursor-pointer ${activeTab === t.key ? "text-amber-700 dark:text-amber-400 border-b-2 border-amber-600 dark:border-amber-400 bg-amber-50/50 dark:bg-amber-900/10" : "text-stone-400 hover:text-stone-600 dark:hover:text-stone-300"}`}>
                          {t.label} <span className="ml-1 opacity-60">({t.count})</span>
                        </button>
                      ))}
                    </div>

                    <div className="p-4">
                      {loadingData ? (
                        <p className="text-center text-stone-400 text-sm py-3">Loading...</p>
                      ) : (
                        <>
                          {/* Transactions tab */}
                          {activeTab === "transactions" && (
                            accTxns.length === 0 ? (
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
                                      {tx.note && <p className="text-[11px] text-amber-600 dark:text-amber-400 truncate mt-0.5">📝 {tx.note}</p>}
                                      <p className="text-[10px] text-stone-400 mt-0.5">{fmtDate(tx.date || tx.createdAt)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          )}

                          {/* Investments tab */}
                          {activeTab === "investments" && (
                            accInvs.length === 0 ? (
                              <p className="text-center text-stone-400 text-sm py-3">No investments from this account.</p>
                            ) : (
                              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                                {accInvs.map((inv) => (
                                  <div key={inv._id} className="flex items-center justify-between bg-stone-50 dark:bg-stone-700/50 rounded-lg p-2.5 border border-stone-100 dark:border-stone-700">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                                          ₹{inv.amount.toLocaleString()}
                                        </span>
                                        <span className="text-xs text-stone-500 dark:text-stone-400 truncate">
                                          {inv.category}
                                        </span>
                                      </div>
                                      {inv.subCategory && <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate mt-0.5">{inv.subCategory}</p>}
                                      <p className="text-[10px] text-stone-400 mt-0.5">{fmtDate(inv.date)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          )}

                          {/* Lending tab */}
                          {activeTab === "lending" && (
                            accLends.length === 0 ? (
                              <p className="text-center text-stone-400 text-sm py-3">No lending activity from this account.</p>
                            ) : (
                              <div className="space-y-1.5 max-h-80 overflow-y-auto">
                                {accLends.map((l) => (
                                  <div key={l._id} className="flex items-center justify-between bg-stone-50 dark:bg-stone-700/50 rounded-lg p-2.5 border border-stone-100 dark:border-stone-700">
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className={`text-xs font-bold ${l.type === "lent" ? "text-orange-600 dark:text-orange-400" : "text-emerald-600 dark:text-emerald-400"}`}>
                                          {l.type === "lent" ? "−" : "+"}₹{l.amount.toLocaleString()}
                                        </span>
                                        <span className="text-xs text-stone-500 dark:text-stone-400 truncate">
                                          {l.type === "lent" ? `Lent to ${l.friend}` : `Got back from ${l.friend}`}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-stone-400 mt-0.5">{fmtDate(l.date)}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          )}
                        </>
                      )}
                    </div>
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
