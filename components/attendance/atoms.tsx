// components/attendance/atoms.tsx
// Átomos partilhados: badge de estado, ladrilho de KPI e avatar.
// Extraído de app/(platform)/attendance/page.tsx.

'use client';

import Image from 'next/image';
import { ArrowUpRight, TrendingDown } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { STATUS_CONFIG } from './constants';
import type { AttendanceStatus } from './types';

interface StatusBadgeProps {
  status: AttendanceStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.ABSENT;
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.color}`}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

interface KpiTileProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  sub?: string;
  color?: 'blue' | 'emerald' | 'amber' | 'red' | 'violet';
  trend?: 'up' | 'down';
}

export function KpiTile({
  label,
  value,
  icon: Icon,
  sub,
  color = 'blue',
  trend,
}: KpiTileProps) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    red: 'bg-red-50 text-red-600 border-red-100',
    violet: 'bg-violet-50 text-violet-600 border-violet-100',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className={`p-2.5 rounded-xl border ${colors[color]}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            {label}
          </p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
          {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
        </div>
        {trend === 'up' && (
          <ArrowUpRight
            size={14}
            className="text-emerald-500 flex-shrink-0 mt-1"
          />
        )}
        {trend === 'down' && (
          <TrendingDown size={14} className="text-red-400 flex-shrink-0 mt-1" />
        )}
      </div>
    </div>
  );
}

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'sm' | 'md';
}

export function Avatar({ name, src, size = 'sm' }: AvatarProps) {
  const s = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';
  const colors = [
    'bg-violet-500',
    'bg-blue-500',
    'bg-emerald-500',
    'bg-amber-500',
    'bg-rose-500',
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  if (src)
    return (
      <div className={`${s} rounded-full overflow-hidden relative`}>
        <Image src={src} alt={name} fill className="object-cover" />
      </div>
    );
  return (
    <div
      className={`${s} ${color} rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0`}
    >
      {name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()}
    </div>
  );
}
