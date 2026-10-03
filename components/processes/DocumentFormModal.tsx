// components/processes/DocumentFormModal.tsx
// Anexar, solicitar ou gerar um documento de processo (docs/Modulo_Processes.md
// §11). O processo guarda REFERÊNCIAS ao repositório central / Biblioteca — o
// ficheiro nunca é copiado; as permissões de acesso são verificadas no backend.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
import { UserPicker } from './UserPicker';
import type {
  DocConfidentiality,
  DocumentSources,
  DocumentTemplate,
  PaginatedInstances,
  ProcessInstance,
} from './types';

export type DocumentFormMode = 'attach' | 'request' | 'generate';

export interface DocumentFormPrefill {
  instanceId?: number;
  name?: string;
  docType?: string;
  /** Pedido (REQUESTED) que o anexo cumpre. */
  requestId?: number;
  stepId?: number;
  required?: boolean;
}

export interface DocumentFormModalProps {
  mode: DocumentFormMode;
  prefill?: DocumentFormPrefill;
  onClose: () => void;
}

const NONE = 'NONE';
const CONF_ITEMS: Array<{ value: DocConfidentiality; label: string }> = [
  { value: 'PUBLIC', label: 'Público' },
  { value: 'INTERNAL', label: 'Interno' },
  { value: 'CONFIDENTIAL', label: 'Confidencial' },
  { value: 'RESTRICTED', label: 'Restrito' },
];
const TITLES: Record<DocumentFormMode, string> = {
  attach: 'Anexar documento',
  request: 'Solicitar documento',
  generate: 'Gerar documento a partir de modelo',
};

type Source = { kind: 'repo'; id: number } | { kind: 'library'; id: string } | null;

