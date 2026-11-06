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
import { MapPin, Plus, X } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useHasRole } from '@/hooks/useCurrentRole';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ADMIN_RH_GESTOR_ROLES, Role } from '@/lib/roles';
import { Button } from '@/components/ui/Button';
import { NavyPanel } from '@/components/trainings/plans/NavyPanel';
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
import { cn } from '@/lib/cn';
import { EQUIPMENT_CFG, LOGISTICS_STATUS_CFG } from './constants';
import { proximityLevel, relativeLabel } from './proximity';
import { useEventPickerOptions } from './eventFormData';
import type {
  Event,
  EventEquipmentType,
  EventLogistics,
  EventLogisticsStatus,
} from './types';
import { Checkbox } from '@/components/ui/Checkbox';
import { EventLogisticsDetailModal } from './EventLogisticsDetailModal';

const MANAGE_ROLES: readonly Role[] = ADMIN_RH_GESTOR_ROLES;

interface LogisticsFormState {
  equipment: EventEquipmentType[];
  customEquipment: string[];
  customServices: string[];
  /** Serviços seleccionados em «Estado e custos»: chave → custo (texto). */
  serviceCosts: Record<string, string>;
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

// Recursos sugeridos; qualquer outro texto é aceite como recurso livre.
// Guardados em EventLogistics.resourcesNeeded, um por linha.
const RESOURCE_SUGGESTIONS = [
  'Água',
  'Café / Coffee break',
  'Crachás',
  'Papel e canetas',
  'Extensões eléctricas',
  'Material de escritório',
];

function parseResources(text: string): string[] {
  return text
    .split('\n')
    .map((r) => r.trim())
    .filter(Boolean);
}

// Serviços fixos de «Fornecedores e serviços» (sem «Fornecedores») que se
// podem seleccionar em «Estado e custos» para lhes indicar o custo.
const FIXED_SERVICES = [
  { key: 'catering', label: 'Catering' },
  { key: 'transport', label: 'Transporte' },
  { key: 'accommodation', label: 'Alojamento' },
  { key: 'security', label: 'Segurança' },
  { key: 'decoration', label: 'Decoração' },
] as const;

const EMPTY_FORM: LogisticsFormState = {
  equipment: [],
  customEquipment: [],
  customServices: [],
  serviceCosts: {},
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
    customEquipment: l.customEquipment ?? [],
    customServices: l.customServices ?? [],
    serviceCosts: Object.fromEntries(
      Object.entries(l.serviceCosts ?? {}).map(([k, v]) => [
        k,
        v === null || v === undefined ? '' : String(v),
      ]),
    ),
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
  const canManage = useHasRole(MANAGE_ROLES);
  const notify = useToast();
  const eventOptions = useEventPickerOptions('logistics');

  const [eventId, setEventId] = useState<number | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [newEquipment, setNewEquipment] = useState('');
  const [newResource, setNewResource] = useState('');
  const [newSupplier, setNewSupplier] = useState('');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDetail, setNewServiceDetail] = useState('');
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
        customEquipment: form.customEquipment,
        customServices: form.customServices,
        serviceCosts: Object.fromEntries(
          Object.entries(form.serviceCosts).map(([k, v]) => [
            k,
            v.trim() === '' ? null : Number(v),
          ]),
        ),
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
      onSuccess: () => {
        notify({ title: 'Logística guardada', intent: 'success' });
        setEditing(false);
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  function cancelEditing() {
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
    setEditing(false);
  }

  const resources = parseResources(form.resourcesNeeded);

  function addResource(raw: string) {
    const name = raw.trim();
    if (!name) return;
    if (resources.some((r) => r.toLowerCase() === name.toLowerCase())) return;
    setForm((f) => ({
      ...f,
      resourcesNeeded: [...parseResources(f.resourcesNeeded), name].join('\n'),
    }));
  }

  function removeResource(name: string) {
    setForm((f) => ({
      ...f,
      resourcesNeeded: parseResources(f.resourcesNeeded)
        .filter((r) => r !== name)
        .join('\n'),
    }));
  }

  const suppliers = parseResources(form.suppliers);

  function addSupplier() {
    const name = newSupplier.trim();
    setNewSupplier('');
    if (!name || suppliers.some((x) => x.toLowerCase() === name.toLowerCase()))
      return;
    setForm((f) => ({
      ...f,
      suppliers: [...parseResources(f.suppliers), name].join('\n'),
    }));
  }

  function removeSupplier(name: string) {
    setForm((f) => ({
      ...f,
      suppliers: parseResources(f.suppliers)
        .filter((x) => x !== name)
        .join('\n'),
    }));
  }

  function addCustomService() {
    const name = newServiceName.trim();
    if (!name) return;
    const detail = newServiceDetail.trim();
    const entry = detail ? `${name}: ${detail}` : name;
    setForm((f) => ({ ...f, customServices: [...f.customServices, entry] }));
    setNewServiceName('');
    setNewServiceDetail('');
  }

  function removeCustomService(entry: string) {
    setForm((f) => ({
      ...f,
      customServices: f.customServices.filter((x) => x !== entry),
    }));
  }

  function toggleServiceCost(key: string) {
    setForm((f) => {
      const next = { ...f.serviceCosts };
      if (key in next) delete next[key];
      else next[key] = '';
      return { ...f, serviceCosts: next };
    });
  }

  function setServiceCost(key: string, value: string) {
    setForm((f) => ({
      ...f,
      serviceCosts: { ...f.serviceCosts, [key]: value },
    }));
  }

  const serviceItems = [
    ...FIXED_SERVICES.map((sv) => ({
      key: sv.key as string,
      label: sv.label,
      detail: form[sv.key],
    })),
    ...form.customServices.map((entry) => ({
      key: `custom:${entry}`,
      label: entry.split(': ')[0],
      detail: entry.includes(': ') ? entry.slice(entry.indexOf(': ') + 2) : '',
    })),
  ];
  const servicesTotal = Object.entries(form.serviceCosts)
    .filter(([key]) => serviceItems.some((i) => i.key === key))
    .reduce((sum, [, v]) => sum + (Number(v) || 0), 0);

  function addCustomEquipment() {
    const name = newEquipment.trim();
    if (!name) return;
    const exists = form.customEquipment.some(
      (e) => e.toLowerCase() === name.toLowerCase(),
    );
    if (!exists) {
      setForm((f) => ({ ...f, customEquipment: [...f.customEquipment, name] }));
    }
    setNewEquipment('');
  }

  function removeCustomEquipment(name: string) {
    setForm((f) => ({
      ...f,
      customEquipment: f.customEquipment.filter((e) => e !== name),
    }));
  }

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
          onValueChange={(v) => {
            setEventId(Number(v));
            setEditing(false);
          }}
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
          onValueChange={(v) => {
            setEventId(Number(v));
            setEditing(false);
          }}
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
            <div
              role="button"
              tabIndex={0}
              aria-label="Ver logística guardada do evento"
              onClick={() => setDetailOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setDetailOpen(true);
                }
              }}
              className="relative cursor-pointer overflow-hidden rounded-[24px] border border-brand-line bg-surface p-5 shadow-[0_8px_24px_rgba(21,47,89,0.10)] transition hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div className="truncate font-body text-sm font-semibold text-brand">
                  {event.title}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 font-body text-xs font-semibold',
                      proximityLevel(event.startAt).cls,
                    )}
                  >
                    {relativeLabel(event.startAt)}
                  </span>
                  {canManage && !editing && (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(true);
                      }}
                      onKeyDown={(e) => e.stopPropagation()}
                    >
                      Editar logística
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <div className="font-body text-xs text-brand-muted">
                    Local
                  </div>
                  <div className="truncate font-semibold text-brand">
                    {event.location ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="font-body text-xs text-brand-muted">Sala</div>
                  <div className="truncate font-semibold text-brand">
                    {event.room ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="font-body text-xs text-brand-muted">
                    Capacidade
                  </div>
                  <div className="font-semibold text-brand">
                    {event.maxCapacity}
                  </div>
                </div>
                <div>
                  <div className="font-body text-xs text-brand-muted">
                    Endereço
                  </div>
                  <div className="truncate font-semibold text-brand">
                    {event.address ?? '—'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {event && detailOpen && (
            <EventLogisticsDetailModal
              event={event}
              logistics={logistics}
              onClose={() => setDetailOpen(false)}
            />
          )}

          {editing && canManage && (
            <div className="space-y-4">
              <NavyPanel seed={event?.id ?? 0} title="Equipamentos">
                <div className="space-y-4">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {(
                        Object.entries(EQUIPMENT_CFG) as Array<
                          [EventEquipmentType, { label: string }]
                        >
                      ).map(([value, cfg]) => (
                        <label
                          key={value}
                          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-brand-line bg-surface px-3 py-1 text-xs text-brand hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-white"
                        >
                          <Checkbox
                            checked={form.equipment.includes(value)}
                            onChange={() => toggleEquipment(value)}
                            disabled={!canManage}
                            size="sm"
                          />
                          {cfg.label}
                        </label>
                      ))}
                      {form.customEquipment.map((name) => (
                        <span
                          key={name}
                          className="flex items-center gap-1.5 rounded-full border border-brand bg-brand px-3 py-1 text-xs text-white"
                        >
                          {name}
                          {canManage && (
                            <button
                              type="button"
                              aria-label={`Remover ${name}`}
                              onClick={() => removeCustomEquipment(name)}
                              className="rounded-full hover:bg-white/20"
                            >
                              <X size={12} strokeWidth={2} />
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                    {canManage && (
                      <div className="mt-2 flex max-w-sm items-center gap-2">
                        <Input
                          value={newEquipment}
                          onChange={(e) => setNewEquipment(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomEquipment();
                            }
                          }}
                          maxLength={80}
                          placeholder="Outro equipamento…"
                          aria-label="Adicionar outro equipamento"
                          className="w-full"
                        />
                        <Button
                          type="button"
                          size="sm"
                          intent="secondary"
                          onClick={addCustomEquipment}
                          disabled={!newEquipment.trim()}
                        >
                          <Plus size={14} strokeWidth={1.75} />
                          Adicionar
                        </Button>
                      </div>
                    )}
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
                </div>
              </NavyPanel>
              <NavyPanel seed={event?.id ?? 0} title="Recursos necessários">
                <div>
                  <div className="flex flex-wrap gap-2">
                    {RESOURCE_SUGGESTIONS.map((name) => {
                      const on = resources.includes(name);
                      return (
                        <label
                          key={name}
                          className="flex cursor-pointer items-center gap-1.5 rounded-full border border-brand-line bg-surface px-3 py-1 text-xs text-brand hover:border-brand has-[:checked]:border-brand has-[:checked]:bg-brand has-[:checked]:text-white"
                        >
                          <Checkbox
                            checked={on}
                            onChange={() =>
                              on ? removeResource(name) : addResource(name)
                            }
                            disabled={!canManage}
                            size="sm"
                          />
                          {name}
                        </label>
                      );
                    })}
                    {resources
                      .filter((r) => !RESOURCE_SUGGESTIONS.includes(r))
                      .map((name) => (
                        <span
                          key={name}
                          className="flex items-center gap-1.5 rounded-full border border-brand bg-brand px-3 py-1 text-xs text-white"
                        >
                          {name}
                          {canManage && (
                            <button
                              type="button"
                              aria-label={`Remover ${name}`}
                              onClick={() => removeResource(name)}
                              className="rounded-full hover:bg-white/20"
                            >
                              <X size={12} strokeWidth={2} />
                            </button>
                          )}
                        </span>
                      ))}
                  </div>
                  {canManage && (
                    <div className="mt-2 flex items-center gap-2">
                      <Input
                        value={newResource}
                        onChange={(e) => setNewResource(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addResource(newResource);
                            setNewResource('');
                          }
                        }}
                        maxLength={120}
                        placeholder="Outro recurso…"
                        aria-label="Adicionar outro recurso"
                        className="w-full"
                      />
                      <Button
                        type="button"
                        size="sm"
                        intent="secondary"
                        onClick={() => {
                          addResource(newResource);
                          setNewResource('');
                        }}
                        disabled={!newResource.trim()}
                      >
                        <Plus size={14} strokeWidth={1.75} />
                        Adicionar
                      </Button>
                    </div>
                  )}
                </div>
              </NavyPanel>
              <NavyPanel seed={event?.id ?? 0} title="Fornecedores e serviços">
                <div className="space-y-3">
                  <div>
                    <div className="mb-1.5 font-body text-xs font-medium text-ink">
                      Fornecedores
                    </div>
                    {suppliers.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {suppliers.map((name) => (
                          <span
                            key={name}
                            className="flex items-center gap-1.5 rounded-full border border-brand bg-brand px-3 py-1 text-xs text-white"
                          >
                            {name}
                            {canManage && (
                              <button
                                type="button"
                                aria-label={`Remover ${name}`}
                                onClick={() => removeSupplier(name)}
                                className="rounded-full hover:bg-white/20"
                              >
                                <X size={12} strokeWidth={2} />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                    {canManage && (
                      <div className="flex items-center gap-2">
                        <Input
                          value={newSupplier}
                          onChange={(e) => setNewSupplier(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSupplier();
                            }
                          }}
                          maxLength={120}
                          placeholder="Nome do fornecedor…"
                          aria-label="Adicionar fornecedor"
                          className="w-full"
                        />
                        <Button
                          type="button"
                          size="sm"
                          intent="secondary"
                          onClick={addSupplier}
                          disabled={!newSupplier.trim()}
                        >
                          <Plus size={14} strokeWidth={1.75} />
                          Adicionar
                        </Button>
                      </div>
                    )}
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
                          setForm((f) => ({
                            ...f,
                            accommodation: e.target.value,
                          }))
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
                  </div>
                  <div>
                    <div className="mb-1.5 font-body text-xs font-medium text-ink">
                      Outros serviços
                    </div>
                    {form.customServices.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-2">
                        {form.customServices.map((entry) => (
                          <span
                            key={entry}
                            className="flex items-center gap-1.5 rounded-full border border-brand bg-brand px-3 py-1 text-xs text-white"
                          >
                            {entry}
                            {canManage && (
                              <button
                                type="button"
                                aria-label={`Remover ${entry}`}
                                onClick={() => removeCustomService(entry)}
                                className="rounded-full hover:bg-white/20"
                              >
                                <X size={12} strokeWidth={2} />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    )}
                    {canManage && (
                      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <Input
                          value={newServiceName}
                          onChange={(e) => setNewServiceName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomService();
                            }
                          }}
                          maxLength={80}
                          placeholder="Serviço (ex.: Fotografia)…"
                          aria-label="Nome do serviço"
                          className="w-full"
                        />
                        <Input
                          value={newServiceDetail}
                          onChange={(e) => setNewServiceDetail(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addCustomService();
                            }
                          }}
                          maxLength={110}
                          placeholder="Detalhe (opcional)"
                          aria-label="Detalhe do serviço"
                          className="w-full"
                        />
                        <Button
                          type="button"
                          size="sm"
                          intent="secondary"
                          onClick={addCustomService}
                          disabled={!newServiceName.trim()}
                        >
                          <Plus size={14} strokeWidth={1.75} />
                          Adicionar serviço
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </NavyPanel>
              <NavyPanel seed={event?.id ?? 0} title="Estado e custos">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                <div className="space-y-2">
                  <div className="font-body text-xs font-medium text-ink">
                    Serviços e custos
                  </div>
                  {serviceItems.map((item) => {
                    const on = item.key in form.serviceCosts;
                    return (
                      <div
                        key={item.key}
                        className="flex flex-wrap items-center gap-3 rounded-control border border-brand-line bg-surface px-3 py-1.5"
                      >
                        <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm text-brand">
                          <Checkbox
                            checked={on}
                            onChange={() => toggleServiceCost(item.key)}
                            disabled={!canManage}
                            size="sm"
                          />
                          <span className="truncate font-semibold">
                            {item.label}
                          </span>
                          {item.detail && (
                            <span className="truncate text-xs text-brand-muted">
                              {item.detail}
                            </span>
                          )}
                        </label>
                        {on && (
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            value={form.serviceCosts[item.key]}
                            onChange={(e) =>
                              setServiceCost(item.key, e.target.value)
                            }
                            disabled={!canManage}
                            placeholder="Custo"
                            aria-label={`Custo de ${item.label}`}
                            className="w-36"
                          />
                        )}
                      </div>
                    );
                  })}
                  {Object.keys(form.serviceCosts).length > 0 && (
                    <div className="text-right font-body text-xs text-brand-muted">
                      Total dos serviços seleccionados:{' '}
                      <b className="text-brand">{servicesTotal.toFixed(2)}</b>
                    </div>
                  )}
                </div>
                {canManage && (
                  <div className="flex justify-end gap-2 border-t border-brand-line pt-4">
                    <Button
                      intent="secondary"
                      disabled={save.isPending}
                      onClick={cancelEditing}
                    >
                      Cancelar
                    </Button>
                    <Button
                      loading={save.isPending}
                      onClick={() => save.mutate(undefined)}
                    >
                      Guardar
                    </Button>
                  </div>
                )}
              </NavyPanel>
            </div>
          )}
        </>
      )}
    </div>
  );
}
