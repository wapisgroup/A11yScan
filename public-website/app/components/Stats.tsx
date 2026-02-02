'use client';

import { StatsComponent } from '@/lib/types';
import { 
  HiCheckCircle, 
  HiUsers, 
  HiClock, 
  HiChartBar,
  HiStar,
  HiGlobeAlt,
  HiDocumentText,
  HiShieldCheck
} from 'react-icons/hi2';

const iconMap = {
  check: HiCheckCircle,
  users: HiUsers,
  clock: HiClock,
  chart: HiChartBar,
  star: HiStar,
  globe: HiGlobeAlt,
  document: HiDocumentText,
  shield: HiShieldCheck,
};

export default function Stats({ data }: { data: StatsComponent }) {
  if (!data.stats || data.stats.length === 0) {
    return null;
  }

  const size = data.size || 'normal';
  const isSmall = size === 'small';

  return (
    <div className="w-full">
      <div className={`grid grid-cols-1 ${
        data.stats.length === 2 ? 'md:grid-cols-2 max-w-3xl' :
        data.stats.length === 3 ? 'md:grid-cols-3 max-w-4xl' :
        data.stats.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4 max-w-6xl' :
        'md:grid-cols-2 lg:grid-cols-3 max-w-5xl'
      } mx-auto ${isSmall ? 'gap-6' : 'gap-8'}`}>
        {data.stats.map((stat) => {
          const IconComponent = stat.icon ? iconMap[stat.icon as keyof typeof iconMap] : null;
          
          return (
            <div
              key={stat._key}
              className="text-center"
            >
              {!isSmall && IconComponent && (
                <IconComponent className="w-12 h-12 text-purple-600 mx-auto mb-4" />
              )}
              <div className={`${
                isSmall ? 'text-3xl' : 'text-4xl md:text-5xl'
              } font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-${isSmall ? '1' : '2'}`}>
                {stat.value}
              </div>
              <div className={`${
                isSmall ? 'text-sm' : 'text-lg font-semibold'
              } text-slate-${isSmall ? '600' : '900'} mb-1`}>
                {stat.label}
              </div>
              {stat.description && (
                <p className="text-sm text-slate-600">
                  {stat.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
