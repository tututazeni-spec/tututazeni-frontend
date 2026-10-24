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
import { useCurrentRole, useHasRole } from '@/hooks/useCurrentRole';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent } from '@/components/ui/Tabs';
import { PillTabsList, type PillTabItem } from '@/components/ui/PillTabs';
import { BANNER_TABS_CLASS, ModuleBanner } from '@/components/ui/ModuleBanner';
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
  const canAddContent = useHasRole(AUTHOR_ROLES);
  const tabs = TABS.filter(
    (t) => t.id !== 'analytics' || role !== 'COLABORADOR',
  );
  const [showAdd, setShowAdd] = useState(false);

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto max-w-7xl px-6 pt-6">
        <ModuleBanner
          src="/images/biblioteca.jpg"
          title="Biblioteca"
          position="center 40%"
          action={
            canAddContent && (
              <Button size="sm" onClick={() => setShowAdd(true)}>
                <Plus size={14} strokeWidth={1.75} />
                Adicionar Conteúdo
              </Button>
            )
          }
        />
      </div>

      {showAdd && <AddContentModal onClose={() => setShowAdd(false)} />}

      {/* Tabs — barra glassmorphism partilhada (components/ui/PillTabs). */}
      <Tabs defaultValue="home">
        <div className={`mx-auto max-w-7xl ${BANNER_TABS_CLASS}`}>
          <PillTabsList items={tabs} />
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
