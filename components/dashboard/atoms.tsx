// components/dashboard/atoms.tsx
// Primitivos de UI partilhados pelos 3 sub-dashboards — puramente
// apresentacionais (props in, JSX out), sem qualquer acesso a dados.
// Extraídos de app/(platform)/dashboard/page.tsx.
//
// `Slideshow` e `StatCard` (definidos no ficheiro original) nunca eram
// renderizados em lado nenhum — confirmado por grep ao resto do repo, o
// `StatCard` que existe em work-declaration/page.tsx é um componente local
// homónimo, não uma reexportação deste. Código morto, não foram trazidos.

'use client';

import Image from 'next/image';
import { TrendingUp, TrendingDown, AlertTriangle, Clock } from 'lucide-react';
import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';
import { getInitials } from '@/lib/format';
import type { Alert, KPICardProps } from './types';

export interface ProgressBarProps {
  value: number;
  color?: string;
  height?: string;
}

export function ProgressBar({
  value,
  color = 'bg-indigo-500',
  height = 'h-1.5',
}: ProgressBarProps) {
  return (
    <div className={`w-full ${height} bg-slate-100 rounded-full`}>
      <div
        className={`${height} ${color} rounded-full transition-all duration-700`}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
}

export interface AvatarProps {
  name: string;
  url?: string;
  size?: number;
}

export function Avatar({ name, url, size = 8 }: AvatarProps) {
  const initials = getInitials(name);
  return url ? (
    <div
      className={`w-${size} h-${size} rounded-full overflow-hidden relative`}
    >
      <Image src={url} alt={name} fill className="object-cover" />
    </div>
  ) : (
    <div
      className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0`}
    >
      {initials}
    </div>
  );
}

export function KPICard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  color = 'text-indigo-600',
  bg = 'bg-indigo-50',
}: KPICardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className={`p-2 rounded-lg ${bg}`}>
          <Icon size={18} className={color} />
        </div>
        {trend !== undefined && (
          <span
            className={`text-xs font-medium flex items-center gap-0.5 ${trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}
          >
            {trend >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-800">{value}</p>
      <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export interface SkeletonProps {
  count?: number;
}

export function Skeleton({ count = 4 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={count}
      wrapperClassName="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse"
      itemClassName="bg-slate-100 rounded-xl h-24"
    />
  );
}

export interface AlertBannerProps {
  alerts: Alert[];
}

export function AlertBanner({ alerts }: AlertBannerProps) {
  if (!alerts.length) return null;
  const urgent = alerts.filter((a) => a.priority === 'URGENT');
  const others = alerts.filter((a) => a.priority !== 'URGENT');

  return (
    <div className="space-y-2">
      {urgent.map((a, i) => (
        <div
          key={i}
          className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-700 flex-1">{a.message}</p>
          {a.actionUrl && (
            <a
              href={a.actionUrl}
              className="text-xs px-3 py-1 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Ver →
            </a>
          )}
        </div>
      ))}
      {others.slice(0, 2).map((a, i) => (
        <div
          key={i}
          className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3"
        >
          <Clock size={14} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-700 flex-1">{a.message}</p>
          {a.actionUrl && (
            <a
              href={a.actionUrl}
              className="text-xs px-3 py-1 bg-amber-600 text-white rounded-lg hover:bg-amber-700 shrink-0"
            >
              Ver →
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
