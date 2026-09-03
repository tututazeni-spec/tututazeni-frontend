// components/departments/DetailView.tsx
// Separador "Detalhe do Departamento" — header, transferência de
// colaborador e tabs (membros/sub-deptos/métricas/histórico). Dados
// próprios + apresentação. Extraído de
// app/(platform)/departments/page.tsx.

'use client';

import { useState } from 'react';
import type { QueryKey } from '@tanstack/react-query';
import { useToast } from '@/providers/ToastProvider';
import {
  ArrowLeft,
  ArrowLeftRight,
  Check,
  Plus,
  UserCheck,
  UserX,
  Users,
  Building2,
  AlertTriangle,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useDebounce } from '@/hooks/useDebounce';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
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
import type { Department, HeadHistoryEntry, Member, Metrics } from './types';

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

type LookupStatus = 'idle' | 'loading' | 'found' | 'notfound';

// Resolve um ID escrito à mão para uma entidade real, para que o nome seja
// mostrado antes de qualquer acção. Debounced para não pedir por tecla; sem
// retry para que um 404 apareça já como "não encontrado".
function useEntityLookup<T>(
  rawId: string,
  buildPath: (id: number) => string,
  buildKey: (id: number) => QueryKey,
  getLabel: (data: T) => string,
): { status: LookupStatus; label: string | null } {
  const parsed = Number.parseInt(rawId, 10);
  const valid = rawId.trim() !== '' && Number.isInteger(parsed) && parsed > 0;
  const debouncedId = useDebounce(valid ? parsed : 0, 400);
  const q = useApiQuery<T>(
    buildKey(debouncedId || 0),
    buildPath(debouncedId || 0),
    { enabled: debouncedId > 0, retry: false, staleTime: STALE_TIME.DYNAMIC },
  );

  if (!valid) return { status: 'idle', label: null };
  if (debouncedId !== parsed || q.isLoading || q.isFetching)
    return { status: 'loading', label: null };
  if (q.isError || !q.data) return { status: 'notfound', label: null };
  return { status: 'found', label: getLabel(q.data) };
}

function LookupHint({
  status,
  label,
  foundPrefix,
}: {
  status: LookupStatus;
  label: string | null;
  foundPrefix: string;
}) {
  if (status === 'idle') return null;
  if (status === 'loading')
    return <p className="mt-2 text-xs text-ink-faint">A procurar…</p>;
  if (status === 'notfound')
    return (
      <p className="mt-2 text-xs text-danger">
        Não encontrado — verifica o ID.
      </p>
    );
  return (
    <p className="mt-2 flex items-center gap-1.5 text-xs text-success-ink">
      <Check size={13} strokeWidth={2} />
      <span>
        {foundPrefix} <strong className="font-medium">{label}</strong>
      </span>
    </p>
  );
}

