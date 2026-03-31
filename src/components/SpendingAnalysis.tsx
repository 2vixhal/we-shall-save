"use client";

import { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, PieLabelRenderProps,
} from "recharts";

interface CategoryData {
  name: string;
  amount: number;
  percentage: number;
}

interface AnalysisData {
  totalSpent: number;
  totalLeft: number;
  categories: CategoryData[];
}

interface TransactionItem {
  _id: string;
  type: "debit" | "credit";
  amount: number;
  category?: string;
  receivedFrom?: string;
  note?: string;
  accountId: { _id: string; name: string } | string;
  date: string;
  createdAt: string;
}

const COLORS = [
  "#92400e", "#065f46", "#0f766e", "#78716c",
  "#b45309", "#166534", "#115e59", "#a16207",
  "#854d0e", "#3f6212",
];

const MONTHS_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function generateCSV(transactions: TransactionItem[], categories: CategoryData[], totalSpent: number, totalLeft: number, month: number, year: number): string {
  const getAccName = (accountId: TransactionItem["accountId"]) =>
    typeof accountId === "object" && accountId?.name ? accountId.name : "Unknown";

  const debits = transactions.filter((t) => t.type === "debit");
  const credits = transactions.filter((t) => t.type === "credit");
  const totalCredit = credits.reduce((s, t) => s + t.amount, 0);

  const rows: string[] = [];
  rows.push(`Expense Report — ${MONTHS_SHORT[month]} ${year}`);
  rows.push("");
  rows.push("Type,Description,Note,Amount (₹),Date,Time,Account");

  for (const tx of transactions) {
    const d = new Date(tx.date || tx.createdAt);
    const dateStr = d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
    const timeStr = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const desc = tx.type === "debit" ? (tx.category || "Other") : `From: ${tx.receivedFrom || "Unknown"}`;
    const escaped = (s: string) => `"${s.replace(/"/g, '""')}"`;
    rows.push(`${tx.type === "debit" ? "Debit" : "Credit"},${escaped(desc)},${escaped(tx.note || "")},${tx.amount},${dateStr},${timeStr},${escaped(getAccName(tx.accountId))}`);
  }

  rows.push("");
  rows.push("SUMMARY");
  rows.push(`Total Expenditure,₹${debits.reduce((s, t) => s + t.amount, 0).toLocaleString()}`);
  rows.push(`Total Credit,₹${totalCredit.toLocaleString()}`);
  rows.push(`Balance Left,₹${totalLeft.toLocaleString()}`);
  rows.push("");
  rows.push("Category-wise Expenditure");
  rows.push("Category,Amount (₹),Percentage");
  for (const cat of categories) {
    rows.push(`"${cat.name}",${cat.amount},${cat.percentage}%`);
  }

  return rows.join("\n");
}

export default function SpendingAnalysis({ month, year }: { month: number; year: number }) {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setExpandedCategory(null);
      try {
        const [analysisRes, txRes] = await Promise.all([
          fetch(`/api/analysis?month=${month}&year=${year}`),
          fetch(`/api/transactions?month=${month}&year=${year}`),
        ]);
        if (analysisRes.ok) setData(await analysisRes.json());
        if (txRes.ok) setTransactions(await txRes.json());
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    };
    fetchAll();
  }, [month, year]);

  const downloadCSV = () => {
    if (!data) return;
    const csv = generateCSV(transactions, data.categories, data.totalSpent, data.totalLeft, month, year);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `expenses_${MONTHS_SHORT[month]}_${year}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const getAccName = (accountId: TransactionItem["accountId"]) =>
    typeof accountId === "object" && accountId?.name ? accountId.name : "Unknown";

  const getCategoryTransactions = (catName: string) =>
    transactions.filter((tx) => tx.type === "debit" && (tx.category || "Other") === catName);

  if (loading) return <div className="text-center py-6 text-stone-400 text-sm">Loading analysis...</div>;
  if (!data) return <div className="text-center py-6 text-stone-400 text-sm">Unable to load analysis</div>;

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-stone-700 dark:text-stone-200">
          {MONTHS_SHORT[month]} {year} — Expense Breakdown
        </h3>
        {data.categories.length > 0 && (
          <button onClick={downloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors cursor-pointer border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download CSV
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 text-center dark:bg-red-900/20 dark:border-red-800">
          <p className="text-xs text-red-600 font-semibold dark:text-red-400">Total Spent</p>
          <p className="text-xl font-bold text-red-700 mt-1 dark:text-red-300">₹{data.totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-center dark:bg-emerald-900/20 dark:border-emerald-800">
          <p className="text-xs text-emerald-600 font-semibold dark:text-emerald-400">Balance Left</p>
          <p className="text-xl font-bold text-emerald-700 mt-1 dark:text-emerald-300">₹{data.totalLeft.toLocaleString()}</p>
        </div>
      </div>

      {data.categories.length > 0 ? (
        <>
          <h4 className="text-xs font-semibold text-stone-500 dark:text-stone-400 mb-2.5 uppercase tracking-wider">
            Category Breakdown <span className="normal-case font-normal">(tap to expand)</span>
          </h4>
          <div className="space-y-1.5 mb-5">
            {data.categories.map((cat, idx) => {
              const isExpanded = expandedCategory === cat.name;
              const catTxns = isExpanded ? getCategoryTransactions(cat.name) : [];
              return (
                <div key={cat.name}>
                  <button onClick={() => setExpandedCategory(isExpanded ? null : cat.name)}
                    className={`w-full flex items-center justify-between bg-stone-50 dark:bg-stone-700/50 rounded-lg p-3 border transition-all cursor-pointer ${isExpanded ? "border-amber-300 dark:border-amber-600 ring-1 ring-amber-200 dark:ring-amber-700" : "border-stone-100 dark:border-stone-600 hover:border-stone-200"}`}>
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                      <span className="font-medium text-stone-700 dark:text-stone-200 text-sm">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-stone-800 dark:text-stone-100 text-sm">₹{cat.amount.toLocaleString()}</span>
                      <span className="text-stone-400 text-xs">({cat.percentage}%)</span>
                      <svg className={`w-3.5 h-3.5 text-stone-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="ml-5 mt-1 mb-2 space-y-1 animate-[fadeIn_0.2s_ease-in-out]">
                      {cat.name === "Investment" || cat.name === "Lent" ? (
                        <p className="text-xs text-stone-400 dark:text-stone-500 italic py-2 pl-2">
                          View details in the {cat.name === "Investment" ? "Investments" : "Lending"} section.
                        </p>
                      ) : catTxns.length === 0 ? (
                        <p className="text-xs text-stone-400 py-2 pl-2">No transactions found.</p>
                      ) : (
                        catTxns.map((tx) => (
                          <div key={tx._id} className="flex items-center justify-between bg-white dark:bg-stone-800 rounded-lg p-2.5 border border-stone-100 dark:border-stone-700">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-red-600 dark:text-red-400">−₹{tx.amount.toLocaleString()}</span>
                                <span className="text-xs text-stone-400">{getAccName(tx.accountId)}</span>
                              </div>
                              {tx.note && <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">📝 {tx.note}</p>}
                              <p className="text-[10px] text-stone-400 mt-0.5">
                                {new Date(tx.date || tx.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.categories} dataKey="amount" nameKey="name" cx="50%" cy="50%" outerRadius={90}
                  label={(props: PieLabelRenderProps) => `${props.name || ""}`}>
                  {data.categories.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <p className="text-stone-400 text-center text-sm py-4">No spending data for this month.</p>
      )}
    </div>
  );
}
