// components/departments/DetailView.tsx
// Separador "Detalhe do Departamento" — header, transferência de
// colaborador e tabs (membros/sub-deptos/métricas/histórico). Dados
// próprios + apresentação. Extraído de
// app/(platform)/departments/page.tsx.

'use client';

import { useState } from 'react';
import { useToast } from '@/providers/ToastProvider';
import {
  ArrowLeft,
  ArrowLeftRight,
  Building2,
  Check,
  Network,
  Plus,
  UserCheck,
  UserX,
  Users,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { AlertCard } from '@/components/ui/AlertCard';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { Skeleton } from '@/components/ui/Skeleton';
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
import type { DirectoryUser } from './departmentFormData';
import { departmentIcon } from './departmentIcon';
import { HeadcountCard } from './HeadcountCard';
import type {
  Department,
  DepartmentNode,
  HeadHistoryEntry,
  Member,
  Metrics,
} from './types';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatDateNumeric, formatMoney } from '@/lib/format';

interface DetailViewProps {
  deptId: number;
  onBack: () => void;
}

function Breadcrumb({
  items,
}: {
  items: Array<{ id: number; name: string; code: string }>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 text-xs text-ink-faint">
      {items.map((item, i) => (
        <span key={item.id} className="flex items-center gap-1">
          {i > 0 && <span>›</span>}
          <span
            className={i === items.length - 1 ? 'font-medium text-ink' : ''}
          >
            {item.name}
          </span>
        </span>
      ))}
    </div>
  );
}

// Lista plana (com indentação por nível) dos departamentos, sem o actual.
function flattenTree(
  nodes: DepartmentNode[],
  excludeId: number,
  depth = 0,
): Array<{ value: string; label: string }> {
  return nodes.flatMap((n) => [
    ...(n.id === excludeId
      ? []
      : [{ value: String(n.id), label: `${'— '.repeat(depth)}${n.name}` }]),
    ...flattenTree(n.children ?? [], excludeId, depth + 1),
  ]);
}

function HeaderIcon({
  name,
  hasChildren,
}: {
  name: string;
  hasChildren: boolean;
}) {
  const Icon = departmentIcon(name, hasChildren);
  return <Icon size={24} strokeWidth={1.75} />;
}

