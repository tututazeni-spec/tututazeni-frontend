'use client';
// src/app/(dashboard)/engagement/page.tsx
//
// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/engagement/ (mesmo
// padrão que components/payslips/page.tsx usa para ListView/CompareView/
// AnnualView). Ver memory project_innova_component_separation_audit.

import { useState } from 'react';
import {
  Activity,
  Award,
  BarChart2,
  MessageSquare,
  Plus,
  RefreshCw,
  Smile,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnalyticsTab } from '@/components/engagement/AnalyticsTab';
import { FeedbackTab } from '@/components/engagement/FeedbackTab';
import { OverviewTab } from '@/components/engagement/OverviewTab';
import { RecognitionTab } from '@/components/engagement/RecognitionTab';
import { SurveysTab } from '@/components/engagement/SurveysTab';
import type { Tab } from '@/components/engagement/types';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'overview', label: 'Visão Geral', icon: Smile },
  { id: 'surveys', label: 'Surveys', icon: BarChart2 },
  { id: 'recognition', label: 'Reconhecimento', icon: Award },
  { id: 'feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'analytics', label: 'Analytics', icon: Activity },
];

export default function EngagementPage() {
  const [tab, setTab] = useState<Tab>('overview');

  const TAB_COMPONENTS: Record<Tab, JSX.Element> = {
    overview: <OverviewTab />,
    surveys: <SurveysTab />,
    recognition: <RecognitionTab />,
    feedback: <FeedbackTab />,
    analytics: <AnalyticsTab />,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-6 py-5">
        <div className="max-w-7xl mx-auto flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-1.5 bg-violet-100 rounded-lg">
                <Smile size={18} className="text-violet-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">Engagement</h1>
            </div>
            <p className="text-sm text-slate-400">
              Surveys · Reconhecimento · Feedback · Mood · Analytics
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-sm rounded-lg hover:border-violet-300 transition-colors">
              <RefreshCw size={14} />
              Actualizar
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white text-sm rounded-lg hover:bg-violet-700 transition-colors">
              <Plus size={14} />
              Novo Survey
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
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
                      ? 'border-violet-600 text-violet-600'
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
