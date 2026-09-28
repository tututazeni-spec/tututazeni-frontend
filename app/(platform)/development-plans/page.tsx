// src/app/(dashboard)/development-plans/page.tsx
'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { CreatePlanWizard } from '@/components/development-plans/CreatePlanWizard';
import { NAV, TITLES } from '@/components/development-plans/constants';
import { DetailView } from '@/components/development-plans/DetailView';
import { MyPlansView } from '@/components/development-plans/MyPlansView';
import { TeamView } from '@/components/development-plans/TeamView';
import type { Nav } from '@/components/development-plans/types';
import { NineBoxTab } from '@/components/development-plans/NineBoxTab';
import { AnalyticsTab } from '@/components/talent-development/AnalyticsTab';
import { MentoringTab } from '@/components/talent-development/MentoringTab';
import { PoolTab } from '@/components/talent-development/PoolTab';
import { SkillGapsTab } from '@/components/talent-development/SkillGapsTab';
import { Button } from '@/components/ui/Button';

// Espelha @Roles(ADMIN, RH, GESTOR) em POST /development-plans
// (development-plans.controller.ts) — quem cria um PDI para um colaborador.
const CAN_CREATE_PLAN_ROLES = ['ADMIN', 'RH', 'GESTOR'];

export default function DevelopmentPlansPage() {
  const role = useCurrentRole();
  const [nav, setNav] = useState<Nav>({ view: 'my-plans' });
  const [showWizard, setShowWizard] = useState(false);
  const canCreate = role != null && CAN_CREATE_PLAN_ROLES.includes(role);

  const handleSelect = (id: number) =>
    setNav({ view: 'detail', selectedId: id });
  const handleBack = () => setNav({ view: 'my-plans' });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="mb-1 font-display text-xl font-semibold text-ink">
            {TITLES[nav.view]}
          </h1>
          <p className="mt-0.5 font-body text-sm text-ink-faint"></p>
        </div>
        {nav.view !== 'detail' && canCreate && (
          <Button size="sm" onClick={() => setShowWizard(true)}>
            <Plus size={14} strokeWidth={1.75} />
            Novo PDI
          </Button>
        )}
      </div>

      {/* Tabs — formato de "cartão": cada botão é um cartão independente
          (borda + fundo branco + rounded), sem o fundo/pill de grupo
          anterior. Alinhadas horizontal e verticalmente (justify-center +
          items-center no wrapper) com largura mínima uniforme. Estado
          activo usa a mesma condição `nav.view === n.id` de sempre para
          aplicar destaque azul (borda/fundo/texto primary). */}
      {nav.view !== 'detail' && (
        <div className="mb-6 flex w-full flex-wrap items-center justify-center gap-2">
          {NAV.map((n) => (
            <button
              key={n.id}
              onClick={() => setNav({ view: n.id })}
              className={`flex min-w-[140px] items-center justify-center whitespace-nowrap rounded-lg border px-4 py-2 text-center text-sm font-medium transition-colors ${
                nav.view === n.id
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-white text-ink-muted hover:text-ink'
              }`}
            >
              {n.label}
            </button>
          ))}
        </div>
      )}

      {nav.view === 'my-plans' && <MyPlansView onSelect={handleSelect} />}
      {nav.view === 'detail' && (
        <DetailView planId={nav.selectedId} onBack={handleBack} />
      )}
      {nav.view === 'team' && <TeamView onSelect={handleSelect} />}
      {nav.view === 'pool' && <PoolTab />}
      {nav.view === 'skill-gaps' && <SkillGapsTab />}
      {nav.view === 'mentoring' && <MentoringTab />}
      {nav.view === 'analytics' && <AnalyticsTab />}
      {nav.view === 'ninebox' && <NineBoxTab />}

      {showWizard && (
        <CreatePlanWizard
          onClose={() => setShowWizard(false)}
          onSuccess={(planId) => setNav({ view: 'detail', selectedId: planId })}
        />
      )}
    </div>
  );
}