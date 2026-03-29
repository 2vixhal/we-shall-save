"use client";

import { useRef, useEffect } from "react";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

interface MonthSelectorProps {
  month: number;
  year: number;
  onChange: (month: number, year: number) => void;
}

export default function MonthSelector({ month, year, onChange }: MonthSelectorProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const activeBtn = scrollRef.current.querySelector("[data-active='true']");
      if (activeBtn) {
        activeBtn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [month]);

  const handlePrevYear = () => onChange(month, year - 1);
  const handleNextYear = () => onChange(month, year + 1);

  return (
    <div className="mb-5">
      <div
        ref={scrollRef}
        className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {MONTHS.map((m, idx) => (
          <button
            key={m}
            data-active={idx === month}
            onClick={() => onChange(idx, year)}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
              idx === month
                ? "bg-stone-800 text-amber-50 shadow-md"
                : "bg-stone-100 text-stone-600 hover:bg-stone-200"
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-center gap-3 mt-2">
        <button
          onClick={handlePrevYear}
          className="text-stone-400 hover:text-stone-700 transition-colors cursor-pointer p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-stone-500 tabular-nums">{year}</span>
        <button
          onClick={handleNextYear}
          className="text-stone-400 hover:text-stone-700 transition-colors cursor-pointer p-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