export function DetailView({ deptId, onBack }: DetailViewProps) {
  const notify = useToast();
  const [activeTab, setActiveTab] = useState<
    'members' | 'subdepts' | 'history' | 'metrics'
  >('members');
  const [transferUser, setTransferUser] = useState<DirectoryUser | null>(null);
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [addUser, setAddUser] = useState<DirectoryUser | null>(null);
  const [addReason, setAddReason] = useState('');
  const [addDeptFilter, setAddDeptFilter] = useState('ALL');
  const [transferDeptFilter, setTransferDeptFilter] = useState('ALL');
  const [createSubOpen, setCreateSubOpen] = useState(false);

  // Colaborador escolhido por pesquisa de nome; departamento destino por lista.
  const treeQ = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const targetItems = flattenTree(treeQ.data ?? [], deptId);
  const filterItems = [
    { value: 'ALL', label: 'Todos os departamentos' },
    ...flattenTree(treeQ.data ?? [], -1),
  ];

  const deptQ = useApiQuery<
    Department & { users: Member[]; headHistory: HeadHistoryEntry[] }
  >(queryKeys.departments.detail(deptId), `/departments/${deptId}`, {
    enabled: !!deptId,
    staleTime: STALE_TIME.DYNAMIC,
  });
  const metricsQ = useApiQuery<Metrics>(
    queryKeys.departments.metrics(deptId),
    `/departments/${deptId}/metrics`,
    { enabled: !!deptId, staleTime: STALE_TIME.DYNAMIC },
  );
  const dept = deptQ.data ?? null;
  const metrics = metricsQ.data ?? null;
  const loading = deptQ.isLoading;

  const reloadKeys = [
    queryKeys.departments.detail(deptId),
    queryKeys.departments.metrics(deptId),
  ];

  const toggleActive = useApiMutation(
    (action: 'activate' | 'deactivate') =>
      apiClient.patch(`/departments/${deptId}/${action}`, {}),
    {
      invalidateKeys: reloadKeys,
      optimistic: {
        key: queryKeys.departments.detail(deptId),
        update: (
          prev:
            | (Department & {
                users: Member[];
                headHistory: HeadHistoryEntry[];
              })
            | undefined,
          action: 'activate' | 'deactivate',
        ) => prev && { ...prev, active: action === 'activate' },
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const actionLoading = toggleActive.isPending;
  const handleToggleActive = () => {
    if (dept) toggleActive.mutate(dept.active ? 'deactivate' : 'activate');
  };

  const transferMutation = useApiMutation(
    () =>
      apiClient.post('/departments/members/transfer', {
        userId: transferUser?.id,
        targetDepartmentId: Number(transferTargetId),
        reason: transferReason || undefined,
      }),
    {
      invalidateKeys: reloadKeys,
      onSuccess: () => {
        notify({
          title: 'Transferência realizada com sucesso',
          intent: 'success',
        });
        setTransferUser(null);
        setTransferTargetId('');
        setTransferReason('');
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const transferLoading = transferMutation.isPending;
  const canTransfer = !!transferUser && transferTargetId !== '';
  const handleTransfer = () => {
    if (!canTransfer) return;
    transferMutation.mutate(undefined);
  };

  // "Adicionar colaborador" reutiliza o endpoint de transferência com o
  // destino fixo neste departamento — o backend não tem rota dedicada e
  // transferir para cá é exactamente o que "adicionar" significa.
  const addMemberMutation = useApiMutation(
    () =>
      apiClient.post('/departments/members/transfer', {
        userId: addUser?.id,
        targetDepartmentId: deptId,
        reason: addReason || undefined,
      }),
    {
      invalidateKeys: reloadKeys,
      onSuccess: () => {
        notify({
          title: 'Colaborador adicionado ao departamento',
          intent: 'success',
        });
        setAddUser(null);
        setAddReason('');
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const addMemberLoading = addMemberMutation.isPending;
  const canAddMember = !!addUser;
  const handleAddMember = () => {
    if (!canAddMember) return;
    addMemberMutation.mutate(undefined);
  };

  if (deptQ.isError)
    return (
      <div>
        <Button intent="ghost" size="sm" className="mb-5" onClick={onBack}>
          <ArrowLeft size={14} strokeWidth={1.75} />
          Voltar
        </Button>
        <Card className="p-6 text-center">
          <p className="text-sm text-danger">
            {deptQ.error?.message ||
              'Não foi possível carregar o departamento.'}
          </p>
          <Button
            intent="secondary"
            size="sm"
            className="mt-4"
            disabled={deptQ.isFetching}
            onClick={() => deptQ.refetch()}
          >
            Tentar de novo
          </Button>
        </Card>
      </div>
    );

  if (loading || !dept)
    return (
      <div>
        <Skeleton
          rows={6}
          wrapperClassName="space-y-2"
          itemClassName="h-14 rounded-card bg-surface-sunken"
        />
      </div>
    );

  const tabs: Array<{ id: typeof activeTab; label: string }> = [
    { id: 'members', label: `Membros (${dept._count.users})` },
    { id: 'subdepts', label: `Sub-departamentos (${dept._count.children})` },
    { id: 'metrics', label: 'Métricas' },
    { id: 'history', label: 'Histórico gestores' },
  ];

  return (
    <div>
      <Button intent="ghost" size="sm" className="mb-5" onClick={onBack}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar
      </Button>

      {/* Breadcrumb */}
      {metrics && (
        <div className="mb-4">
          <Breadcrumb items={metrics.breadcrumb} />
        </div>
      )}

      {/* Header */}
      <div className="mb-5 overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
        <div className="flex items-start justify-between gap-4 border-b border-brand-line px-5 py-4">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand text-white">
              <HeaderIcon
                name={dept.name}
                hasChildren={dept._count.children > 0}
              />
            </span>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <Badge intent={dept.active ? 'success' : 'neutral'}>
                  {dept.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <h2 className="text-lg font-semibold text-ink">{dept.name}</h2>
              {dept.description && (
                <p className="mt-1 text-sm text-ink-muted">
                  {dept.description}
                </p>
              )}
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-ink-faint">
                {dept.parent && (
                  <span>
                    Pertence a:{' '}
                    <strong className="text-ink">{dept.parent.name}</strong>
                  </span>
                )}
                {dept.costCenter && (
                  <span>
                    Centro de custo:{' '}
                    <strong className="text-ink">{dept.costCenter}</strong>
                  </span>
                )}
                {dept.trainingBudget && (
                  <span>
                    Budget formação:{' '}
                    <strong className="text-ink">
                      {formatMoney(dept.trainingBudget)}
                    </strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Button
              intent={dept.active ? 'danger' : 'success'}
              size="sm"
              disabled={actionLoading}
              loading={actionLoading}
              onClick={handleToggleActive}
            >
              {dept.active ? 'Desactivar' : 'Reactivar'}
            </Button>
          </div>
        </div>

        {/* Gestor */}
        {dept.head && (
          <div className="flex w-full flex-wrap items-center gap-3 bg-surface px-5 py-3">
            <Avatar name={dept.head.fullName} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate font-body text-sm font-semibold text-brand">
                {dept.head.fullName}
              </div>
              <div className="truncate font-body text-xs text-brand-muted">
                {dept.head.email} · Responsável
              </div>
            </div>
          </div>
        )}
        {!dept.head && (
          <div className="px-5 py-3">
            <AlertCard
              compact
              variant="warning"
              title="Atenção"
              message="Departamento sem gestor definido"
              className="[&_p]:text-brand"
            />
          </div>
        )}
      </div>

      {metrics && (
        <div className="mb-5">
          <HeadcountCard
            deptId={deptId}
            activeUsers={metrics.activeUsers}
            expected={metrics.expectedEmployees}
            max={metrics.maxEmployees}
            invalidateKeys={[...reloadKeys, queryKeys.departments.all]}
          />
        </div>
      )}

      {/* Tabs */}
      <div className="mb-5 flex w-fit flex-wrap gap-1 rounded-control p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setActiveTab(t.id)}
            className="rounded-control border border-[#0F1F3D] bg-white px-3 py-1.5 text-sm font-medium text-[#0F1F3D] transition-colors hover:bg-[#0F1F3D] hover:text-white"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {activeTab === 'members' && (
        <div>
          {/* Add member form */}
          <Card className="mb-4 border-success bg-success-subtle p-4">
            <div className="-mx-4 -mt-4 mb-3 rounded-t-[inherit] bg-[#0F1F3D] px-4 py-3 text-xs font-medium uppercase tracking-wide text-white">
              Adicionar colaborador ao departamento
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="min-w-[220px] flex-1">
                <DepartmentUserPicker
                  underline
                  label="Colaborador"
                  htmlFor="dept-add-user"
                  value={addUser}
                  onChange={setAddUser}
                  departmentId={
                    addDeptFilter === 'ALL' ? undefined : Number(addDeptFilter)
                  }
                />
              </div>
              <Select
                variant="underline"
                icon={Network}
                items={filterItems}
                value={addDeptFilter}
                onValueChange={setAddDeptFilter}
                placeholder="Departamento"
                className="min-w-[200px] flex-1"
              />
              <Input
                variant="underline"
                type="text"
                placeholder="Motivo (opcional)"
                value={addReason}
                onChange={(e) => setAddReason(e.target.value)}
                className="min-w-[160px] flex-1"
              />
              <Button
                onClick={handleAddMember}
                disabled={!canAddMember || addMemberLoading}
                loading={addMemberLoading}
                className="bg-[#0F1F3D] text-white hover:bg-[#0F1F3D]/90"
              >
                Adicionar
              </Button>
            </div>
          </Card>

          {/* Transfer form */}
          <Card className="mb-4 border-info bg-info-subtle p-4">
            <div className="-mx-4 -mt-4 mb-3 rounded-t-[inherit] bg-[#0F1F3D] px-4 py-3 text-xs font-medium uppercase tracking-wide text-white">
              Transferir colaborador
            </div>
            <div className="flex flex-wrap gap-3">
              <div className="min-w-[220px] flex-1">
                <DepartmentUserPicker
                  underline
                  label="Colaborador"
                  htmlFor="dept-transfer-user"
                  value={transferUser}
                  onChange={setTransferUser}
                  departmentId={
                    transferDeptFilter === 'ALL'
                      ? undefined
                      : Number(transferDeptFilter)
                  }
                />
              </div>
              <Select
                variant="underline"
                icon={Network}
                items={filterItems}
                value={transferDeptFilter}
                onValueChange={setTransferDeptFilter}
                placeholder="Departamento do colaborador"
                className="min-w-[200px] flex-1"
              />
              <Select
                variant="underline"
                icon={Building2}
                items={targetItems}
                value={transferTargetId}
                onValueChange={setTransferTargetId}
                placeholder="Departamento destino"
                className="min-w-[200px] flex-1"
              />
              <Input
                variant="underline"
                type="text"
                placeholder="Motivo (opcional)"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                className="min-w-[160px] flex-1"
              />
              <Button
                onClick={handleTransfer}
                disabled={!canTransfer || transferLoading}
                loading={transferLoading}
                className="bg-[#0F1F3D] text-white hover:bg-[#0F1F3D]/90"
              >
                Transferir
              </Button>
            </div>
          </Card>

          {/* Members list */}
          {(dept.users as Member[]).length === 0 ? (
            <div className="rounded-[24px] border border-brand-line bg-surface px-5 py-8 text-center font-body text-sm text-ink-faint shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
              Sem membros neste departamento
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-brand-line bg-surface shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
              {(dept.users as Member[]).map((u) => (
                <div
                  key={u.id}
                  className="relative flex w-full flex-wrap items-center gap-3 border-b border-brand-line bg-surface px-5 py-3 last:border-0"
                >
                  <Avatar name={u.fullName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-body text-sm font-semibold text-brand">
                      {u.fullName}
                    </div>
                    <div className="truncate font-body text-xs text-brand-muted">
                      {u.email}
                    </div>
                  </div>
                  <div className="hidden w-48 shrink-0 truncate font-body text-xs text-brand-muted sm:block">
                    {u.position?.name ?? '—'}
                  </div>
                  <Badge intent={u.active ? 'success' : 'neutral'}>
                    {u.active ? 'Activo' : 'Inactivo'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-departments tab */}
      {activeTab === 'subdepts' && (
        <div className="space-y-2">
          <div className="mb-3 flex justify-end">
            <Button size="sm" onClick={() => setCreateSubOpen(true)}>
              <Plus size={14} strokeWidth={1.75} />
              Criar sub-departamento
            </Button>
          </div>
          {createSubOpen && (
            <CreateDepartmentModal
              endpoint="/departments"
              defaultParentId={deptId}
              invalidateKeys={[
                ...reloadKeys,
                queryKeys.departments.tree(),
                queryKeys.departments.all,
              ]}
              onClose={() => setCreateSubOpen(false)}
            />
          )}
          {dept.children.length === 0 ? (
            <EmptyState variant="inline" title="Sem sub-departamentos" />
          ) : (
            dept.children.map((child) => (
              <Card key={child.id} className="flex items-center gap-3 p-4">
                <div
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    background: child.color ?? 'var(--color-ink-faint)',
                  }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink">
                      {child.name}
                    </span>
                    <span className="text-xs text-ink-faint">{child.code}</span>
                    <Badge intent={child.active ? 'success' : 'neutral'}>
                      {child.active ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </div>
                  {child.head && (
                    <div className="mt-0.5 text-xs text-ink-faint">
                      {child.head.fullName}
                    </div>
                  )}
                </div>
                <div className="text-sm text-ink-faint">
                  {child._count.users} membros
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Metrics tab */}
      {activeTab === 'metrics' && metrics && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <NavyStatCard
              icon={Users}
              tone="blue"
              label="Total membros"
              value={metrics.totalUsers}
            />
            <NavyStatCard
              icon={UserCheck}
              tone="green"
              label="Activos"
              value={metrics.activeUsers}
            />
            <NavyStatCard
              icon={UserX}
              tone="orange"
              label="Inactivos"
              value={metrics.inactiveUsers}
            />
            <NavyStatCard
              icon={ArrowLeftRight}
              tone="blue"
              label="Transferências ↑"
              value={metrics.transfers.in}
              sub={`↓ saídas: ${metrics.transfers.out}`}
            />
          </div>
          <Card className="p-4">
            <div className="-mx-4 -mt-4 mb-3 rounded-t-[inherit] bg-brand/60 px-4 py-3 text-xs font-medium uppercase tracking-wide text-white">
              Hierarquia organizacional
            </div>
            <Breadcrumb items={metrics.breadcrumb} />
          </Card>
        </div>
      )}

      {/* Head history tab */}
      {activeTab === 'history' && (
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="bg-brand/60 text-white">
                Gestor
              </TableHeaderCell>
              <TableHeaderCell className="bg-brand/60 text-white">
                Início
              </TableHeaderCell>
              <TableHeaderCell className="bg-brand/60 text-white">
                Fim
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {dept.headHistory.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-ink-faint"
                >
                  Sem histórico de gestores
                </TableCell>
              </TableRow>
            ) : (
              dept.headHistory.map((h) => (
                <TableRow key={h.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar name={h.head.fullName} size="sm" />
                      <span className="text-sm text-ink">
                        {h.head.fullName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {formatDateNumeric(h.startedAt)}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {h.endedAt ? (
                      formatDateNumeric(h.endedAt)
                    ) : (
                      <span className="text-success">Actual</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
