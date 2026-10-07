// components/processes/DocumentsView.tsx
// Aba «Documentos» (docs/Modulo_Processes.md §11): documentos associados aos
// processos e etapas, integrados com o repositório central e a Biblioteca
// (guardam-se referências, não ficheiros). Filtros, validade, pedidos de
// documentos em falta, validação de anexos obrigatórios e acções de ciclo de
// vida (DocumentPanel).

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { FilePlus2, FileText, Send, Sparkles } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { CONFIDENTIALITY_MAP, DOC_STATUS_MAP, REQUIREMENT_MAP } from './constants';
import { DocumentFormModal, type DocumentFormMode, type DocumentFormPrefill } from './DocumentFormModal';
import { DocumentPanel } from './DocumentPanel';
import { Skeleton } from './Skeleton';
import type {
  InstanceDocuments,
  PaginatedInstances,
  PaginatedProcessDocuments,
  ProcessDocumentRow,
} from './types';

export interface DocumentsViewProps {
  canManage: boolean;
  onOpenInstance: (instanceId: number) => void;
}

const ALL = 'ALL';
const STATUS_ITEMS = [
  { value: ALL, label: 'Todos os estados' },
  { value: 'REQUESTED', label: 'Pedidos' },
  { value: 'PENDING', label: 'Por validar' },
  { value: 'APPROVED', label: 'Validados' },
  { value: 'REJECTED', label: 'Rejeitados' },
  { value: 'EXPIRING', label: 'A expirar (30 dias)' },
  { value: 'EXPIRED', label: 'Expirados' },
];
const CONF_ITEMS = [
  { value: ALL, label: 'Qualquer confidencialidade' },
  { value: 'PUBLIC', label: 'Público' },
  { value: 'INTERNAL', label: 'Interno' },
  { value: 'CONFIDENTIAL', label: 'Confidencial' },
  { value: 'RESTRICTED', label: 'Restrito' },
];
const ASSIGNED_ITEMS = [
  { value: ALL, label: 'Todos' },
  { value: 'approver', label: 'Para eu validar' },
  { value: 'requested', label: 'Pedidos para mim' },
  { value: 'mine', label: 'Anexados por mim' },
];

function SummaryTile({
  label,
  value,
  tone,
  active,
  onClick,
}: {
  label: string;
  value: number;
  tone: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-card border bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-sunken',
        active ? 'border-primary' : 'border-border',
      )}
    >
      <div className="font-body text-xs uppercase tracking-wide text-ink-faint">{label}</div>
      <div className={cn('font-display text-2xl font-semibold', value > 0 ? tone : 'text-ink')}>{value}</div>
    </button>
  );
}

