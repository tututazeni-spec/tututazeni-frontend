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
    { key: 'my', label: 'Minhas Skills', icon: Target },
    {
      key: 'gap',
      label: 'Gap Analysis',
      icon: AlertCircle,
      badge: gap?.gaps.mandatory.length,
    },
    { key: 'team', label: 'Equipa', icon: Users },
    { key: 'catalogue', label: 'Catálogo', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Mapa de Competências
            </h1>
            <p className="text-sm text-gray-500">
              Skills, gaps e desenvolvimento profissional
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAssess(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Star size={15} /> Autoavaliar
            </button>
            <button
              onClick={load}
              aria-label="Actualizar"
              className="p-2 text-gray-500 border border-gray-200 bg-white rounded-xl hover:bg-gray-50"
            >
              <RefreshCcw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-5">
        {/* Tabs */}
        <div className="flex bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 gap-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-medium transition-colors relative ${tab === t.key ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
            >
              <t.icon size={15} />
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span
                  className={`w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold ${tab === t.key ? 'bg-white text-blue-600' : 'bg-red-500 text-white'}`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'my' && (
          <MySkillsTab
            loading={loading}
            myMap={myMap}
            radar={radar}
            gap={gap}
            rcfg={rcfg}
            onAssess={() => setShowAssess(true)}
          />
        )}

        {tab === 'gap' && gap && <GapTab gap={gap} rcfg={rcfg} />}

        {tab === 'team' && <TeamTab />}

        {tab === 'catalogue' && <CatalogueTab allSkills={allSkills} />}
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
