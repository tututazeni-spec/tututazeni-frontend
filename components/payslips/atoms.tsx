// components/payslips/atoms.tsx
// Átomos partilhados: skeleton de linha e badge de delta. Extraído
// de app/(platform)/payslips/page.tsx.

'use client';

import { formatKz as fmtKz } from '@/lib/format';

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-gray-100 animate-pulse">
      <div className="flex-1 h-4 bg-gray-100 rounded" />
      <div className="w-24 h-4 bg-gray-100 rounded" />
      <div className="w-32 h-4 bg-gray-100 rounded" />
      <div className="w-20 h-4 bg-gray-100 rounded" />
    </div>
  );
}

interface DeltaBadgeProps {
  delta: number;
  pct: number | null;
}

export function DeltaBadge({ delta, pct }: DeltaBadgeProps) {
  if (delta === 0)
    return <span className="text-xs text-gray-400 font-mono">—</span>;
  const up = delta > 0;
  return (
    <span
      className={`text-xs font-mono font-medium ${up ? 'text-emerald-600' : 'text-red-600'}`}
    >
      {up ? '↑' : '↓'}{' '}
      {pct !== null ? `${Math.abs(pct).toFixed(1)}%` : fmtKz(Math.abs(delta))}
    </span>
  );
}
