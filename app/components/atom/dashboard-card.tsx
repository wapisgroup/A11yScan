import Link from "next/link";
import { ReactNode } from "react";

type DashboardCardProps = {
  title: string;
  value: string | number;
  icon: ReactNode;
  link?: string;
  iconColor?: string;
  valueColor?: string;
  borderColor?: string;
  hoverBorderColor?: string;
};

export function DashboardCard({
  title,
  value,
  icon,
  link,
  iconColor = "text-gray-500",
  valueColor = "text-gray-900",
  borderColor = "border-gray-200",
  hoverBorderColor,
}: DashboardCardProps) {
  const cardContent = (
    <>
      <div className="flex items-center gap-2 mb-2">
        <div className={`text-xl ${iconColor}`}>{icon}</div>
        <span className="text-xs text-gray-600">{title}</span>
      </div>
      <div className={`text-3xl font-bold ${valueColor}`}>{value}</div>
    </>
  );

  if (link) {
    return (
      <Link
        href={link}
        className={`bg-white rounded-xl p-4 border ${borderColor} ${
          hoverBorderColor ? `hover:${hoverBorderColor}` : "hover:border-gray-300"
        } hover:shadow-md transition-all block`}
      >
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-4 border ${borderColor}`}>
      {cardContent}
    </div>
  );
}
