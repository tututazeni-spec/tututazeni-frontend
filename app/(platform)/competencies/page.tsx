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
//
// Módulo "Competências" único na sidebar: junta catálogo/perfil/matriz
// numa só página com separadores. As abas "Dashboard RH" e "Mapa de
// Competências" que aqui existiram foram removidas a pedido do
// utilizador — o backend (models/controllers, incl. /competency-map)
// mantém-se intacto, só a navegação deste módulo mudou. A rota standalone
// /competency-map continua a existir e a usar CompetencyMapView, sem
// entrada de sidebar.

import { useState } from 'react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES, filterByRole } from '@/lib/roles';
import { useToast } from '@/providers/ToastProvider';
import { NAV, TITLES } from '@/components/competencies/constants';
import { CatalogView } from '@/components/competencies/CatalogView';
import { CompetencyDetailModal } from '@/components/competencies/CompetencyDetailModal';
import { CompetencyFormModal } from '@/components/competencies/CompetencyFormModal';
import { DevelopmentView } from '@/components/competencies/DevelopmentView';
import { EvaluationsView } from '@/components/competencies/EvaluationsView';
import { GapsView } from '@/components/competencies/GapsView';
import { LevelsView } from '@/components/competencies/LevelsView';
import { ModelDetailModal } from '@/components/competencies/ModelDetailModal';
import { ModelFormModal } from '@/components/competencies/ModelFormModal';
import { ModelsView } from '@/components/competencies/ModelsView';
import { MyProfileView } from '@/components/competencies/MyProfileView';
import { OverviewView } from '@/components/competencies/OverviewView';
import { ReportsView } from '@/components/competencies/ReportsView';
import { SkillMatrixView } from '@/components/competencies/SkillMatrixView';
import type { View } from '@/components/competencies/types';
import { Button } from '@/components/ui/Button';

export default function CompetenciesPage() {
  const notify = useToast();
  const role = useCurrentRole();
  const canManage = !!role && ADMIN_ROLES.includes(role);
  const canDelete = role === 'ADMIN';
  const visibleNav = filterByRole(NAV, role);

  const [view, setView] = useState<View>('catalog');
  const [detailId, setDetailId] = useState<number | null>(null);
  // null → fechado; { competencyId: null } → criar; { competencyId: n } → editar.
  const [form, setForm] = useState<{ competencyId: number | null } | null>(
    null,
  );

  // docs/módulo_competencies.md §4 (Fase 2) — mesmo padrão de
  // detailId/form acima, para a aba "Modelos de Competências".
  const [modelDetailId, setModelDetailId] = useState<number | null>(null);
  const [modelForm, setModelForm] = useState<{ modelId: number | null } | null>(
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
        {view === 'models' && canManage && (
          <Button onClick={() => setModelForm({ modelId: null })}>
            + Novo modelo
          </Button>
        )}
      </div>

      {/* Tabs — formato de "cartão": cada botão é um cartão independente
          (borda + fundo branco + rounded), sem o fundo/pill de grupo
          anterior. Alinhadas horizontal e verticalmente (justify-center +
          items-center no wrapper) com largura mínima uniforme. Estado
          activo usa a mesma condição `view === n.id` de sempre para
          aplicar destaque azul (borda/fundo/texto primary). */}
      <div className="mb-6 flex w-full flex-wrap items-center justify-center gap-2">
        {visibleNav.map((n) => (
          <button
            key={n.id}
            onClick={() => setView(n.id)}
            className={`flex min-w-[140px] items-center justify-center whitespace-nowrap rounded-lg border px-4 py-2 text-center text-sm font-medium transition-colors ${
              view === n.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-white text-ink-muted hover:text-ink'
            }`}
          >
            {n.label}
          </button>
        ))}
      </div>

      {/* Overview/Matrix/etc.: nem montados para quem não tem
          @Roles(ADMIN, RH, GESTOR) no backend — não só escondidos da
          lista de separadores acima. */}
      {view === 'overview' && visibleNav.some((n) => n.id === 'overview') && (
        <OverviewView />
      )}
      {view === 'catalog' && (
        <CatalogView onSelect={setDetailId} canManage={canManage} />
      )}
      {view === 'levels' && visibleNav.some((n) => n.id === 'levels') && (
        <LevelsView canManage={canManage} />
      )}
      {view === 'models' && visibleNav.some((n) => n.id === 'models') && (
        <ModelsView onSelect={setModelDetailId} />
      )}
      {view === 'my-profile' && <MyProfileView />}
      {view === 'matrix' && visibleNav.some((n) => n.id === 'matrix') && (
        <SkillMatrixView />
      )}
      {view === 'evaluations' &&
        visibleNav.some((n) => n.id === 'evaluations') && <EvaluationsView />}
      {view === 'gaps' && visibleNav.some((n) => n.id === 'gaps') && (
        <GapsView />
      )}
      {view === 'development' &&
        visibleNav.some((n) => n.id === 'development') && <DevelopmentView />}
      {view === 'reports' && visibleNav.some((n) => n.id === 'reports') && (
        <ReportsView />
      )}

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

      {modelDetailId !== null && (
        <ModelDetailModal
          modelId={modelDetailId}
          canManage={canManage}
          onEdit={() => {
            setModelForm({ modelId: modelDetailId });
            setModelDetailId(null);
          }}
          onClose={() => setModelDetailId(null)}
        />
      )}

      {modelForm !== null && (
        <ModelFormModal
          modelId={modelForm.modelId}
          onClose={() => setModelForm(null)}
          onSuccess={() =>
            notify({
              title: modelForm.modelId
                ? 'Modelo actualizado.'
                : 'Modelo criado.',
              intent: 'success',
            })
          }
        />
      )}
    </div>
  );
}