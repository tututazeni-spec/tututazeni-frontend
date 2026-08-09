// components/users/shared.tsx
// Sub-componentes de apresentação partilhados entre as várias vistas de
// users/page.tsx (UserListView, UserProfileView, TeamView, DashboardView,
// DirectoryView) — extraídos ao separar container/apresentação do
// UserProfileView. Ver memory project_innova_component_separation_audit,
// item 3.3.

import Image from 'next/image';
import { getInitials as initials } from '@/lib/format';
import { Skeleton as SharedSkeleton } from '@/components/ui/Skeleton';
import type { User } from './types';

export function Avatar({
  user,
  size = 'sm',
}: {
  user: Pick<User, 'fullName' | 'avatarUrl'>;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
  }[size];
  return user.avatarUrl ? (
    <div
      className={`${dim} rounded-full overflow-hidden relative flex-shrink-0`}
    >
      <Image
        src={user.avatarUrl}
        alt={user.fullName}
        fill
        className="object-cover"
      />
    </div>
  ) : (
    <div
      className={`${dim} rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold flex-shrink-0`}
    >
      {initials(user.fullName)}
    </div>
  );
}

export function Skeleton({ rows = 5 }: { rows?: number }) {
  return (
    <SharedSkeleton
      rows={rows}
      wrapperClassName="space-y-2 animate-pulse"
      itemClassName="h-14 bg-gray-100 rounded-xl"
    />
  );
}

export function MetricCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-gray-50 rounded-xl p-4">
      <div className="text-xs text-gray-400 mb-1">{label}</div>
      <div
        className={`text-2xl font-semibold font-mono ${color ?? 'text-gray-900'}`}
      >
        {value}
      </div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}
