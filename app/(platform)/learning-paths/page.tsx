'use client';

// Container: gere a navegação (catálogo/detalhe/minhas trilhas/
// dashboard); delega dados+apresentação de cada separador aos
// componentes auto-contidos em components/learning-paths/. Ver memory
// project_innova_component_separation_audit. Migrado para a fundação de
// design: header/tabs passam a tokens semânticos, mesmo padrão de
// app/(platform)/trainings/page.tsx (pill de navegação em
// bg-surface-sunken, botão de acção primário).

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { NAV, TITLES } from '@/components/learning-paths/constants';
import { CatalogView } from '@/components/learning-paths/CatalogView';
import { CreateLearningPathModal } from '@/components/learning-paths/CreateLearningPathModal';
import { DashboardView } from '@/components/learning-paths/DashboardView';
import { LPDetailView } from '@/components/learning-paths/LPDetailView';
import { MyPathsView } from '@/components/learning-paths/MyPathsView';
import type { Nav } from '@/components/learning-paths/types';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/providers/ToastProvider';

export default function LearningPathsPage() {
  const notify = useToast();
  const role = useCurrentRole();
  // Criar trilha bate em POST /learning-paths (@Roles ADMIN, RH) — só
  // mostrar o botão a quem o endpoint aceita. Enquanto a role não chegou
  // (arranque pós-login/reload) tratamos como não-admin.
  const isAdmin = !!role && ADMIN_ROLES.includes(role);
  const [nav, setNav] = useState<Nav>({ view: 'catalog' });
  const [showCreate, setShowCreate] = useState(false);

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'catalog' });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[nav.view]}
          </h1>
          <p className="mt-0.5 font-body text-sm text-ink-faint"></p>
        </div>
        {nav.view === 'catalog' && isAdmin && (
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} strokeWidth={1.75} />
            Criar trilha
          </Button>
        )}
      </div>

      {/* Tabs */}
      {nav.view !== 'detail' && (
        <div className="mb-6 flex w-fit gap-1 rounded-xl bg-surface-sunken p-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setNav({ view: n.id })}
              className={`rounded-lg px-4 py-2 font-body text-sm font-medium transition-colors ${
                nav.view === n.id
                  ? 'bg-surface text-ink shadow-resting'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {nav.view === 'catalog' && <CatalogView onSelect={handleSelect} />}
      {nav.view === 'detail' && (
        <LPDetailView pathId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'my-paths' && <MyPathsView onSelect={handleSelect} />}
      {nav.view === 'dashboard' && <DashboardView onSelect={handleSelect} />}

      {showCreate && (
        <CreateLearningPathModal
          onClose={() => setShowCreate(false)}
          onSuccess={() =>
            notify({
              title:
                'Trilha criada como rascunho. Vê-a na secção Rascunhos do Dashboard (Admin).',
              intent: 'success',
            })
          }
        />
      )}
    </div>
  );
}
