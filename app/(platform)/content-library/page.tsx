'use client';
// app/(platform)/content-library/page.tsx
//
// Container: gere o separador activo (via Tabs do Radix); delega dados+
// apresentação de cada separador aos componentes auto-contidos em
// components/content-library/ (mesmo padrão que components/payslips/page.tsx
// usa para ListView/CompareView/AnnualView). Ver memory
// project_innova_component_separation_audit.

import { useState } from 'react';
import {
  Archive,
  BarChart2,
  BookOpen,
  Landmark,
  Plus,
  Search,
  TrendingUp,
} from 'lucide-react';
import { AddContentModal } from '@/components/content-library/AddContentModal';
import { AnalyticsTab } from '@/components/content-library/AnalyticsTab';
import { CatalogueTab } from '@/components/content-library/CatalogueTab';
import { CorporateDocsTab } from '@/components/content-library/CorporateDocsTab';
import { HomeTab } from '@/components/content-library/HomeTab';
import { MyProgressTab } from '@/components/content-library/MyProgressTab';
import { RepositoryTab } from '@/components/content-library/RepositoryTab';
import type { Tab } from '@/components/content-library/types';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { PillTabsList, type PillTabItem } from '@/components/ui/PillTabs';
import type { Role } from '@/lib/roles';

// Espelha AUTHOR_ROLES em src/content-library/content-library.controller.ts
// (@Roles no POST /content-library). Não usar ADMIN_ROLES de lib/roles.ts —
// esse não inclui INSTRUCTOR, que o backend autoriza a criar conteúdo.
const AUTHOR_ROLES: readonly Role[] = ['ADMIN', 'RH', 'INSTRUCTOR'];

const TABS: Array<PillTabItem & { id: Tab }> = [
  { id: 'home', label: 'Início', hint: 'Destaques', icon: BookOpen },
  {
    id: 'catalogue',
    label: 'Catálogo',
    hint: 'Pesquisar conteúdos',
    icon: Search,
  },
  {
    id: 'repository',
    label: 'Repositório',
    hint: 'Ficheiros e media',
    icon: Archive,
  },
  {
    id: 'corporate-docs',
    label: 'Documentos Corporativos',
    hint: 'Políticas e normas',
    icon: Landmark,
  },
  {
    id: 'my-progress',
    label: 'O Meu Percurso',
    hint: 'Progresso pessoal',
    icon: TrendingUp,
  },
  {
    id: 'analytics',
    label: 'Análises',
    hint: 'Uso e tendências',
    icon: BarChart2,
  },
];

export default function ContentLibraryPage() {
  const role = useCurrentRole();
  const canAddContent = !!role && AUTHOR_ROLES.includes(role);
  const tabs = TABS.filter(
    (t) => t.id !== 'analytics' || role !== 'COLABORADOR',
  );
  const [showAdd, setShowAdd] = useState(false);

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
          {canAddContent && (
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowAdd(true)}>
                <Plus size={14} strokeWidth={1.75} />
                Adicionar Conteúdo
              </Button>
            </div>
          )}
        </div>
      </div>

      {showAdd && <AddContentModal onClose={() => setShowAdd(false)} />}

      {/* Tabs — barra glassmorphism partilhada (components/ui/PillTabs). */}
      <Tabs defaultValue="home">
        <div className="bg-surface px-6 py-5">
          <PillTabsList items={tabs} className="mx-auto max-w-7xl" />
        </div>

        <div className="mx-auto max-w-7xl px-6 py-6">
          <TabsContent value="home">
            <HomeTab />
          </TabsContent>
          <TabsContent value="catalogue">
            <CatalogueTab />
          </TabsContent>
          <TabsContent value="repository">
            <RepositoryTab />
          </TabsContent>
          <TabsContent value="corporate-docs">
            <CorporateDocsTab />
          </TabsContent>
          <TabsContent value="my-progress">
            <MyProgressTab />
          </TabsContent>
          {role !== 'COLABORADOR' && (
            <TabsContent value="analytics">
              <AnalyticsTab />
            </TabsContent>
          )}
        </div>
      </Tabs>
    </div>
  );
}
