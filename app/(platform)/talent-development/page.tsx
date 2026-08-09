'use client';
// src/app/(dashboard)/talent-development/page.tsx
//
// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/talent-development/
// (mesmo padrão que components/payslips/page.tsx usa para ListView/
// CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import {
  BarChart2,
  Brain,
  Filter,
  Plus,
  Target,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnalyticsTab } from '@/components/talent-development/AnalyticsTab';
import { MentoringTab } from '@/components/talent-development/MentoringTab';
import { PlansTab } from '@/components/talent-development/PlansTab';
import { PoolTab } from '@/components/talent-development/PoolTab';
import { SkillGapsTab } from '@/components/talent-development/SkillGapsTab';
import type { Tab } from '@/components/talent-development/types';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'pool', label: 'Pool de Talento', icon: Users },
  { id: 'plans', label: 'Planos (PDI)', icon: Target },
  { id: 'skill-gaps', label: 'Skill Gaps', icon: Brain },
  { id: 'mentoring', label: 'Mentoria', icon: UserCheck },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

export default function TalentDevelopmentPage() {
  const [tab, setTab] = useState<Tab>('pool');

  const TAB_COMPONENTS: Record<Tab, JSX.Element> = {
    pool: <PoolTab />,
    plans: <PlansTab />,
    'skill-gaps': <SkillGapsTab />,
    mentoring: <MentoringTab />,
    analytics: <AnalyticsTab />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <TrendingUp size={18} className="text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">
                Talent Development
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Pool de talento · PDI · Skill Gaps · Mentoria · Analytics
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg hover:border-indigo-300 transition-colors">
              <Filter size={14} />
              Filtros
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus size={14} />
              Novo PDI
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex gap-0 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap
                  border-b-2 transition-colors ${
                    tab === t.id
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">{TAB_COMPONENTS[tab]}</div>
    </div>
  );
}
