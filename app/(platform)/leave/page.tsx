'use client';

// ─── app/(dashboard)/leave/page.tsx ──────────────────────────────────────────
// INNOVA — Módulo de Gestão de Ausências (Leave Management)
//
// Container: liga os 5 hooks de dados (hooks/useLeave.ts) e as 3 mutações
// (approve/cancel/bulkApprove) à apresentação, agora repartida em
// components/leave/. O estado de `pending` é partilhado entre o badge do
// separador e o conteúdo do separador "Aprovações", por isso fica ao nível
// do container em vez de cada separador buscar os seus próprios dados
// (diferente do padrão usado em dashboard/employees, onde os separadores
// eram totalmente independentes). Ver memory
// project_innova_component_separation_audit.
//
// Migrado para a fundação de design: header/tab bar bespoke passam a
// tokens + Button/IconButton; badge do separador passa a Badge — mesmos
// hooks/mutações/queryKeys, só apresentação.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import {
  useLeaveDashboard,
  useLeaveTypes,
  useMyBalance,
  useMyRequests,
  usePendingApprovals,
} from '@/hooks/useLeave';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { cn } from '@/lib/cn';
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Plus,
  RefreshCcw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { ApprovalsTab } from '@/components/leave/ApprovalsTab';
import { LeaveDashboardTab } from '@/components/leave/LeaveDashboardTab';
import { MyLeaveTab } from '@/components/leave/MyLeaveTab';
import { NewLeaveModal } from '@/components/leave/NewLeaveModal';

type TabKey = 'my' | 'approvals' | 'dashboard';

export default function LeavePage() {
  const [tab, setTab] = useState<TabKey>('my');
  const [showModal, setShowModal] = useState(false);
  const notify = useToast();

  const leaveTypes = useLeaveTypes();
  const { balances, loading: bLoading, refetch: bRefetch } = useMyBalance();
  const {
    data: myData,
    loading: mLoading,
    refetch: mRefetch,
  } = useMyRequests();
  const {
    data: dashboard,
    loading: dLoading,
    refetch: dRefetch,
  } = useLeaveDashboard();
  const {
    data: pending,
    loading: pLoading,
    refetch: pRefetch,
  } = usePendingApprovals();

  const approve = useApiMutation(
    ({ id, action }: { id: number; action: string }) =>
      apiClient.patch(`/leave/${id}/approve`, { action }),
    {
      invalidateKeys: [
        queryKeys.leave.pendingApprovals(),
        queryKeys.leave.dashboard(),
      ],
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const cancel = useApiMutation(
    (id: number) => apiClient.patch(`/leave/${id}/cancel`, {}),
    {
      invalidateKeys: [
        queryKeys.leave.myRequests(),
        queryKeys.leave.myBalance(),
      ],
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const bulkApprove = useApiMutation(
    (ids: number[]) =>
      apiClient.post('/leave/bulk-approve', {
        requestIds: ids,
        action: 'APPROVE',
      }),
    {
      invalidateKeys: [
        queryKeys.leave.pendingApprovals(),
        queryKeys.leave.dashboard(),
      ],
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  // ApprovalCard faz `await onDecide(...)` para gerir o seu loading; engolimos o
  // erro aqui (o alert já é tratado no onError da mutação).
  const handleApprovalDecide = async (requestId: number, action: string) => {
    try {
      await approve.mutateAsync({ id: requestId, action });
    } catch {
      /* tratado */
    }
  };

  const confirm = useConfirm();
  const handleCancel = async (requestId: number) => {
    if (
      !(await confirm({
        title: 'Cancelar este pedido?',
        message: 'Tem a certeza?',
        confirmLabel: 'Cancelar pedido',
        destructive: true,
      }))
    )
      return;
    cancel.mutate(requestId);
  };

  const tabs: Array<{
    key: TabKey;
    label: string;
    icon: LucideIcon;
    badge?: number;
  }> = [
    { key: 'my', label: 'Minhas Ausências', icon: Calendar },
    {
      key: 'approvals',
      label: 'Aprovações',
      icon: CheckCircle2,
      badge: pending.length,
    },
    { key: 'dashboard', label: 'Dashboard RH', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      {/* Header */}
      <div className="bg-surface border-b border-border px-6 py-5 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold text-ink">
              Gestão de Ausências
            </h1>
            <p className="text-sm text-ink-muted">
              Licenças, férias e afastamentos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <IconButton
              icon={RefreshCcw}
              label="Actualizar"
              intent="secondary"
              onClick={() => {
                mRefetch();
                bRefetch();
                dRefetch();
                pRefetch();
              }}
            />
            <Button onClick={() => setShowModal(true)}>
              <Plus size={15} strokeWidth={1.75} /> Solicitar Licença
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-5">
        {/* Tab bar */}
        <div className="flex bg-surface rounded-panel border border-border shadow-resting p-1.5 gap-1 w-fit">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'flex items-center gap-2 px-4 py-2 text-sm rounded-control font-medium transition-colors relative',
                tab === t.key
                  ? 'bg-primary text-canvas shadow-resting'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-sunken',
              )}
            >
              <t.icon size={15} strokeWidth={1.75} />
              {t.label}
              {t.badge != null && t.badge > 0 && (
                <span
                  className={cn(
                    'w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold',
                    tab === t.key
                      ? 'bg-canvas text-primary'
                      : 'bg-primary text-canvas',
                  )}
                >
                  {t.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {tab === 'my' && (
          <MyLeaveTab
            balances={balances}
            balancesLoading={bLoading}
            requestsData={myData}
            requestsLoading={mLoading}
            onCancel={handleCancel}
          />
        )}

        {tab === 'approvals' && (
          <ApprovalsTab
            pending={pending}
            loading={pLoading}
            onDecide={handleApprovalDecide}
            onBulkApprove={(ids) => bulkApprove.mutate(ids)}
            bulkApproving={bulkApprove.isPending}
          />
        )}

        {tab === 'dashboard' && (
          <LeaveDashboardTab
            dashboard={dashboard}
            loading={dLoading}
            leaveTypes={leaveTypes}
          />
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <NewLeaveModal
          leaveTypes={leaveTypes}
          balances={balances}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            mRefetch();
            bRefetch();
            dRefetch();
          }}
        />
      )}
    </div>
  );
}
