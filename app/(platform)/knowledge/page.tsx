// src/app/(dashboard)/knowledge/page.tsx
'use client';

// Container: gere a navegação (portal/biblioteca/artigo/dashboard);
// delega dados+apresentação de cada separador aos componentes
// auto-contidos em components/knowledge/. Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import { NAV, TITLES } from '@/components/knowledge/constants';
import { AdminDashboardView } from '@/components/knowledge/AdminDashboardView';
import { ArticleDetailView } from '@/components/knowledge/ArticleDetailView';
import { LibraryView } from '@/components/knowledge/LibraryView';
import { PortalView } from '@/components/knowledge/PortalView';
import type { Nav } from '@/components/knowledge/types';

export default function KnowledgePage() {
  const [nav, setNav] = useState<Nav>({ view: 'portal' });

  const handleSelectArticle = (id: number) =>
    setNav({ view: 'article', selectedId: id });
  const handleBack = () => setNav({ view: 'library' });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {TITLES[nav.view]}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            INNOVA — Gestão do Conhecimento
          </p>
        </div>
        <button
          onClick={() => alert('Abrir editor de artigo')}
          className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
        >
          + Novo artigo
        </button>
      </div>

      {/* Tabs */}
      {nav.view !== 'article' && (
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setNav({ view: n.id })}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                nav.view === n.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {nav.view === 'portal' && (
        <PortalView onSelectArticle={handleSelectArticle} onSearch={() => {}} />
      )}
      {nav.view === 'library' && (
        <LibraryView onSelectArticle={handleSelectArticle} />
      )}
      {nav.view === 'article' && (
        <ArticleDetailView articleId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'dashboard' && <AdminDashboardView />}
    </div>
  );
}
