// src/app/(dashboard)/competencies/page.tsx
'use client';

// Container: gere o separador activo e os modais de CRUD do catálogo;
// delega dados+apresentação de cada separador aos componentes
// auto-contidos em components/competencies/ (mesmo padrão que
// components/payslips/page.tsx usa para ListView/CompareView/AnnualView).
// Ver memory project_innova_component_separation_audit. Migrado para a
// fundação de design: nav em pílula e botão de acção passam a Button
// (mesmo padrão de app/(platform)/sucession/page.tsx).
//
// "+ Nova competência", "Editar" e "Arquivar" só aparecem a ADMIN/RH,
// espelhando @Roles(ADMIN, RH) em competencies.controller.ts. "Apagar" é
// mais restrito — só ADMIN, espelhando @Roles(ADMIN) no DELETE
// /competencies/:id. O clique num cartão do catálogo abre o detalhe
// (leitura aberta a todos).

import { useState } from 'react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES } from '@/lib/roles';
import { useToast } from '@/providers/ToastProvider';
import { NAV, TITLES } from '@/components/competencies/constants';
import { CatalogView } from '@/components/competencies/CatalogView';
import { CompetencyDetailModal } from '@/components/competencies/CompetencyDetailModal';
import { CompetencyFormModal } from '@/components/competencies/CompetencyFormModal';
import { DashboardView } from '@/components/competencies/DashboardView';
import { MyProfileView } from '@/components/competencies/MyProfileView';
import { SkillMatrixView } from '@/components/competencies/SkillMatrixView';
import type { View } from '@/components/competencies/types';
import { Button } from '@/components/ui/Button';

export default function CompetenciesPage() {
  const notify = useToast();
  const role = useCurrentRole();
  const canManage = !!role && ADMIN_ROLES.includes(role);
  const canDelete = role === 'ADMIN';

  const [view, setView] = useState<View>('catalog');
  const [detailId, setDetailId] = useState<number | null>(null);
  // null → fechado; { competencyId: null } → criar; { competencyId: n } → editar.
  const [form, setForm] = useState<{ competencyId: number | null } | null>(
    null,
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-ink">
            {TITLES[view]}
          </h1>
          <p className="mt-0.5 font-body text-sm text-ink-faint"></p>
        </div>
        {view === 'catalog' && canManage && (
          <Button onClick={() => setForm({ competencyId: null })}>
            + Nova competência
          </Button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-6 flex w-fit gap-1 rounded-card bg-surface-sunken p-1">
        {NAV.map((n) => (
          <Button
            key={n.id}
            size="sm"
            intent={view === n.id ? 'primary' : 'ghost'}
            onClick={() => setView(n.id)}
          >
            {n.label}
          </Button>
        ))}
      </div>

      {view === 'catalog' && (
        <CatalogView onSelect={setDetailId} canManage={canManage} />
      )}
      {view === 'my-profile' && <MyProfileView />}
      {view === 'matrix' && <SkillMatrixView />}
      {view === 'dashboard' && <DashboardView />}

      {detailId !== null && (
        <CompetencyDetailModal
          competencyId={detailId}
          canManage={canManage}
          canDelete={canDelete}
          onEdit={() => {
            setForm({ competencyId: detailId });
            setDetailId(null);
          }}
          onClose={() => setDetailId(null)}
        />
      )}

      {form !== null && (
        <CompetencyFormModal
          competencyId={form.competencyId}
          onClose={() => setForm(null)}
          onSuccess={() =>
            notify({
              title: form.competencyId
                ? 'Competência actualizada.'
                : 'Competência criada.',
              intent: 'success',
            })
          }
        />
      )}
    </div>
  );
}