export function DetailView({ deptId, onBack }: DetailViewProps) {
  const notify = useToast();
  const [activeTab, setActiveTab] = useState<
    'members' | 'subdepts' | 'history' | 'metrics'
  >('members');
  const [transferUserId, setTransferUserId] = useState('');
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [addUserId, setAddUserId] = useState('');
  const [addReason, setAddReason] = useState('');
  const [createSubOpen, setCreateSubOpen] = useState(false);

  // Confirmação do nome antes de qualquer acção: só é possível adicionar /
  // transferir depois de o colaborador (e o departamento destino) resolverem.
  const addUserLookup = useEntityLookup<Member>(
    addUserId,
    (id) => `/users/${id}`,
    (id) => queryKeys.users.detail(id),
    (u) => `${u.fullName} · ${u.email}`,
  );
  const transferUserLookup = useEntityLookup<Member>(
    transferUserId,
    (id) => `/users/${id}`,
    (id) => queryKeys.users.detail(id),
    (u) => `${u.fullName} · ${u.email}`,
  );
  const transferTargetLookup = useEntityLookup<Department>(
    transferTargetId,
    (id) => `/departments/${id}`,
    (id) => queryKeys.departments.detail(id),
    (d) => `${d.name} · ${d.code}`,
  );

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
        userId: parseInt(transferUserId),
        targetDepartmentId: parseInt(transferTargetId),
        reason: transferReason || undefined,
      }),
    {
      invalidateKeys: reloadKeys,
      onSuccess: () => {
        notify({
          title: 'Transferência realizada com sucesso',
          intent: 'success',
        });
        setTransferUserId('');
        setTransferTargetId('');
        setTransferReason('');
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const transferLoading = transferMutation.isPending;
  const canTransfer =
    transferUserLookup.status === 'found' &&
    transferTargetLookup.status === 'found';
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
        userId: parseInt(addUserId),
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
        setAddUserId('');
        setAddReason('');
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const addMemberLoading = addMemberMutation.isPending;
  const canAddMember = addUserLookup.status === 'found';
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
          wrapperClassName="space-y-2 animate-pulse"
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
      <Card className="mb-5 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-card text-xl"
              style={{
                background: dept.color
                  ? `${dept.color}20`
                  : 'var(--color-surface-sunken)',
              }}
            >
              {dept.icon ?? <Building2 size={20} strokeWidth={1.75} />}
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm text-ink-faint">
                  {dept.code}
                </span>
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
                      {dept.trainingBudget.toLocaleString('pt-AO')} Kz
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
          <div className="mt-4 flex items-center gap-3 border-t border-border pt-4">
            <Avatar name={dept.head.fullName} size="md" />
            <div>
              <div className="text-sm font-medium text-ink">
                {dept.head.fullName}
              </div>
              <div className="text-xs text-ink-faint">
                {dept.head.email} · Responsável
              </div>
            </div>
          </div>
        )}
        {!dept.head && (
          <div className="mt-4 rounded-control border border-black bg-white px-3 py-2 text-xs text-black">
            <AlertTriangle
              size={13}
              strokeWidth={1.75}
              className="inline align-[-2px]"
            />{' '}
            Departamento sem gestor definido
          </div>
        )}
      </Card>

      {/* Tabs */}
      <div className="mb-5 flex w-fit flex-wrap gap-1 rounded-control bg-surface-sunken p-1">
        {tabs.map((t) => (
          <Button
            key={t.id}
            size="sm"
            intent={activeTab === t.id ? 'primary' : 'ghost'}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </Button>
        ))}
      </div>

      {/* Members tab */}
      {activeTab === 'members' && (
        <div>
          {/* Add member form */}
          <Card className="mb-4 border-success bg-success-subtle p-4">
            <div className="mb-3 text-xs font-medium uppercase tracking-wide text-success-ink">
              Adicionar colaborador ao departamento
            </div>
            <div className="flex flex-wrap gap-3">
              <Input
                type="number"
                placeholder="ID do colaborador"
                value={addUserId}
                onChange={(e) => setAddUserId(e.target.value)}
                className="min-w-[140px] flex-1"
              />
              <Input
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
              >
                Adicionar
              </Button>
            </div>
            <LookupHint
              status={addUserLookup.status}
              label={addUserLookup.label}
              foundPrefix="Colaborador:"
            />
          </Card>

          {/* Transfer form */}
          <Card className="mb-4 border-info bg-info-subtle p-4">
            <div className="mb-3 text-xs font-medium uppercase tracking-wide text-info-ink">
              Transferir colaborador
            </div>
            <div className="flex flex-wrap gap-3">
              <Input
                type="number"
                placeholder="ID do colaborador"
                value={transferUserId}
                onChange={(e) => setTransferUserId(e.target.value)}
                className="min-w-[140px] flex-1"
              />
              <Input
                type="number"
                placeholder="ID do departamento destino"
                value={transferTargetId}
                onChange={(e) => setTransferTargetId(e.target.value)}
                className="min-w-[180px] flex-1"
              />
              <Input
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
              >
                Transferir
              </Button>
            </div>
            <LookupHint
              status={transferUserLookup.status}
              label={transferUserLookup.label}
              foundPrefix="Colaborador:"
            />
            <LookupHint
              status={transferTargetLookup.status}
              label={transferTargetLookup.label}
              foundPrefix="Departamento destino:"
            />
          </Card>

          {/* Members list */}
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Colaborador</TableHeaderCell>
                <TableHeaderCell>Cargo</TableHeaderCell>
                <TableHeaderCell>Estado</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(dept.users as Member[]).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="py-8 text-center text-ink-faint"
                  >
                    Sem membros neste departamento
                  </TableCell>
                </TableRow>
              ) : (
                (dept.users as Member[]).map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar name={u.fullName} size="sm" />
                        <div>
                          <div className="text-sm text-ink">{u.fullName}</div>
                          <div className="text-xs text-ink-faint">
                            {u.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-ink-muted">
                      {u.position?.name ?? '—'}
                    </TableCell>
                    <TableCell>
                      <Badge intent={u.active ? 'success' : 'neutral'}>
                        {u.active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
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
            <div className="rounded-card border border-dashed border-border-strong py-8 text-center text-sm text-ink-faint">
              Sem sub-departamentos
            </div>
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
                    <span className="font-mono text-xs text-ink-faint">
                      {child.code}
                    </span>
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
          <div className="grid grid-cols-4 gap-3">
            <KpiCard
              icon={Users}
              label="Total membros"
              value={metrics.totalUsers}
            />
            <KpiCard
              icon={UserCheck}
              label="Activos"
              value={metrics.activeUsers}
              intent="success"
            />
            <KpiCard
              icon={UserX}
              label="Inactivos"
              value={metrics.inactiveUsers}
            />
            <KpiCard
              icon={ArrowLeftRight}
              label="Transferências ↑"
              value={metrics.transfers.in}
              sub={`↓ saídas: ${metrics.transfers.out}`}
              intent="accent"
            />
          </div>
          <Card className="p-4">
            <div className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-faint">
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
              <TableHeaderCell>Gestor</TableHeaderCell>
              <TableHeaderCell>Início</TableHeaderCell>
              <TableHeaderCell>Fim</TableHeaderCell>
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
                    {new Date(h.startedAt).toLocaleDateString('pt-AO')}
                  </TableCell>
                  <TableCell className="text-xs text-ink-muted">
                    {h.endedAt ? (
                      new Date(h.endedAt).toLocaleDateString('pt-AO')
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
