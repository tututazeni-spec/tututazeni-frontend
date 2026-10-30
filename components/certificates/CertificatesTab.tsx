// components/certificates/CertificatesTab.tsx
// Lista administrativa de certificados com pesquisa, filtros, ordenação e
// paginação no servidor. Acções reais: descarregar PDF (válidos/expirados) e
// aprovar, revogar, reemitir e reenviar (só quem gere), mais importação de
// certificados externos e emissão em lote.

'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import {
  Building2,
  Download,
  FileUp,
  Filter,
  Layers,
  MapPin,
  Route,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { usePdfDownload } from '@/hooks/usePdfDownload';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Pagination } from '@/components/ui/Pagination';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { ImportExternalModal } from './ImportExternalModal';
import { BatchIssueModal } from './BatchIssueModal';
import { ReconcilePathsModal } from './ReconcilePathsModal';
import { ReasonDialog } from './ReasonDialog';
import { ExportMenu } from './ExportMenu';
import { KIND_LABEL, STATUS_INTENT, STATUS_LABEL } from './labels';
import type {
  ActivityKind,
  AdminCertificateRow,
  EffectiveStatus,
  Paginated,
} from './types';

const ALL = '__all__';

const STATUS_ITEMS = [
  { value: ALL, label: 'Todos os estados' },
  { value: 'ACTIVE', label: 'Válidos' },
  { value: 'PENDING_APPROVAL', label: 'Aguardam aprovação' },
  { value: 'EXPIRED', label: 'Expirados' },
  { value: 'REVOKED', label: 'Revogados' },
];

const KIND_ITEMS = [
  { value: ALL, label: 'Todos os tipos' },
  { value: 'COURSE', label: KIND_LABEL.COURSE },
  { value: 'EVENT', label: KIND_LABEL.EVENT },
  { value: 'TRAINING', label: KIND_LABEL.TRAINING },
  { value: 'LEARNING_PATH', label: KIND_LABEL.LEARNING_PATH },
];

const SORT_ITEMS = [
  { value: 'issuedAt:desc', label: 'Mais recentes' },
  { value: 'issuedAt:asc', label: 'Mais antigos' },
  { value: 'expiresAt:asc', label: 'Validade a terminar primeiro' },
  { value: 'holderName:asc', label: 'Nome do titular (A–Z)' },
];

type RowAction = 'approve' | 'revoke' | 'reissue' | 'resend';

interface RowActionsProps {
  row: AdminCertificateRow;
  canManage: boolean;
  canApprove: boolean;
  onAction: (action: RowAction, row: AdminCertificateRow) => void;
}

