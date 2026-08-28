'use client';
// app/(platform)/content-library/page.tsx
//
// Container: gere o separador activo (via Tabs do Radix); delega dados+
// apresentação de cada separador aos componentes auto-contidos em
// components/content-library/ (mesmo padrão que components/payslips/page.tsx
// usa para ListView/CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit.

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
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

const TABS: { id: Tab; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Início', icon: BookOpen },
  { id: 'catalogue', label: 'Catálogo', icon: Search },
  { id: 'paths', label: 'Trilhas', icon: Layers },
  { id: 'my-progress', label: 'O Meu Percurso', icon: TrendingUp },
  { id: 'analytics', label: 'Análises', icon: BarChart2 },
];

export default function ContentLibraryPage() {
  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="border-b border-border bg-surface px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <h1 className="font-display text-xl font-bold text-ink">
                Biblioteca
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm">
              <Plus size={14} strokeWidth={1.75} />
              Adicionar Conteúdo
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="home">
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

        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="home">
            <HomeTab />
          </TabsContent>
          <TabsContent value="catalogue">
            <CatalogueTab />
          </TabsContent>
          <TabsContent value="paths">
            <PathsTab />
          </TabsContent>
          <TabsContent value="my-progress">
            <MyProgressTab />
          </TabsContent>
          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
