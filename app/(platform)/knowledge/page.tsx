// src/app/(dashboard)/knowledge/page.tsx
'use client';

// Container: gere a navegação (portal/biblioteca/artigo/dashboard);
// delega dados+apresentação de cada separador aos componentes
// auto-contidos em components/knowledge/. Ver memory
// project_innova_component_separation_audit. Migrado para a fundação de
// design: nav em pílula local passa a Button primary/ghost dentro de um
// wrapper com token, mesmo padrão de app/(platform)/audit/page.tsx.

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { NAV, TITLES } from '@/components/knowledge/constants';
import { AdminDashboardView } from '@/components/knowledge/AdminDashboardView';
import { ArticleDetailView } from '@/components/knowledge/ArticleDetailView';
import { LibraryView } from '@/components/knowledge/LibraryView';
import { PortalView } from '@/components/knowledge/PortalView';
import type { Nav } from '@/components/knowledge/types';
import { Button } from '@/components/ui/Button';

export default function KnowledgePage() {
  const [nav, setNav] = useState<Nav>({ view: 'portal' });

  const handleSelectArticle = (id: number) =>
    setNav({ view: 'article', selectedId: id });
  const handleBack = () => setNav({ view: 'library' });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[nav.view]}
          </h1>
          <p className="mt-0.5 font-body text-sm text-ink-faint">
            INNOVA — Gestão do Conhecimento
          </p>
        </div>
        <Button onClick={() => alert('Abrir editor de artigo')}>
          <Plus size={16} strokeWidth={1.75} />
          Novo artigo
        </Button>
      </div>

      {/* Tabs */}
      {nav.view !== 'article' && (
        <div className="mb-6 flex w-fit gap-1 rounded-card bg-surface-sunken p-1">
          {NAV.map((n) => (
            <Button
              key={n.id}
              size="sm"
              intent={nav.view === n.id ? 'primary' : 'ghost'}
              onClick={() => setNav({ view: n.id })}
            >
              {n.label}
            </Button>
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
