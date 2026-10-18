// components/trainings/ResourceFormModal.tsx
// Criação/edição de sala/recurso (docs/trainings-detalhado.md pt.8 — "Nova
// Sala"/"Novo Recurso", um único formulário sobre TrainingResource.kind).

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { RESOURCE_KIND_LABEL } from './constants';
import type { TrainingResourceItem } from './types';

export interface ResourceFormModalProps {
  resource: TrainingResourceItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

const KIND_ITEMS = Object.entries(RESOURCE_KIND_LABEL).map(
  ([value, label]) => ({ value, label }),
);

const STATUS_ITEMS = [
  { value: 'AVAILABLE', label: 'Disponível' },
  { value: 'UNAVAILABLE', label: 'Indisponível' },
  { value: 'MAINTENANCE', label: 'Manutenção' },
];

const ROOM_TYPE_PRESETS = [
  'Sala de formação',
  'Sala de reuniões',
  'Auditório',
  'Laboratório',
  'Sala de informática',
  'Espaço exterior',
];
const RESOURCE_CATEGORY_PRESETS = [
  'Audiovisual',
  'Informática',
  'Mobiliário',
  'Material didáctico',
  'Alimentação',
  'Transporte',
  'Alojamento',
];
const LOCATION_PRESETS = [
  'Sede',
  'Centro de formação',
  'Delegação',
  'Online',
  'Externo',
];
const NONE = '__none__';

/** Presets + valores já usados noutros recursos + valor actual, sem duplicados. */
function buildOptions(
  presets: string[],
  used: (string | null | undefined)[],
  current: string,
  noneLabel: string,
) {
  const all = [...presets, ...used, current]
    .map((v) => v?.trim())
    .filter((v): v is string => !!v);
  const unique = Array.from(new Set(all)).sort((a, b) =>
    a.localeCompare(b, 'pt'),
  );
  return [
    { value: NONE, label: noneLabel },
    ...unique.map((v) => ({ value: v, label: v })),
  ];
}

interface UserOption {
  id: number;
  fullName: string;
}

function n(value: string): number | undefined {
  if (value.trim() === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function ResourceFormModal({
  resource,
  onClose,
  onSuccess,
}: ResourceFormModalProps) {
  const editing = !!resource;

  const { data: usersResp } = useApiQuery<{ data: UserOption[] }>(
    ['training-resources', 'users-picker'],
    '/users',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data: existing } = useApiQuery<{ data: TrainingResourceItem[] }>(
    queryKeys.trainingResources.list({ limit: 100 }),
    '/training-resources',
    { params: { limit: 100 }, staleTime: STALE_TIME.DYNAMIC },
  );
  const userItems = (usersResp?.data ?? []).map((u) => ({
    value: String(u.id),
    label: u.fullName,
  }));

  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      kind: resource?.kind ?? 'ROOM',
      name: resource?.name ?? '',
      code: resource?.code ?? '',
      category: resource?.category ?? '',
      location: resource?.location ?? '',
      capacity: resource?.capacity?.toString() ?? '',
      quantity: resource?.quantity?.toString() ?? '1',
      equipment: resource?.equipment?.join(', ') ?? '',
      cost: resource?.cost?.toString() ?? '',
      responsibleId: resource?.responsibleId?.toString() ?? '',
      status: resource?.status ?? 'AVAILABLE',
      notes: resource?.notes ?? '',
    },
    { name: [required()] },
  );
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;
  const isRoom = form.kind === 'ROOM';
  const used = existing?.data ?? [];
  const categoryItems = buildOptions(
    isRoom ? ROOM_TYPE_PRESETS : RESOURCE_CATEGORY_PRESETS,
    used.map((r) => r.category),
    form.category,
    isRoom ? 'Sem tipo de sala' : 'Sem categoria',
  );
  const locationItems = buildOptions(
    LOCATION_PRESETS,
    used.map((r) => r.location),
    form.location,
    'Sem localização',
  );

  function buildPayload(): Record<string, unknown> {
    const payload: Record<string, unknown> = {
      kind: form.kind,
      name: form.name.trim(),
      status: form.status || 'AVAILABLE',
      equipment: form.equipment
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    const str = (key: keyof typeof form) => {
      const v = (form[key] as string).trim();
      if (v) payload[key] = v;
    };
    str('code');
    str('category');
    str('location');
    str('notes');
    if (form.capacity) payload.capacity = n(form.capacity);
    if (form.quantity) payload.quantity = n(form.quantity);
    if (form.cost) payload.cost = n(form.cost);
    if (form.responsibleId) payload.responsibleId = n(form.responsibleId);
    return payload;
  }

  const mutation = useApiMutation(
    () => {
      const payload = buildPayload();
      return resource
        ? apiClient.put(`/training-resources/${resource.id}`, payload)
        : apiClient.post('/training-resources', payload);
    },
    {
      invalidateKeys: [queryKeys.trainingResources.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (e) =>
        setSubmitError(
          e.message ||
            (editing
              ? 'Erro ao actualizar recurso.'
              : 'Erro ao criar recurso.'),
        ),
    },
  );
  const loading = mutation.isPending;
  const handleSubmit = withValidation(() => {
    setSubmitError('');
    mutation.mutate(undefined);
  });

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={editing ? `Editar "${resource!.name}"` : 'Nova sala / recurso'}
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tipo" htmlFor="rf-kind">
              <Select
                items={KIND_ITEMS}
                value={form.kind}
                onValueChange={(v) => setField('kind', v as typeof form.kind)}
                className="w-full"
              />
            </FormField>
            <FormField label="Nome *" htmlFor="rf-name">
              <Input
                id="rf-name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Código" htmlFor="rf-code">
              <Input
                id="rf-code"
                value={form.code}
                onChange={(e) => setField('code', e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField
              label={isRoom ? 'Tipo de sala' : 'Categoria'}
              htmlFor="rf-category"
            >
              <Combobox
                items={categoryItems}
                value={form.category || undefined}
                onValueChange={(v) => setField('category', v === NONE ? '' : v)}
                placeholder="Opcional"
                allowCustom
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Localização / Unidade" htmlFor="rf-location">
            <Combobox
              items={locationItems}
              value={form.location || undefined}
              onValueChange={(v) => setField('location', v === NONE ? '' : v)}
              placeholder="Opcional"
              allowCustom
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            {isRoom ? (
              <FormField label="Capacidade" htmlFor="rf-capacity">
                <Input
                  id="rf-capacity"
                  type="number"
                  min={0}
                  value={form.capacity}
                  onChange={(e) => setField('capacity', e.target.value)}
                  className="w-full"
                />
              </FormField>
            ) : (
              <FormField label="Quantidade" htmlFor="rf-quantity">
                <Input
                  id="rf-quantity"
                  type="number"
                  min={0}
                  value={form.quantity}
                  onChange={(e) => setField('quantity', e.target.value)}
                  className="w-full"
                />
              </FormField>
            )}
            <FormField label="Custo (AOA)" htmlFor="rf-cost">
              <Input
                id="rf-cost"
                type="number"
                min={0}
                value={form.cost}
                onChange={(e) => setField('cost', e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          {isRoom && (
            <FormField
              label="Equipamentos disponíveis (separados por vírgula)"
              htmlFor="rf-equipment"
            >
              <Input
                id="rf-equipment"
                value={form.equipment}
                onChange={(e) => setField('equipment', e.target.value)}
                className="w-full"
                placeholder="Ex: Projetor, Som, Wi-Fi"
              />
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Responsável" htmlFor="rf-responsible">
              <Combobox
                items={userItems}
                value={form.responsibleId || undefined}
                onValueChange={(v) => setField('responsibleId', v)}
                placeholder="Selecionar"
                className="w-full"
              />
            </FormField>
            <FormField label="Estado" htmlFor="rf-status">
              <Select
                items={STATUS_ITEMS}
                value={form.status}
                onValueChange={(v) =>
                  setField('status', v as typeof form.status)
                }
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Observações" htmlFor="rf-notes">
            <Textarea
              id="rf-notes"
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              rows={2}
              className="w-full resize-none"
            />
          </FormField>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={handleSubmit}
            loading={loading}
          >
            {loading
              ? 'A guardar...'
              : editing
                ? 'Guardar alterações'
                : 'Criar'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
