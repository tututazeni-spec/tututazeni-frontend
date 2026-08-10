'use client';
// src/app/(dashboard)/leader/page.tsx

import { useState } from 'react';
import { RefreshCw, Users } from 'lucide-react';
import { DashboardTab } from '@/components/leader/DashboardTab';
import { PerformanceTab } from '@/components/leader/PerformanceTab';
import { PlansTab } from '@/components/leader/PlansTab';
import { TABS } from '@/components/leader/constants';
import { TalentPipelineTab } from '@/components/leader/TalentPipelineTab';
import { TeamTab } from '@/components/leader/TeamTab';
import type { Tab } from '@/components/leader/types';

const PANELS: Record<Tab, JSX.Element> = {
  dashboard: <DashboardTab />,
  team: <TeamTab />,
  performance: <PerformanceTab />,
  pipeline: <TalentPipelineTab />,
  plans: <PlansTab />,
};

export default function LeaderPage() {
  const [tab, setTab] = useState<Tab>('dashboard');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-teal-100 rounded-lg">
                <Users size={18} className="text-teal-700" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Leader Hub</h1>
            </div>
            <p className="text-sm text-slate-400">
              Gestão de equipa · Performance · PDIs · Talent Pipeline ·
              Recomendações IA
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

      <div className="bg-white border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto flex overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                  tab === t.id
                    ? 'border-teal-600 text-teal-700'
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

      <div className="max-w-7xl mx-auto px-6 py-6">{PANELS[tab]}</div>
    </div>
  );
}
