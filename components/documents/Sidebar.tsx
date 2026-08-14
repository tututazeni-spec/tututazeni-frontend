// components/documents/Sidebar.tsx
// Sidebar de filtros: novo documento, filtros rápidos, categorias e nuvem
// de tags. Extraído de app/(platform)/documents/page.tsx. Migrado para a
// fundação de design: classes Tailwind cruas passam a tokens; botão "Novo
// Documento" e contador de "A Expirar" passam a Button/Badge reais.

'use client';

import { AlertCircle, Folder, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { CATEGORY_CONFIG } from './constants';
import type { DashboardData, DocFilters } from './types';

interface SidebarProps {
  filters: DocFilters;
  updateFilters: (patch: Partial<DocFilters>) => void;
  dashboard: DashboardData | null;
  allTags: Array<{ tag: string; count: number }>;
  onNewDocument: () => void;
}

export function Sidebar({
  filters,
  updateFilters,
  dashboard,
  allTags,
  onNewDocument,
}: SidebarProps) {
  return (
    <div className="w-56 flex-shrink-0 bg-surface border-r border-border p-4 space-y-6">
      <div>
        <Button onClick={onNewDocument} className="w-full">
          <Plus size={15} strokeWidth={1.75} /> Novo Documento
        </Button>
      </div>

      {/* Quick filters */}
      <div>
        <p className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-2">
          Filtros
        </p>
        <div className="space-y-1">
          {[
            {
              label: 'Todos os documentos',
              icon: Folder,
              action: () =>
                updateFilters({ category: '', expiringSoon: false, tag: '' }),
            },
            {
              label: 'A Expirar',
              icon: AlertCircle,
              action: () => updateFilters({ expiringSoon: true }),
              badge: dashboard?.kpis.expiringSoon,
            },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-muted rounded-control hover:bg-surface-sunken transition-colors text-left"
            >
              <item.icon size={15} strokeWidth={1.75} className="text-ink-faint" />
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <Badge intent="warning" className="px-1.5 py-0 text-[10px]">
                  {item.badge}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <p className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-2">
          Categorias
        </p>
        <div className="space-y-1">
          {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
            <button
              key={k}
              onClick={() =>
                updateFilters({
                  category: filters.category === k ? '' : k,
                  expiringSoon: false,
                })
              }
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-control transition-colors text-left ${filters.category === k ? 'bg-primary-subtle text-primary font-semibold' : 'text-ink-muted hover:bg-surface-sunken'}`}
            >
              <span className={`w-2 h-2 rounded-full ${v.dot}`} />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tag cloud */}
      {allTags.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-ink-faint uppercase tracking-wider mb-2">
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allTags.slice(0, 12).map((t) => (
              <button
                key={t.tag}
                onClick={() =>
                  updateFilters({ tag: filters.tag === t.tag ? '' : t.tag })
                }
                className={`text-xs px-2 py-0.5 rounded-pill transition-colors ${filters.tag === t.tag ? 'bg-primary text-canvas' : 'bg-surface-sunken text-ink-muted hover:bg-border-strong'}`}
              >
                {t.tag}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
