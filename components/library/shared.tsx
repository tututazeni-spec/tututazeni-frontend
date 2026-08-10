// components/library/shared.tsx

import type { ReactNode } from 'react';

interface InfoProps {
  label: string;
  value: string | null | undefined;
}

export function Info({ label, value }: InfoProps) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase">{label}</p>
      <p className="text-sm text-gray-800">{value || '—'}</p>
    </div>
  );
}

interface FieldProps {
  label: string;
  children: ReactNode;
}

export function Field({ label, children }: FieldProps) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500 uppercase">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

export function GridSkeleton() {
  return (
    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
    </div>
  );
}
