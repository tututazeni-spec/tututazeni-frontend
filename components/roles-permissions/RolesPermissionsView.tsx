'use client';
// components/roles-permissions/RolesPermissionsView.tsx
//
// Extraído de app/(platform)/roles-permissions/page.tsx para poder ser
// reutilizado como separador de app/(platform)/users/page.tsx — módulo
// "Utilizadores" único na sidebar, que integra Utilizadores + Colaboradores
// + Permissões por Cargos sem fundir dados. A rota standalone
// /roles-permissions continua a existir.

import { ShieldUser } from 'lucide-react';
import { TABS } from '@/components/roles-permissions/constants';
import { GovernanceTab } from '@/components/roles-permissions/GovernanceTab';
import { MatrixTab } from '@/components/roles-permissions/MatrixTab';
import { RolesTab } from '@/components/roles-permissions/RolesTab';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';

export function RolesPermissionsView() {
  return (
    <div className="min-h-screen bg-canvas">
      <Tabs defaultValue="roles">
        {/* Cartão "Funções e Permissões": cabeçalho azul-marinho + separadores */}
        <div className="mx-auto max-w-7xl px-6 pt-6">
          <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
            <div className="relative flex items-center gap-5 overflow-hidden bg-brand-ink px-8 py-6">
              <div
                aria-hidden
                className="pointer-events-none absolute -right-6 -top-10 h-40 w-24 skew-x-[-24deg] bg-primary/40"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute right-24 -top-10 h-40 w-16 skew-x-[-24deg] bg-primary/25"
              />
              <ShieldUser
                size={44}
                strokeWidth={1.5}
                className="relative shrink-0 text-white"
              />
              <span aria-hidden className="relative h-10 w-px bg-white/30" />
              <h1 className="relative font-display text-2xl font-bold text-white">
                Funções e Permissões
              </h1>
            </div>

            <TabsList className="mx-auto grid grid-cols-3 gap-0 border-b-0 bg-surface px-2 py-2">
              {TABS.map((t) => {
                const Icon = t.icon;
                return (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    className="group flex items-center justify-center gap-2.5 rounded-2xl border-b-[3px] px-4 py-3 text-base text-ink-muted transition-colors hover:bg-brand-soft data-[state=active]:border-primary data-[state=active]:bg-surface data-[state=active]:text-primary data-[state=active]:shadow-[0_4px_16px_rgba(21,47,89,0.14)]"
                  >
                    <Icon size={20} strokeWidth={1.75} />
                    {t.label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-6">
          <TabsContent value="roles">
            <RolesTab />
          </TabsContent>
          <TabsContent value="matrix">
            <MatrixTab />
          </TabsContent>
          <TabsContent value="governance">
            <GovernanceTab />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
