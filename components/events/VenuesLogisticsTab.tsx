// components/events/VenuesLogisticsTab.tsx
// Separador "Locais & Logística" (docs/events.md secção 6) — recursos
// necessários para realizar UM evento seleccionado. O spec não lista
// "Evento" como coluna própria (ao contrário de Programação), mesmo
// critério de ParticipantsTab.tsx: contexto escolhido primeiro, não
// cross-evento. Local/sala/capacidade/endereço já existem em Event
// (mostrados aqui só como resumo) — este formulário cobre o que falta
// (equipamentos, fornecedores, orçamento…) via GET/PUT
// /events/:id/logistics (upsert).

'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { Role } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Combobox } from '@/components/ui/Combobox';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/departments/departmentFormData';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { EQUIPMENT_CFG, LOGISTICS_STATUS_CFG } from './constants';
import { useEventPickerOptions } from './eventFormData';
import type {
  Event,
  EventEquipmentType,
  EventLogistics,
  EventLogisticsStatus,
} from './types';

const MANAGE_ROLES: readonly Role[] = ['ADMIN', 'RH', 'GESTOR'];

interface LogisticsFormState {
  equipment: EventEquipmentType[];
  resourcesNeeded: string;
  suppliers: string;
  catering: string;
  transport: string;
  accommodation: string;
  security: string;
  decoration: string;
  budget: string;
  actualCost: string;
  status: EventLogisticsStatus;
}

const EMPTY_FORM: LogisticsFormState = {
  equipment: [],
  resourcesNeeded: '',
  suppliers: '',
  catering: '',
  transport: '',
  accommodation: '',
  security: '',
  decoration: '',
  budget: '',
  actualCost: '',
  status: 'PLANNED',
};

function toForm(l: EventLogistics | null): LogisticsFormState {
  if (!l) return EMPTY_FORM;
  return {
    equipment: l.equipment,
    resourcesNeeded: l.resourcesNeeded ?? '',
    suppliers: l.suppliers ?? '',
    catering: l.catering ?? '',
    transport: l.transport ?? '',
    accommodation: l.accommodation ?? '',
    security: l.security ?? '',
    decoration: l.decoration ?? '',
    budget: l.budget !== null ? String(l.budget) : '',
    actualCost: l.actualCost !== null ? String(l.actualCost) : '',
    status: l.status,
  };
}

