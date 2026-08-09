'use client';
// src/app/(dashboard)/content-library/page.tsx
//
// Container: gere o separador activo; delega dados+apresentação de cada
// separador aos componentes auto-contidos em components/content-library/
// (mesmo padrão que components/payslips/page.tsx usa para ListView/
// CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import {
  BarChart2,
  BookOpen,
  Layers,
  Plus,
  Search,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { AnalyticsTab } from '@/components/content-library/AnalyticsTab';
import { CatalogueTab } from '@/components/content-library/CatalogueTab';
import { HomeTab } from '@/components/content-library/HomeTab';
import { MyProgressTab } from '@/components/content-library/MyProgressTab';
import { PathsTab } from '@/components/content-library/PathsTab';
import type { Tab } from '@/components/content-library/types';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Início', icon: BookOpen },
  { id: 'catalogue', label: 'Catálogo', icon: Search },
  { id: 'paths', label: 'Trilhas', icon: Layers },
  { id: 'my-progress', label: 'O Meu Percurso', icon: TrendingUp },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
];

export default function ContentLibraryPage() {
  const [tab, setTab] = useState<Tab>('home');

  const TAB_COMPONENTS: Record<Tab, JSX.Element> = {
    home: <HomeTab />,
    catalogue: <CatalogueTab />,
    paths: <PathsTab />,
    'my-progress': <MyProgressTab />,
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
                <BookOpen size={18} className="text-indigo-600" />
              </div>
              <h1 className="text-xl font-bold text-slate-800">
                Content Library
              </h1>
            </div>
            <p className="text-sm text-slate-400">
              Cursos · Vídeos · Artigos · Podcasts · Learning Paths
            </p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors">
              <Plus size={14} />
              Adicionar Conteúdo
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
