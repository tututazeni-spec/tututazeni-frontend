'use client';
// src/app/(dashboard)/roi-impact/page.tsx

import { useState } from 'react';
import {
  BarChart2,
  BookOpen,
  Brain,
  DollarSign,
  Star,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ExecutiveTab } from '@/components/roi-impact/ExecutiveTab';
import { LearningTab } from '@/components/roi-impact/LearningTab';
import { PerformanceTab } from '@/components/roi-impact/PerformanceTab';
import { ProgramsTab } from '@/components/roi-impact/ProgramsTab';
import { RetentionTab } from '@/components/roi-impact/RetentionTab';
import { SimulatorTab } from '@/components/roi-impact/SimulatorTab';
import type { Tab } from '@/components/roi-impact/types';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'executive', label: 'Executivo', icon: DollarSign },
  { id: 'learning', label: 'Aprendizagem', icon: BookOpen },
  { id: 'retention', label: 'Retenção', icon: Users },
  { id: 'performance', label: 'Performance', icon: Star },
  { id: 'simulator', label: 'Simulador', icon: Brain },
  { id: 'programs', label: 'Programas', icon: BarChart2 },
];

const PANELS: Record<Tab, JSX.Element> = {
  executive: <ExecutiveTab />,
  learning: <LearningTab />,
  retention: <RetentionTab />,
  performance: <PerformanceTab />,
  simulator: <SimulatorTab />,
  programs: <ProgramsTab />,
};

export default function RoiImpactPage() {
  const [tab, setTab] = useState<Tab>('executive');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <DollarSign size={18} className="text-emerald-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">ROI & Impact</h1>
            </div>
            <p className="text-sm text-slate-400">
              Impacto financeiro · Kirkpatrick L1-L5 · Simulações · Programas
            </p>
          </div>
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
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === t.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <Icon size={15} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">{PANELS[tab]}</div>
    </div>
  );
}
