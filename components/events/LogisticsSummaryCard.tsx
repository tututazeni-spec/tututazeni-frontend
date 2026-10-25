// components/events/LogisticsSummaryCard.tsx
//
// Resumo (só leitura) dos equipamentos e recursos guardados na aba "Locais &
// Logística", mostrado no detalhe do evento. O GET /events/:id/logistics é
// restrito a ADMIN/RH/GESTOR — para os restantes papéis o cartão não é pedido
// nem renderizado. Sem registo de logística, também não aparece.

import { Boxes, ClipboardList } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useHasRole } from '@/hooks/useCurrentRole';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ADMIN_RH_GESTOR_ROLES, Role } from '@/lib/roles';
import { Card, CardBody } from '@/components/ui/Card';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EQUIPMENT_CFG, LOGISTICS_STATUS_CFG } from './constants';
import type { EventLogistics } from './types';
import { EmptyState } from '@/components/ui/EmptyState';

const VIEW_ROLES: readonly Role[] = ADMIN_RH_GESTOR_ROLES;

function Pill({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-[#EEF4FD] px-2.5 py-1 font-body text-xs font-medium text-brand">
      {children}
    </span>
  );
}

export function LogisticsSummaryCard({ eventId }: { eventId: number }) {
  const allowed = useHasRole(VIEW_ROLES);

  const { data: logistics } = useApiQuery<EventLogistics | null>(
    queryKeys.events.logistics(eventId),
    `/events/${eventId}/logistics`,
    { enabled: allowed, staleTime: STALE_TIME.DYNAMIC },
  );

  if (!allowed || !logistics) return null;

  const equipment = [
    ...logistics.equipment.map((e) => EQUIPMENT_CFG[e]?.label ?? e),
    ...(logistics.customEquipment ?? []),
  ];
  const resources = (logistics.resourcesNeeded ?? '')
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean);

  return (
    <Card className="mt-4 rounded-[24px] border-brand-line bg-white shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
      <CardBody>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="font-body text-base font-semibold text-brand">
            Equipamentos e recursos
          </div>
          <StatusBadge
            value={logistics.status}
            map={LOGISTICS_STATUS_CFG}
            variant="dot"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center gap-1.5 font-body text-xs font-semibold text-brand-muted">
              <Boxes size={14} strokeWidth={1.75} />
              Equipamentos ({equipment.length})
            </div>
            {equipment.length === 0 ? (
              <EmptyState
                variant="inline"
                title="Nenhum equipamento guardado"
              />
            ) : (
              <div className="flex flex-wrap gap-2">
                {equipment.map((e) => (
                  <Pill key={e}>{e}</Pill>
                ))}
              </div>
            )}
          </div>
          <div>
            <div className="mb-2 flex items-center gap-1.5 font-body text-xs font-semibold text-brand-muted">
              <ClipboardList size={14} strokeWidth={1.75} />
              Recursos necessários ({resources.length})
            </div>
            {resources.length === 0 ? (
              <EmptyState variant="inline" title="Nenhum recurso guardado" />
            ) : (
              <div className="flex flex-wrap gap-2">
                {resources.map((r) => (
                  <Pill key={r}>{r}</Pill>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
