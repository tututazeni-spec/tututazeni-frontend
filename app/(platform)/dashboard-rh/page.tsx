'use client';
// src/app/(dashboard)/dashboard-rh/page.tsx
//
// Container: gere o painel activo; delega dados+apresentação de cada
// painel aos componentes auto-contidos em components/dashboard-rh/ (mesmo
// padrão que components/payslips/page.tsx usa para ListView/CompareView/
// AnnualView). Ver memory project_innova_component_separation_audit.

import { useState } from 'react';
import {
  BarChart2,
  Brain,
  BookOpen,
  RefreshCw,
  Star,
  Target,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { CorrelationsPanel } from '@/components/dashboard-rh/CorrelationsPanel';
import { HeadcountPanel } from '@/components/dashboard-rh/HeadcountPanel';
import { OverviewPanel } from '@/components/dashboard-rh/OverviewPanel';
import { PerformancePanel } from '@/components/dashboard-rh/PerformancePanel';
import { TalentPanel } from '@/components/dashboard-rh/TalentPanel';
import { TrainingPanel } from '@/components/dashboard-rh/TrainingPanel';
import type { Panel } from '@/components/dashboard-rh/types';

const PANELS: { id: Panel; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Visão Geral', icon: BarChart2 },
  { id: 'headcount', label: 'Headcount', icon: Users },
  { id: 'performance', label: 'Performance', icon: Star },
  { id: 'training', label: 'Formação', icon: BookOpen },
  { id: 'talent', label: 'Talento', icon: Target },
  { id: 'correlations', label: 'People Analytics', icon: Brain },
];

export default function DashboardRhPage() {
  const [panel, setPanel] = useState<Panel>('overview');

  // 'turnover' e 'engagement' não têm entrada em PANELS (sem separador
  // próprio no menu) mas continuam mapeados para OverviewPanel — mesmo
  // comportamento do ficheiro original, preservado tal e qual.
  const PANEL_CONTENT: Record<Panel, JSX.Element> = {
    overview: <OverviewPanel />,
    headcount: <HeadcountPanel />,
    turnover: <OverviewPanel />,
    performance: <PerformancePanel />,
    training: <TrainingPanel />,
    engagement: <OverviewPanel />,
    talent: <TalentPanel />,
    correlations: <CorrelationsPanel />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Users size={18} className="text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Dashboard RH</h1>
              <span className="text-xs bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-medium">
                People Analytics
              </span>
            </div>
            <p className="text-sm text-slate-400">
              Centro de comando · Headcount · Performance · Talento · Formação
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-2 bg-white border border-slate-200 rounded-lg hover:border-slate-300"
          >
            <RefreshCw size={15} className="text-slate-500" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {PANELS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => setPanel(p.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  panel === p.id
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
                }`}
              >
                <Icon size={15} />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">{PANEL_CONTENT[panel]}</div>
    </div>
  );
}
