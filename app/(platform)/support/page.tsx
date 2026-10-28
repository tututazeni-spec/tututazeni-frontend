'use client';
// Ajuda e Suporte: perguntas frequentes, pedidos com tempo de resposta, novidades e (ADMIN/RH) fila.

import { LifeBuoy } from 'lucide-react';
import { useHasRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES } from '@/lib/roles';
import { PageHeader } from '@/components/ui/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { HelpView } from '@/components/support/HelpView';
import { NovidadesView } from '@/components/support/NovidadesView';
import {
  MyTicketsView,
  SupportQueueView,
} from '@/components/support/TicketsView';

export default function SupportPage() {
  const isStaff = useHasRole(ADMIN_ROLES);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader
        icon={LifeBuoy}
        title="Ajuda e Suporte"
        description="Encontre respostas, fale com a equipa e saiba o que há de novo."
      />
      <Tabs defaultValue="help">
        <TabsList className="flex-wrap">
          <TabsTrigger value="help">Ajuda</TabsTrigger>
          <TabsTrigger value="tickets">Os meus pedidos</TabsTrigger>
          {isStaff && <TabsTrigger value="queue">Fila de suporte</TabsTrigger>}
          <TabsTrigger value="news">Novidades</TabsTrigger>
        </TabsList>
        <div className="pt-6">
          <TabsContent value="help">
            <HelpView />
          </TabsContent>
          <TabsContent value="tickets">
            <MyTicketsView />
          </TabsContent>
          {isStaff && (
            <TabsContent value="queue">
              <SupportQueueView />
            </TabsContent>
          )}
          <TabsContent value="news">
            <NovidadesView />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
