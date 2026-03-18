"use client";

interface DashboardBoxProps {
  title: string;
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "amber";
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

const colorMap = {
  blue: {
    bg: "bg-gradient-to-r from-blue-600 to-blue-700",
    hover: "hover:from-blue-700 hover:to-blue-800",
    ring: "ring-blue-400",
  },
  green: {
    bg: "bg-gradient-to-r from-emerald-600 to-emerald-700",
    hover: "hover:from-emerald-700 hover:to-emerald-800",
    ring: "ring-emerald-400",
  },
  purple: {
    bg: "bg-gradient-to-r from-purple-600 to-purple-700",
    hover: "hover:from-purple-700 hover:to-purple-800",
    ring: "ring-purple-400",
  },
  amber: {
    bg: "bg-gradient-to-r from-amber-600 to-amber-700",
    hover: "hover:from-amber-700 hover:to-amber-800",
    ring: "ring-amber-400",
  },
};

export default function DashboardBox({
  title,
  icon,
  color,
  isActive,
  onClick,
  children,
}: DashboardBoxProps) {
  const colors = colorMap[color];

  return (
    <div className="flex flex-col">
      <button
        onClick={onClick}
        className={`${colors.bg} ${colors.hover} ${
          isActive ? `ring-4 ${colors.ring}` : ""
        } text-white rounded-2xl p-8 shadow-lg transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[180px] w-full`}
      >
        <div className="mb-3">{icon}</div>
        <h2 className="text-xl font-bold text-center">{title}</h2>
      </button>

      {isActive && (
        <div className="mt-4 animate-[fadeIn_0.3s_ease-in-out]">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
            {children}
          </div>
        </div>
      )}
    </div>
  );
}
