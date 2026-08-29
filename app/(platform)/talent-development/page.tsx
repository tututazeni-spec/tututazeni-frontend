'use client';
// src/app/(dashboard)/talent-development/page.tsx
//
// Container: gere o separador activo (via Tabs do Radix); delega dados+
// apresentação de cada separador aos componentes auto-contidos em
// components/talent-development/ (mesmo padrão que components/payslips/
// page.tsx usa para ListView/CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit.

import {
  AlertTriangle,
  BarChart3,
  ClipboardList,
  Filter,
  GraduationCap,
  Plus,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnalyticsTab } from '@/components/talent-development/AnalyticsTab';
import { MentoringTab } from '@/components/talent-development/MentoringTab';
import { PlansTab } from '@/components/talent-development/PlansTab';
import { PoolTab } from '@/components/talent-development/PoolTab';
import { SkillGapsTab } from '@/components/talent-development/SkillGapsTab';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

const TABS: ReadonlyArray<{ id: string; label: string; icon: LucideIcon }> = [
  { id: 'pool', label: 'Banco de Talentos', icon: Users },
  {
    id: 'plans',
    label: 'Planos de Desenvolvimento (PDI)',
    icon: ClipboardList,
  },
  { id: 'skill-gaps', label: 'Lacunas de Competências', icon: AlertTriangle },
  { id: 'mentoring', label: 'Mentoria', icon: GraduationCap },
  { id: 'analytics', label: 'Análises', icon: BarChart3 },
];

export default function TalentDevelopmentPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h1 className="font-display text-xl font-bold text-ink">
                Desenvolvimento de Talentos
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button intent="secondary" size="sm">
              <Filter size={14} strokeWidth={1.75} />
              Filtros
            </Button>
            <Button size="sm">
              <Plus size={14} strokeWidth={1.75} />
              Novo PDI
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pool">
        <div className="border-b border-border bg-surface px-6">
          <TabsList className="mx-auto max-w-7xl overflow-x-auto gap-0">
            {TABS.map((t, i) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.id}
                  value={t.id}
                  className={
                    i < TABS.length - 1
                      ? 'gap-2 whitespace-nowrap mr-[1cm]!'
                      : 'gap-2 whitespace-nowrap'
                  }
                >
                  <Icon size={16} strokeWidth={1.75} />
                  {t.label}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>

        {/* Content */}
        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="pool">
            <PoolTab />
          </TabsContent>
          <TabsContent value="plans">
            <PlansTab />
          </TabsContent>
          <TabsContent value="skill-gaps">
            <SkillGapsTab />
          </TabsContent>
          <TabsContent value="mentoring">
            <MentoringTab />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
