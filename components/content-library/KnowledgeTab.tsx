// components/content-library/KnowledgeTab.tsx
//
// Fusão do antigo módulo `knowledge` (base de conhecimento — portal,
// biblioteca de artigos, dashboard admin) no módulo "Biblioteca"
// unificado. Reaproveita tal e qual a navegação interna + as views que já
// existiam em app/(platform)/knowledge/page.tsx — nada foi reescrito, só
// re-embrulhado como separador (a própria rota /knowledge continua a
// existir e a funcionar).

'use client';

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

export function KnowledgeTab() {
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
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            {TITLES[nav.view]}
          </h2>
        </div>
        {canCreate && (
          <Button onClick={() => setCreating(true)}>
            <Plus size={16} strokeWidth={1.75} />
            Novo artigo
          </Button>
        )}
      </div>

      {creating && <CreateArticleModal onClose={() => setCreating(false)} />}

      {nav.view !== 'article' && (
        <div className="mb-6 flex w-fit gap-1 rounded-card bg-surface-sunken p-1">
          {visibleNav.map((n) => (
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
