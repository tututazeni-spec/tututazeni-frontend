// components/audit/ExportsView.tsx
// Aba 08 «Exportações e Evidências» (docs/modulo_audit.md §11): ficheiros de
// auditoria produzidos e evidências de investigação. Os ficheiros só saem por
// descarga autenticada (nunca por link público), com hash SHA-256 verificado e
// histórico de acessos.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import {
  AlertCircle,
  Archive,
  Download,
  Files,
  FileCheck2,
  HardDrive,
  Paperclip,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { CONFIDENTIALITY_ITEMS } from './ReportsView';
import { downloadAuditFile } from './downloadAuditFile';
import { fmtTs } from './utils';
import type {
  AuditExportDetail,
  AuditExportItem,
  AuditExportsSummary,
  Paginated,
} from './types';

const MAX_EVIDENCE_BYTES = 5 * 1024 * 1024;

const KIND_ITEMS = [
  { value: 'ALL', label: 'Relatórios e evidências' },
  { value: 'REPORT', label: 'Relatórios exportados' },
  { value: 'EVIDENCE', label: 'Evidências' },
];
const STATUS_ITEMS = [
  { value: 'ALL', label: 'Todos os estados' },
  { value: 'ACTIVE', label: 'Ativos' },
  { value: 'EXPIRED', label: 'Expirados' },
  { value: 'PURGED', label: 'Eliminados' },
];
const FORMAT_ITEMS = [
  { value: 'ALL', label: 'Todos os formatos' },
  { value: 'pdf', label: 'PDF' },
  { value: 'xlsx', label: 'XLSX' },
  { value: 'csv', label: 'CSV' },
  { value: 'other', label: 'Outro' },
];
const CONF_FILTER = [
  { value: 'ALL', label: 'Toda a confidencialidade' },
  ...CONFIDENTIALITY_ITEMS,
];

const CONF_BADGE: Record<string, 'info' | 'warning' | 'danger'> = {
  INTERNAL: 'info',
  CONFIDENTIAL: 'warning',
  RESTRICTED: 'danger',
};
const CONF_LABEL = Object.fromEntries(
  CONFIDENTIALITY_ITEMS.map((c) => [c.value, c.label]),
);
const STATUS_BADGE: Record<
  string,
  { label: string; intent: 'success' | 'warning' | 'neutral' }
> = {
  ACTIVE: { label: 'Ativo', intent: 'success' },
  EXPIRED: { label: 'Expirado', intent: 'warning' },
  PURGED: { label: 'Eliminado', intent: 'neutral' },
};
const ACCESS_LABEL: Record<string, string> = {
  VIEW: 'Consulta',
  DOWNLOAD: 'Descarga',
  DENIED: 'Acesso negado',
};

const fmtSize = (n: number) =>
  n < 1024
    ? `${n} B`
    : n < 1024 * 1024
      ? `${(n / 1024).toFixed(1)} KB`
      : `${(n / 1024 / 1024).toFixed(1)} MB`;
const fmtDay = (d: string | null) => (d ? d.slice(0, 10) : '—');

function readBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
    r.onerror = () => reject(new Error('Não foi possível ler o ficheiro'));
    r.readAsDataURL(file);
  });
}

// ── Anexar evidência ────────────────────────────────────────────────────────

