"use client";

interface DashboardBoxProps {
  title: string;
  icon: React.ReactNode;
  color: "terracotta" | "sage" | "teal" | "clay" | "amber" | "slate";
  isActive: boolean;
  onClick: () => void;
}

const colorMap = {
  terracotta: {
    bg: "bg-gradient-to-br from-amber-700 to-orange-800",
    hover: "hover:from-amber-800 hover:to-orange-900",
    ring: "ring-amber-400/50",
  },
  sage: {
    bg: "bg-gradient-to-br from-emerald-700 to-emerald-800",
    hover: "hover:from-emerald-800 hover:to-emerald-900",
    ring: "ring-emerald-400/50",
  },
  teal: {
    bg: "bg-gradient-to-br from-teal-700 to-teal-800",
    hover: "hover:from-teal-800 hover:to-teal-900",
    ring: "ring-teal-400/50",
  },
  clay: {
    bg: "bg-gradient-to-br from-stone-600 to-stone-700",
    hover: "hover:from-stone-700 hover:to-stone-800",
    ring: "ring-stone-400/50",
  },
  amber: {
    bg: "bg-gradient-to-br from-yellow-700 to-amber-800",
    hover: "hover:from-yellow-800 hover:to-amber-900",
    ring: "ring-yellow-400/50",
  },
  slate: {
    bg: "bg-gradient-to-br from-indigo-700 to-indigo-800",
    hover: "hover:from-indigo-800 hover:to-indigo-900",
    ring: "ring-indigo-400/50",
  },
};

export default function DashboardBox({
  title,
  icon,
  color,
  isActive,
  onClick,
}: DashboardBoxProps) {
  const colors = colorMap[color];

  return (
    <button
      onClick={onClick}
      className={`${colors.bg} ${colors.hover} ${
        isActive ? `ring-4 ${colors.ring} scale-[1.02]` : ""
      } text-white rounded-2xl p-5 lg:p-7 shadow-lg transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[120px] lg:min-h-[150px] w-full`}
    >
      <div className="mb-2 opacity-90">{icon}</div>
      <h2 className="text-sm lg:text-base font-bold text-center tracking-wide leading-tight">{title}</h2>
    </button>
  );
}
