// components/content-library/ContentRow.tsx
// Fileira horizontal de cartões de conteúdo com título/ícone (usada em
// Início). Extraído de app/(platform)/content-library/page.tsx.

import { BookOpen, type LucideIcon } from 'lucide-react';
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
        <div className="h-4 bg-slate-200 w-40 rounded animate-pulse mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-slate-100 rounded-xl h-48" />
          ))}
        </div>
      </div>
    );

  if (!items.length) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Icon size={16} className="text-indigo-600" />
        <h3 className="font-semibold text-slate-700">{title}</h3>
        <span className="text-xs text-slate-400 ml-1">{items.length}</span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {items.map((c) => (
          <ContentCard key={c.id} content={c} />
        ))}
      </div>
    </div>
  );
}
