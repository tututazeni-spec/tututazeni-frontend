'use client';

// ─── app/(dashboard)/competency-map/page.tsx ─────────────────────────────────
// INNOVA — Mapa de Competências
//
// Container: gere separador/estado do modal e as 3 queries de dados
// (mapa/radar/catálogo); delega apresentação aos componentes em
// components/competency-map/. Ver memory
// project_innova_component_separation_audit.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  RefreshCcw,
  Star,
  Target,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { READINESS_CONFIG } from '@/components/competency-map/constants';
import { SelfAssessModal } from '@/components/competency-map/SelfAssessModal';
import { MySkillsTab } from '@/components/competency-map/MySkillsTab';
import { GapTab } from '@/components/competency-map/GapTab';
import { TeamTab } from '@/components/competency-map/TeamTab';
import { CatalogueTab } from '@/components/competency-map/CatalogueTab';
import type {
  CatalogueSkill,
  CompetencyMap,
  RadarData,
} from '@/components/competency-map/types';

type TabKey = 'my' | 'gap' | 'team' | 'catalogue';

export default function CompetencyMapPage() {
  const [tab, setTab] = useState<TabKey>('my');
  const [showAssess, setShowAssess] = useState(false);

  const skillsParams = { limit: 100 };
  const mapQuery = useApiQuery<CompetencyMap>(
    queryKeys.competencyMap.my(),
    '/competency-map/my',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const radarQuery = useApiQuery<RadarData>(
    queryKeys.competencyMap.myRadar(),
    '/competency-map/my/radar',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const skillsQuery = useApiQuery<{ data: CatalogueSkill[] }>(
    queryKeys.competencyMap.skills(skillsParams),
    '/competency-map/skills',
    { params: skillsParams, staleTime: STALE_TIME.STATIC },
  );

  const myMap = mapQuery.data ?? null;
  const radar = radarQuery.data ?? null;
  const allSkills = skillsQuery.data?.data ?? [];
  const loading =
    mapQuery.isLoading || radarQuery.isLoading || skillsQuery.isLoading;

  const load = () => {
    mapQuery.refetch();
    radarQuery.refetch();
    skillsQuery.refetch();
  };

  const gap = myMap?.gapAnalysis;
  const rcfg = gap ? READINESS_CONFIG[gap.readinessLevel] : null;

  const tabs: Array<{
    key: TabKey;
    label: string;
    icon: LucideIcon;
    badge?: number;
  }> = [
    { key: 'my', label: 'Minhas Habilidades', icon: Target },
    {
      key: 'gap',
      label: 'Análise de Lacunas',
      icon: AlertCircle,
      badge: gap?.gaps.mandatory.length,
    },
    { key: 'team', label: 'Equipa', icon: Users },
    { key: 'catalogue', label: 'Catálogo', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="bg-surface border-b border-border px-6 py-5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="font-display text-xl font-bold text-ink">
              Mapa de Competências
            </h1>
            <p className="font-body text-sm text-ink-faint"></p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => setShowAssess(true)}>
              <Star size={14} strokeWidth={1.75} /> Autoavaliar
            </Button>
            <Button
              intent="secondary"
              size="sm"
              onClick={load}
              aria-label="Actualizar"
            >
              <RefreshCcw
                size={14}
                strokeWidth={1.75}
                className={loading ? 'animate-spin' : ''}
              />
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="mb-5 w-fit gap-0">
            {tabs.map((t, i) => (
              <TabsTrigger
                key={t.key}
                value={t.key}
                className={
                  i < tabs.length - 1
                    ? 'gap-2 whitespace-nowrap mr-[1cm]!'
                    : 'gap-2 whitespace-nowrap'
                }
              >
                <t.icon size={16} strokeWidth={1.75} />
                {t.label}
                {t.badge != null && t.badge > 0 && (
                  <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold bg-danger text-canvas">
                    {t.badge}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="my">
            <MySkillsTab
              loading={loading}
              myMap={myMap}
              radar={radar}
              gap={gap}
              rcfg={rcfg}
              onAssess={() => setShowAssess(true)}
            />
          </TabsContent>

          <TabsContent value="gap">
            {gap && <GapTab gap={gap} rcfg={rcfg} />}
          </TabsContent>

          <TabsContent value="team">
            <TeamTab />
          </TabsContent>

          <TabsContent value="catalogue">
            <CatalogueTab allSkills={allSkills} />
          </TabsContent>
        </Tabs>
      </div>

      {showAssess && (
        <SelfAssessModal
          skills={allSkills.map((s) => ({
            id: s.id,
            name: s.name,
            type: s.type,
            maxLevel: s.maxLevel,
          }))}
          onClose={() => setShowAssess(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}