export function DocumentsView({ canManage, onOpenInstance }: DocumentsViewProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(ALL);
  const [confidentiality, setConfidentiality] = useState(ALL);
  const [assigned, setAssigned] = useState(ALL);
  const [instanceId, setInstanceId] = useState('');
  const [required, setRequired] = useState(false);
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState<ProcessDocumentRow | null>(null);
  const [form, setForm] = useState<{ mode: DocumentFormMode; prefill?: DocumentFormPrefill } | null>(null);
  const debounced = useDebounce(search, 300);

  const params = {
    page,
    limit: 15,
    ...(debounced ? { search: debounced } : {}),
    ...(status !== ALL ? { status } : {}),
    ...(confidentiality !== ALL ? { confidentiality } : {}),
    ...(assigned !== ALL ? { assigned } : {}),
    ...(instanceId ? { instanceId } : {}),
    ...(required ? { required: true } : {}),
    ...(archived ? { archived: true } : {}),
  };
  const { data, isLoading, error } = useApiQuery<PaginatedProcessDocuments>(
    queryKeys.processes.documents(params),
    '/processes/documents',
    { params, staleTime: STALE_TIME.DYNAMIC, placeholderData: keepPreviousData },
  );
  const { data: instances } = useApiQuery<PaginatedInstances>(
    queryKeys.processes.instances({ picker: true }),
    '/processes/instances/list',
    { params: { limit: 100 }, staleTime: STALE_TIME.DYNAMIC },
  );
  const { data: reqs } = useApiQuery<InstanceDocuments>(
    queryKeys.processes.instanceDocuments(Number(instanceId) || 0),
    `/processes/instances/${instanceId}/documents`,
    { staleTime: STALE_TIME.DYNAMIC, enabled: !!instanceId },
  );

  const reset = () => setPage(1);
  const summary = data?.summary;
  const tile = (key: string) => status === key;

  return (
    <div className="space-y-4">
      {/* Resumo */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryTile
          label="Pedidos por entregar"
          value={summary?.requested ?? 0}
          tone="text-warning-ink"
          active={tile('REQUESTED')}
          onClick={() => {
            setStatus(tile('REQUESTED') ? ALL : 'REQUESTED');
            reset();
          }}
        />
        <SummaryTile
          label="Por validar"
          value={summary?.pending ?? 0}
          tone="text-info-ink"
          active={tile('PENDING')}
          onClick={() => {
            setStatus(tile('PENDING') ? ALL : 'PENDING');
            reset();
          }}
        />
        <SummaryTile
          label="A expirar (30 dias)"
          value={summary?.expiring ?? 0}
          tone="text-warning-ink"
          active={tile('EXPIRING')}
          onClick={() => {
            setStatus(tile('EXPIRING') ? ALL : 'EXPIRING');
            reset();
          }}
        />
        <SummaryTile
          label="Expirados"
          value={summary?.expired ?? 0}
          tone="text-danger-ink"
          active={tile('EXPIRED')}
          onClick={() => {
            setStatus(tile('EXPIRED') ? ALL : 'EXPIRED');
            reset();
          }}
        />
      </div>

      {/* Acções */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Input
            type="text"
            placeholder="Pesquisar documento, tipo ou processo…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              reset();
            }}
            className="min-w-[160px] flex-1"
          />
          <Select
            items={STATUS_ITEMS}
            value={status}
            onValueChange={(v) => {
              setStatus(v);
              reset();
            }}
            className="w-48"
          />
          <Select
            items={CONF_ITEMS}
            value={confidentiality}
            onValueChange={(v) => {
              setConfidentiality(v);
              reset();
            }}
            className="w-56"
          />
          <Select
            items={ASSIGNED_ITEMS}
            value={assigned}
            onValueChange={(v) => {
              setAssigned(v);
              reset();
            }}
            className="w-44"
          />
          <div className="w-64">
            <Combobox
              items={[
                { value: ALL, label: 'Todos os processos' },
                ...(instances?.data ?? []).map((i) => ({
                  value: String(i.id),
                  label: `${i.code} — ${i.name}`,
                })),
              ]}
              value={instanceId || ALL}
              onValueChange={(v) => {
                setInstanceId(v === ALL ? '' : v);
                reset();
              }}
              placeholder="Todos os processos"
              searchPlaceholder="Pesquisar processo…"
              emptyText="Sem resultados"
            />
          </div>
          <label className="flex items-center gap-2 font-body text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={required}
              onChange={(e) => {
                setRequired(e.target.checked);
                reset();
              }}
            />
            Obrigatórios
          </label>
          <label className="flex items-center gap-2 font-body text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={archived}
              onChange={(e) => {
                setArchived(e.target.checked);
                reset();
              }}
            />
            Arquivados
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => setForm({ mode: 'attach', prefill: instanceId ? { instanceId: Number(instanceId) } : undefined })}
          >
            <FilePlus2 size={14} strokeWidth={1.75} />
            Anexar
          </Button>
          <Button
            size="sm"
            intent="secondary"
            onClick={() => setForm({ mode: 'request', prefill: instanceId ? { instanceId: Number(instanceId) } : undefined })}
          >
            <Send size={14} strokeWidth={1.75} />
            Solicitar
          </Button>
          {canManage && (
            <Button
              size="sm"
              intent="secondary"
              onClick={() => setForm({ mode: 'generate', prefill: instanceId ? { instanceId: Number(instanceId) } : undefined })}
            >
              <Sparkles size={14} strokeWidth={1.75} />
              Gerar de modelo
            </Button>
          )}
        </div>
      </div>

      {/* Documentos obrigatórios do processo seleccionado */}
      {instanceId && reqs && reqs.requirements.length > 0 && (
        <div className="rounded-card border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="font-body text-sm font-medium text-ink">
              Documentos obrigatórios — {reqs.instance.code ?? `#${reqs.instance.id}`}
            </div>
            <span className={cn('font-body text-xs', reqs.missing ? 'text-warning-ink' : 'text-success-ink')}>
              {reqs.missing ? `${reqs.missing} por cumprir` : 'Todos validados'}
            </span>
          </div>
          <ul className="space-y-1.5">
            {reqs.requirements.map((r) => (
              <li key={r.name} className="flex items-center justify-between gap-3 font-body text-sm">
                <span className="text-ink">{r.name}</span>
                <span className="flex items-center gap-3">
                  <StatusBadge value={r.state} map={REQUIREMENT_MAP} variant="dot" />
                  {r.state === 'MISSING' && (
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() =>
                        setForm({
                          mode: 'request',
                          prefill: { instanceId: Number(instanceId), name: r.name, docType: r.name, required: true },
                        })
                      }
                    >
                      Solicitar
                    </button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lista */}
      <div className="overflow-x-auto rounded-card border border-border bg-surface">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[2fr_1.5fr_1fr_110px_120px_120px] gap-3 border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            <div>Documento</div>
            <div>Processo / etapa</div>
            <div>Tipo · versão</div>
            <div>Validade</div>
            <div>Confidencial.</div>
            <div>Estado</div>
          </div>

          {isLoading && (
            <div className="p-4">
              <Skeleton rows={4} />
            </div>
          )}
          {error && <div className="px-4 py-8 text-center font-body text-sm text-danger">{error.message}</div>}
          {!isLoading && data?.data.length === 0 && (
            <EmptyState
              icon={FileText}
              title="Sem documentos"
              description="Nenhum documento corresponde aos filtros. Anexe um documento do repositório ou solicite um em falta."
            />
          )}

          {data?.data.map((d) => (
            <div
              key={d.id}
              className="grid cursor-pointer grid-cols-[2fr_1.5fr_1fr_110px_120px_120px] items-center gap-3 border-b border-border px-4 py-3.5 last:border-0 hover:bg-surface-sunken"
              onClick={() => setOpen(d)}
            >
              <div className="min-w-0">
                <div className="truncate font-body text-sm font-medium text-ink">
                  {d.name}
                  {d.required && <span className="ml-2 text-xs font-normal text-primary">obrigatório</span>}
                </div>
                <div className="truncate font-body text-xs text-ink-faint">
                  {d.source?.kind === 'REPOSITORY' ? 'Repositório' : d.source?.kind === 'LIBRARY' ? 'Biblioteca' : d.generated ? 'Gerado de modelo' : 'Aguarda ficheiro'}
                  {d.requestedFrom && d.validationStatus === 'REQUESTED' ? ` · pedido a ${d.requestedFrom.fullName}` : ''}
                </div>
              </div>
              <div className="min-w-0 font-body text-xs text-ink-muted">
                <div className="truncate">{d.instance.title}</div>
                <div className="text-ink-faint">
                  {d.instance.code}
                  {d.stepId ? ` · etapa #${d.stepId}` : ''}
                </div>
              </div>
              <div className="font-body text-xs text-ink-muted">
                <div className="truncate">{d.docType}</div>
                <div className="text-ink-faint">v{d.version}</div>
              </div>
              <div
                className={cn(
                  'font-body text-xs',
                  d.expired ? 'font-medium text-danger' : d.expiringSoon ? 'text-warning-ink' : 'text-ink-muted',
                )}
              >
                {formatDate(d.validUntil)}
                {d.expiringSoon && <div>em {d.daysLeft} d</div>}
              </div>
              <div>
                <StatusBadge value={d.confidentiality} map={CONFIDENTIALITY_MAP} />
              </div>
              <div>
                <StatusBadge value={d.effectiveStatus} map={DOC_STATUS_MAP} variant="dot" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}

      {open && (
        <DocumentPanel
          doc={open}
          onClose={() => setOpen(null)}
          onOpenInstance={onOpenInstance}
          onFulfil={(d) => {
            setOpen(null);
            setForm({
              mode: 'attach',
              prefill: {
                instanceId: d.instance.id,
                name: d.name,
                docType: d.docType,
                requestId: d.id,
                stepId: d.stepId ?? undefined,
                required: d.required,
              },
            });
          }}
        />
      )}
      {form && <DocumentFormModal mode={form.mode} prefill={form.prefill} onClose={() => setForm(null)} />}
    </div>
  );
}
