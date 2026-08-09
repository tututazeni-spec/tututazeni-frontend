'use client';
// src/app/(dashboard)/evaluations/page.tsx
//
// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/evaluation/ (mesmo
// padrão que components/payslips/page.tsx usa para ListView/CompareView/
// AnnualView). Ver memory project_innova_component_separation_audit.

import { useState } from 'react';
import {
  BarChart2,
  Clock,
  Layers,
  Plus,
  Shield,
  Star,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnalyticsTab } from '@/components/evaluation/AnalyticsTab';
import { CalibrationTab } from '@/components/evaluation/CalibrationTab';
import { CyclesTab } from '@/components/evaluation/CyclesTab';
import { OverviewTab } from '@/components/evaluation/OverviewTab';
import { PendingTab } from '@/components/evaluation/PendingTab';
import { ResultsTab } from '@/components/evaluation/ResultsTab';
import type { Tab } from '@/components/evaluation/types';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Visão Geral', icon: Star },
  { id: 'cycles', label: 'Ciclos', icon: Layers },
  { id: 'pending', label: 'Pendentes', icon: Clock },
  { id: 'results', label: 'Resultados', icon: BarChart2 },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'calibration', label: 'Calibração', icon: Shield },
];

export default function EvaluationsPage() {
  const [tab, setTab] = useState<Tab>('overview');

  const TAB_COMPONENTS: Record<Tab, JSX.Element> = {
    overview: <OverviewTab />,
    cycles: <CyclesTab />,
    pending: <PendingTab />,
    results: <ResultsTab />,
    analytics: <AnalyticsTab />,
    calibration: <CalibrationTab />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Star size={18} className="text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">
                Avaliação 360°
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Ciclos · Formulários · Resultados · Calibração · Analytics
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
            <Plus size={14} />
            Novo Ciclo
          </button>
        </div>
      </div>

      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
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

      <div className="max-w-7xl mx-auto px-6 py-6">{TAB_COMPONENTS[tab]}</div>
    </div>
  );
}
