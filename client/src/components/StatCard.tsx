import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  subtext: string;
  icon: LucideIcon;
  theme?: 'purple' | 'sky' | 'emerald' | 'amber';
}

export default function StatCard({ label, value, subtext, icon: Icon, theme = 'purple' }: StatCardProps) {
  const themeStyles = {
    purple: 'bg-purple-50 text-purple-600',
    sky: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600'
  };

  return (
    <div className="stat-card">
      <div>
        <div className="stat-label">{label}</div>
        <div className="stat-value">{value}</div>
        <div className="stat-subtext">{subtext}</div>
      </div>
      <div className={`stat-icon-wrapper ${themeStyles[theme]}`}>
        <Icon size={22} />
      </div>
    </div>
  );
}