function RowActions({ row, canManage, canApprove, onAction }: RowActionsProps) {
  const { download, loading, error } = usePdfDownload(
    'certificate',
    String(row.id),
  );
  const downloadable = row.status === 'ACTIVE' || row.status === 'EXPIRED';
  const live = row.status !== 'REVOKED';
  const reissuable = row.origin === 'INTERNAL' && downloadable;
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-2">
        {downloadable && (
          <Button
            intent="secondary"
            size="sm"
            onClick={() => void download()}
            disabled={loading}
          >
            <Download size={14} strokeWidth={1.75} />
            Descarregar PDF
          </Button>
        )}
        {canApprove && row.status === 'PENDING_APPROVAL' && (
          <Button size="sm" onClick={() => onAction('approve', row)}>
            Aprovar
          </Button>
        )}
        {canManage && row.status === 'ACTIVE' && (
          <Button
            intent="secondary"
            size="sm"
            onClick={() => onAction('resend', row)}
          >
            Reenviar
          </Button>
        )}
        {canManage && reissuable && (
          <Button
            intent="secondary"
            size="sm"
            onClick={() => onAction('reissue', row)}
          >
            Reemitir
          </Button>
        )}
        {canManage && live && (
          <Button
            intent="danger"
            size="sm"
            onClick={() => onAction('revoke', row)}
          >
            Revogar
          </Button>
        )}
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

export interface CertificatesTabProps {
  /** ADMIN/RH: revogar, reemitir, reenviar, importar e emitir em lote. */
  canManage: boolean;
  /** ADMIN/RH e gestores (só da sua equipa — o servidor aplica o âmbito). */
  canApprove: boolean;
  initialStatus?: EffectiveStatus | '';
}

export function CertificatesTab({
  canManage,
  canApprove,
  initialStatus = '',
}: CertificatesTabProps) {
  const confirm = useConfirm();
  const toast = useToast();
  const [filters, setFilters] = useState({
    search: '',
    status: initialStatus as string,
    activityKind: '',
    departmentId: '',
    code: '',
    issuedFrom: '',
    issuedTo: '',
    sort: 'issuedAt:desc',
    page: 1,
  });
  const [searchDraft, setSearchDraft] = useState('');

  // Pesquisa com atraso para não disparar um pedido por tecla.
  useEffect(() => {
    const t = setTimeout(
      () => setFilters((f) => ({ ...f, search: searchDraft.trim(), page: 1 })),
      300,
    );
    return () => clearTimeout(t);
  }, [searchDraft]);

  const set = (patch: Partial<typeof filters>) =>
    setFilters((f) => ({ ...f, page: 1, ...patch }));

  const [sort, order] = filters.sort.split(':');
  const params = {
    search: filters.search || undefined,
    status: filters.status || undefined,
    activityKind: filters.activityKind || undefined,
    departmentId: filters.departmentId || undefined,
    code: filters.code.trim() || undefined,
    issuedFrom: filters.issuedFrom || undefined,
    issuedTo: filters.issuedTo || undefined,
    sort,
    order,
    page: filters.page,
    limit: 20,
  };

  const { data, isLoading, error, refetch } = useApiQuery<
    Paginated<AdminCertificateRow>
  >(queryKeys.certificates.list(params), '/certificates/admin/list', {
    params,
    staleTime: STALE_TIME.DYNAMIC,
    placeholderData: keepPreviousData,
  });

  const deptParams = { limit: 200 };
  const depts = useApiQuery<{ data: { id: number; name: string }[] }>(
    queryKeys.departments.list(deptParams),
    '/departments',
    { params: deptParams, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const deptItems = [
    { value: ALL, label: 'Todos os departamentos' },
    ...(depts.data?.data ?? []).map((d) => ({
      value: String(d.id),
      label: d.name,
    })),
  ];

  const approve = useApiMutation(
    (id: number) => apiClient.post(`/certificates/${id}/approve`),
    {
      invalidateKeys: [
        queryKeys.certificates.all,
        queryKeys.courses.myCertificates(),
      ],
      onSuccess: () =>
        toast({ title: 'Certificado aprovado e emitido.', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const invalidate = [
    queryKeys.certificates.all,
    queryKeys.courses.myCertificates(),
  ];
  const [reasonFor, setReasonFor] = useState<{
    kind: 'revoke' | 'reissue';
    row: AdminCertificateRow;
  } | null>(null);
  const [reasonError, setReasonError] = useState<string | undefined>();
  const [modal, setModal] = useState<'import' | 'batch' | 'paths' | null>(null);

  const withReason = useApiMutation(
    (v: { kind: 'revoke' | 'reissue'; id: number; reason: string }) =>
      apiClient.post(`/certificates/${v.id}/${v.kind}`, { reason: v.reason }),
    {
      invalidateKeys: invalidate,
      onSuccess: (_r, v) => {
        setReasonFor(null);
        setReasonError(undefined);
        toast({
          title:
            v.kind === 'revoke'
              ? 'Certificado revogado.'
              : 'Certificado reemitido.',
          intent: 'success',
        });
      },
      onError: (e) => setReasonError(e.message),
    },
  );

  const resend = useApiMutation(
    (id: number) =>
      apiClient.post<{ notified: boolean; emailed: boolean }>(
        `/certificates/${id}/resend`,
      ),
    {
      onSuccess: (r) =>
        toast({
          title: r.emailed
            ? 'Certificado reenviado ao colaborador (notificação e e-mail).'
            : 'Colaborador notificado. O e-mail não foi enviado.',
          intent: 'success',
        }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  async function onAction(action: RowAction, row: AdminCertificateRow) {
    if (action === 'revoke' || action === 'reissue') {
      setReasonError(undefined);
      setReasonFor({ kind: action, row });
      return;
    }
    const ok = await confirm({
      title:
        action === 'approve'
          ? `Aprovar o certificado de ${row.holderName}?`
          : `Reenviar o certificado a ${row.holderName}?`,
      confirmLabel: action === 'approve' ? 'Aprovar' : 'Reenviar',
    });
    if (!ok) return;
    if (action === 'approve') approve.mutate(row.id);
    else resend.mutate(row.id);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ExportMenu params={params} />
        {canManage && (
          <div className="flex flex-wrap gap-2">
            <Button intent="secondary" onClick={() => setModal('import')}>
              <FileUp size={14} strokeWidth={1.75} />
              Importar certificado externo
            </Button>
            <Button intent="secondary" onClick={() => setModal('paths')}>
              <Route size={14} strokeWidth={1.75} />
              Reconciliar trilhas
            </Button>
            <Button onClick={() => setModal('batch')}>
              <Layers size={14} strokeWidth={1.75} />
              Emitir em lote
            </Button>
          </div>
        )}
      </div>
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            variant="underline"
            placeholder="Pesquisar por titular ou formação"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Código de verificação"
            aria-label="Código de verificação"
            value={filters.code}
            onChange={(e) => set({ code: e.target.value })}
          />
          <Select
            variant="underline"
            icon={MapPin}
            items={STATUS_ITEMS}
            value={filters.status || ALL}
            onValueChange={(v) => set({ status: v === ALL ? '' : v })}
          />
          <Select
            variant="underline"
            icon={Filter}
            items={KIND_ITEMS}
            value={filters.activityKind || ALL}
            onValueChange={(v) => set({ activityKind: v === ALL ? '' : v })}
          />
          <Select
            variant="underline"
            icon={Building2}
            items={deptItems}
            value={filters.departmentId || ALL}
            onValueChange={(v) => set({ departmentId: v === ALL ? '' : v })}
          />
          <Input
            type="date"
            aria-label="Emitidos desde"
            value={filters.issuedFrom}
            onChange={(e) => set({ issuedFrom: e.target.value })}
          />
          <Input
            type="date"
            aria-label="Emitidos até"
            value={filters.issuedTo}
            onChange={(e) => set({ issuedTo: e.target.value })}
          />
          <Select
            items={SORT_ITEMS}
            value={filters.sort}
            onValueChange={(v) => set({ sort: v })}
          />
        </div>
      </Card>

      {isLoading ? (
        <Skeleton rows={4} />
      ) : error ? (
        <QueryError error={error} onRetry={() => void refetch()} />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="Sem certificados"
          description="Nenhum certificado corresponde aos filtros escolhidos."
        />
      ) : (
        <>
          <Table>
            <TableHead className="bg-brand/60 [&_th]:text-white">
              <TableRow className="hover:bg-transparent">
                <TableHeaderCell>Titular</TableHeaderCell>
                <TableHeaderCell>Formação</TableHeaderCell>
                <TableHeaderCell>Departamento</TableHeaderCell>
                <TableHeaderCell>Emissão</TableHeaderCell>
                <TableHeaderCell>Validade</TableHeaderCell>
                <TableHeaderCell>Estado</TableHeaderCell>
                <TableHeaderCell>Código</TableHeaderCell>
                <TableHeaderCell>Acções</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.holderName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{row.title}</span>
                      {row.origin === 'EXTERNAL' && (
                        <Badge intent="neutral" dot={false}>
                          Externo
                        </Badge>
                      )}
                    </div>
                    {row.activityKind && (
                      <div className="text-xs text-ink-muted">
                        {KIND_LABEL[row.activityKind as ActivityKind] ??
                          row.activityKind}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{row.departmentName ?? '—'}</TableCell>
                  <TableCell>{formatDate(row.issuedAt)}</TableCell>
                  <TableCell>{formatDate(row.expiresAt)}</TableCell>
                  <TableCell>
                    <Badge intent={STATUS_INTENT[row.status]}>
                      {STATUS_LABEL[row.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.code}
                  </TableCell>
                  <TableCell>
                    <RowActions
                      row={row}
                      canManage={canManage}
                      canApprove={canApprove}
                      onAction={(a, r) => void onAction(a, r)}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Pagination
            page={data.page}
            totalPages={data.totalPages}
            onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
          />
        </>
      )}

      {reasonFor && (
        <ReasonDialog
          title={
            reasonFor.kind === 'revoke'
              ? `Revogar o certificado de ${reasonFor.row.holderName}`
              : `Reemitir o certificado de ${reasonFor.row.holderName}`
          }
          description={
            reasonFor.kind === 'revoke'
              ? 'O certificado deixa de ser válido de imediato. O registo é preservado.'
              : 'O certificado actual é revogado e é emitido um novo, ligado ao anterior.'
          }
          confirmLabel={reasonFor.kind === 'revoke' ? 'Revogar' : 'Reemitir'}
          pending={withReason.isPending}
          error={reasonError}
          onClose={() => setReasonFor(null)}
          onConfirm={(reason) =>
            withReason.mutate({
              kind: reasonFor.kind,
              id: reasonFor.row.id,
              reason,
            })
          }
        />
      )}
      {modal === 'import' && (
        <ImportExternalModal onClose={() => setModal(null)} />
      )}
      {modal === 'batch' && <BatchIssueModal onClose={() => setModal(null)} />}
      {modal === 'paths' && (
        <ReconcilePathsModal onClose={() => setModal(null)} />
      )}
    </div>
  );
}
