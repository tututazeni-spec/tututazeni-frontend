// src/app/(dashboard)/knowledge/page.tsx
'use client';

// Container: gere a navegação (portal/biblioteca/artigo/dashboard);
// delega dados+apresentação de cada separador aos componentes
// auto-contidos em components/knowledge/. Ver memory
// project_innova_component_separation_audit. Migrado para a fundação de
// design: nav em pílula local passa a Button primary/ghost dentro de um
// wrapper com token, mesmo padrão de app/(platform)/audit/page.tsx.

import { PillNav } from '@/components/ui/PillTabs';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { NAV, TITLES } from '@/components/knowledge/constants';
import { AdminDashboardView } from '@/components/knowledge/AdminDashboardView';
import { ArticleDetailView } from '@/components/knowledge/ArticleDetailView';
import { CreateArticleModal } from '@/components/knowledge/CreateArticleModal';
import { LibraryView } from '@/components/knowledge/LibraryView';
import { PortalView } from '@/components/knowledge/PortalView';
import type { Nav } from '@/components/knowledge/types';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { filterByRole, type Role } from '@/lib/roles';
import { Button } from '@/components/ui/Button';

export default function KnowledgePage() {
  const [nav, setNav] = useState<Nav>({ view: 'portal' });
  const [creating, setCreating] = useState(false);
  const { data: me } = useCurrentUser();
  const role = me?.role?.name as Role | undefined;
  const visibleNav = filterByRole(NAV, role);
  // Pedido do utilizador: colaborador não cria artigos pela UI (o endpoint
  // POST /knowledge em si não tem @Roles no backend).
  const canCreate = role !== 'COLABORADOR';

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
        </div>
        {canCreate && (
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={1.75} />
            Novo artigo
          </Button>
        )}
      </div>

      {creating && <CreateArticleModal onClose={() => setCreating(false)} />}

      {/* Tabs — barra glassmorphism partilhada (components/ui/PillTabs). */}
      {nav.view !== 'article' && (
        <PillNav
          items={visibleNav}
          value={nav.view}
          onChange={(id) => setNav({ view: id } as Nav)}
          label="Base de conhecimento"
          className="mb-6"
        />
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
