// components/departments/ListView.tsx
// Separador "Departamentos" (docs/modulo_departments.md Ponto 2) — tabela
// paginada com todos os filtros e ações do documento (Ver, Editar,
// Ativar/desativar, Arquivar, Eliminar, Exportar). Dados próprios +
// apresentação. Extraído de app/(platform)/departments/page.tsx.

'use client';

import { useState } from 'react';
import { keepPreviousData } from '@tanstack/react-query';
import {
  Archive,
  Download,
  Eye,
  Pencil,
  Plus,
  Power,
  Trash2,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { apiClient } from '@/lib/apiClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonVariants } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { CreateDepartmentModal } from './CreateDepartmentModal';
import { DepartmentUserPicker } from './DepartmentUserPicker';
import { useUnits, type DirectoryUser } from './departmentFormData';
import { flattenTree } from './treeUtils';
import type { Department, DepartmentNode, PaginatedDepts } from './types';

interface ListViewProps {
  onSelect: (id: number) => void;
}

const NONE = 'NONE';

const STATUS_ITEMS = [
  { value: NONE, label: 'Todos os estados' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'ARCHIVED', label: 'Arquivado' },
];

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-AO');
}

// Modal "Arquivar departamento" — pede o motivo de encerramento
// (docs/modulo_departments.md Ponto 2, secção "Estado") antes de chamar
// PATCH /departments/:id/archive.
function ArchiveModal({
  dept,
  onClose,
}: {
  dept: Department;
  onClose: () => void;
}) {
  const notify = useToast();
  const [reason, setReason] = useState('');
  const archiveMutation = useApiMutation(
    () => apiClient.patch(`/departments/${dept.id}/archive`, { reason: reason.trim() || undefined }),
    {
      invalidateKeys: [queryKeys.departments.all],
      onSuccess: () => {
        notify({ title: 'Departamento arquivado', intent: 'success' });
        onClose();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Arquivar departamento"
        description={`"${dept.name}" fica marcado como arquivado/encerrado. Pode ser reactivado mais tarde.`}
      >
        <div className="mt-4">
          <FormField label="Motivo do encerramento" htmlFor="archive-reason">
            <Textarea
              id="archive-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Opcional."
              rows={2}
              className="w-full"
            />
          </FormField>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={archiveMutation.isPending}>
            Cancelar
          </Button>
          <Button
            intent="danger"
            onClick={() => archiveMutation.mutate(undefined)}
            loading={archiveMutation.isPending}
          >
            Arquivar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

export function ListView({ onSelect }: ListViewProps) {
  const notify = useToast();
  const confirm = useConfirm();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(NONE);
  const [unitId, setUnitId] = useState(NONE);
  const [parentId, setParentId] = useState(NONE);
  const [head, setHead] = useState<DirectoryUser | null>(null);
  const [location, setLocation] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [page, setPage] = useState(1);

  const [createOpen, setCreateOpen] = useState(false);
  const [editDept, setEditDept] = useState<Department | null>(null);
  const [archiveDept, setArchiveDept] = useState<Department | null>(null);

  const debouncedSearch = useDebounce(search);
  const debouncedLocation = useDebounce(location);
  const params = {
    page,
    limit: 20,
    search: debouncedSearch || undefined,
    status: status !== NONE ? status : undefined,
    unitId: unitId !== NONE ? Number(unitId) : undefined,
    parentId: parentId !== NONE ? Number(parentId) : undefined,
    headId: head?.id,
    location: debouncedLocation || undefined,
    createdFrom: createdFrom || undefined,
    createdTo: createdTo || undefined,
  };

  const {
    data,
    isLoading: loading,
    error: queryError,
  } = useApiQuery<PaginatedDepts>(
    queryKeys.departments.list(params),
    '/departments',
    {
      params,
      staleTime: STALE_TIME.SEMI_STATIC,
      placeholderData: keepPreviousData,
    },
  );
  const error = queryError?.message ?? null;

  const { data: tree } = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { units } = useUnits();

  const unitItems = [
    { value: NONE, label: 'Todas as unidades' },
    ...units.map((u) => ({ value: String(u.id), label: u.name })),
  ];
  const parentItems = [
    { value: NONE, label: 'Todos os departamentos superiores' },
    ...flattenTree(tree ?? []),
  ];

  const exportQuery = new URLSearchParams(
    Object.entries(params)
      .filter(([k, v]) => v != null && k !== 'page' && k !== 'limit')
      .map(([k, v]) => [k, String(v)]),
  ).toString();

  const reloadKeys = [queryKeys.departments.all];

  const [pendingId, setPendingId] = useState<number | null>(null);

  const toggleActive = useApiMutation(
    (vars: { id: number; action: 'activate' | 'deactivate' }) =>
      apiClient.patch(`/departments/${vars.id}/${vars.action}`, {}),
    {
      invalidateKeys: reloadKeys,
      onMutate: (vars) => setPendingId(vars.id),
      onSettled: () => setPendingId(null),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const removeDept = useApiMutation(
    (id: number) => apiClient.delete(`/departments/${id}`),
    {
      invalidateKeys: reloadKeys,
      onMutate: (id) => setPendingId(id),
      onSettled: () => setPendingId(null),
      onSuccess: () => notify({ title: 'Departamento eliminado', intent: 'success' }),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const handleToggleActive = (d: Department) => async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (d.active) {
      const ok = await confirm({
        title: 'Desactivar departamento?',
        message: `"${d.name}" deixa de aparecer como activo. Só é possível sem colaboradores activos.`,
        confirmLabel: 'Desactivar',
        destructive: true,
      });
      if (!ok) return;
    }
    toggleActive.mutate({ id: d.id, action: d.active ? 'deactivate' : 'activate' });
  };

  const handleDelete = (d: Department) => async (e: React.MouseEvent) => {
    e.stopPropagation();
    const ok = await confirm({
      title: 'Eliminar departamento?',
      message: `"${d.name}" será eliminado permanentemente. Só é possível sem colaboradores nem sub-departamentos.`,
      confirmLabel: 'Eliminar',
      destructive: true,
    });
    if (ok) removeDept.mutate(d.id);
  };

  return (
    <div>
      {createOpen && (
        <CreateDepartmentModal
          endpoint="/departments"
          invalidateKeys={reloadKeys}
          onClose={() => setCreateOpen(false)}
        />
      )}
      {editDept && (
        <CreateDepartmentModal
          endpoint="/departments"
          department={editDept}
          invalidateKeys={reloadKeys}
          onClose={() => setEditDept(null)}
        />
      )}
      {archiveDept && (
        <ArchiveModal dept={archiveDept} onClose={() => setArchiveDept(null)} />
      )}

      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setCreateOpen(true)}>
          <Plus size={16} strokeWidth={1.75} />
          Novo departamento
        </Button>
      </div>

      {/* Filtros */}
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <Input
          type="text"
          placeholder="Pesquisar por nome, código, sigla ou gestor…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="min-w-[220px] flex-1"
        />
        <Select
          items={STATUS_ITEMS}
          value={status}
          onValueChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
        />
        <Select
          items={unitItems}
          value={unitId}
          onValueChange={(v) => {
            setUnitId(v);
            setPage(1);
          }}
        />
        <Select
          items={parentItems}
          value={parentId}
          onValueChange={(v) => {
            setParentId(v);
            setPage(1);
          }}
        />
        <div className="min-w-[200px]">
          <DepartmentUserPicker
            label="Responsável"
            htmlFor="filter-head"
            value={head}
            onChange={(u) => {
              setHead(u);
              setPage(1);
            }}
          />
        </div>
        <Input
          type="text"
          placeholder="Localização"
          value={location}
          onChange={(e) => {
            setLocation(e.target.value);
            setPage(1);
          }}
          className="min-w-[140px]"
        />
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            aria-label="Criado a partir de"
            value={createdFrom}
            onChange={(e) => {
              setCreatedFrom(e.target.value);
              setPage(1);
            }}
          />
          <span className="text-xs text-ink-faint">a</span>
          <Input
            type="date"
            aria-label="Criado até"
            value={createdTo}
            onChange={(e) => {
              setCreatedTo(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <a
          href={`/api/departments/export${exportQuery ? `?${exportQuery}` : ''}`}
          className={buttonVariants({ intent: 'ghost', size: 'sm' })}
        >
          <Download size={14} strokeWidth={1.75} />
          Exportar
        </a>
        <span className="ml-auto text-sm text-ink-faint">
          {data?.total ?? 0} departamentos
        </span>
      </div>

      {/* Tabela */}
      {loading && (
        <Skeleton
          rows={5}
          wrapperClassName="space-y-2 animate-pulse"
          itemClassName="h-14 rounded-card bg-surface-sunken"
        />
      )}
      {error && (
        <div className="px-4 py-8 text-center text-sm text-danger">
          {error}
        </div>
      )}
      {!loading && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Nome</TableHeaderCell>
              <TableHeaderCell>Código</TableHeaderCell>
              <TableHeaderCell>Sigla</TableHeaderCell>
              <TableHeaderCell>Departamento superior</TableHeaderCell>
              <TableHeaderCell>Unidade/empresa</TableHeaderCell>
              <TableHeaderCell>Responsável</TableHeaderCell>
              <TableHeaderCell>Colaboradores</TableHeaderCell>
              <TableHeaderCell>Sub-deptos</TableHeaderCell>
              <TableHeaderCell>Localização</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell>Criado em</TableHeaderCell>
              <TableHeaderCell>Actualizado em</TableHeaderCell>
              <TableHeaderCell>Ações</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.data.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={13}
                  className="py-12 text-center text-ink-faint"
                >
                  Nenhum departamento encontrado
                </TableCell>
              </TableRow>
            )}
            {data?.data.map((d) => (
              <TableRow
                key={d.id}
                className="cursor-pointer"
                onClick={() => onSelect(d.id)}
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                      style={{ background: d.color ?? 'var(--color-ink-faint)' }}
                    />
                    <span className="text-sm font-medium text-ink">{d.name}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs text-ink-muted">
                  {d.code}
                </TableCell>
                <TableCell className="text-xs text-ink-muted">
                  {d.acronym ?? '—'}
                </TableCell>
                <TableCell className="text-xs text-ink-faint">
                  {d.parent?.name ?? '—'}
                </TableCell>
                <TableCell className="text-xs text-ink-faint">
                  {d.unit?.name ?? '—'}
                </TableCell>
                <TableCell>
                  {d.head ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={d.head.fullName} size="sm" />
                      <span className="truncate text-xs text-ink">
                        {d.head.fullName}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-ink-faint">—</span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-ink-muted">
                  {d._count.users}
                </TableCell>
                <TableCell className="text-sm text-ink-faint">
                  {d._count.children}
                </TableCell>
                <TableCell className="text-xs text-ink-faint">
                  {d.location ?? '—'}
                </TableCell>
                <TableCell>
                  <Badge
                    intent={
                      d.status === 'ACTIVE'
                        ? 'success'
                        : d.status === 'ARCHIVED'
                          ? 'neutral'
                          : 'warning'
                    }
                  >
                    {d.status === 'ACTIVE'
                      ? 'Activo'
                      : d.status === 'ARCHIVED'
                        ? 'Arquivado'
                        : 'Inactivo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-ink-faint">
                  {fmtDate(d.createdAt)}
                </TableCell>
                <TableCell className="text-xs text-ink-faint">
                  {fmtDate(d.updatedAt)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      intent="ghost"
                      size="sm"
                      aria-label="Ver"
                      title="Ver"
                      onClick={() => onSelect(d.id)}
                    >
                      <Eye size={14} strokeWidth={1.75} />
                    </Button>
                    <Button
                      intent="ghost"
                      size="sm"
                      aria-label="Editar"
                      title="Editar"
                      onClick={() => setEditDept(d)}
                    >
                      <Pencil size={14} strokeWidth={1.75} />
                    </Button>
                    <Button
                      intent="ghost"
                      size="sm"
                      aria-label={d.active ? 'Desactivar' : 'Reactivar'}
                      title={d.active ? 'Desactivar' : 'Reactivar'}
                      loading={pendingId === d.id && toggleActive.isPending}
                      onClick={handleToggleActive(d)}
                    >
                      <Power size={14} strokeWidth={1.75} />
                    </Button>
                    {d.status !== 'ARCHIVED' && (
                      <Button
                        intent="ghost"
                        size="sm"
                        aria-label="Arquivar"
                        title="Arquivar"
                        onClick={(e) => {
                          e.stopPropagation();
                          setArchiveDept(d);
                        }}
                      >
                        <Archive size={14} strokeWidth={1.75} />
                      </Button>
                    )}
                    <Button
                      intent="ghost"
                      size="sm"
                      aria-label="Eliminar"
                      title="Eliminar"
                      loading={pendingId === d.id && removeDept.isPending}
                      onClick={handleDelete(d)}
                    >
                      <Trash2 size={14} strokeWidth={1.75} className="text-danger" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {data && data.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-ink-faint">
            Página {data.page} de {data.totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              intent="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <Button
              intent="secondary"
              size="sm"
              disabled={page === data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