function EvidenceModal({ onClose }: { onClose: () => void }) {
  const notify = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [target, setTarget] = useState<'incidentId' | 'auditId'>('incidentId');
  const [refId, setRefId] = useState('');
  const [conf, setConf] = useState('RESTRICTED');
  const [error, setError] = useState('');

  const upload = useApiMutation(
    async () => {
      const contentBase64 = await readBase64(file as File);
      return apiClient.post('/audit/exports/evidence', {
        fileName: (file as File).name,
        mimeType: (file as File).type || undefined,
        contentBase64,
        [target]: Number(refId),
        confidentiality: conf,
      });
    },
    {
      invalidateKeys: [queryKeys.audit.all],
      onSuccess: () => {
        notify({ title: 'Evidência anexada', intent: 'success' });
        onClose();
      },
      onError: (e) => setError(e.message),
    },
  );

  const submit = () => {
    if (!file) return setError('Escolha o ficheiro');
    if (file.size > MAX_EVIDENCE_BYTES)
      return setError('Ficheiro acima do limite de 5 MB');
    if (!refId || Number(refId) < 1)
      return setError('Indique o ID do incidente ou da auditoria');
    setError('');
    upload.mutate(undefined);
  };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent title="Anexar evidência" className="max-w-md">
        <div className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}
          <FormField label="Ficheiro * (máx. 5 MB)" htmlFor="ev-file">
            <input
              id="ev-file"
              type="file"
              className="w-full font-body text-xs"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Associar a" htmlFor="ev-target">
              <Select
                items={[
                  { value: 'incidentId', label: 'Incidente' },
                  { value: 'auditId', label: 'Auditoria' },
                ]}
                value={target}
                onValueChange={(v) => setTarget(v as typeof target)}
              />
            </FormField>
            <FormField label="ID *" htmlFor="ev-ref">
              <Input
                id="ev-ref"
                type="number"
                min={1}
                value={refId}
                onChange={(e) => setRefId(e.target.value)}
              />
            </FormField>
          </div>
          <FormField label="Confidencialidade" htmlFor="ev-conf">
            <Select
              items={CONFIDENTIALITY_ITEMS}
              value={conf}
              onValueChange={setConf}
            />
          </FormField>
          <div className="flex justify-end gap-2 pt-2">
            <Button intent="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button loading={upload.isPending} onClick={submit}>
              Anexar
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

// ── Detalhe ─────────────────────────────────────────────────────────────────

