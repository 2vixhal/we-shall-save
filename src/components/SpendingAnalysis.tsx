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

const COLORS = [
  "#92400e", "#065f46", "#0f766e", "#78716c",
  "#b45309", "#166534", "#115e59", "#a16207",
  "#854d0e", "#3f6212",
];

export default function SpendingAnalysis({ month, year }: { month: number; year: number }) {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysis = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/analysis?month=${month}&year=${year}`);
        if (res.ok) setData(await res.json());
      } catch { /* silently fail */ }
      finally { setLoading(false); }
    };
    fetchAnalysis();
  }, [month, year]);

  if (loading) return <div className="text-center py-6 text-stone-400 text-sm">Loading analysis...</div>;
  if (!data) return <div className="text-center py-6 text-stone-400 text-sm">Unable to load analysis</div>;

  return (
    <div className="mt-5 border-t border-stone-200 pt-5">
      <h3 className="text-sm font-bold text-stone-700 mb-4">Spending Analysis</h3>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-red-50 border border-red-100 rounded-xl p-3.5 text-center">
          <p className="text-xs text-red-600 font-semibold">Total Spent</p>
          <p className="text-xl font-bold text-red-700 mt-1">₹{data.totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-center">
          <p className="text-xs text-emerald-600 font-semibold">Balance Left</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">₹{data.totalLeft.toLocaleString()}</p>
        </div>
      </div>

      {data.categories.length > 0 ? (
        <>
          <h4 className="text-xs font-semibold text-stone-500 mb-2.5 uppercase tracking-wider">Category Breakdown</h4>
          <div className="space-y-1.5 mb-5">
            {data.categories.map((cat, idx) => (
              <div key={cat.name} className="flex items-center justify-between bg-stone-50 rounded-lg p-3 border border-stone-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="font-medium text-stone-700 text-sm">{cat.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-stone-800 text-sm">₹{cat.amount.toLocaleString()}</span>
                  <span className="text-stone-400 text-xs ml-1.5">({cat.percentage}%)</span>
                </div>
              </div>
            ))}
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
