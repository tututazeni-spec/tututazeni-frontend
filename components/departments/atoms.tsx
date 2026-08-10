// components/departments/atoms.tsx
// Átomos partilhados: badge de estado, avatar, breadcrumb, skeleton e
// cartão de métrica. Extraído de app/(platform)/departments/page.tsx.

'use client';

import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';
import { getInitials } from '@/lib/format';

interface StatusBadgeProps {
  active: boolean;
}

export function StatusBadge({ active }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${active ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {active ? 'Activo' : 'Inactivo'}
    </span>
  );
}

interface AvatarProps {
  name: string;
  size?: 'sm' | 'md';
}

export function Avatar({ name, size = 'sm' }: AvatarProps) {
  const initials = getInitials(name);
  const dim = size === 'sm' ? 'w-7 h-7 text-xs' : 'w-10 h-10 text-sm';
  return (
    <div
      className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0`}
    >
      {initials}
    </div>
  );
}

interface BreadcrumbProps {
  items: Array<{ id: number; name: string; code: string }>;
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <div className="flex items-center gap-1 text-xs text-gray-400 flex-wrap">
      {items.map((item, i) => (
        <span key={item.id} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300">›</span>}
          <span
            className={
              i === items.length - 1 ? 'text-gray-700 font-medium' : ''
            }
          >
            {item.name}
          </span>
        </span>
      ))}
    </div>
  );
}

interface SkeletonProps {
  rows?: number;
}

export function Skeleton({ rows = 5 }: SkeletonProps) {
  return (
    <SharedSkeleton
      rows={rows}
      wrapperClassName="space-y-2 animate-pulse"
      itemClassName="h-14 bg-gray-100 rounded-xl"
    />
  );
}

interface MetricCardProps {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}

export function MetricCard({
  label,
  value,
  sub,
  color = 'text-gray-900',
}: MetricCardProps) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div className={`text-2xl font-semibold font-mono ${color}`}>{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}