function ExportModal({
  exportId,
  onClose,
}: {
  exportId: number;
  onClose: () => void;
}) {
  const notify = useToast();
  const { data: item } = useApiQuery<AuditExportDetail>(
    queryKeys.audit.exportDetail(exportId),
    `/audit/exports/${exportId}`,
    { staleTime: 0 },
  );
  const [conf, setConf] = useState<string | null>(null);
  const [until, setUntil] = useState('');
  const [busy, setBusy] = useState(false);

  const fail = (e: unknown, title: string) =>
    notify({
      title,
      description: e instanceof Error ? e.message : undefined,
      intent: 'danger',
    });

  const update = useApiMutation(
    () =>
      apiClient.patch(`/audit/exports/${exportId}`, {
        confidentiality: conf ?? undefined,
        retentionUntil: until
          ? new Date(`${until}T23:59:59`).toISOString()
          : undefined,
      }),
    {
      invalidateKeys: [queryKeys.audit.all],
      onSuccess: () => {
        setConf(null);
        setUntil('');
        notify({ title: 'Ficheiro actualizado', intent: 'success' });
      },
      onError: (e) => fail(e, 'Não foi possível actualizar'),
    },
  );
  const verify = useApiMutation(
    () =>
      apiClient.get<{ valid: boolean | null; reason?: string }>(
        `/audit/exports/${exportId}/verify`,
      ),
    {
      onSuccess: (r) =>
        notify({
          title:
            r.valid === null
              ? (r.reason ?? 'Sem conteúdo para verificar')
              : r.valid
                ? 'Integridade confirmada'
                : 'Integridade comprometida',
          intent: r.valid ? 'success' : 'danger',
        }),
      onError: (e) => fail(e, 'Não foi possível verificar'),
    },
  );

  const download = async () => {
    setBusy(true);
    try {
      await downloadAuditFile(
        `/audit/exports/${exportId}/download`,
        {},
        item?.fileName,
      );
    } catch (e) {
      fail(e, 'Não foi possível descarregar');
    } finally {
      setBusy(false);
    }
  };

  const downloadable = item?.status === 'ACTIVE';

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={item ? `${item.code} — ${item.fileName}` : 'Ficheiro'}
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        {!item ? (
          <Skeleton rows={5} />
        ) : (
          <div className="mt-4 space-y-5 font-body text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <Badge intent={STATUS_BADGE[item.status].intent}>
                {STATUS_BADGE[item.status].label}
              </Badge>
              <Badge intent={CONF_BADGE[item.confidentiality]}>
                {CONF_LABEL[item.confidentiality]}
              </Badge>
              <span className="text-ink-muted">
                {item.kind === 'REPORT' ? 'Relatório' : 'Evidência'} ·{' '}
                {item.format.toUpperCase()} · {fmtSize(item.sizeBytes)}
              </span>
            </div>

            <dl className="grid grid-cols-[150px_1fr] gap-y-1 text-ink">
              <dt className="text-ink-faint">Autor</dt>
              <dd>{item.author?.fullName ?? '—'}</dd>
              <dt className="text-ink-faint">Criado em</dt>
              <dd>{fmtTs(item.createdAt)}</dd>
              <dt className="text-ink-faint">Relatório / origem</dt>
              <dd>
                {item.reportType ??
                  (item.incidentId
                    ? `Incidente #${item.incidentId}`
                    : item.auditId
                      ? `Auditoria #${item.auditId}`
                      : '—')}
              </dd>
              <dt className="text-ink-faint">Período</dt>
              <dd>
                {fmtDay(item.periodFrom)} a {fmtDay(item.periodTo)}
              </dd>
              <dt className="text-ink-faint">Registos</dt>
              <dd>{item.recordCount}</dd>
              <dt className="text-ink-faint">Retenção até</dt>
              <dd>{fmtDay(item.retentionUntil)}</dd>
              <dt className="text-ink-faint">SHA-256</dt>
              <dd className="break-all font-data">{item.sha256}</dd>
              {item.filters && (
                <>
                  <dt className="text-ink-faint">Filtros aplicados</dt>
                  <dd className="break-all font-data">
                    {JSON.stringify(item.filters)}
                  </dd>
                </>
              )}
            </dl>

            <div className="flex flex-wrap gap-2">
              <Button
                loading={busy}
                disabled={!downloadable}
                onClick={download}
              >
                <Download size={14} strokeWidth={1.75} className="mr-1.5" />
                Descarregar
              </Button>
              <Button
                intent="secondary"
                loading={verify.isPending}
                disabled={item.status === 'PURGED'}
                onClick={() => verify.mutate(undefined)}
              >
                <ShieldCheck size={14} strokeWidth={1.75} className="mr-1.5" />
                Verificar integridade
              </Button>
            </div>

            {item.status !== 'PURGED' && (
              <div className="grid grid-cols-2 gap-3 rounded-card border border-border p-3">
                <FormField label="Confidencialidade" htmlFor="ex-conf">
                  <Select
                    items={CONFIDENTIALITY_ITEMS}
                    value={conf ?? item.confidentiality}
                    onValueChange={setConf}
                  />
                </FormField>
                <FormField
                  label="Prolongar retenção até"
                  htmlFor="ex-until"
                  hint="Só pode ser prolongada."
                >
                  <Input
                    id="ex-until"
                    type="date"
                    value={until}
                    onChange={(e) => setUntil(e.target.value)}
                  />
                </FormField>
                <div className="col-span-2 flex justify-end">
                  <Button
                    intent="secondary"
                    loading={update.isPending}
                    disabled={
                      !until && (conf === null || conf === item.confidentiality)
                    }
                    onClick={() => update.mutate(undefined)}
                  >
                    Guardar alterações
                  </Button>
                </div>
              </div>
            )}

            <div>
              <div className="mb-2 font-medium uppercase tracking-wide text-ink-faint">
                Histórico de acessos
              </div>
              {item.accesses.length === 0 ? (
                <p className="text-ink-faint">Sem acessos registados.</p>
              ) : (
                item.accesses.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 border-b border-border py-1.5 last:border-0"
                  >
                    <span className="w-28 text-ink">
                      {ACCESS_LABEL[a.action] ?? a.action}
                    </span>
                    <span className="flex-1 text-ink-muted">
                      {a.user?.fullName ?? '—'}
                    </span>
                    <span className="font-data text-ink-faint">
                      {a.ip ?? ''}
                    </span>
                    <span className="text-ink-faint">{fmtTs(a.createdAt)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
}

// ── Aba ─────────────────────────────────────────────────────────────────────

export function ExportsView() {
  const notify = useToast();
  const role = useCurrentRole();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    kind: '',
    status: '',
    format: '',
    confidentiality: '',
  });
  const [openId, setOpenId] = useState<number | null>(null);
  const [attach, setAttach] = useState(false);

  const set = (patch: Partial<typeof filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };
  const pick = (key: keyof typeof filters) => (v: string) =>
    set({ [key]: v === 'ALL' ? '' : v });

  const { data: summary } = useApiQuery<AuditExportsSummary>(
    queryKeys.audit.exportsSummary(),
    '/audit/exports/summary',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const { data, isLoading } = useApiQuery<Paginated<AuditExportItem>>(
    queryKeys.audit.exports({ ...filters, page }),
    '/audit/exports',
    {
      params: { ...filters, page, limit: 20 },
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  const purge = useApiMutation(
    () => apiClient.post<{ purged: number }>('/audit/exports/purge-expired'),
    {
      invalidateKeys: [queryKeys.audit.all],
      onSuccess: (r) =>
        notify({
          title: `${r.purged} ficheiro(s) eliminado(s)`,
          description: 'O conteúdo foi apagado; o registo mantém-se.',
          intent: 'success',
        }),
      onError: (e) =>
        notify({
          title: 'Não foi possível eliminar',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard
          icon={Files}
          label="Relatórios exportados"
          value={summary?.reports ?? 0}
        />
        <KpiCard
          icon={Paperclip}
          label="Evidências"
          value={summary?.evidences ?? 0}
        />
        <KpiCard
          icon={Archive}
          label="Expirados"
          value={summary?.expired ?? 0}
          intent={summary && summary.expired > 0 ? 'warning' : 'primary'}
          sub="A eliminar pela política"
        />
        <KpiCard
          icon={HardDrive}
          label="Espaço ocupado"
          value={fmtSize(summary?.sizeBytes ?? 0)}
        />
      </div>

      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Select
            items={KIND_ITEMS}
            value={filters.kind || 'ALL'}
            onValueChange={pick('kind')}
            className="w-56"
          />
          <Select
            items={FORMAT_ITEMS}
            value={filters.format || 'ALL'}
            onValueChange={pick('format')}
            className="w-44"
          />
          <Select
            items={CONF_FILTER}
            value={filters.confidentiality || 'ALL'}
            onValueChange={pick('confidentiality')}
            className="w-52"
          />
          <Select
            items={STATUS_ITEMS}
            value={filters.status || 'ALL'}
            onValueChange={pick('status')}
            className="w-44"
          />
          <div className="ml-auto flex gap-2">
            <Button intent="secondary" onClick={() => setAttach(true)}>
              <Paperclip size={14} strokeWidth={1.75} className="mr-1.5" />
              Anexar evidência
            </Button>
            {role === 'ADMIN' && (
              <Button
                intent="danger"
                loading={purge.isPending}
                disabled={!summary?.expired}
                onClick={() => purge.mutate(undefined)}
              >
                <Trash2 size={14} strokeWidth={1.75} className="mr-1.5" />
                Eliminar expirados
              </Button>
            )}
          </div>
        </div>

        {isLoading || !data ? (
          <Skeleton rows={8} />
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    {[
                      'Código',
                      'Ficheiro',
                      'Tipo',
                      'Autor',
                      'Criado em',
                      'Registos',
                      'Confidencialidade',
                      'Retenção até',
                      'Estado',
                    ].map((h) => (
                      <TableHeaderCell key={h}>{h}</TableHeaderCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data.map((e) => (
                    <tr
                      key={e.id}
                      onClick={() => setOpenId(e.id)}
                      className="cursor-pointer border-b border-border last:border-0 hover:bg-surface-sunken"
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 font-data text-xs text-ink">
                        {e.code}
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-2.5 font-body text-xs text-ink">
                        {e.fileName}
                      </td>
                      <td className="px-3 py-2.5 font-body text-xs text-ink-muted">
                        {e.kind === 'REPORT' ? 'Relatório' : 'Evidência'} ·{' '}
                        {e.format.toUpperCase()}
                      </td>
                      <td className="px-3 py-2.5 font-body text-xs text-ink-muted">
                        {e.author?.fullName ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-body text-xs text-ink-muted">
                        {fmtTs(e.createdAt)}
                      </td>
                      <td className="px-3 py-2.5 font-body text-xs text-ink-muted">
                        {e.recordCount}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge intent={CONF_BADGE[e.confidentiality]}>
                          {CONF_LABEL[e.confidentiality]}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 font-body text-xs text-ink-muted">
                        {fmtDay(e.retentionUntil)}
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge intent={STATUS_BADGE[e.status].intent}>
                          {STATUS_BADGE[e.status].label}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {data.data.length === 0 && (
                    <TableRow>
                      <td
                        colSpan={9}
                        className="px-4 py-10 text-center font-body text-sm text-ink-faint"
                      >
                        <FileCheck2
                          size={20}
                          strokeWidth={1.5}
                          className="mx-auto mb-2"
                        />
                        Ainda sem exportações ou evidências
                      </td>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <Pagination
              page={page}
              totalPages={data.totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </div>

      {openId !== null && (
        <ExportModal exportId={openId} onClose={() => setOpenId(null)} />
      )}
      {attach && <EvidenceModal onClose={() => setAttach(false)} />}
    </div>
  );
}
