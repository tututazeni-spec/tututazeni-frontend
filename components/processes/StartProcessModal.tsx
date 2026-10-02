// components/processes/StartProcessModal.tsx
// Modal «Novo Processo» (docs/Modulo_Processes.md §19): cria uma instância a
// partir de um modelo publicado. Campos base do §19 + campos específicos do
// modelo (colaborador, entidade de origem, prazo). O backend valida acesso,
// modelo em vigor e pedidos duplicados (409).

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
import { PRIORITY_MAP } from './constants';
import { UserPicker } from './UserPicker';
import type {
  InstanceRow,
  PaginatedProcesses,
  ProcessPriority,
} from './types';

export interface StartProcessModalProps {
  /** Modelo pré-seleccionado (ex.: a partir do detalhe do modelo). */
  templateId?: number;
  onClose: () => void;
  onCreated: (instanceId: number) => void;
}

export const SOURCE_MODULES = [
  'Users',
  'Departments',
  'Organization',
  'Onboarding',
  'Courses',
  'Trainings',
  'Enrollments',
  'Performance',
  'PDI',
  'Career',
  'Leave',
  'Attendance',
  'Payroll',
  'Documentos',
  'Events',
  'Processes',
];

const PRIORITY_ITEMS = (Object.keys(PRIORITY_MAP) as ProcessPriority[]).map(
  (p) => ({ value: p, label: PRIORITY_MAP[p].label }),
);

export function StartProcessModal({
  templateId,
  onClose,
  onCreated,
}: StartProcessModalProps) {
  const notify = useToast();

  const [name, setName] = useState('');
  const [template, setTemplate] = useState(templateId ? String(templateId) : '');
  const [sourceModule, setSourceModule] = useState('Processes');
  const [priority, setPriority] = useState<ProcessPriority>('NORMAL');
  const [description, setDescription] = useState('');
  const [targetUserId, setTargetUserId] = useState('');
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [error, setError] = useState('');

  const { data: templates } = useApiQuery<PaginatedProcesses>(
    queryKeys.processes.library({ status: 'ACTIVE', limit: 100, picker: true }),
    '/processes',
    {
      params: { status: 'ACTIVE', limit: 100 },
      staleTime: STALE_TIME.SEMI_STATIC,
    },
  );
  const templateItems = (templates?.data ?? []).map((t) => ({
    value: String(t.id),
    label: `${t.title} (${t.code})`,
  }));
  const chosen = templates?.data.find((t) => String(t.id) === template);

  const create = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.post<InstanceRow & { id: number }>(
        `/processes/${template}/start`,
        body,
      ),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: (inst) => {
        notify({ title: 'Processo iniciado', intent: 'success' });
        onCreated(inst.id);
      },
      onError: (e) => setError(e.message || 'Não foi possível iniciar o processo.'),
    },
  );

  const canSubmit = name.trim().length > 0 && template !== '' && sourceModule !== '';

  const submit = () => {
    if (!canSubmit || create.isPending) return;
    setError('');
    create.mutate({
      title: name.trim(),
      sourceModule,
      priority,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(targetUserId ? { targetUserId: Number(targetUserId) } : {}),
      ...(entityType.trim() && entityId.trim()
        ? { sourceEntityType: entityType.trim(), sourceEntityId: entityId.trim() }
        : {}),
      ...(dueAt ? { dueAt: new Date(dueAt + 'T23:59:59').toISOString() } : {}),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo processo"
        description="Inicia um processo a partir de um modelo publicado."
        className="max-h-[90vh] max-w-xl overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <FormField label="Nome do processo *" htmlFor="sp-name">
            <Input
              id="sp-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Integração de novo colaborador"
              maxLength={200}
            />
          </FormField>

          <FormField label="Modelo de processo *" htmlFor="sp-template">
            <Select
              items={templateItems}
              value={template}
              onValueChange={setTemplate}
              placeholder="Seleccionar modelo"
              className="w-full"
              disabled={!!templateId}
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Módulo de origem *" htmlFor="sp-module">
              <Select
                items={SOURCE_MODULES.map((m) => ({ value: m, label: m }))}
                value={sourceModule}
                onValueChange={setSourceModule}
                className="w-full"
              />
            </FormField>
            <FormField label="Prioridade" htmlFor="sp-priority">
              <Select
                items={PRIORITY_ITEMS}
                value={priority}
                onValueChange={(v) => setPriority(v as ProcessPriority)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Descrição e finalidade" htmlFor="sp-desc">
            <Textarea
              id="sp-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o objectivo e o resultado esperado."
              rows={2}
              className="w-full"
            />
          </FormField>

          {/* Campos específicos do modelo (§19) */}
          <div className="rounded-card border border-border bg-surface-sunken p-3">
            <p className="mb-3 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Dados do pedido{chosen ? ` — ${chosen.title}` : ''}
            </p>
            <div className="space-y-3">
              <FormField
                label="Colaborador"
                htmlFor="sp-target"
                hint="Por defeito, o próprio solicitante."
              >
                <UserPicker value={targetUserId} onChange={setTargetUserId} />
              </FormField>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <FormField label="Entidade de origem" htmlFor="sp-etype" hint="Ex.: Curso, Pedido, Documento.">
                  <Input
                    id="sp-etype"
                    value={entityType}
                    onChange={(e) => setEntityType(e.target.value)}
                    maxLength={60}
                  />
                </FormField>
                <FormField label="Identificador" htmlFor="sp-eid" hint="Evita processos duplicados para o mesmo pedido.">
                  <Input
                    id="sp-eid"
                    value={entityId}
                    onChange={(e) => setEntityId(e.target.value)}
                    maxLength={60}
                  />
                </FormField>
              </div>
              <FormField
                label="Prazo final"
                htmlFor="sp-due"
                hint="Por defeito, o SLA do modelo."
              >
                <Input
                  id="sp-due"
                  type="date"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                />
              </FormField>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button onClick={submit} disabled={!canSubmit} loading={create.isPending}>
            Iniciar processo
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
