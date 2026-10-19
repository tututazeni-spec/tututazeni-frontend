// components/certificates/CertificatesTab.tsx
// Lista administrativa de certificados com pesquisa, filtros, ordenação e
// paginação no servidor. Acções reais: descarregar PDF (válidos/expirados) e
// aprovar (só pendentes e só quem pode escrever). Revogar/reemitir chega com
// a fase de ciclo de vida.

'use client';

import { useEffect, useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import { Download } from 'lucide-react';
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

function RowActions({
  row,
  canApprove,
  onApprove,
}: {
  row: AdminCertificateRow;
  canApprove: boolean;
  onApprove: (row: AdminCertificateRow) => void;
}) {
  const { download, loading, error } = usePdfDownload(
    'certificate',
    String(row.id),
  );
  const downloadable = row.status === 'ACTIVE' || row.status === 'EXPIRED';
  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex gap-2">
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
          <Button size="sm" onClick={() => onApprove(row)}>
            Aprovar
          </Button>
        )}
      </div>
      {error && <span className="text-xs text-danger">{error}</span>}
    </div>
  );
}

export function CertificatesTab({
  canApprove,
  initialStatus = '',
}: {
  canApprove: boolean;
  initialStatus?: EffectiveStatus | '';
}) {
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

  async function onApprove(row: AdminCertificateRow) {
    const ok = await confirm({
      title: `Aprovar o certificado de ${row.holderName}?`,
      confirmLabel: 'Aprovar',
    });
    if (ok) approve.mutate(row.id);
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
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
            items={STATUS_ITEMS}
            value={filters.status || ALL}
            onValueChange={(v) => set({ status: v === ALL ? '' : v })}
          />
          <Select
            items={KIND_ITEMS}
            value={filters.activityKind || ALL}
            onValueChange={(v) => set({ activityKind: v === ALL ? '' : v })}
          />
          <Select
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
            <TableHead>
              <TableRow>
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
                    <div>{row.title}</div>
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
                      canApprove={canApprove}
                      onApprove={(r) => void onApprove(r)}
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
    </div>
  );
}
