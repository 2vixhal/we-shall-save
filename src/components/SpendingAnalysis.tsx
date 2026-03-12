"use client";

import { useState, useEffect } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieLabelRenderProps,
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
  "#3B82F6",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
];

export default function SpendingAnalysis() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysis();
  }, []);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/analysis");
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-6 text-gray-500">
        Loading analysis...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-6 text-gray-500">
        Unable to load analysis
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-gray-200 pt-6">
      <h3 className="text-lg font-bold text-gray-800 mb-4">
        Spending Analysis (This Month)
      </h3>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-red-50 rounded-xl p-4 text-center">
          <p className="text-sm text-red-600 font-medium">Total Spent</p>
          <p className="text-2xl font-bold text-red-700">
            ₹{data.totalSpent.toLocaleString()}
          </p>
        </div>
        <div className="bg-green-50 rounded-xl p-4 text-center">
          <p className="text-sm text-green-600 font-medium">Total Left</p>
          <p className="text-2xl font-bold text-green-700">
            ₹{data.totalLeft.toLocaleString()}
          </p>
        </div>
      </div>

      {data.categories.length > 0 ? (
        <>
          <h4 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">
            Category Breakdown
          </h4>
          <div className="space-y-2 mb-6">
            {data.categories.map((cat, idx) => (
              <div
                key={cat.name}
                className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="font-medium text-gray-700">{cat.name}</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-gray-800">
                    ₹{cat.amount.toLocaleString()}
                  </span>
                  <span className="text-gray-400 text-sm ml-2">
                    ({cat.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categories}
                  dataKey="amount"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(props: PieLabelRenderProps) =>
                    `${props.name || ""} ₹${(props.value ?? 0).toLocaleString()}`
                  }
                >
                  {data.categories.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `₹${Number(value).toLocaleString()}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <p className="text-gray-500 text-center py-4">
          No spending data this month yet.
        </p>
      )}
    </div>
  );
}