export function VenuesLogisticsTab() {
  const role = useCurrentRole();
  const canManage = !!role && MANAGE_ROLES.includes(role);
  const notify = useToast();
  const eventOptions = useEventPickerOptions('logistics');

  const [eventId, setEventId] = useState<number | null>(null);
  const [responsible, setResponsible] = useState<DirectoryUser | null>(null);
  const [form, setForm] = useState<LogisticsFormState>(EMPTY_FORM);

  const { data: event } = useApiQuery<Event>(
    queryKeys.events.detail(eventId ?? 0),
    `/events/${eventId}`,
    {
      enabled: !!eventId,
      staleTime: STALE_TIME.DYNAMIC,
    },
  );

  const {
    data: logistics,
    isLoading,
    error,
    refetch,
  } = useApiQuery<EventLogistics | null>(
    queryKeys.events.logistics(eventId ?? 0),
    `/events/${eventId}/logistics`,
    { enabled: !!eventId, staleTime: STALE_TIME.DYNAMIC },
  );

  useEffect(() => {
    setForm(toForm(logistics ?? null));
    setResponsible(
      logistics?.responsible
        ? {
            id: logistics.responsible.id,
            fullName: logistics.responsible.fullName,
            avatarUrl: null,
          }
        : null,
    );
  }, [logistics]);

  const save = useApiMutation(
    () =>
      apiClient.put(`/events/${eventId}/logistics`, {
        responsibleId: responsible?.id,
        equipment: form.equipment,
        resourcesNeeded: form.resourcesNeeded || undefined,
        suppliers: form.suppliers || undefined,
        catering: form.catering || undefined,
        transport: form.transport || undefined,
        accommodation: form.accommodation || undefined,
        security: form.security || undefined,
        decoration: form.decoration || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        actualCost: form.actualCost ? Number(form.actualCost) : undefined,
        status: form.status,
      }),
    {
      invalidateKeys: [queryKeys.events.all],
      onSuccess: () =>
        notify({ title: 'Logística guardada', intent: 'success' }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  function toggleEquipment(item: EventEquipmentType) {
    setForm((f) => ({
      ...f,
      equipment: f.equipment.includes(item)
        ? f.equipment.filter((e) => e !== item)
        : [...f.equipment, item],
    }));
  }

  if (!eventId) {
    return (
      <div className="space-y-4">
        <Combobox
          items={eventOptions}
          value={undefined}
          onValueChange={(v) => setEventId(Number(v))}
          placeholder="Selecionar evento"
          searchPlaceholder="Pesquisar evento…"
          emptyText="Nenhum evento encontrado"
          className="max-w-lg"
        />
        <EmptyState
          icon={MapPin}
          title="Escolhe um evento"
          description="Selecciona um evento acima para gerir os seus locais e recursos de logística."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Combobox
          items={eventOptions}
          value={String(eventId)}
          onValueChange={(v) => setEventId(Number(v))}
          placeholder="Selecionar evento"
          searchPlaceholder="Pesquisar evento…"
          emptyText="Nenhum evento encontrado"
          className="max-w-sm"
        />
        {logistics && (
          <StatusBadge value={logistics.status} map={LOGISTICS_STATUS_CFG} />
        )}
      </div>

      {error ? (
        <QueryError error={error} onRetry={() => refetch()} />
      ) : isLoading ? (
        <Skeleton rows={6} />
      ) : (
        <>
          {event && (
            <Card className="grid grid-cols-2 gap-3 p-4 text-sm sm:grid-cols-4">
              <div>
                <div className="font-body text-xs text-ink-faint">Local</div>
                <div className="truncate text-ink">{event.location ?? '—'}</div>
              </div>
              <div>
                <div className="font-body text-xs text-ink-faint">Sala</div>
                <div className="truncate text-ink">{event.room ?? '—'}</div>
              </div>
              <div>
                <div className="font-body text-xs text-ink-faint">
                  Capacidade
                </div>
                <div className="text-ink">{event.maxCapacity}</div>
              </div>
              <div>
                <div className="font-body text-xs text-ink-faint">Endereço</div>
                <div className="truncate text-ink">{event.address ?? '—'}</div>
              </div>
            </Card>
          )}

          <Card className="space-y-4 p-4">
            <div>
              <div className="mb-2 font-body text-xs font-medium text-ink">
                Equipamentos
              </div>
              <div className="flex flex-wrap gap-2">
                {(
                  Object.entries(EQUIPMENT_CFG) as Array<
                    [EventEquipmentType, { label: string }]
                  >
                ).map(([value, cfg]) => (
                  <label
                    key={value}
                    className="flex cursor-pointer items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs text-ink hover:bg-surface-sunken has-[:checked]:border-primary has-[:checked]:bg-primary-subtle has-[:checked]:text-primary"
                  >
                    <input
                      type="checkbox"
                      checked={form.equipment.includes(value)}
                      onChange={() => toggleEquipment(value)}
                      disabled={!canManage}
                      className="h-3.5 w-3.5 rounded border-border-strong accent-primary"
                    />
                    {cfg.label}
                  </label>
                ))}
              </div>
            </div>

            {canManage ? (
              <div className="w-full sm:max-w-xs">
                <DepartmentUserPicker
                  label="Responsável"
                  htmlFor="log-responsible"
                  value={responsible}
                  onChange={setResponsible}
                />
              </div>
            ) : (
              <div className="w-full sm:max-w-xs">
                <div className="mb-1.5 font-body text-xs font-medium text-ink">
                  Responsável
                </div>
                <div className="text-sm text-ink">
                  {responsible?.fullName ?? '—'}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Recursos necessários" htmlFor="log-resources">
                <Textarea
                  id="log-resources"
                  value={form.resourcesNeeded}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, resourcesNeeded: e.target.value }))
                  }
                  rows={2}
                  disabled={!canManage}
                  className="w-full resize-none"
                />
              </FormField>
              <FormField label="Fornecedores" htmlFor="log-suppliers">
                <Textarea
                  id="log-suppliers"
                  value={form.suppliers}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, suppliers: e.target.value }))
                  }
                  rows={2}
                  disabled={!canManage}
                  className="w-full resize-none"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField label="Catering" htmlFor="log-catering">
                <Input
                  id="log-catering"
                  value={form.catering}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, catering: e.target.value }))
                  }
                  disabled={!canManage}
                  className="w-full"
                />
              </FormField>
              <FormField label="Transporte" htmlFor="log-transport">
                <Input
                  id="log-transport"
                  value={form.transport}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, transport: e.target.value }))
                  }
                  disabled={!canManage}
                  className="w-full"
                />
              </FormField>
              <FormField label="Alojamento" htmlFor="log-accommodation">
                <Input
                  id="log-accommodation"
                  value={form.accommodation}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, accommodation: e.target.value }))
                  }
                  disabled={!canManage}
                  className="w-full"
                />
              </FormField>
              <FormField label="Segurança" htmlFor="log-security">
                <Input
                  id="log-security"
                  value={form.security}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, security: e.target.value }))
                  }
                  disabled={!canManage}
                  className="w-full"
                />
              </FormField>
              <FormField label="Decoração" htmlFor="log-decoration">
                <Input
                  id="log-decoration"
                  value={form.decoration}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, decoration: e.target.value }))
                  }
                  disabled={!canManage}
                  className="w-full"
                />
              </FormField>
              <FormField label="Estado" htmlFor="log-status">
                <Select
                  items={Object.entries(LOGISTICS_STATUS_CFG).map(
                    ([value, cfg]) => ({ value, label: cfg.label }),
                  )}
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((f) => ({
                      ...f,
                      status: v as EventLogisticsStatus,
                    }))
                  }
                  disabled={!canManage}
                  className="w-full"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <FormField
                label="Orçamento (custo estimado)"
                htmlFor="log-budget"
              >
                <Input
                  id="log-budget"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.budget}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, budget: e.target.value }))
                  }
                  disabled={!canManage}
                  className="w-full"
                />
              </FormField>
              <FormField label="Custo realizado" htmlFor="log-actual-cost">
                <Input
                  id="log-actual-cost"
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.actualCost}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, actualCost: e.target.value }))
                  }
                  disabled={!canManage}
                  className="w-full"
                />
              </FormField>
            </div>

            {canManage && (
              <div className="flex justify-end border-t border-border pt-4">
                <Button
                  loading={save.isPending}
                  onClick={() => save.mutate(undefined)}
                >
                  Guardar
                </Button>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
