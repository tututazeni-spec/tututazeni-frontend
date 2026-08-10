'use client';
// src/app/(dashboard)/automation/page.tsx

import { useState } from 'react';
import { Zap, Activity, BookOpen, BarChart2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ExecutionsTab } from '@/components/automation/ExecutionsTab';
import { RulesTab } from '@/components/automation/RulesTab';
import { StatsTab } from '@/components/automation/StatsTab';
import { TemplatesTab } from '@/components/automation/TemplatesTab';
import type { Tab } from '@/components/automation/types';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'rules', label: 'Automações', icon: Zap },
  { id: 'executions', label: 'Execuções', icon: Activity },
  { id: 'templates', label: 'Templates', icon: BookOpen },
  { id: 'stats', label: 'Analytics', icon: BarChart2 },
];

const PANELS: Record<Tab, JSX.Element> = {
  rules: <RulesTab />,
  executions: <ExecutionsTab />,
  templates: <TemplatesTab />,
  stats: <StatsTab />,
};

export default function AutomationPage() {
  const [tab, setTab] = useState<Tab>('rules');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-amber-100 rounded-lg">
              <Zap size={18} className="text-amber-600" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Automation</h1>
          </div>
          <p className="text-sm text-slate-400">
            Regras · Triggers · Execuções · Templates · Analytics
          </p>
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
                    ? 'border-amber-600 text-amber-700'
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
