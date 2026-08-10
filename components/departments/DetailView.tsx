// components/departments/DetailView.tsx
// Separador "Detalhe do Departamento" — header, transferência de
// colaborador e tabs (membros/sub-deptos/métricas/histórico). Dados
// próprios + apresentação. Extraído de
// app/(platform)/departments/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar, Breadcrumb, MetricCard, Skeleton, StatusBadge } from './atoms';
import type { Department, HeadHistoryEntry, Member, Metrics } from './types';

interface DetailViewProps {
  deptId: number;
  onBack: () => void;
}

export function DetailView({ deptId, onBack }: DetailViewProps) {
  const [activeTab, setActiveTab] = useState<
    'members' | 'subdepts' | 'history' | 'metrics'
  >('members');
  const [transferUserId, setTransferUserId] = useState('');
  const [transferTargetId, setTransferTargetId] = useState('');
  const [transferReason, setTransferReason] = useState('');

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
    () =>
      apiClient.patch(
        `/departments/${deptId}/${dept!.active ? 'deactivate' : 'activate'}`,
        {},
      ),
    { invalidateKeys: reloadKeys, onError: (e) => alert(e.message) },
  );
  const actionLoading = toggleActive.isPending;
  const handleToggleActive = () => {
    if (dept) toggleActive.mutate(undefined);
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
        alert('Transferência realizada com sucesso');
        setTransferUserId('');
        setTransferTargetId('');
        setTransferReason('');
      },
      onError: (e) => alert(e.message),
    },
  );
  const transferLoading = transferMutation.isPending;
  const handleTransfer = () => {
    if (!transferUserId || !transferTargetId) return;
    transferMutation.mutate(undefined);
  };

  if (loading || !dept)
    return (
      <div>
        <Skeleton rows={6} />
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
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5"
      >
        ← Voltar
      </button>

      {/* Breadcrumb */}
      {metrics && (
        <div className="mb-4">
          <Breadcrumb items={metrics.breadcrumb} />
        </div>
      )}

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: dept.color ? `${dept.color}20` : '#e2e8f0' }}
            >
              {dept.icon ?? '🏢'}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="font-mono text-sm text-gray-400">
                  {dept.code}
                </span>
                <StatusBadge active={dept.active} />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                {dept.name}
              </h2>
              {dept.description && (
                <p className="text-sm text-gray-500 mt-1">{dept.description}</p>
              )}
              <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-400">
                {dept.parent && (
                  <span>
                    Pertence a:{' '}
                    <strong className="text-gray-700">
                      {dept.parent.name}
                    </strong>
                  </span>
                )}
                {dept.costCenter && (
                  <span>
                    Centro de custo:{' '}
                    <strong className="text-gray-700">{dept.costCenter}</strong>
                  </span>
                )}
                {dept.trainingBudget && (
                  <span>
                    Budget formação:{' '}
                    <strong className="text-gray-700">
                      {dept.trainingBudget.toLocaleString('pt-AO')} Kz
                    </strong>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={handleToggleActive}
              disabled={actionLoading}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors disabled:opacity-50 ${
                dept.active
                  ? 'border-red-200 text-red-600 hover:bg-red-50'
                  : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
              }`}
            >
              {dept.active ? 'Desactivar' : 'Reactivar'}
            </button>
          </div>
        </div>

        {/* Gestor */}
        {dept.head && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-3">
            <Avatar name={dept.head.fullName} size="md" />
            <div>
              <div className="text-sm font-medium text-gray-900">
                {dept.head.fullName}
              </div>
              <div className="text-xs text-gray-400">
                {dept.head.email} · Responsável
              </div>
            </div>
          </div>
        )}
        {!dept.head && (
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
            ⚠ Departamento sem gestor definido
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Members tab */}
      {activeTab === 'members' && (
        <div>
          {/* Transfer form */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
            <div className="text-xs font-medium text-blue-700 uppercase tracking-wide mb-3">
              Transferir colaborador
            </div>
            <div className="flex flex-wrap gap-3">
              <input
                type="number"
                placeholder="ID do colaborador"
                value={transferUserId}
                onChange={(e) => setTransferUserId(e.target.value)}
                className="flex-1 min-w-[140px] text-sm border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
              <input
                type="number"
                placeholder="ID do departamento destino"
                value={transferTargetId}
                onChange={(e) => setTransferTargetId(e.target.value)}
                className="flex-1 min-w-[180px] text-sm border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
              <input
                type="text"
                placeholder="Motivo (opcional)"
                value={transferReason}
                onChange={(e) => setTransferReason(e.target.value)}
                className="flex-1 min-w-[160px] text-sm border border-blue-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
              />
              <button
                onClick={handleTransfer}
                disabled={
                  !transferUserId || !transferTargetId || transferLoading
                }
                className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
              >
                {transferLoading ? 'A transferir…' : 'Transferir'}
              </button>
            </div>
          </div>

          {/* Members list */}
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="grid grid-cols-[1fr_180px_80px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
              <div>Colaborador</div>
              <div>Cargo</div>
              <div>Estado</div>
            </div>
            {(dept.users as Member[]).length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                Sem membros neste departamento
              </div>
            ) : (
              (dept.users as Member[]).map((u) => (
                <div
                  key={u.id}
                  className="grid grid-cols-[1fr_180px_80px] gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-2">
                    <Avatar name={u.fullName} size="sm" />
                    <div>
                      <div className="text-sm text-gray-900">{u.fullName}</div>
                      <div className="text-xs text-gray-400">{u.email}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {u.position?.name ?? '—'}
                  </div>
                  <div>
                    <StatusBadge active={u.active} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Sub-departments tab */}
      {activeTab === 'subdepts' && (
        <div className="space-y-2">
          {dept.children.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem sub-departamentos
            </div>
          ) : (
            dept.children.map((child) => (
              <div
                key={child.id}
                className="flex items-center gap-3 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: child.color ?? '#cbd5e1' }}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {child.name}
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      {child.code}
                    </span>
                    <StatusBadge active={child.active} />
                  </div>
                  {child.head && (
                    <div className="text-xs text-gray-400 mt-0.5">
                      {child.head.fullName}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-400">
                  {child._count.users} membros
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Metrics tab */}
      {activeTab === 'metrics' && metrics && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <MetricCard label="Total membros" value={metrics.totalUsers} />
            <MetricCard
              label="Activos"
              value={metrics.activeUsers}
              color="text-emerald-600"
            />
            <MetricCard label="Inactivos" value={metrics.inactiveUsers} />
            <MetricCard
              label="Transferências ↑"
              value={metrics.transfers.in}
              sub={`↓ saídas: ${metrics.transfers.out}`}
            />
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">
              Hierarquia organizacional
            </div>
            <Breadcrumb items={metrics.breadcrumb} />
          </div>
        </div>
      )}

      {/* Head history tab */}
      {activeTab === 'history' && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[1fr_160px_160px] gap-3 px-4 py-2.5 border-b border-gray-100 text-xs font-medium text-gray-400 uppercase tracking-wide">
            <div>Gestor</div>
            <div>Início</div>
            <div>Fim</div>
          </div>
          {dept.headHistory.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Sem histórico de gestores
            </div>
          ) : (
            dept.headHistory.map((h) => (
              <div
                key={h.id}
                className="grid grid-cols-[1fr_160px_160px] gap-3 items-center px-4 py-3 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <Avatar name={h.head.fullName} size="sm" />
                  <span className="text-sm text-gray-800">
                    {h.head.fullName}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(h.startedAt).toLocaleDateString('pt-AO')}
                </div>
                <div className="text-xs text-gray-500">
                  {h.endedAt ? (
                    new Date(h.endedAt).toLocaleDateString('pt-AO')
                  ) : (
                    <span className="text-emerald-600">Actual</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