export function DocumentFormModal({ mode, prefill, onClose }: DocumentFormModalProps) {
  const notify = useToast();
  const [instanceId, setInstanceId] = useState(prefill?.instanceId ? String(prefill.instanceId) : '');
  const [stepId, setStepId] = useState(prefill?.stepId ? String(prefill.stepId) : NONE);
  const [name, setName] = useState(prefill?.name ?? '');
  const [docType, setDocType] = useState(prefill?.docType ?? '');
  const [required, setRequired] = useState(prefill?.required ?? false);
  const [validUntil, setValidUntil] = useState('');
  const [confidentiality, setConfidentiality] = useState<DocConfidentiality>('INTERNAL');
  const [signature, setSignature] = useState(false);
  const [approverId, setApproverId] = useState('');
  const [requestedFromId, setRequestedFromId] = useState('');
  const [note, setNote] = useState('');
  const [entityType, setEntityType] = useState('');
  const [entityId, setEntityId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [search, setSearch] = useState('');
  const [source, setSource] = useState<Source>(null);
  const debounced = useDebounce(search, 300);

  const { data: instances } = useApiQuery<PaginatedInstances>(
    queryKeys.processes.instances({ picker: true }),
    '/processes/instances/list',
    { params: { limit: 100 }, staleTime: STALE_TIME.DYNAMIC, enabled: !prefill?.instanceId },
  );
  const { data: instance } = useApiQuery<ProcessInstance>(
    queryKeys.processes.instance(Number(instanceId) || 0),
    `/processes/instances/${instanceId}`,
    { staleTime: STALE_TIME.DYNAMIC, enabled: !!instanceId, retry: false },
  );
  const { data: sources } = useApiQuery<DocumentSources>(
    queryKeys.processes.documentSources(debounced),
    '/processes/documents/sources',
    { params: debounced ? { search: debounced } : {}, staleTime: STALE_TIME.DYNAMIC, enabled: mode === 'attach' },
  );
  const { data: templates } = useApiQuery<DocumentTemplate[]>(
    queryKeys.processes.documentTemplates(),
    '/processes/documents/templates',
    { staleTime: STALE_TIME.SEMI_STATIC, enabled: mode === 'generate' },
  );

  const common = () => ({
    ...(stepId !== NONE ? { stepId: Number(stepId) } : {}),
    required,
    ...(validUntil ? { validUntil: new Date(`${validUntil}T23:59:59`).toISOString() } : {}),
    confidentiality,
    signatureRequired: signature,
    ...(approverId ? { approverId: Number(approverId) } : {}),
    ...(entityType.trim() ? { relatedEntityType: entityType.trim() } : {}),
    ...(entityId.trim() ? { relatedEntityId: entityId.trim() } : {}),
  });

  const save = useApiMutation(
    () => {
      const base = `/processes/instances/${instanceId}/documents`;
      if (mode === 'attach') {
        return apiClient.post(base, {
          ...common(),
          ...(source?.kind === 'repo' ? { documentId: source.id } : {}),
          ...(source?.kind === 'library' ? { libraryItemId: source.id } : {}),
          ...(prefill?.requestId ? { requestId: prefill.requestId } : {}),
          ...(name.trim() ? { name: name.trim() } : {}),
          ...(docType.trim() ? { docType: docType.trim() } : {}),
        });
      }
      if (mode === 'request') {
        return apiClient.post(`${base}/request`, {
          ...common(),
          name: name.trim(),
          docType: docType.trim(),
          requestedFromId: Number(requestedFromId),
          ...(note.trim() ? { note: note.trim() } : {}),
        });
      }
      return apiClient.post(`${base}/generate`, {
        ...common(),
        templateId: Number(templateId),
        ...(name.trim() ? { name: name.trim() } : {}),
      });
    },
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: (res) => {
        const unresolved = (res as { unresolved?: string[] } | undefined)?.unresolved ?? [];
        notify({
          title:
            mode === 'attach' ? 'Documento anexado' : mode === 'request' ? 'Pedido enviado' : 'Documento gerado',
          description: unresolved.length ? `Variáveis sem valor: ${unresolved.join(', ')}` : undefined,
          intent: unresolved.length ? 'info' : 'success',
        });
        onClose();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const valid =
    !!instanceId &&
    (mode === 'attach'
      ? source !== null
      : mode === 'request'
        ? name.trim() !== '' && docType.trim() !== '' && requestedFromId !== ''
        : templateId !== '');

  const steps = (instance?.stepProgress ?? []).map((s) => ({
    value: String(s.stepId),
    label: `${s.stepOrder}. ${s.step.title}`,
  }));

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={TITLES[mode]}
        description="O processo guarda uma referência ao documento — o ficheiro não é duplicado."
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <div className="mt-4 space-y-4">
          <FormField label="Processo *" htmlFor="doc-instance">
            {prefill?.instanceId ? (
              <Input id="doc-instance" value={`#${prefill.instanceId}`} disabled />
            ) : (
              <Combobox
                items={(instances?.data ?? []).map((i) => ({
                  value: String(i.id),
                  label: `${i.code} — ${i.name}`,
                }))}
                value={instanceId}
                onValueChange={(v) => {
                  setInstanceId(v);
                  setStepId(NONE);
                }}
                placeholder="Seleccionar processo"
                searchPlaceholder="Pesquisar processo…"
                emptyText="Sem resultados"
              />
            )}
          </FormField>

          {steps.length > 0 && (
            <FormField label="Etapa" htmlFor="doc-step">
              <Select
                items={[{ value: NONE, label: 'Sem etapa específica' }, ...steps]}
                value={stepId}
                onValueChange={setStepId}
                className="w-full"
              />
            </FormField>
          )}

          {mode === 'attach' && (
            <div>
              <FormField label="Documento *" htmlFor="doc-search" hint="Pesquise no repositório central ou na Biblioteca.">
                <Input
                  id="doc-search"
                  type="text"
                  placeholder="Pesquisar por título ou código…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </FormField>
              <div className="mt-2 max-h-48 space-y-1 overflow-y-auto rounded-card border border-border p-1">
                {(sources?.repository ?? []).map((d) => {
                  const active = source?.kind === 'repo' && source.id === d.id;
                  return (
                    <button
                      key={`r${d.id}`}
                      type="button"
                      onClick={() => setSource({ kind: 'repo', id: d.id })}
                      className={cn(
                        'flex w-full items-center justify-between rounded-control px-2 py-1.5 text-left font-body text-sm',
                        active ? 'bg-primary/10 text-primary' : 'hover:bg-surface-sunken',
                      )}
                    >
                      <span className="truncate">
                        {d.title} <span className="text-xs text-ink-faint">{d.documentCode ?? ''}</span>
                      </span>
                      <span className="ml-2 shrink-0 text-xs text-ink-faint">Repositório · v{d.version}</span>
                    </button>
                  );
                })}
                {(sources?.library ?? []).map((l) => {
                  const active = source?.kind === 'library' && source.id === l.id;
                  return (
                    <button
                      key={`l${l.id}`}
                      type="button"
                      onClick={() => setSource({ kind: 'library', id: l.id })}
                      className={cn(
                        'flex w-full items-center justify-between rounded-control px-2 py-1.5 text-left font-body text-sm',
                        active ? 'bg-primary/10 text-primary' : 'hover:bg-surface-sunken',
                      )}
                    >
                      <span className="truncate">
                        {l.title} <span className="text-xs text-ink-faint">{l.code}</span>
                      </span>
                      <span className="ml-2 shrink-0 text-xs text-ink-faint">Biblioteca · v{l.version}</span>
                    </button>
                  );
                })}
                {sources && sources.repository.length + sources.library.length === 0 && (
                  <p className="p-3 text-center font-body text-sm text-ink-faint">Sem resultados.</p>
                )}
              </div>
            </div>
          )}

          {mode === 'generate' && (
            <FormField label="Modelo *" htmlFor="doc-template">
              <Select
                items={(templates ?? []).map((t) => ({ value: String(t.id), label: t.name }))}
                value={templateId}
                onValueChange={(v) => {
                  setTemplateId(v);
                  if (!name) setName((templates ?? []).find((t) => String(t.id) === v)?.name ?? '');
                }}
                placeholder="Seleccionar modelo"
                className="w-full"
              />
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FormField label={mode === 'request' ? 'Nome *' : 'Nome'} htmlFor="doc-name">
              <Input id="doc-name" value={name} onChange={(e) => setName(e.target.value)} />
            </FormField>
            {mode !== 'generate' && (
              <FormField label={mode === 'request' ? 'Tipo documental *' : 'Tipo documental'} htmlFor="doc-type">
                <Input
                  id="doc-type"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  placeholder="Ex.: Contrato, Declaração"
                />
              </FormField>
            )}
            <FormField label="Data de validade" htmlFor="doc-valid">
              <Input id="doc-valid" type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </FormField>
            <FormField label="Confidencialidade" htmlFor="doc-conf">
              <Select
                items={CONF_ITEMS}
                value={confidentiality}
                onValueChange={(v) => setConfidentiality(v as DocConfidentiality)}
                className="w-full"
              />
            </FormField>
            <FormField label="Entidade relacionada (tipo)" htmlFor="doc-entity-type">
              <Input id="doc-entity-type" value={entityType} onChange={(e) => setEntityType(e.target.value)} placeholder="Ex.: Employee" />
            </FormField>
            <FormField label="Entidade relacionada (id)" htmlFor="doc-entity-id">
              <Input id="doc-entity-id" value={entityId} onChange={(e) => setEntityId(e.target.value)} />
            </FormField>
          </div>

          <FormField label="Responsável pela aprovação" htmlFor="doc-approver" hint="Por defeito, o dono do modelo do processo.">
            <UserPicker value={approverId} onChange={setApproverId} placeholder="Dono do modelo (por defeito)" className="w-full" />
          </FormField>

          {mode === 'request' && (
            <>
              <FormField label="Quem deve entregar *" htmlFor="doc-from">
                <UserPicker value={requestedFromId} onChange={setRequestedFromId} className="w-full" />
              </FormField>
              <FormField label="Nota para o destinatário" htmlFor="doc-note">
                <Textarea id="doc-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="w-full" />
              </FormField>
            </>
          )}

          <div className="flex flex-wrap gap-6 font-body text-sm text-ink-muted">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={required} onChange={(e) => setRequired(e.target.checked)} />
              Documento obrigatório
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={signature} onChange={(e) => setSignature(e.target.checked)} />
              Exige assinatura
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={save.isPending}>
            Cancelar
          </Button>
          <Button disabled={!valid} loading={save.isPending} onClick={() => save.mutate(undefined)}>
            {mode === 'attach' ? 'Anexar' : mode === 'request' ? 'Enviar pedido' : 'Gerar'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
