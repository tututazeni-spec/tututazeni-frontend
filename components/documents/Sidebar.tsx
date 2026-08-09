// components/documents/Sidebar.tsx
// Sidebar de filtros: novo documento, filtros rápidos, categorias e nuvem
// de tags. Extraído de app/(platform)/documents/page.tsx.

'use client';

import { AlertCircle, Folder, Plus } from 'lucide-react';
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
    <div className="w-56 flex-shrink-0 bg-white border-r border-gray-100 p-4 space-y-6">
      <div>
        <button
          onClick={onNewDocument}
          className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm"
        >
          <Plus size={15} /> Novo Documento
        </button>
      </div>

      {/* Quick filters */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 rounded-xl hover:bg-gray-100 transition-colors text-left"
            >
              <item.icon size={15} className="text-gray-400" />
              <span className="flex-1">{item.label}</span>
              {item.badge != null && item.badge > 0 && (
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div>
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
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
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs rounded-xl transition-colors text-left ${filters.category === k ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${v.color.split(' ')[0]}`}
              />
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tag cloud */}
      {allTags.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Tags
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allTags.slice(0, 12).map((t) => (
              <button
                key={t.tag}
                onClick={() =>
                  updateFilters({ tag: filters.tag === t.tag ? '' : t.tag })
                }
                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${filters.tag === t.tag ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
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
