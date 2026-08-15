// components/content-library/ContentRow.tsx
// Fileira horizontal de cartões de conteúdo com título/ícone (usada em
// Início). Extraído de app/(platform)/content-library/page.tsx.

import { BookOpen, type LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { ContentCard } from './ContentCard';
import type { Content } from './types';

export interface ContentRowProps {
  title: string;
  items: Content[];
  loading?: boolean;
  icon?: LucideIcon;
}

export function ContentRow({
  title,
  items,
  loading,
  icon: Icon = BookOpen,
}: ContentRowProps) {
  if (loading)
    return (
      <div>
        <div className="mb-3 h-4 w-40 animate-pulse rounded bg-surface-sunken" />
        <Skeleton
          rows={5}
          wrapperClassName="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 animate-pulse"
          itemClassName="bg-surface-sunken rounded-card h-48"
        />
      </div>
    );

  if (!items.length) return null;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon size={16} strokeWidth={1.75} className="text-primary" />
        <h3 className="font-body font-semibold text-ink">{title}</h3>
        <span className="ml-1 font-body text-xs text-ink-faint">
          {items.length}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {items.map((c) => (
          <ContentCard key={c.id} content={c} />
        ))}
      </div>
    </div>
  );
}
