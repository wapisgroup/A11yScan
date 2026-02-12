/**
 * Dashboard Card
 * Shared component in atom/dashboard-card.tsx.
 */

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
  hoverBorderColor,
}: DashboardCardProps) {
  const cardClassName = `bg-white rounded-xl p-4 border border-[var(--color-border-light)] ${
    hoverBorderColor ? `hover:${hoverBorderColor}` : "hover:border-[#BFD0E6]"
  } hover:shadow-sm transition-all block`;

  const cardContent = (
    <>
      <div className="flex items-center gap-2 mb-2">
        <div className={`text-xl ${iconColor}`}>{icon}</div>
        <span className="as-p3-text secondary-text-color">{title}</span>
      </div>
      <div className={`text-3xl font-bold ${valueColor}`}>{value}</div>
    </>
  );

  if (link) {
    return (
      <Link href={link} className={cardClassName}>
        {cardContent}
      </Link>
    );
  }

  return (
    <div className={`bg-white rounded-xl p-4 border border-[var(--color-border-light)]`}>
      {cardContent}
    </div>
  );
}
