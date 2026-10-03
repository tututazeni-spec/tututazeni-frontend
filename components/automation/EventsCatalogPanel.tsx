// components/automation/EventsCatalogPanel.tsx
// Integração por eventos (docs/modulo_automation.md §5): catálogo de eventos
// por módulo — o que já pode ser gatilho vs. o que o spec propõe mas nenhum
// módulo emite ainda — e o registo dos eventos recebidos (identificador,
// correlação, regras accionadas).

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { Workflow } from 'lucide-react';
import type { AutomationEventRow, EventCatalog, Paginated } from './types';

const STATUS_INTENT = {
  PROCESSED: 'success',
  NO_RULES: 'neutral',
  REJECTED: 'danger',
} as const;
const STATUS_LABEL: Record<string, string> = {
  PROCESSED: 'Processado',
  NO_RULES: 'Sem regras',
  REJECTED: 'Rejeitado',
};

export function EventsCatalogPanel() {
  const { data: catalog, isLoading } = useApiQuery<EventCatalog>(
    queryKeys.automation.eventCatalog(),
    '/automation/events/catalog',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const eventsParams = { limit: 10 };
  const { data: recent } = useApiQuery<Paginated<AutomationEventRow>>(
    queryKeys.automation.events(eventsParams),
    '/automation/events',
    { params: eventsParams, staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <Skeleton rows={3} />;
  if (!catalog) return null;

  const s = catalog.summary;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-display text-base font-semibold text-ink">
          Eventos por módulo
        </h3>
        <p className="font-body text-sm text-ink-muted">
          Cada módulo publica acontecimentos e a automação decide se há regras a
          executar. Só os eventos <strong>disponíveis</strong> podem ser
          gatilho; os <strong>propostos</strong> são a especificação e têm de
          ser emitidos no backend do respectivo módulo.
        </p>
        <p className="mt-1 font-data text-xs text-ink-faint">
          {s.modules} módulos · {s.implemented} disponíveis · {s.proposed}{' '}
          propostos · {s.listened} com regras activas
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {catalog.modules.map((m) => (
          <Card key={m.module}>
            <CardBody>
              <h4 className="mb-2 font-display text-sm font-semibold text-ink">
                {m.label}
              </h4>
              <ul className="flex flex-col gap-1">
                {m.events.map((e) => (
                  <li
                    key={e.key}
                    className="flex flex-wrap items-center gap-2 text-sm"
                  >
                    <span className={e.implemented ? '' : 'text-ink-faint'}>
                      {e.label}
                    </span>
                    <Badge
                      intent={e.implemented ? 'success' : 'neutral'}
                      dot={false}
                    >
                      {e.implemented ? 'Disponível' : 'Proposto'}
                    </Badge>
                    {e.activeRules > 0 && (
                      <span className="font-data text-[10px] text-ink-muted">
                        {e.activeRules} regra{e.activeRules > 1 ? 's' : ''}
                      </span>
                    )}
                    {e.events30d > 0 && (
                      <span className="font-data text-[10px] text-ink-muted">
                        {e.events30d} eventos/30d
                      </span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="mt-2 font-body text-xs text-ink-faint">
                Acções: {m.actions.join(' · ')}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <div>
        <h3 className="mb-2 font-display text-base font-semibold text-ink">
          Eventos recebidos recentemente
        </h3>
        {recent?.data?.length ? (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-sunken text-xs uppercase text-ink-faint">
                <tr>
                  <th className="px-3 py-2">Quando</th>
                  <th className="px-3 py-2">Módulo</th>
                  <th className="px-3 py-2">Evento</th>
                  <th className="px-3 py-2">Registo</th>
                  <th className="px-3 py-2">Regras</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Correlação</th>
                </tr>
              </thead>
              <tbody>
                {recent.data.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="whitespace-nowrap px-3 py-2 text-xs">
                      {new Date(e.occurredAt).toLocaleString('pt')}
                    </td>
                    <td className="px-3 py-2">{e.module}</td>
                    <td className="px-3 py-2 font-data text-xs">{e.type}</td>
                    <td className="px-3 py-2 text-xs">
                      {e.recordType
                        ? `${e.recordType}${e.recordId ? ` #${e.recordId}` : ''}`
                        : '–'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {e.executed}/{e.matchedRules}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        intent={
                          STATUS_INTENT[
                            e.status as keyof typeof STATUS_INTENT
                          ] ?? 'neutral'
                        }
                        title={e.note ?? undefined}
                      >
                        {STATUS_LABEL[e.status] ?? e.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-data text-[10px] text-ink-faint">
                      {e.correlationId.slice(0, 8)}
                      {e.depth > 0 ? ` · nível ${e.depth}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Workflow}
            title="Sem eventos recebidos"
            description="Quando um módulo publicar um evento, aparece aqui com a correlação e as regras accionadas."
          />
        )}
      </div>
    </div>
  );
}
